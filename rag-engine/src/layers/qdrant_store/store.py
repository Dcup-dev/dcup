from typing import List
from qdrant_client.conversions.common_types import PointStruct
from src.layers.chunking_embedding.models import Chunk
from src.common.utils import VECTOR_SIZE, qclient, COLLECTION_NAME


def store_chunks(chunks: List[Chunk], batch_size: int = 64) -> None:

    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        points: List[PointStruct] = []

        for chunk in batch:
            # Correct validation
            if chunk.dense_vectors is None or chunk.sparse_vectors is None:
                continue

            payload = {
                "_text": chunk.text,
                "_chunk_index": chunk.chunk_index,
                "_token_count": chunk.token_count,
                "_section_title": chunk.section_title,
                "_section_path": chunk.section_path,
                "_level": chunk.level,
                "_page_start": chunk.page_start,
                "_page_end": chunk.page_end,
                **chunk.metadata,
            }

            points.append(
                PointStruct(
                    id=chunk.id,
                    vector={
                        "text-dense": chunk.dense_vectors,
                        "text-sparse": chunk.sparse_vectors,
                    },
                    payload=payload,
                )
            )

            # Correct validation
            assert len(chunk.dense_vectors) == VECTOR_SIZE

        if points:
            qclient.upsert(
                collection_name=COLLECTION_NAME,
                points=points,
                wait=False
            )
