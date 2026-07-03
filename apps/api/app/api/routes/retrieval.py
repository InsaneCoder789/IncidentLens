from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.rag.retriever import search_evidence
from app.schemas.retrieval import RetrievalSearchRequest, RetrievalSearchResponse

router = APIRouter(prefix="/api/retrieval", tags=["retrieval"])


@router.post("/search", response_model=RetrievalSearchResponse)
def retrieval_search(payload: RetrievalSearchRequest, db: Session = Depends(get_db)) -> RetrievalSearchResponse:
    results = search_evidence(db, payload)
    return RetrievalSearchResponse(query=payload.query, results=results)
