from typing import List
import uuid
import tiktoken
from src.layers.chunking_embedding.models import Chunk
from src.layers.data_extractor.models import ImagePage, TablePage
from src.layers.structure_analyzer.models import Paragraph, Section, StructuredDocument

_encoder = tiktoken.get_encoding("cl100k_base")

_token_cache = {}


def count_tokens(text: str) -> int:
    if text in _token_cache:
        return _token_cache[text]

    val = len(_encoder.encode(text))
    _token_cache[text] = val
    return val


def chunk_document(
    structured_document: StructuredDocument,
    metadata: dict,
    max_tokens: int = 450,
    min_tokens: int = 80,
) -> List[Chunk]:

    chunks: List[Chunk] = []

    # ---- PREAMBLE ----
    if structured_document.preamble:
        preamble_text = "\n".join(p.text for p in structured_document.preamble)
        if preamble_text.strip():
            chunks.extend(
                _chunk_paragraphs(
                    paragraphs=structured_document.preamble,
                    section_title="Preamble",
                    section_path=["Preamble"],
                    level=0,
                    max_tokens=max_tokens,
                    metadata=metadata,
                )
            )

    # ---- SECTIONS ----
    for section in structured_document.sections:
        chunks.extend(
            _process_section(
                section,
                parent_path=[],
                max_tokens=max_tokens,
                min_tokens=min_tokens,
                metadata=metadata,
            )
        )

    # ---- FINAL CLEANUP ----
    chunks = _merge_small_chunks(chunks, min_tokens, max_tokens)
    chunks = _deduplicate_chunks_atttach_index(chunks)

    return chunks


def _chunk_paragraphs(
    paragraphs,
    section_title: str,
    section_path: List[str],
    level: int,
    max_tokens: int,
    metadata: dict,
) -> List[Chunk]:

    chunks: List[Chunk] = []

    buffer = ""
    page_start: int | None = None
    page_end: int | None = None

    for p in paragraphs:
        text = p.text.strip()
        if not text:
            continue

        if page_start is None:
            page_start = p.page_number

        page_end = p.page_number

        candidate = f"{buffer}\n{text}" if buffer else text
        token_count = count_tokens(candidate)

        if token_count <= max_tokens:
            buffer = candidate
        else:
            # flush
            if buffer:
                chunks.append(
                    _build_chunk(
                        buffer,
                        section_title,
                        section_path,
                        level,
                        page_start,
                        page_end,
                        metadata=metadata,
                    )
                )

            buffer = text
            page_start = p.page_number
            page_end = p.page_number

    # final flush
    if buffer:
        chunks.append(
            _build_chunk(
                buffer,
                section_title,
                section_path,
                level,
                page_start,
                page_end,
                metadata=metadata,
            )
        )

    return chunks


def _process_section(section, parent_path, max_tokens, min_tokens, metadata):

    path = parent_path + [section.title]
    chunks = []

    paragraph_buffer = []

    def flush_paragraph_buffer():
        nonlocal paragraph_buffer, chunks

        if paragraph_buffer:
            chunks.extend(
                _chunk_paragraphs(
                    paragraph_buffer,
                    section.title,
                    path,
                    section.level,
                    max_tokens,
                    metadata,
                )
            )
            paragraph_buffer = []

    for item in section.content_stream:
        if isinstance(item, Paragraph):
            paragraph_buffer.append(item)

        elif isinstance(item, TablePage):
            flush_paragraph_buffer()
            chunks.extend(_build_table_chunk(item, section, path, metadata))

        elif isinstance(item, Section):
            flush_paragraph_buffer()
            chunks.extend(
                _process_section(item, path, max_tokens, min_tokens, metadata)
            )

        elif isinstance(item, ImagePage):
            flush_paragraph_buffer()
            continue

    return chunks


def _build_table_chunk(table, section, section_path, metadata):

    table_metadata = metadata.copy()
    table_metadata["_content_type"] = "table"

    headers = table.data[0]
    rows = table.data[1:]

    max_rows_per_chunk = 20

    chunks = []

    for i in range(0, len(rows), max_rows_per_chunk):
        group = rows[i : i + max_rows_per_chunk]

        # Natural language version
        text_lines = []
        for row in group:
            row_text = ", ".join(f"{headers[j]}: {row[j]}" for j in range(len(headers)))
            text_lines.append(row_text)

        text = "Table:\n" + "\n".join(text_lines)

        chunk = Chunk(
            id=str(uuid.uuid4()),
            text=text,
            token_count=count_tokens(text),
            section_title=section.title,
            section_path=section_path,
            level=section.level,
            page_start=table.page_number,
            page_end=table.page_number,
            metadata={
                **table_metadata,
                "_table_headers": headers,
                "_row_start": i,
                "_row_end": i + len(group) - 1,
                "_table_json": group,
            },
        )

        chunks.append(chunk)

    return chunks


def _build_chunk(
    text: str,
    section_title: str,
    section_path: List[str],
    level: int,
    page_start: int | None,
    page_end: int | None,
    metadata: dict,
) -> Chunk:

    return Chunk(
        id=str(uuid.uuid4()),
        text=text.strip(),
        token_count=count_tokens(text),
        section_title=section_title,
        section_path=section_path,
        level=level,
        page_start=page_start,
        page_end=page_end,
        metadata=metadata,
    )


def _merge_small_chunks(
    chunks: List[Chunk],
    min_tokens: int,
    max_tokens: int,
) -> List[Chunk]:

    if not chunks:
        return []

    merged: List[Chunk] = []

    for chunk in chunks:
        if not merged:
            merged.append(chunk)
            continue

        prev = merged[-1]

        # Merge if either side is small
        if prev.token_count < min_tokens or chunk.token_count < min_tokens:
            combined_text = (
                prev.text + "." + "\n" + chunk.section_path[-1] + ":\n" + chunk.text
            )
            combined_tokens = count_tokens(combined_text)

            if combined_tokens <= max_tokens:
                merged[-1] = _build_chunk(
                    combined_text,
                    prev.section_title,
                    # combine section paths
                    prev.section_path
                    + [p for p in chunk.section_path if p not in prev.section_path],
                    prev.level,
                    prev.page_start,
                    chunk.page_end,
                    prev.metadata,
                )
                continue

        merged.append(chunk)

    return merged


def _deduplicate_chunks_atttach_index(chunks: List[Chunk]) -> List[Chunk]:
    seen = set()
    unique = []
    index = 0

    for chunk in chunks:
        normalized = chunk.text.strip()

        if normalized in seen:
            continue

        seen.add(normalized)
        chunk.chunk_index = index
        index += 1
        unique.append(chunk)

    return unique
