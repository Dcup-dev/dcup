import logging
from src.layers.chunking_embedding.chunk_document import chunk_document
from src.layers.chunking_embedding.embedding import embed_chunks
from src.layers.data_extractor.extractor.pdf import extract_data
from src.layers.qdrant_store.store import store_chunks
from src.layers.structure_analyzer.analyzer.pdf import analyze_layout
from src.store.services.utils import makeResponse, process_with_error_handling


def handle(file_bytes: bytes, metadata: dict):
    return process_with_error_handling(_handleFile, file_bytes, metadata)


def _handleFile(file_bytes: bytes, metadata: dict):
    pages, extractor_meta = extract_data(file_bytes)
    logging.info(f"pdf data extracted pages: {len(pages)}")
    structured_document = analyze_layout(pages)
    logging.info("analyzed pdf structured")
    chunks = chunk_document(
        structured_document,
        metadata | extractor_meta,
        max_tokens=400,
    )
    logging.info(f"chunked pdf to : {len(chunks)} chunks")
    chunks = embed_chunks(chunks)
    logging.info(f"embedding chunks: {len(chunks[0].embedding)}")
    store_chunks(chunks)
    logging.info("stored chunked")
    return makeResponse(metadata | extractor_meta, chunks)
