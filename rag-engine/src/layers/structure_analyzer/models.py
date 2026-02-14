from pydantic import BaseModel, Field
from typing import List

from src.layers.data_extractor.models import ImagePage


class Paragraph(BaseModel):
    text: str
    page_number: int


class Section(BaseModel):
    id: str
    title: str
    level: int
    page_number: int

    paragraphs: List[Paragraph] = Field(default_factory=list)
    children: List["Section"] = Field(default_factory=list)

    tables: list[list[list[str | None]]] = Field(default_factory=list)
    images: List[ImagePage] = Field(default_factory=list)
    confidence: float


class StructuredDocument(BaseModel):
    sections: List[Section] = Field(default_factory=list)
    preamble: List[Paragraph] = Field(default_factory=list)


Section.model_rebuild()
