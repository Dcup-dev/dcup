import io
import re
from typing import List
import uuid
import pdfplumber

from src.layers.data_extractor.models import ImagePage, Line, Page, Word


# ===============================
# CONFIG
# ===============================
LINE_TOLERANCE = 3  # vertical tolerance for grouping words into lines
TABLE_PADDING = 1.5  # small padding around table bbox to catch overlaps

# ===============================
# PUBLIC ENTRY
# ===============================
def pdf(pdf_bytes: bytes) -> list[Page]:
    pages_output: list[Page] = []

    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf_doc:
            for page_number, page in enumerate(pdf_doc.pages, start=1):
                tables_output = extract_tables(page)
                table_bboxes = [
                    expand_bbox(table.bbox, padding=TABLE_PADDING)
                    for table in page.find_tables()
                ]

                words = extract_words(page)
                words = filter_table_words(words, table_bboxes)

                lines_output = group_words_into_lines(words)

                raw_text = "\n".join(line.text for line in lines_output)
                text = normalize_text(raw_text)

                images_output = extract_images(page)

                pages_output.append(
                    Page(
                        page_number=page_number,
                        text=text,
                        lines=lines_output,
                        tables=tables_output,
                        images=images_output,
                        width=page.width,
                        height=page.height,
                    )
                )

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


def extract_words(page) -> List[Word]:

    raw_words = page.extract_words(
        x_tolerance=2,
        y_tolerance=2,
        keep_blank_chars=False,
        extra_attrs=["size", "fontname"],
    )

    words: List[Word] = []

    for w in raw_words:
        words.append(
            Word(
                text=w["text"],
                x0=w["x0"],
                x1=w["x1"],
                top=w["top"],
                bottom=w["bottom"],
                size=w.get("size", 0.0),
                fontname=w.get("fontname", ""),
            )
        )

    return words


def group_words_into_lines(words: List[Word]) -> List[Line]:

    if not words:
        return []

    words_sorted = sorted(words, key=lambda w: (w.top, w.x0))

    line_clusters: List[List[Word]] = []

    for word in words_sorted:
        placed = False

        for cluster in line_clusters:
            if abs(cluster[0].top - word.top) <= LINE_TOLERANCE:
                cluster.append(word)
                placed = True
                break

        if not placed:
            line_clusters.append([word])

    lines_output: List[Line] = []

    for cluster in line_clusters:
        cluster = sorted(cluster, key=lambda w: w.x0)

        line_text = " ".join(w.text for w in cluster)

        avg_size = sum(w.size for w in cluster) / len(cluster)

        is_bold = any("bold" in w.fontname.lower() for w in cluster)

        x0 = min(w.x0 for w in cluster)
        x1 = max(w.x1 for w in cluster)

        top = min(w.top for w in cluster)

        lines_output.append(
            Line(
                text=line_text,
                words=cluster,
                top=top,
                avg_size=avg_size,
                is_bold=is_bold,
                x0=x0,
                x1=x1,
            )
        )

    # Sort final lines vertically
    lines_output.sort(key=lambda lin: lin.top)

    return lines_output


def extract_tables(page):

    tables_output = []

    tables = page.find_tables()

    for table in tables:
        data = table.extract()

        if data and any(any(cell for cell in row) for row in data):
            tables_output.append(data)

    return tables_output


def extract_images(page):

    images_output: list[ImagePage] = []

    for img in page.images:
        images_output.append(
            ImagePage(
                id=str(uuid.uuid4()),
                x0=img.get("x0"),
                top=img.get("top"),
                x1=img.get("x1"),
                bottom=img.get("bottom"),
                width=img.get("width"),
                height=img.get("height"),
            )
        )

    return images_output


def fix_hyphen_breaks(text: str) -> str:
    return re.sub(r"-\n(\w)", r"\1", text)


def remove_page_numbers(text: str) -> str:
    return "\n".join(line for line in text.splitlines() if not line.strip().isdigit())


def normalize_spaces(text: str) -> str:
    return re.sub(r"[ \t]+", " ", text)


def remove_dot_lines(text: str) -> str:
    return "\n".join(
        line
        for line in text.splitlines()
        if not re.match(r"^(\.\s?){5,}$", line.strip())
    )


def remove_lonely_symbols(text: str) -> str:
    return "\n".join(line for line in text.splitlines() if len(line.strip()) > 2)


def fix_merged_words(text: str) -> str:
    return re.sub(r"([a-z])([A-Z])", r"\1 \2", text)

def expand_bbox(bbox, padding=1.0):
    x0, top, x1, bottom = bbox
    return (x0 - padding, top - padding, x1 + padding, bottom + padding)

def filter_table_words(words: list[Word], table_bboxes: list[tuple]) -> list[Word]:
    filtered = []
    for word in words:
        if not any(is_inside_bbox(word, bbox) for bbox in table_bboxes):
            filtered.append(word)
    return filtered

def is_inside_bbox(word: Word, bbox) -> bool:
    x0, top, x1, bottom = bbox
    return (
        word.x0 >= x0 and word.x1 <= x1 and word.top >= top and word.bottom <= bottom
    )
