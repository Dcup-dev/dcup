from pydantic import BaseModel


class StoreResponse(BaseModel):
    document_id: str
    file_type:str
    page_count: int
    chunks: list[str]
