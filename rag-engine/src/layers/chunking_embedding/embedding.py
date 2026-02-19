from concurrent.futures import ThreadPoolExecutor
import os
from typing import List
from qdrant_client.models import models
from src.layers.chunking_embedding.models import Chunk
from src.common.utils import dense_embedding, sparse_embedding


_executor = ThreadPoolExecutor(max_workers=os.cpu_count() or 4)

def embed_chunks(chunks: List[Chunk], batch_size: int = 64) -> List[Chunk]:

    for i in range(0, len(chunks), batch_size):

        batch = chunks[i : i + batch_size]
        texts = [f"passage: {c.text.strip()}" for c in batch]

        def dense_task():
            return list(dense_embedding.embed(texts))

        def sparse_task():
            return list(sparse_embedding.embed(texts))

        future_dense = _executor.submit(dense_task)
        future_sparse = _executor.submit(sparse_task)

        dense_vectors = future_dense.result()
        sparse_vectors = future_sparse.result()

        for chunk, dv, sv in zip(batch, dense_vectors, sparse_vectors):

            chunk.dense_vectors = dv.tolist()

            chunk.sparse_vectors = models.SparseVector(
                indices=sv.indices.tolist(),
                values=sv.values.tolist(),
            )

    return chunks
