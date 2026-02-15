from typing import List
from src.layers.chunking_embedding.models import Chunk
from src.common.utils import embedding_model


def embed_chunks(chunks: List[Chunk], batch_size: int = 64) -> List[Chunk]:
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        texts = [c.text for c in batch]
        vectors = list(embedding_model.embed(texts))
        for chunk, vector in zip(batch, vectors):
            chunk.embedding = vector.tolist()
    return chunks
