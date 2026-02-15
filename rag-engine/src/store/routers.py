from fastapi import APIRouter, File, Form, UploadFile, status
from qdrant_client.models import Optional
from src.store.model import StoreResponse
from src.store.controllers import pdf

store_upload_router = APIRouter(prefix="/store/upload", tags=["Store_Upload"])
store_url_router = APIRouter(prefix="/store/url", tags=["Store_URL"])


@store_upload_router.post(
    "/pdf",
    summary="Store an uploaded PDF file",
    response_model=StoreResponse,
    status_code=status.HTTP_200_OK,
)
async def store_pdf_upload(
    upload: UploadFile = File(..., description="The file to upload"),
    metadata: Optional[str] = Form(..., description="Metadata for chunks (JSON)"),
):
    return pdf.upload(upload, metadata)


@store_url_router.post(
    "/pdf",
    summary="Store an uploaded PDF file",
    response_model=StoreResponse,
    status_code=status.HTTP_200_OK,
)
async def store_pdf_with_url(
    url: str  = Form(..., description="Link to fetch"),
    metadata: Optional[str] = Form(..., description="Metadata for chunks (JSON)"),
):
    return pdf.with_url(url, metadata)
