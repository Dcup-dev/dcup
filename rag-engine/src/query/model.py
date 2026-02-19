from pydantic import BaseModel
from qdrant_client.models import Any, Dict


class Hit(BaseModel):
    id: str
    score: float
    payload: Dict[str, Any]


class Reference(BaseModel):
    file: str
    section: str
    pages: list[int]


class QueryResponse(BaseModel):
    text: str
    score: float
    token_count: int
    content_type: str
    metadata: Dict
    table_json: list[list[str | None]]
    reference: Reference
