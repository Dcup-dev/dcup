import logging
from src.layers.data_extractor import extractor
from src.layers.structure_analyzer.analyzer import analyze_layout

from . import models


def processFile(fileType: models.FileType, file_bytes: bytes):
    if fileType == models.FileType.pdf:
        logging.info("start processing pdf files")
        pages = extractor.pdf(file_bytes)
        data = analyze_layout(pages)
        logging.info(f"pdf data extracted pages: {len(pages)}")
        return data.model_dump()

    raise Exception("Unspported File type")
