from pydantic import BaseModel
from typing import List, Dict, Any

from qdrant_client.models import models

# -------------------------
# Output Model
# -------------------------


class Chunk(BaseModel):
    id: str
    text: str
    token_count: int

    section_title: str
    section_path: List[str]
    level: int

    page_start: int | None
    page_end: int | None
    chunk_index: int = 0
    dense_vectors: List[float] | None = None
    sparse_vectors: models.SparseVector | None = None

    metadata: Dict[str, Any] = {}
