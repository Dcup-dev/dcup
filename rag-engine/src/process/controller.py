from fastapi.responses import JSONResponse
from fastapi import APIRouter, File, Form, HTTPException, Path, UploadFile, status
import requests
import json
from src.process.service import processFile
from . import models


router = APIRouter(prefix="/process", tags=["Process"])


@router.post(
    "/{file_type}/{input_mode}",
    summary="Process an uploaded file or URL",
    status_code=status.HTTP_200_OK,
)
async def process(
    file_type: models.FileType = Path(..., description="Type of file to process"),
    input_mode: models.InputMode = Path(..., description="How content is passed"),
    metadata: str | None = Form(None, description="metadata for chunks"),
    upload: UploadFile | None = File(None, description="The file to upload"),
    url: str | None = Form(None, description="Link to fetch"),
):
    meta = {}
    if metadata:
        try:
            meta = json.loads(metadata)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid JSON in metadata field",
            )
    try:
        if input_mode == models.InputMode.url:
            if not url:
                raise HTTPException(
                    status.HTTP_422_UNPROCESSABLE_CONTENT,
                    "Must provide a URL when input_mode is 'url'",
                )
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            if file_type == models.FileType.pdf:
                if "application/pdf" not in resp.headers.get("Content-Type", ""):
                    raise HTTPException(
                        status.HTTP_400_BAD_REQUEST, "URL does not point to a PDF file"
                    )

            data = processFile(models.FileType.pdf, resp.content, meta)
            return JSONResponse(content=data, status_code=status.HTTP_200_OK)
        if input_mode == models.InputMode.file:
            if not upload:
                raise HTTPException(
                    status.HTTP_422_UNPROCESSABLE_CONTENT,
                    "Must upload a file when input_mode is 'file'",
                )
            data_bytes = await upload.read()
            data = processFile(models.FileType.pdf, data_bytes, meta)
            return JSONResponse(content=data, status_code=status.HTTP_200_OK)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal server error: {str(e)}",
        )
