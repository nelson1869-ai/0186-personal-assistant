"""Public API response models."""

from typing import Literal

from pydantic import BaseModel


class HealthResponse(BaseModel):
    """Health status returned to clients and process monitors."""

    status: Literal["ok"]
    service: str
    version: str

