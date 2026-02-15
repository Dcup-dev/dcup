import json
from typing import List
import uuid
import tiktoken
from src.layers.chunking_embedding.models import Chunk
from src.layers.structure_analyzer.models import Section, StructuredDocument

_encoder = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    return len(_encoder.encode(text))


def chunk_document(
    structured_document: StructuredDocument,
    metadata: dict,
    max_tokens: int = 400,
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
                    min_tokens=min_tokens,
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
    chunks = _deduplicate_chunks(chunks)

    return chunks


def _chunk_paragraphs(
    paragraphs,
    section_title: str,
    section_path: List[str],
    level: int,
    max_tokens: int,
    min_tokens: int,
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

    return _merge_small_chunks(chunks, metadata, min_tokens, max_tokens)


def _process_section(
    section: Section,
    parent_path: List[str],
    max_tokens: int,
    min_tokens: int,
    metadata: dict,
) -> List[Chunk]:

    path = parent_path + [section.title]
    chunks: List[Chunk] = []

    # ---- TEXT CHUNKS ----
    if section.paragraphs:
        chunks.extend(
            _chunk_paragraphs(
                paragraphs=section.paragraphs,
                section_title=section.title,
                section_path=path,
                level=section.level,
                max_tokens=max_tokens,
                min_tokens=min_tokens,
                metadata=metadata,
            )
        )

    # ---- TABLE CHUNKS ----
    if section.tables:
        chunks.extend(
            _build_table_chunks_from_section(
                section=section,
                section_path=path,
                metadata=metadata,
            )
        )

    # ---- CHILD SECTIONS ----
    for child in section.children:
        chunks.extend(
            _process_section(
                child,
                parent_path=path,
                max_tokens=max_tokens,
                min_tokens=min_tokens,
                metadata=metadata,
            )
        )

    if (
        not section.paragraphs
        and not section.tables
        and not section.children
        and section.title.strip()
    ):
        if not _is_pure_category_title(section.title):
            chunks.append(
                _build_chunk(
                    text=section.title.strip(),
                    section_title=section.title,
                    section_path=path,
                    level=section.level,
                    page_start=section.page_number,
                    page_end=section.page_number,
                    metadata=metadata,
                )
            )

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
        embedding=None,
    )


def _merge_small_chunks(
    chunks: List[Chunk],
    metadata: dict,
    min_tokens: int,
    max_tokens: int,
) -> List[Chunk]:

    if not chunks:
        return []

    merged = []
    buffer = chunks[0]

    for chunk in chunks[1:]:
        # If buffer too small, try merging
        if buffer.token_count < min_tokens:
            combined_text = buffer.text + "\n" + chunk.text
            combined_tokens = count_tokens(combined_text)

            # Only merge if we stay under max_tokens
            if combined_tokens <= max_tokens:
                buffer = _build_chunk(
                    combined_text,
                    buffer.section_title,
                    buffer.section_path,
                    buffer.level,
                    buffer.page_start,
                    chunk.page_end,
                    metadata,
                )
                continue

        # Otherwise flush buffer
        merged.append(buffer)
        buffer = chunk

    merged.append(buffer)
    return merged


def _deduplicate_chunks(chunks: List[Chunk]) -> List[Chunk]:
    seen = set()
    unique = []

    for chunk in chunks:
        normalized = chunk.text.strip()

        if normalized in seen:
            continue

        seen.add(normalized)
        unique.append(chunk)

    return unique


def _build_table_chunks_from_section(
    section: Section,
    section_path: List[str],
    metadata: dict,
) -> List[Chunk]:

    chunks = []

    for table in section.tables:
        table_metadata = metadata.copy()
        table_metadata["_content_type"] = "table"
        table_json = json.dumps(table, ensure_ascii=False)

        chunks.append(
            Chunk(
                id=str(uuid.uuid4()),
                text=table_json,
                token_count=count_tokens(table_json),
                section_title=section.title,
                section_path=section_path,
                level=section.level,
                page_start=section.page_number,
                page_end=section.page_number,
                metadata=table_metadata,
                embedding=None,
            )
        )

    return chunks


def _is_pure_category_title(title: str) -> bool:
    clean = title.strip()

    # If fully uppercase and short → likely category
    if clean.isupper() and len(clean.split()) <= 3:
        return True

    return False
