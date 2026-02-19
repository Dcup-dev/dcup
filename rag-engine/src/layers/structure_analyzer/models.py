from __future__ import annotations
from pydantic import BaseModel, Field
from typing import List
from src.layers.data_extractor.models import ImagePage, TablePage


class Paragraph(BaseModel):
    text: str
    page_number: int


class Section(BaseModel):
    id: str
    title: str
    level: int
    page_number: int
    content_stream: List[Paragraph | TablePage | ImagePage | Section]
    children: List["Section"] = Field(default_factory=list)
    confidence: float


class StructuredDocument(BaseModel):
    sections: List[Section] = Field(default_factory=list)
    preamble: List[Paragraph] = Field(default_factory=list)


Section.model_rebuild()
