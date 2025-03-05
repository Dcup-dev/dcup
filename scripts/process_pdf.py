#!/usr/bin/env python
import io
import pdfplumber
import requests
import argparse
import json


def download_pdf(url: str) -> bytes:
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        if "application/pdf" not in response.headers.get("Content-Type", ""):
            raise ValueError("URL does not point to a PDF file")

        return response.content
    except requests.exceptions.RequestException as e:
        raise ValueError(f"Failed to download PDF: {e}")


def extract_text_from_pdf(pdf_bytes: bytes):
    result = {"text": "", "tables": []}
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    result["text"] += page_text + "\n"
                tables = page.extract_tables()
                if tables:
                    result["tables"].extend(tables)
            return result
    except Exception as e:
        raise ValueError(f"Error processing PDF: {e}")


def main():
    parser = argparse.ArgumentParser(description="Extract text from PDF URL")
    parser.add_argument("url", type=str, help="URL of the PDF file")
    args = parser.parse_args()
    try:
        pdf_content = download_pdf(args.url)
        result = extract_text_from_pdf(pdf_content)

    except Exception as e:
        result = {"error": str(e)}
    print(json.dumps(result))


if __name__ == "__main__":
    main()
