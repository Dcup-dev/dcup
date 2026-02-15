from pydantic import BaseModel
from typing import List, Dict, Any

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
    embedding: Any

    metadata: Dict[str, Any] = {}
