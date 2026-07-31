"""Health-check routes."""

from fastapi import APIRouter

from app.models import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, summary="Check API health")
async def health() -> HealthResponse:
    """Report whether the API process is available."""
    return HealthResponse(status="ok", service="assistant-api", version="0.1.0")

