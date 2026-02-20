import re
import uuid
from src.layers.data_extractor.models import ImagePage, Line, Page, TablePage
import yaml

JSX_SELF_CLOSING = re.compile(r"<[A-Z][^>/]*/>")
JSX_OPEN_CLOSE = re.compile(r"</?[A-Z][^>]*>")
CODE_BLOCK_RE = re.compile(
    r"```(\w+)?\n(.*?)\n```",
    re.DOTALL,
)


def extract_data_md(file_bytes: bytes) -> tuple[list[Page], dict]:
    md_text = file_bytes.decode("utf-8", errors="ignore")
    metadata: dict[str, object] = {
        "_page_count": 1,
    }

    md_text, fm = _extract_frontmatter(md_text)
    metadata.update(fm)

    md_text = _strip_mdx_jsx(md_text)

    lines, tables, images = _parse_md_stream(md_text)

    page = Page(
        page_number=1,
        text="\n".join(line.text for line in lines),
        lines=lines,
        tables=tables,
        images=images,
        width=None,
        height=None,
    )

    return [page], metadata


def _parse_md_stream(md_text: str):
    lines_out: list[Line] = []
    tables: list[TablePage] = []
    images: list[ImagePage] = []

    y = 0.0
    line_gap = 14.0
    i = 0
    rows = md_text.splitlines()

    while i < len(rows):
        raw = rows[i]
        stripped = raw.strip()

        # ---------- Code blocks ----------
        if stripped.startswith("```"):
            lang = stripped[3:].strip() or "text"
            body = []
            i += 1
            while i < len(rows) and not rows[i].strip().startswith("```"):
                body.append(rows[i])
                i += 1

            tag = "DIAGRAM" if lang.lower() == "mermaid" else "CODE"
            lines_out.append(
                Line(
                    text=f"[{tag}:{lang}]",
                    words=[],
                    top=y,
                    avg_size=12,
                    is_bold=True,
                    x0=0,
                    x1=400,
                    bottom=y + 12,
                )
            )
            y += line_gap

            for b in body:
                lines_out.append(
                    Line(
                        text=b,
                        words=[],
                        top=y,
                        avg_size=11,
                        is_bold=False,
                        x0=20,
                        x1=600,
                        bottom=y + 11,
                    )
                )
                y += line_gap

            i += 1
            continue

        # ---------- Tables (GFM) ----------
        if "|" in raw and i + 1 < len(rows) and "---" in rows[i + 1]:
            header = [c.strip() or None for c in raw.split("|") if c.strip()]
            data: list[list[str | None]] = [header]
            i += 2

            while i < len(rows) and "|" in rows[i]:
                row = [c.strip() or None for c in rows[i].split("|") if c.strip()]
                data.append(row)
                i += 1

            tables.append(
                TablePage(
                    id=str(uuid.uuid4()),
                    bbox=(0, y, 0, y),
                    data=data,
                    top=y,
                    x0=0,
                    x1=600,
                    bottom=y,
                    page_number=1,
                )
            )
            y += line_gap
            continue

        # ---------- Images ----------
        img_match = re.search(r"!\[.*?\]\((.*?)\)", raw)
        if img_match:
            images.append(
                ImagePage(
                    id=str(uuid.uuid4()),
                    x0=0,
                    top=y,
                    x1=0,
                    bottom=y,
                    width=None,
                    height=None,
                )
            )

        # ---------- Normal text / headings ----------
        text = raw.rstrip()
        if not stripped:
            y += line_gap
            i += 1
            continue

        level = len(stripped) - len(stripped.lstrip("#"))
        is_heading = level > 0 and stripped[level : level + 1] == " "

        clean = stripped[level + 1 :] if is_heading else stripped
        avg_size = 26 - level * 2 if is_heading else 12
        is_bold = is_heading or "**" in stripped or "__" in stripped
        indent = len(text) - len(text.lstrip())
        x0 = indent * 4

        lines_out.append(
            Line(
                text=clean,
                words=[],
                top=y,
                avg_size=avg_size,
                is_bold=is_bold,
                x0=x0,
                x1=x0 + len(clean) * 6,
                bottom=y + avg_size,
            )
        )

        y += line_gap
        i += 1

    return lines_out, tables, images


def _extract_frontmatter(md_text: str) -> tuple[str, dict[str, object]]:
    if not md_text.startswith("---"):
        return md_text, {}

    match = re.match(r"^---\n(.*?)\n---\n?", md_text, re.DOTALL)
    if not match:
        return md_text, {}

    raw_yaml = match.group(1)
    body = md_text[match.end() :]

    try:
        data = yaml.safe_load(raw_yaml) or {}
        if not isinstance(data, dict):
            data = {}
    except Exception:
        data = {}

    return body, data


def _strip_mdx_jsx(md_text: str) -> str:
    md_text = JSX_SELF_CLOSING.sub("", md_text)
    md_text = JSX_OPEN_CLOSE.sub("", md_text)
    return md_text
