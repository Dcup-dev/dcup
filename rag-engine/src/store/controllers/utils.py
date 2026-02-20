import json
import csv
import io
from fastapi import HTTPException, status
from qdrant_client.models import Optional
from openpyxl import load_workbook


def parse_metadata(metadata_str: Optional[str]) -> dict:
    """Parse JSON metadata string, return empty dict if None."""
    if metadata_str:
        try:
            return json.loads(metadata_str)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid JSON in metadata field",
            )
    return {}


def assert_pdf(data: bytes):
    if not data.startswith(b"%PDF-"):
        raise HTTPException(400, "Invalid PDF file")


def assert_markdown(data: bytes):
    if data.startswith(b"%PDF-") or data.startswith(b"\x50\x4b"):
        raise HTTPException(400, "Binary file is not Markdown")

    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(400, "Markdown must be UTF-8 text")

    if "\x00" in text:
        raise HTTPException(400, "Invalid Markdown content")


def assert_csv(data: bytes):
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(400, "CSV must be UTF-8 text")

    reader = csv.reader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise HTTPException(400, "Empty CSV")

    cols = len(rows[0])
    if any(len(r) != cols for r in rows):
        raise HTTPException(400, "Malformed CSV")


def assert_json(data: bytes):
    try:
        json.loads(data.decode("utf-8"))
    except Exception:
        raise HTTPException(400, "Invalid JSON file")


def assert_sheet(data: bytes):
    if not data.startswith(b"\x50\x4b"):
        raise HTTPException(400, "Invalid XLSX file")

    try:
        load_workbook(io.BytesIO(data), read_only=True)
    except Exception:
        raise HTTPException(400, "Corrupted XLSX file")
