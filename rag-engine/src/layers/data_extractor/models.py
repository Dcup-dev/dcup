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
    x0: float
    x1: float
    bottom: float


class ImagePage(BaseModel):
    id: str | None
    x0: float | None
    top: float | None
    x1: float | None
    bottom: float | None
    width: float | None
    height: float | None


class TablePage(BaseModel):
    id: str
    bbox: tuple[float, float, float, float]
    data: list[list[str | None]]
    top: float
    x0: float
    x1: float
    bottom: float
    page_number: int


class Page(BaseModel):
    page_number: int
    text: str
    lines: list[Line]
    tables: list[TablePage]
    images: list[ImagePage]
    width: float | None
    height: float | None


Page.model_rebuild()
