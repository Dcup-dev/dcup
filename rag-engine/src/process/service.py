import logging
from src.layers.chunking.chunk_document import chunk_document
from src.layers.data_extractor import extractor
from src.layers.structure_analyzer.analyzer import analyze_layout

from . import models


def processFile(fileType: models.FileType, file_bytes: bytes, metadata: dict):
    if fileType == models.FileType.pdf:
        logging.info("start processing pdf files")
        pages = extractor.pdf(file_bytes)
        structured_document = analyze_layout(pages)
        chunks = chunk_document(structured_document, metadata, max_tokens=400)
        logging.info(f"pdf data extracted pages: {len(pages)}")
        return [chunk.model_dump() for chunk in chunks]

    raise Exception("Unspported File type")
