import os
from pathlib import Path as FilePath
from fastembed import TextEmbedding
from fastembed.common.model_description import ModelSource, PoolingType
from qdrant_client import QdrantClient, models
from qdrant_client.models import Distance, FieldCondition, MatchValue, VectorParams

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
embedding_model = TextEmbedding(
    model_name="intfloat/multilingual-e5-small",
    cache_dir=str(CACHE_DIR),
)

qclient = QdrantClient(
    url=os.getenv("QDRANT_DB_URL"),
    api_key=os.getenv("QDRANT_DB_KEY"),
)

if COLLECTION_NAME not in [c.name for c in qclient.get_collections().collections]:
    qclient.create_collection(
        collection_name=COLLECTION_NAME,
        vectors_config=VectorParams(
            size=VECTOR_SIZE,
            distance=Distance.COSINE,
        ),
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
