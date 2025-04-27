from fastapi import FastAPI, File, Form, Path, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from enum import Enum
import requests
import io
import pdfplumber

app = FastAPI(title="File Processing Microservice")


class FileType(str, Enum):
    pdf = "pdf"


class InputMode(str, Enum):
    file = "file"
    url = "url"


class PageContent(BaseModel):
    text: str
    tables: list[list[list[str]]]


@app.post(
    "/process/{file_type}/{input_mode}",
    response_model=list[PageContent],
    summary="Process an uploaded file or URL",
)
async def process_pdf(
    file_type: FileType = Path(..., description="Type of file to process"),
    input_mode: InputMode = Path(..., description="How content is passed"),
    upload: UploadFile | None = File(None, description="The file to upload"),
    url: str | None = Form(None, description="Link to fetch"),
):
    try:
        if input_mode == InputMode.url:
            if not url:
                raise HTTPException(422, "Must provide a URL when input_mode is 'url'")
            resp = requests.get(url, timeout=10)
            resp.raise_for_status()
            if file_type == FileType.pdf:
                if "application/pdf" not in resp.headers.get("Content-Type", ""):
                    raise HTTPException(400,"URL does not point to a PDF file")
            data = extract_text_from_pdf(resp.content)
            return JSONResponse(content=data, status_code=200)
        if input_mode == InputMode.file:
            if not upload:
                raise HTTPException(422, "Must upload a file when input_mode is 'file'")
            data_bytes = await upload.read()
            data = extract_text_from_pdf(data_bytes)
            return JSONResponse(content=data, status_code=200)
   
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))   
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")



def extract_text_from_pdf(pdf_bytes: bytes):
    pages_data = []
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text() or ""
                tables = page.extract_tables() or []
                pages_data.append({
                    "text": page_text.strip(),
                    "tables": tables,
                })
        return pages_data
    except Exception as e:
        raise ValueError(f"Error processing PDF: {e}")
