from fastapi import APIRouter, File, Form, UploadFile, status
from qdrant_client.models import Optional
from src.store.model import StoreResponse
from src.store.controllers import pdf, md, csv, json, sheet

store_upload_router = APIRouter(prefix="/store/upload", tags=["Store_Upload"])
store_url_router = APIRouter(prefix="/store/url", tags=["Store_URL"])

# 1. PDF
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
    return await pdf.upload(upload, metadata)

@store_url_router.post(
    "/pdf",
    summary="Store an uploaded PDF file",
    response_model=StoreResponse,
    status_code=status.HTTP_200_OK,
)
def store_pdf_with_url(
    url: str = Form(..., description="Link to fetch"),
    metadata: Optional[str] = Form(..., description="Metadata for chunks (JSON)"),
):
    return pdf.with_url(url, metadata)

# 2. MDX
@store_upload_router.post(
    "/md",
    summary="Store an uploaded Markdown / MDX file",
    status_code=status.HTTP_200_OK,
)
async def store_md_upload(
    upload: UploadFile = File(..., description="Markdown or MDX file to upload"),
    metadata: Optional[str] = Form(None, description="Metadata for chunks (JSON)"),
):
    return await md.upload(upload, metadata)

@store_url_router.post(
    "/md",
    summary="Store a Markdown / MDX file from URL",
    status_code=status.HTTP_200_OK,
)
def store_md_with_url(
    url: str = Form(..., description="Link to fetch Markdown / MDX"),
    metadata: Optional[str] = Form(None, description="Metadata for chunks (JSON)"),
):
    return md.with_url(url, metadata)

# 3. CSV
@store_upload_router.post(
    "/csv",
    summary="Store an uploaded CSV file",
    status_code=status.HTTP_200_OK,
)
async def store_csv_upload(
    upload: UploadFile = File(..., description="CSV file to upload"),
    metadata: Optional[str] = Form(None, description="Metadata for chunks (JSON)"),
):
    return await csv.upload(upload, metadata)

@store_url_router.post(
    "/csv",
    summary="Store a SCV file from URL",
    status_code=status.HTTP_200_OK,
)
def store_csv_with_url(
    url: str = Form(..., description="Link to fetch CSV"),
    metadata: Optional[str] = Form(None, description="Metadata for chunks (JSON)"),
):
    return csv.with_url(url, metadata)

# 4. JSON
@store_upload_router.post(
    "/json",
    summary="Store an uploaded JSON file",
    status_code=status.HTTP_200_OK,
)
async def store_json_upload(
    upload: UploadFile = File(..., description="JSON file to upload"),
    metadata: Optional[str] = Form(None, description="Metadata for chunks (JSON)"),
):
    return await json.upload(upload, metadata)

@store_url_router.post(
    "/json",
    summary="Store a JSON file from URL",
    status_code=status.HTTP_200_OK,
)
def store_json_with_url(
    url: str = Form(..., description="Link to fetch JSON"),
    metadata: Optional[str] = Form(None, description="Metadata for chunks (JSON)"),
):
    return json.with_url(url, metadata)

# 5. Sheet
@store_upload_router.post(
    "/sheet",
    summary="Store an uploaded sheet file",
    status_code=status.HTTP_200_OK,
)
async def store_sheet_upload(
    upload: UploadFile = File(..., description="Sheet file to upload"),
    metadata: Optional[str] = Form(None, description="Metadata for chunks (JSON)"),
):
    return await sheet.upload(upload, metadata)

@store_url_router.post(
    "/sheet",
    summary="Store a Sheet file from URL",
    status_code=status.HTTP_200_OK,
)
def store_sheet_with_url(
    url: str = Form(..., description="Link to fetch Sheet"),
    metadata: Optional[str] = Form(None, description="Metadata for chunks (JSON)"),
):
    return sheet.with_url(url, metadata)
