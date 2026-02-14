from collections import defaultdict
import re
import uuid
from typing import Counter, List

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

    font_tiers = compute_font_tiers(pages)

    for page in pages:

        # ---- normalize reading order ----
        page_lines = normalize_reading_order(page.lines)

        # ---- detect columns ----
        columns = cluster_columns(page_lines)

        for column_lines in columns:

            blocks = build_blocks(column_lines)

            for block in blocks:

                if is_garbage_block(block):
                    continue

                heading_level, confidence = detect_heading(block, font_tiers)

                # -------------------------------
                # SECTION CREATION
                # -------------------------------
                if heading_level > 0:

                    section = Section(
                        id=str(uuid.uuid4()),
                        title=clean_title(block.text),
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

def should_merge(prev_line, current_line):
    if not prev_line:
        return False

    # Font size must match
    if round(prev_line.avg_size, 1) != round(current_line.avg_size, 1):
        return False

    # Bold style mismatch → new paragraph
    if prev_line.is_bold != current_line.is_bold:
        return False

    # Indentation difference
    if abs(prev_line.x0 - current_line.x0) > 5:
        return False

    # Large vertical gap → new paragraph
    if has_large_vertical_gap(prev_line, current_line, multiplier=1.2):
        return False

    # Bullet line → start new paragraph
    if is_bullet_line(current_line.text):
        return False

    return True


def is_garbage_fragment(line, body_size):
    # Very small font → likely garbage
    if line.avg_size < body_size * 0.85:
        return True

    # Tiny orphan line → likely fragment
    words = line.text.strip().split()
    if len(words) <= 1:
        return True

    # Single symbol lines → skip
    if len(line.text.strip()) <= 2:
        return True

    return False


def is_bullet_line(text: str):

    stripped = text.strip()

    return (
        stripped.startswith(("•", "-", "–", "*"))
        or re.match(r"^\d+\.", stripped)
        or re.match(r"^[a-zA-Z]\)", stripped)
    )


def is_page_number(line, page_width):
    text = line.text.strip()
    if not text.isdigit():
        return False
    if not is_centered(line, page_width, tolerance_ratio=0.2):
        return False
    return True


# ==========================================================
# FONT ANALYSIS
# ==========================================================
def compute_font_stats(pages: List[Page]):
    sizes = []

    for page in pages:
        for line in page.lines:
            sizes.append(round(line.avg_size, 1))

    counter = Counter(sizes)

    body_size = counter.most_common(1)[0][0]
    unique_sizes = sorted(counter.keys(), reverse=True)

    return body_size, unique_sizes


def get_heading_level(line, body_size, size_levels):
    size = round(line.avg_size, 1)

    if size <= body_size:
        return 0

    for idx, s in enumerate(size_levels):
        if size == s:
            return idx + 1

    return 0


# ==========================================================
# LAYOUT SIGNALS
# ==========================================================
def is_centered(line, page_width, tolerance_ratio=0.1):
    line_center = (line.x0 + line.x1) / 2
    page_center = page_width / 2
    tolerance = page_width * tolerance_ratio
    return abs(line_center - page_center) <= tolerance


def compute_body_indent(pages):
    indents = []

    for page in pages:
        for line in page.lines:
            indents.append(round(line.x0, 1))

    counter = Counter(indents)
    return counter.most_common(1)[0][0]


def is_indent_shift(line, body_indent, threshold=5):
    return abs(line.x0 - body_indent) > threshold


def has_large_vertical_gap(prev_line, current_line, multiplier=1.5):
    if not prev_line:
        return False

    gap = current_line.top - prev_line.top
    return gap > (prev_line.avg_size * multiplier)



# ==========================================================
# HEADING SCORING
# ==========================================================
def compute_heading_score(
    line,
    body_size,
    body_indent,
    prev_line,
    page_width,
):
    score = 0.0

    # Larger font
    if line.avg_size > body_size:
        score += 0.4

    # Bold
    if line.is_bold:
        score += 0.2

    # Centered
    if is_centered(line, page_width):
        score += 0.15

    # Indent difference
    if is_indent_shift(line, body_indent):
        score += 0.1

    # Vertical gap above
    if has_large_vertical_gap(prev_line, line):
        score += 0.15

    # Short lines are more likely headings
    if len(line.text.split()) <= 20:
        score += 0.05

    return score


def should_merge_lines(prev_line: Line | None, current_line: Line) -> bool:

    if not prev_line:
        return False

    # Font match
    if abs(prev_line.avg_size - current_line.avg_size) > 0.3:
        return False

    # Bold mismatch
    if prev_line.is_bold != current_line.is_bold:
        return False

    # Indent tolerance
    if abs(prev_line.x0 - current_line.x0) > 8:
        return False

    # Vertical gap normalization
    gap = current_line.top - prev_line.top
    if gap > prev_line.avg_size * 1.6:
        return False

    # Bullet always starts new paragraph
    if is_bullet_line(current_line.text):
        return False

    # Sentence continuation heuristic
    if prev_line.text.rstrip().endswith((".", "!", "?", ":", ";")):
        return False

    return True


def is_garbage_line(line, known_headings):
    text = line.text.strip()

    # Numeric only
    if text.isdigit():
        return True

    # Single symbol (→, -, etc.)
    if len(text) <= 2 and not text.isalpha():
        return True

    # Repeated heading fragment
    if text in known_headings:
        return True

    # Tiny orphan word
    if len(text.split()) == 1 and len(text) < 4:
        return True

    return False





def normalize_reading_order(lines: List[Line]) -> List[Line]:
    return sorted(lines, key=lambda lin: (round(lin.top, 1), lin.x0))

def cluster_columns(lines: List[Line], tolerance=60):

    clusters = []

    for line in sorted(lines, key=lambda lin: lin.x0):

        placed = False

        for cluster in clusters:
            if abs(cluster["x_mean"] - line.x0) < tolerance:
                cluster["lines"].append(line)
                cluster["x_mean"] = sum(lin.x0 for lin in cluster["lines"]) / len(cluster["lines"])
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


def build_blocks(lines: List[Line]) -> List[Block]:

    blocks = []
    current = [lines[0]]

    for prev, line in zip(lines, lines[1:]):

        if should_start_new_block(prev, line):
            blocks.append(Block(current))
            current = [line]
        else:
            current.append(line)

    if current:
        blocks.append(Block(current))

    return blocks

def compute_font_tiers(pages: List[Page]):

    sizes = []

    for page in pages:
        for line in page.lines:
            sizes.append(round(line.avg_size, 1))

    unique = sorted(set(sizes), reverse=True)

    # map size → tier index
    return {size: idx + 1 for idx, size in enumerate(unique)}


def detect_heading(block, font_tiers):

    size = round(block.avg_size, 1)
    tier = font_tiers.get(size, 0)

    if tier <= 1:
        return 0, 0.0

    score = 0.0

    # Larger tier weight
    if tier >= 2:
        score += 0.5

    # Bold weight
    if block.is_bold:
        score += 0.2

    word_count = len(block.text.split())

    # Headings are usually short
    if word_count <= 12:
        score += 0.2
    else:
        score -= 0.3  # Penalize long paragraphs heavily

    # Penalize sentence-like paragraphs
    if block.text.count(".") > 1:
        score -= 0.3

    # Uppercase headings
    if block.text.isupper():
        score += 0.1

    if score >= 0.6:
        return tier - 1, round(score, 3)

    return 0, round(score, 3)


def is_garbage_block(block):

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

def detect_repeated_lines(pages):

    freq = defaultdict(int)

    for page in pages:
        for line in page.lines:
            key = (round(line.top, 0), line.text.strip())
            freq[key] += 1

    repeated = set()
    total = len(pages)

    for key, count in freq.items():
        if count > total * 0.6:
            repeated.add(key)

    return repeated


def clean_title(text: str) -> str:
    return re.sub(r"^\d+(\.\d+)*\s*", "", text).strip()


def should_start_new_block(prev: Line, current: Line):

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
