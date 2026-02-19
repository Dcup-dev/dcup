import os
from pathlib import Path as FilePath
from fastembed import SparseTextEmbedding, TextEmbedding
from fastembed.common.model_description import ModelSource, PoolingType
from qdrant_client import QdrantClient, models
from qdrant_client.conversions.common_types import SparseVectorParams
from fastembed.rerank.cross_encoder import TextCrossEncoder
import json
from fastapi import HTTPException, status
from qdrant_client.models import Optional
from qdrant_client.models import (
    Distance,
    FieldCondition,
    MatchValue,
    VectorParams,
)


CACHE_DIR = FilePath("./models_cache")
CACHE_DIR.mkdir(exist_ok=True)
VECTOR_SIZE = 384
COLLECTION_NAME = "dcup_documents"

TextEmbedding.add_custom_model(
    model="intfloat/multilingual-e5-small",
    pooling=PoolingType.MEAN,
    normalization=True,
    sources=ModelSource(hf="intfloat/multilingual-e5-small"),
    dim=VECTOR_SIZE,
    model_file="onnx/model.onnx",
)
dense_embedding = TextEmbedding(
    model_name="intfloat/multilingual-e5-small",
    cache_dir=str(CACHE_DIR),
)
sparse_embedding = SparseTextEmbedding(
    model_name="prithivida/Splade_PP_en_v1",
    cache_dir=str(CACHE_DIR),
)
reranker = TextCrossEncoder(
    model_name="Xenova/ms-marco-MiniLM-L-12-v2",
    cache_dir=str(CACHE_DIR),
)

qclient = QdrantClient(
    url=os.getenv("QDRANT_DB_URL"),
    api_key=os.getenv("QDRANT_DB_KEY"),
)

if COLLECTION_NAME not in [c.name for c in qclient.get_collections().collections]:
    qclient.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config={
            "text-dense": VectorParams(
                size=VECTOR_SIZE,
                distance=Distance.COSINE,
            ),
        },
        sparse_vectors_config={
            "text-sparse": SparseVectorParams(index=models.SparseIndexParams()),
        },
    )
    qclient.create_payload_index(
        collection_name=COLLECTION_NAME,
        field_name="_file_hash",
        field_schema=models.PayloadSchemaType.KEYWORD,
    )
    qclient.create_payload_index(
        collection_name=COLLECTION_NAME,
        field_name="_user_id",
        field_schema=models.PayloadSchemaType.KEYWORD,
    )


def document_exists(user_id: str, file_hash: str) -> bool:
    results = qclient.scroll(
        collection_name=COLLECTION_NAME,
        scroll_filter=models.Filter(
            must=[
                FieldCondition(
                    key="_user_id",
                    match=MatchValue(value=user_id),
                ),
                FieldCondition(
                    key="_file_hash",
                    match=MatchValue(value=file_hash),
                ),
            ]
        ),
        limit=1,
    )

    return len(results[0]) > 0





def parse_metadata(metadata_str: Optional[str]) -> dict:
    """Parse JSON metadata string, return empty dict if None."""
    if metadata_str:
        try:
            return json.loads(metadata_str)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid JSON in metadata field",
            )
    return {}
