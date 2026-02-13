from pydantic import BaseModel

class ImagePage(BaseModel):
    id: str
    x0:float
    top:float
    x1: float
    bottom: float
    width:float
    height: float

class PageContent(BaseModel):
    page_number: int
    text: str
    images: list[ImagePage]
    tables: list[list[list[str]]]
