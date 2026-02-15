from fastapi import HTTPException, status
import logging

from src.layers.chunking_embedding.models import Chunk
from src.store.model import StoreResponse


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
