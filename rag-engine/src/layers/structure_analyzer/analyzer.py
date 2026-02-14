import re
import uuid
from typing import List

from src.layers.data_extractor.models import Line, Page
from src.layers.structure_analyzer.models import Paragraph, Section, StructuredDocument


# ==========================================================
# PUBLIC API
# ==========================================================
def analyze_layout(pages: List[Page]) -> StructuredDocument:

    document = StructuredDocument()
    stack: List[Section] = []

    if not pages:
        return document

    font_tiers = _compute_font_tiers(pages)

    for page in pages:
        # ---- normalize reading order ----
        page_lines = _normalize_reading_order(page.lines)

        # ---- detect columns ----
        columns = _cluster_columns(page_lines)

        for column_lines in columns:
            blocks = _build_blocks(column_lines)

            for block in blocks:
                if _is_garbage_block(block):
                    continue

                heading_level, confidence = _detect_heading(block, font_tiers)

                # -------------------------------
                # SECTION CREATION
                # -------------------------------
                if heading_level > 0:
                    section = Section(
                        id=str(uuid.uuid4()),
                        title=_clean_title(block.text),
                        level=heading_level,
                        page_number=page.page_number,
                        confidence=confidence,
                    )

                    while stack and stack[-1].level >= heading_level:
                        stack.pop()

                    if stack:
                        stack[-1].children.append(section)
                    else:
                        document.sections.append(section)

                    stack.append(section)
                    continue

                # -------------------------------
                # PARAGRAPH CREATION
                # -------------------------------
                paragraph = Paragraph(
                    text=block.text,
                    page_number=page.page_number,
                )

                if stack:
                    stack[-1].paragraphs.append(paragraph)
                else:
                    document.preamble.append(paragraph)

        # ---- attach assets ----
        if stack:
            stack[-1].tables.extend(page.tables)
            stack[-1].images.extend(page.images)

    return document


def _normalize_reading_order(lines: List[Line]) -> List[Line]:
    return sorted(lines, key=lambda lin: (round(lin.top, 1), lin.x0))


def _cluster_columns(lines: List[Line], tolerance=60):

    clusters = []

    for line in sorted(lines, key=lambda lin: lin.x0):
        placed = False

        for cluster in clusters:
            if abs(cluster["x_mean"] - line.x0) < tolerance:
                cluster["lines"].append(line)
                cluster["x_mean"] = sum(lin.x0 for lin in cluster["lines"]) / len(
                    cluster["lines"]
                )
                placed = True
                break

        if not placed:
            clusters.append({"x_mean": line.x0, "lines": [line]})

    # maintain vertical order inside each column
    return [
        sorted(cluster["lines"], key=lambda lin: lin.top)
        for cluster in sorted(clusters, key=lambda c: c["x_mean"])
    ]


class Block:
    def __init__(self, lines: List[Line]):
        self.lines = lines
        self.text = " ".join(lin.text for lin in lines)
        self.avg_size = sum(lin.avg_size for lin in lines) / len(lines)
        self.is_bold = any(lin.is_bold for lin in lines)
        self.x0 = min(lin.x0 for lin in lines)
        self.top = lines[0].top


def _build_blocks(lines: List[Line]) -> List[Block]:

    blocks = []
    current = [lines[0]]

    for prev, line in zip(lines, lines[1:]):
        if _should_start_new_block(prev, line):
            blocks.append(Block(current))
            current = [line]
        else:
            current.append(line)

    if current:
        blocks.append(Block(current))

    return blocks


def _compute_font_tiers(pages: List[Page]):

    sizes = []

    for page in pages:
        for line in page.lines:
            sizes.append(round(line.avg_size, 1))

    unique = sorted(set(sizes), reverse=True)

    # map size → tier index
    return {size: idx + 1 for idx, size in enumerate(unique)}


def _detect_heading(block, font_tiers):

    if _is_code_like(block):
        return 0, 0.0

    if _looks_like_toc_block(block):
        return 0, 0.0

    size = round(block.avg_size, 1)
    tier = font_tiers.get(size, 0)

    if tier == 0:
        return 0, 0.0

    score = 0.0

    # Tier weight (now includes largest font)
    if tier >= 1:
        score += 0.5

    if block.is_bold:
        score += 0.2

    word_count = len(block.text.split())

    if word_count <= 12:
        score += 0.2
    else:
        score -= 0.4

    if block.text.count(".") > 1:
        score -= 0.3

    if block.text.isupper():
        score += 0.1

    # Chapter-number pattern
    text = block.text.strip()
    if text and text[0].isdigit() and "—" in text:
        score += 0.2

    if score >= 0.6:
        level = min(tier, 6)
        return level, round(score, 3)

    return 0, round(score, 3)


def _is_garbage_block(block):

    text = block.text.strip()

    if not text:
        return True

    # pure symbols
    if len(text) <= 2 and not text.isalpha():
        return True

    # extremely tiny font
    if block.avg_size < 5:
        return True

    return False


def _clean_title(text: str) -> str:
    return re.sub(r"^\d+(\.\d+)*\s*", "", text).strip()


def _should_start_new_block(prev: Line, current: Line):

    # large vertical gap
    gap = current.top - prev.top
    if gap > prev.avg_size * 1.8:
        return True

    # strong font size change
    if abs(prev.avg_size - current.avg_size) > 1.2:
        return True

    # strong indent shift
    if abs(prev.x0 - current.x0) > 40:
        return True

    return False


def _is_code_like(block) -> bool:
    text = block.text.strip()

    if not text:
        return False

    # High punctuation density
    punct = sum(1 for c in text if c in "{}();=<>[]")
    if len(text) > 0 and (punct / len(text)) > 0.08:
        return True

    # Ends with semicolon (strong signal)
    if text.endswith(";"):
        return True

    # Many parentheses (function-like)
    if text.count("(") >= 1 and text.count(")") >= 1:
        if "{" in text or "=" in text:
            return True

    # Very high digit ratio (often code or references)
    digits = sum(1 for c in text if c.isdigit())
    if len(text) > 0 and (digits / len(text)) > 0.3:
        return True

    return False


def _looks_like_toc_block(block) -> bool:
    text = block.text.strip()

    if not text:
        return False

    words = text.split()

    # Many dot leaders
    if text.count(".") > 8:
        return True

    # Ends with page number
    if words and words[-1].isdigit():
        if text.count(".") >= 3:
            return True

    # High digit ratio
    digits = sum(1 for c in text if c.isdigit())
    if len(text) > 0 and (digits / len(text)) > 0.4:
        return True

    return False
