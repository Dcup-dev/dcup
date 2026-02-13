from pydantic import BaseModel


class Word(BaseModel):
    text: str
    x0: float
    x1: float
    top: float
    bottom: float
    size: float
    fontname: str


class Line(BaseModel):
    text: str
    words: list[Word]
    top: float
    avg_size: float
    is_bold: bool
    x0: float  # new
    x1: float  # new


class ImagePage(BaseModel):
    id: str | None
    x0: float | None
    top: float | None
    x1: float | None
    bottom: float | None
    width: float | None
    height: float | None


class Page(BaseModel):
    page_number: int
    text: str
    lines: list[Line]
    tables: list[list[list[str | None]]]
    images: list[ImagePage]
    width: float | None
    height: float | None


Page.model_rebuild()
