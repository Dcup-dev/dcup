import hashlib
import os
from typing import Optional
from urllib.parse import urlparse
from fastapi import File, Form, HTTPException, UploadFile, status
import requests
from src.common.utils import document_exists, parse_metadata
from src.layers.data_extractor.extractor.xls import extract_data_excel
from src.store import service
from src.store.controllers.utils import assert_sheet


async def upload(
    upload: UploadFile = File(..., description="Sheet file to upload"),
    metadata: Optional[str] = Form(..., description="Metadata for chunks (JSON)"),
):
    meta = parse_metadata(metadata)
    meta["_source_file"] = upload.filename

    data_bytes = await upload.read()

    assert_sheet(data_bytes)
    file_hash = hashlib.sha256(data_bytes).hexdigest()
    meta["_file_hash"] = file_hash
    meta["_file_type"] = "sheet"

    user_id = meta.get("_user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing '_user_id' in metadata",
        )

    if document_exists(user_id, file_hash):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document already uploaded",
        )

    return service.handle(data_bytes, meta, extract_data_excel)


def with_url(
    url: str = Form(..., description="Link to fetch sheet"),
    metadata: Optional[str] = Form(..., description="Metadata for chunks (JSON)"),
):
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()

    content_type = resp.headers.get("Content-Type", "").lower()
    if not any(
        t in content_type
        for t in [
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ]
    ):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "URL does not point to a XLS/Sheet file",
        )

    data_bytes = resp.content
    assert_sheet(data_bytes)

    parsed = urlparse(url)
    filename = os.path.basename(parsed.path) or "unknown.md"

    meta = parse_metadata(metadata)
    meta["_source_file"] = filename
    meta["_file_type"] = "sheet"

    file_hash = hashlib.sha256(data_bytes).hexdigest()
    meta["_file_hash"] = file_hash

    user_id = meta.get("_user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing '_user_id' in metadata",
        )

    if document_exists(user_id, file_hash):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document already uploaded",
        )

    return service.handle(data_bytes, meta, extract_data_excel)
