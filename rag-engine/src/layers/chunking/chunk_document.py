from typing import List
import uuid
from src.layers.chunking.models import Chunk
import tiktoken

_encoder = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    return len(_encoder.encode(text))


def chunk_document(
    structured_document,
    metadata: dict,
    max_tokens: int = 400,
) -> List[Chunk]:

    chunks: List[Chunk] = []

    # handle preamble
    if structured_document.preamble:
        preamble_text = "\n".join(p.text for p in structured_document.preamble)
        if not _looks_like_toc(preamble_text):
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

    # handle sections
    for section in structured_document.sections:
        chunks.extend(
            _process_section(
                section, parent_path=[], max_tokens=max_tokens, metadata=metadata
            )
        )

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

    return _merge_small_chunks(chunks, metadata)


def _process_section(
    section,
    parent_path: List[str],
    max_tokens: int,
    metadata: dict,
) -> List[Chunk]:

    path = parent_path + [section.title]
    chunks: List[Chunk] = []

    # chunk this section's paragraphs
    if section.paragraphs:
        chunks.extend(
            _chunk_paragraphs(
                paragraphs=section.paragraphs,
                section_title=section.title,
                section_path=path,
                level=section.level,
                max_tokens=max_tokens,
                metadata=metadata,
            )
        )

    # recursively process children
    for child in section.children:
        chunks.extend(
            _process_section(
                child, parent_path=path, max_tokens=max_tokens, metadata=metadata
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
    )


def _merge_small_chunks(
    chunks: List[Chunk], metadata: dict, min_tokens: int = 80
) -> List[Chunk]:
    if not chunks:
        return chunks

    merged = []
    buffer = chunks[0]

    for chunk in chunks[1:]:
        if buffer.token_count < min_tokens:
            combined_text = buffer.text + "\n" + chunk.text
            buffer = _build_chunk(
                combined_text,
                buffer.section_title,
                buffer.section_path,
                buffer.level,
                buffer.page_start,
                chunk.page_end,
                metadata=metadata,
            )
        else:
            merged.append(buffer)
            buffer = chunk

    merged.append(buffer)
    return merged


def _looks_like_toc(text: str) -> bool:
    lines = text.split("\n")
    digit_lines = sum(1 for lin in lines if lin.strip().split()[-1].isdigit())
    dotted_lines = sum(1 for lin in lines if "..." in lin or ". ." in lin)

    if len(lines) == 0:
        return False

    return (digit_lines / len(lines)) > 0.4 or (dotted_lines / len(lines)) > 0.3
