import json
import uuid
from src.layers.data_extractor.models import Line, Page, TablePage


def extract_data_json(json_bytes: bytes) -> tuple[list[Page], dict]:
    metadata: dict[str, object] = {
        "_file_type": "json",
        "_page_count": 1,
    }

    text = json_bytes.decode("utf-8", errors="replace")
    data = json.loads(text)

    lines: list[Line] = []
    tables: list[TablePage] = []

    y = 0.0

    _walk_json(
        data=data,
        path=[],
        lines=lines,
        tables=tables,
        y_ref=[y],
        page_number=1,
    )

    page = Page(
        page_number=1,
        text="\n".join(lin.text for lin in lines),
        lines=lines,
        tables=tables,
        images=[],
        width=None,
        height=None,
    )

    return [page], metadata


def _walk_json(
    data,
    path: list[str],
    lines: list[Line],
    tables: list[TablePage],
    y_ref: list[float],
    page_number: int,
):
    y = y_ref[0]

    # ---------- dict ----------
    if isinstance(data, dict):
        for key, value in data.items():  # 🔒 insertion order preserved
            title = ".".join(path + [str(key)])

            lines.append(
                Line(
                    text=title,
                    words=[],
                    top=y,
                    avg_size=18,
                    is_bold=True,
                    x0=len(path) * 20,
                    x1=800,
                    bottom=y + 18,
                )
            )
            y += 18

            _walk_json(value, path + [str(key)], lines, tables, [y], page_number)
            y = y_ref[0]

    # ---------- list ----------
    elif isinstance(data, list):
        if data and all(isinstance(x, dict) for x in data):
            # table-like list
            headers = list(data[0].keys())

            rows: list[list[str | None]] = []
            for item in data:  # 🔒 list order preserved
                rows.append([
                    str(item.get(h)) if item.get(h) is not None else None
                    for h in headers
                ])

            tables.append(
                TablePage(
                    id=str(uuid.uuid4()),
                    bbox=(0, y, 0, y),
                    data=[headers] + rows,
                    top=y,
                    x0=0,
                    x1=800,
                    bottom=y,
                    page_number=page_number,
                )
            )
            y += 14 * (len(rows) + 1)

        else:
            for idx, item in enumerate(data):
                _walk_json(item, path + [str(idx)], lines, tables, [y], page_number)
                y = y_ref[0]

    # ---------- scalar ----------
    else:
        lines.append(
            Line(
                text=str(data),
                words=[],
                top=y,
                avg_size=12,
                is_bold=False,
                x0=len(path) * 20,
                x1=800,
                bottom=y + 12,
            )
        )
        y += 12
