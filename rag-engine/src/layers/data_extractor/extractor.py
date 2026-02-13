import io
import re
import uuid
import pdfplumber

from src.process.models import PageContent


def pdf(pdf_bytes: bytes) -> list[PageContent]:
    pages_output = []
    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page_number, page in enumerate(pdf.pages, start=1):
                words = page.extract_words(
                    x_tolerance=2, y_tolerance=2, keep_blank_chars=False
                )
                lines = {}
                for w in words:
                    top = round(w["top"], 1)
                    lines.setdefault(top, []).append(w)
                text_lines = []
                for top in sorted(lines.keys()):
                    line_words = sorted(lines[top], key=lambda x: x["x0"])
                    line_text = " ".join(word["text"] for word in line_words)
                    text_lines.append(line_text)
                text = normalize_text("\n".join(text_lines))

                tables_output = []
                tables = page.find_tables()
                for table in tables:
                    data = table.extract()
                    if data and any(any(cell for cell in row) for row in data):
                        tables_output.append(data)

                images_output = []
                for img in page.images:
                    images_output.append({
                        "id": str(uuid.uuid4()),
                        "x0": img.get("x0"),
                        "top": img.get("top"),
                        "x1": img.get("x1"),
                        "bottom": img.get("bottom"),
                        "width": img.get("width"),
                        "height": img.get("height"),
                    })

                pages_output.append({
                    "page_number": page_number,
                    "text": text,
                    "tables": tables_output,
                    "images": images_output,
                    "width": page.width,
                    "height": page.height,
                })

        return pages_output
    except Exception as e:
        raise ValueError(f"Error processing PDF: {e}")


def normalize_text(text: str) -> str:
    text = fix_hyphen_breaks(text)
    text = remove_page_numbers(text)
    text = remove_dot_lines(text)
    text = remove_lonely_symbols(text)
    text = fix_merged_words(text)
    text = normalize_spaces(text)

    text = "\n".join(line.rstrip() for line in text.splitlines())
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def fix_hyphen_breaks(text: str) -> str:
    # Join words broken with hyphen + newline
    return re.sub(r"-\n(\w)", r"\1", text)


def remove_page_numbers(text: str) -> str:
    lines = text.splitlines()
    cleaned = []

    for line in lines:
        stripped = line.strip()
        if stripped.isdigit():
            continue
        cleaned.append(line)

    return "\n".join(cleaned)


def normalize_spaces(text: str) -> str:
    return re.sub(r"[ \t]+", " ", text)


def remove_dot_lines(text: str) -> str:
    lines = text.splitlines()
    cleaned = []
    for line in lines:
        if re.match(r"^(\.\s?){5,}$", line.strip()):
            continue
        cleaned.append(line)
    return "\n".join(cleaned)


def remove_lonely_symbols(text: str) -> str:
    lines = text.splitlines()
    cleaned = []
    for line in lines:
        if len(line.strip()) <= 2:
            continue
        cleaned.append(line)
    return "\n".join(cleaned)


def fix_merged_words(text: str) -> str:
    return re.sub(r"([a-z])([A-Z])", r"\1 \2", text)
