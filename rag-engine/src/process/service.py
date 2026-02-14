import logging
from src.layers.chunking_embedding.chunk_document import chunk_document
from src.layers.chunking_embedding.embedding import embed_chunks
from src.layers.data_extractor import extractor
from src.layers.structure_analyzer.analyzer import analyze_layout

from . import models


def processFile(fileType: models.FileType, file_bytes: bytes, metadata: dict):
    if fileType == models.FileType.pdf:
        logging.info("start processing pdf files")
        pages, extractor_meta = extractor.pdf(file_bytes)
        structured_document = analyze_layout(pages)
        chunks = chunk_document(
            structured_document,
            extractor_meta | metadata,
            max_tokens=400,
        )
        logging.info(f"pdf data extracted pages: {len(pages)}")
        chunks = embed_chunks(chunks)
        return [chunk.model_dump() for chunk in chunks]

    raise Exception("Unspported File type")
