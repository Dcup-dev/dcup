import logging
from src.common.utils import document_exists
from src.layers.chunking_embedding.chunk_document import chunk_document
from src.layers.chunking_embedding.embedding import embed_chunks
from src.layers.data_extractor import extractor
from src.layers.qdrant_store.store import store_chunks
from src.layers.structure_analyzer.analyzer import analyze_layout

from . import models


def processFile(fileType: models.FileType, file_bytes: bytes, metadata: dict):
    userId = metadata.get("_user_id")
    file_hash = metadata.get("_file_hash")
    if userId is None or file_hash is None:
        raise Exception("user_id or file_hash is missing")
  
    if document_exists(userId, file_hash):
        raise Exception("Document already uploaded")

    if fileType == models.FileType.pdf:
        pages, extractor_meta = extractor.pdf(file_bytes)
        logging.info(f"pdf data extracted pages: {len(pages)}")
        structured_document = analyze_layout(pages)
        logging.info("analyzed pdf structured")
        chunks = chunk_document(
            structured_document,
            extractor_meta | metadata,
            max_tokens=400,
        )
        logging.info(f"chunked pdf to : {len(chunks)} chunks")
        chunks = embed_chunks(chunks)
        logging.info(f"embedding chunks: {len(chunks[0].embedding)}")
        store_chunks(chunks)
        logging.info("stored chunked")
        return {"ok": True}

    raise Exception("Unspported File type")
