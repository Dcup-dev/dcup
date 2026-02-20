import os
from urllib.parse import urlparse
import requests
import hashlib
from typing import Optional
from fastapi import File, Form, HTTPException, UploadFile, status
from src.common.utils import document_exists, parse_metadata
from src.layers.data_extractor.extractor.json import extract_data_json
from src.store import service
from src.store.controllers.utils import assert_json


async def upload(
    upload: UploadFile = File(..., description="Json file to upload"),
    metadata: Optional[str] = Form(..., description="Metadata for chunks (JSON)"),
):
    meta = parse_metadata(metadata)
    meta["_source_file"] = upload.filename

    data_bytes = await upload.read()
    assert_json(data_bytes)

    file_hash = hashlib.sha256(data_bytes).hexdigest()
    meta["_file_hash"] = file_hash
    meta["_file_type"] = "json"

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

    return service.handle(data_bytes, meta, extract_data_json)


def with_url(
    url: str = Form(..., description="Link to fetch Json"),
    metadata: Optional[str] = Form(..., description="Metadata for chunks (JSON)"),
):
    resp = requests.get(url, timeout=10)
    resp.raise_for_status()

    content_type = resp.headers.get("Content-Type", "").lower()
    if not any(t in content_type for t in ["application/json", "text/plain"]):
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "URL does not point to a JSON file",
        )

    data_bytes = resp.content
    assert_json(data_bytes)
   
    parsed = urlparse(url)
    filename = os.path.basename(parsed.path) or "unknown.json"

    meta = parse_metadata(metadata)
    meta["_source_file"] = filename
    meta["_file_type"] = "json"

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

    return service.handle(data_bytes, meta, extract_data_json)
