import os
import numpy as np
import math
from typing import List, Dict, Optional, Tuple
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
import logging

from src.query.model import QueryResponse, Reference
from qdrant_client.http import models
from qdrant_client.models import (
    Filter,
    FieldCondition,
    MatchValue,
    Condition,
)

from src.common.utils import (
    COLLECTION_NAME,
    dense_embedding,
    sparse_embedding,
    reranker,
    qclient,
)
from src.query.model import Hit


_executor = ThreadPoolExecutor(max_workers=os.cpu_count() or 4)

_CANDIDATE_POOL = 50
_RERANK_BATCH_SIZE = 64

_MAX_CONTEXT_TOKENS = 1400

_MIN_RERANK_SCORE = 0.15
_RELATIVE_RERANK_DROP = 0.30
_NEIGHBOR_WINDOW = 2


def query(
    queries: List[str],
    metadata: Optional[Dict],
    final_top_k: int,
) -> List[QueryResponse]:

    expanded_queries = _expand_queries(queries)
    logging.info(f"expanded queries and clean up to {len(expanded_queries)}")

    meta_filter = _build_metadata_filter(metadata)
    logging.info("Build filtering..")

    query_embeddings = _embed_queries(expanded_queries)
    logging.info(f"query embeded : {len(query_embeddings)}")

    hits = _hybrid_query(query_embeddings, meta_filter, _CANDIDATE_POOL)
    logging.info(f"hybrid query first hits : {len(hits)}")

    hits = _normalize_scores(hits)
    logging.info(f"hits after normalized scores : {len(hits)}")

    hits = _rerank(expanded_queries[0], hits, math.floor(final_top_k / 2) + 1)
    logging.info(
        f"hits after reranking : {len(hits)} with final_top: {math.floor(final_top_k / 2) + 1}"
    )

    neighbors = _expand_neighbors(hits)
    logging.info(f"getting neighbors of the hits : {len(neighbors)}")

    hits.extend(neighbors)
    logging.info(f"add all neighbors to hits , Total Hits: {len(neighbors)}")

    hits = _rerank(expanded_queries[0], hits, final_top_k)
    logging.info(
        f"make second reranking for hits : {len(hits)} with final_top: {final_top_k}"
    )

    return _pack_context(hits)


def _expand_queries(queries: List[str]) -> List[str]:

    expanded = set()

    for q in queries:
        q = q.strip()
        expanded.add(q)
        expanded.add(q.replace("-", " "))
        expanded.add(q.replace("_", " "))
        expanded.add(" ".join(q.split()))

    return list(expanded)


@lru_cache(maxsize=512)
def _embed_single_query(query: str):

    prefixed = f"query: {query}"

    def dense_task():
        return list(dense_embedding.embed([prefixed]))[0]

    def sparse_task():
        return list(sparse_embedding.embed([prefixed]))[0]

    fd = _executor.submit(dense_task)
    fs = _executor.submit(sparse_task)

    dense = fd.result()
    sparse = fs.result()

    return {
        "dense": dense.tolist(),
        "sparse": models.SparseVector(
            indices=sparse.indices.tolist(),
            values=sparse.values.tolist(),
        ),
    }


def _embed_queries(queries: List[str]):
    return [_embed_single_query(q) for q in queries]


def _build_metadata_filter(meta: Optional[Dict]) -> Optional[Filter]:

    if not meta:
        return None

    cond: List[Condition] = []

    for k, v in meta.items():
        if v is None:
            continue

        cond.append(
            FieldCondition(
                key=k,
                match=MatchValue(value=v),
            )
        )

    return Filter(must=cond) if cond else None


def _hybrid_query(
    embeddings: List[Dict], meta_filter: Optional[Filter], limit: int
) -> List[Hit]:

    results: List[Hit] = []

    for emb in embeddings:
        res = qclient.query_points(
            collection_name=COLLECTION_NAME,
            prefetch=[
                models.Prefetch(
                    query=emb["dense"],
                    using="text-dense",
                    filter=meta_filter,
                    limit=limit,
                ),
                models.Prefetch(
                    query=emb["sparse"],
                    using="text-sparse",
                    filter=meta_filter,
                    limit=limit,
                ),
            ],
            query=models.FusionQuery(fusion=models.Fusion.RRF),
            limit=limit,
        )

        for p in res.points:
            results.append(
                Hit(
                    id=str(p.id),
                    score=float(p.score),
                    payload=p.payload or {},
                )
            )

    return results


def _normalize_scores(hits: List[Hit]) -> List[Hit]:

    if not hits:
        return hits

    scores = np.array([h.score for h in hits])
    mn, mx = scores.min(), scores.max()

    if mx == mn:
        return hits

    normalized = (scores - mn) / (mx - mn)
    for h, norm_score in zip(hits, normalized):
        h.score = float(norm_score)

    return hits


def _rerank(query: str, hits: List[Hit], top_k: int) -> List[Hit]:

    texts = [h.payload.get("_text", "") for h in hits]

    score_list: List[float] = []

    for i in range(0, len(texts), _RERANK_BATCH_SIZE):
        batch = texts[i : i + _RERANK_BATCH_SIZE]
        score_list.extend(list(reranker.rerank(query, batch)))

    if not score_list:
        return []

    scores_np = np.array(score_list, dtype=float)

    mn, mx = scores_np.min(), scores_np.max()
    if mx > mn:
        scores_np = (scores_np - mn) / (mx - mn)

    scored = sorted(zip(hits, scores_np.tolist()), key=lambda x: x[1], reverse=True)

    return _adaptive_rerank_cutoff(scored, top_k)


def _adaptive_rerank_cutoff(scored: List[Tuple[Hit, float]], top_k: int) -> List[Hit]:

    if not scored:
        return []

    best = max(scored[0][1], 1e-6)

    selected: List[Hit] = []

    for hit, score in scored:
        if score < _MIN_RERANK_SCORE:
            continue

        if score / best < _RELATIVE_RERANK_DROP:
            break

        hit.score = float(score)
        selected.append(hit)

        if len(selected) >= top_k:
            break

    if not selected:
        selected.append(scored[0][0])

    return selected


# ============================================================
# CONTEXT PACKING
# ============================================================
def _pack_context(hits: List[Hit]) -> List[QueryResponse]:

    if not hits:
        return []

    # --- Preserve document reading order ---
    hits = sorted(
        hits,
        key=lambda h: (
            h.payload.get("_file_hash"),
            h.payload.get("_chunk_index", 0),
        ),
    )

    chunks: List[QueryResponse] = []
    file_counts = defaultdict(int)

    tokens_used = 0

    for hit in hits:
        payload = hit.payload
        file_hash = payload.get("_file_hash")

        text = payload.get("_text", "")
        token_count = payload.get("_token_count", len(text.split()))

        if tokens_used + token_count > _MAX_CONTEXT_TOKENS:
            break

        file_counts[file_hash] += 1
        tokens_used += token_count
        chunks.append(
            QueryResponse(
                text=text,
                score=float(hit.score),
                token_count=token_count,
                content_type=payload.get("_content_type", "text"),
                metadata=payload.get("_file_metadata", {}),
                table_json=payload.get("_table_json", []),
                reference=Reference(
                    file=payload.get("_source_file", ""),
                    section=payload.get("_section_title", ""),
                    pages=[
                        payload.get("_page_start", 0),
                        payload.get("_page_end", 0),
                    ],
                ),
            )
        )

    # Return highest score first
    return sorted(chunks, key=lambda x: x.score, reverse=True)


def _expand_neighbors(hits: List[Hit]) -> List[Hit]:

    expanded: List[Hit] = []
    seen_ids = {h.id for h in hits}

    for hit in hits:
        fh = hit.payload.get("_file_hash")
        idx = hit.payload.get("_chunk_index")

        if fh is None or idx is None:
            continue

        neighbors = _fetch_neighbors(fh, idx)

        for n in neighbors:
            nid = str(n.id)

            if nid in seen_ids:
                continue

            expanded.append(
                Hit(
                    id=nid,
                    score=hit.score * 0.85,
                    payload=n.payload or {},
                )
            )

    return expanded


def _fetch_neighbors(file_hash, idx):

    result, _ = qclient.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=models.Filter(
            must=[
                models.FieldCondition(
                    key="_file_hash",
                    match=models.MatchValue(value=file_hash),
                ),
                models.FieldCondition(
                    key="_chunk_index",
                    range=models.Range(
                        gte=idx - _NEIGHBOR_WINDOW,
                        lte=idx + _NEIGHBOR_WINDOW,
                    ),
                ),
            ]
        ),
        limit=_NEIGHBOR_WINDOW * 2 + 1,
    )

    return result
