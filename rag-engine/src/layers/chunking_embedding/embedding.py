from fastembed import TextEmbedding
from typing import List
from fastembed.common.model_description import ModelSource, PoolingType

from src.layers.chunking_embedding.models import Chunk


TextEmbedding.add_custom_model(
    model="intfloat/multilingual-e5-small",
    pooling=PoolingType.MEAN,
    normalization=True,
    sources=ModelSource(hf="intfloat/multilingual-e5-small"),  
    dim=384,
    model_file="onnx/model.onnx",
)
_embedding_model = TextEmbedding(model_name="intfloat/multilingual-e5-small")

def embed_chunks(chunks: List[Chunk], batch_size: int = 64) -> List[Chunk]:
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        texts = [c.text for c in batch]
        vectors = list(_embedding_model.embed(texts))
        for chunk, vector in zip(batch, vectors):
            chunk.metadata["_embedding"] = vector.tolist()
    return chunks
