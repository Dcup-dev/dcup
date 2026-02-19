from typing import List
from fastapi import APIRouter, Form, HTTPException, status
from src.query.model import QueryResponse
from qdrant_client.models import Optional

import logging
from src.common.utils import parse_metadata
from src.query.service import query

query_router = APIRouter(tags=["Query"])


@query_router.post(
    "/query",
    summary="query chunk",
    response_model=List[QueryResponse],
    status_code=status.HTTP_200_OK,
)
def chunk_query(
    queries: list[str] = Form(..., description="query list"),
    metadata: Optional[str] = Form(..., description="Metadata for chunks (JSON)"),
    top_result: int | None = Form(None, description="top results"),
):
    meta = parse_metadata(metadata)
    logging.info(f"parse Metadata: {len(meta)}")
    user_id = meta.get("_user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing '_user_id' in metadata",
        )
    final_top_k = top_result if top_result else 10
    chunks = query(queries, meta, final_top_k)
    logging.info(f"Query sucscesfully :{len(chunks)}")
    return chunks
