import csv
import io
import uuid
from src.layers.data_extractor.models import Line, Page, TablePage


def extract_data_csv(csv_bytes: bytes) -> tuple[list[Page], dict]:
    metadata: dict[str, object] = {
        "_file_type": "csv",
        "_page_count": 1,
    }

    text = csv_bytes.decode("utf-8", errors="replace")

    lines, tables = _parse_csv(text, metadata)

    page = Page(
        page_number=1,
        text="\n".join(line.text for line in lines),
        lines=lines,
        tables=tables,
        images=[],
        width=None,
        height=None,
    )

    return [page], metadata


def _parse_csv(
    csv_text: str,
    metadata: dict[str, object],
) -> tuple[list[Line], list[TablePage]]:

    reader = csv.reader(io.StringIO(csv_text))
    rows = list(reader)

    if not rows:
        return [], []

    header = rows[0]
    body = rows[1:]

    metadata["_csv_columns"] = header
    metadata["_csv_row_count"] = len(body)

    lines: list[Line] = []
    tables: list[TablePage] = []

    y = 0.0
    line_gap = 14.0

    # ---------- Optional title line ----------
    lines.append(
        Line(
            text="CSV Table",
            words=[],
            top=y,
            avg_size=22,
            is_bold=True,
            x0=0,
            x1=300,
            bottom=y + 22,
        )
    )
    y += line_gap * 2

    # ---------- Table ----------
    data: list[list[str | None]] = [[c if c != "" else None for c in header]]

    for row in body:
        data.append([c if c != "" else None for c in row])

    tables.append(
        TablePage(
            id=str(uuid.uuid4()),
            bbox=(0, y, 0, y),
            data=data,
            top=y,
            x0=0,
            x1=800,
            bottom=y,
            page_number=1,
        )
    )

    # ---------- Text lines (for layout + headings) ----------
    for _, row in enumerate(body[:50]):  # cap for readability
        text = ", ".join(f"{header[i]}: {row[i]}" for i in range(len(header)))
        lines.append(
            Line(
                text=text,
                words=[],
                top=y,
                avg_size=12,
                is_bold=False,
                x0=20,
                x1=800,
                bottom=y + 12,
            )
        )
        y += line_gap

    return lines, tables
