from enum import Enum
from pydantic import BaseModel


class FileType(str, Enum):
    pdf = "pdf"
    md = "md"


class InputMode(str, Enum):
    file = "file"
    url = "url"


class PageContent(BaseModel):
    text: str
    tables: list[list[list[str]]]


class SupportUrlFile(str, Enum):
    pdf = "application/pdf"
