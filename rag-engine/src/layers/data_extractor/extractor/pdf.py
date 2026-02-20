import io
import re
from typing import List
import uuid
import pdfplumber

from src.layers.data_extractor.models import ImagePage, Line, Page, TablePage, Word


# ===============================
# CONFIG
# ===============================
LINE_TOLERANCE = 3  # vertical tolerance for grouping words into lines
TABLE_PADDING = 1.5  # small padding around table bbox to catch overlaps


# ===============================
# PUBLIC ENTRY
# ===============================
def extract_data_pdf(pdf_bytes: bytes) -> tuple[list[Page], dict]:
    pages_output: list[Page] = []
    metadata = {}

    try:
        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf_doc: 
            metadata["_page_count"] = len(pdf_doc.pages)
            metadata["_file_metadata"] = pdf_doc.metadata

            for page_number, page in enumerate(pdf_doc.pages, start=1):
                tables_output = _extract_tables(page, page_number)
                words = _extract_words(page)
                words = _filter_table_words(words, tables_output)

                lines_output = _group_words_into_lines(words)

                raw_text = "\n".join(line.text for line in lines_output)
                text = _normalize_text(raw_text)

                images_output = _extract_images(page)

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

        return pages_output, metadata

    except Exception as e:
        raise ValueError(f"Error processing PDF: {e}")


def _normalize_text(text: str) -> str:
    text = _fix_hyphen_breaks(text)
    text = _remove_page_numbers(text)
    text = _remove_dot_lines(text)
    text = _remove_lonely_symbols(text)
    text = _fix_merged_words(text)
    text = _normalize_spaces(text)

    text = "\n".join(line.rstrip() for line in text.splitlines())
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def _extract_words(page) -> List[Word]:

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


def _group_words_into_lines(words: List[Word]) -> List[Line]:

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
        bottom = max(w.bottom for w in cluster)

        lines_output.append(
            Line(
                text=line_text,
                words=cluster,
                top=top,
                avg_size=avg_size,
                is_bold=is_bold,
                x0=x0,
                x1=x1,
                bottom=bottom,
            )
        )

    # Sort final lines vertically
    lines_output.sort(key=lambda lin: lin.top)

    return lines_output


def _extract_tables(page, page_number):
    tables_output: list[TablePage] = []
    tables = page.find_tables()

    for table in tables:
        data = table.extract()

        if not data or not any(any(cell for cell in row) for row in data):
            continue

        bbox = table.bbox
        x0, top, x1, bottom = bbox

        tables_output.append(
            TablePage(
                id=str(uuid.uuid4()),
                bbox=bbox,
                data=data,
                top=top,
                x0=x0,
                x1=x1,
                bottom=bottom,
                page_number=page_number,
            )
        )

    return tables_output


def _extract_images(page):

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


def _fix_hyphen_breaks(text: str) -> str:
    return re.sub(r"-\n(\w)", r"\1", text)


def _remove_page_numbers(text: str) -> str:
    return "\n".join(line for line in text.splitlines() if not line.strip().isdigit())


def _normalize_spaces(text: str) -> str:
    return re.sub(r"[ \t]+", " ", text)


def _remove_dot_lines(text: str) -> str:
    return "\n".join(
        line
        for line in text.splitlines()
        if not re.match(r"^(\.\s?){5,}$", line.strip())
    )


def _remove_lonely_symbols(text: str) -> str:
    return "\n".join(line for line in text.splitlines() if len(line.strip()) > 2)


def _fix_merged_words(text: str) -> str:
    return re.sub(r"([a-z])([A-Z])", r"\1 \2", text)


def _filter_table_words(words: list[Word], tables: list[TablePage]) -> list[Word]:
    filtered = []
    for word in words:
        if not any(_is_inside_bbox(word, table.bbox) for table in tables):
            filtered.append(word)
    return filtered


def _is_inside_bbox(word: Word, bbox) -> bool:
    x0, top, x1, bottom = bbox
    return word.x0 >= x0 and word.x1 <= x1 and word.top >= top and word.bottom <= bottom
