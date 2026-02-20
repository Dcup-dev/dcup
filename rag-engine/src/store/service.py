import logging

from fastapi import HTTPException, status
from src.layers.chunking_embedding.chunk_document import chunk_document
from src.layers.chunking_embedding.embedding import embed_chunks
from src.layers.chunking_embedding.models import Chunk
from src.layers.qdrant_store.store import store_chunks
from src.layers.structure_analyzer.analyzer import analyze_layout
from src.store.model import StoreResponse


def handle(file_bytes: bytes, metadata: dict, extract_data_func):
    return process_with_error_handling(
        _handleFile, file_bytes, metadata, extract_data_func
    )


def _handleFile(file_bytes: bytes, metadata: dict, extract_data_func):
    file_type = metadata.get("_file_type")
    pages, extractor_meta = extract_data_func(file_bytes)
    logging.info(f"{file_type} data extracted pages: {len(pages)}")
    structured_document = analyze_layout(pages)
    logging.info(f"analyzed {file_type} structured")
    chunks = chunk_document(
        structured_document,
        metadata | extractor_meta,
        max_tokens=450,
        min_tokens=80,
    )
    logging.info(f"chunked {file_type} to : {len(chunks)} chunks")
    chunks = embed_chunks(chunks)
    logging.info("embedding chunks")
    store_chunks(chunks)
    logging.info("stored chunked")
    return makeResponse(metadata | extractor_meta, chunks)


def makeResponse(metadata: dict, chunks: list[Chunk]) -> StoreResponse:
    return StoreResponse(
        document_id=metadata["_file_hash"],
        file_type=metadata["_file_type"],
        page_count=metadata["_page_count"],
        chunks=[chunk.id for chunk in chunks],
    )


def process_with_error_handling(process_func, *args, **kwargs):
    """
    Execute process_func and convert exceptions to HTTPException.
    - ValueError -> 400 Bad Request
    - Other Exception -> 500 Internal Server Error (with generic message)
    """
    try:
        return process_func(*args, **kwargs)
    except ValueError as e:
        # Client error – include the message
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        # Server error – log and return generic message
        logging.error(f"Unexpected error in processing, {str(e)} ")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred while processing the file.",
        )
