#!/usr/bin/env python
import io
import pdfplumber
import requests
import argparse
import json
import sys


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


def main():
    parser = argparse.ArgumentParser(description="Extract text from PDF URL")
    parser.add_argument("input", nargs="?", type=str, help="URL of the PDF file")
    args = parser.parse_args()
    try:
        if args.input and (
            args.input.startswith("http://") or args.input.startswith("https://")
        ):
            pdf_content = download_pdf(args.input)
        else:
            if not sys.stdin.isatty():
                pdf_content = sys.stdin.buffer.read()
                if not pdf_content:
                    raise ValueError("No PDF data provided via STDIN.")
            else:
                raise ValueError("No valid URL provided and no PDF data piped.")

        result = extract_text_from_pdf(pdf_content)
    except Exception as e:
        result = {"error": str(e)}

    print(json.dumps(result))


if __name__ == "__main__":
    main()
