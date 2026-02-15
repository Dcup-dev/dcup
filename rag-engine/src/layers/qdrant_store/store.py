from typing import List
from qdrant_client.conversions.common_types import PointStruct, Points
from src.layers.chunking_embedding.models import Chunk
from src.common.utils import VECTOR_SIZE, qclient, COLLECTION_NAME


def store_chunks(chunks: List[Chunk], batch_size: int = 64) -> None:
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i : i + batch_size]
        points:Points = []
        for chunk in batch:
            if chunk.embedding is None:
                continue
            payload = {
                "text": chunk.text,
                "token_count": chunk.token_count,
                "section_title": chunk.section_title,
                "section_path": chunk.section_path,
                "level": chunk.level,
                "page_start": chunk.page_start,
                "page_end": chunk.page_end,
                **chunk.metadata,
            }
            points.append(
                PointStruct(
                    id=chunk.id,
                    vector=chunk.embedding,
                    payload=payload,
                ),
            )
            assert isinstance(chunk.embedding, list)
            assert len(chunk.embedding) == VECTOR_SIZE
        qclient.upsert(collection_name=COLLECTION_NAME, points=points)
