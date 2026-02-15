import json
from fastapi import HTTPException, status
from qdrant_client.models import Optional


def parse_metadata(metadata_str: Optional[str]) -> dict:
    """Parse JSON metadata string, return empty dict if None."""
    if metadata_str:
        try:
            return json.loads(metadata_str)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Invalid JSON in metadata field",
            )
    return {}
