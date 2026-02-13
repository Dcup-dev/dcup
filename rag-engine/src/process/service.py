import logging
from src.layers.data_extractor import extractor
from . import models


def processFile(fileType: models.FileType, file_bytes: bytes):
    if fileType == models.FileType.pdf:
        logging.info("start processing pdf files")
        data = extractor.pdf(file_bytes)
        logging.info(f"pdf data extracted pages: {len(data)}")
        return data

    raise Exception("Unspported File type")
