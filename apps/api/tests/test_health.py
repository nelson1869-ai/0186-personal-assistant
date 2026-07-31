"""Health endpoint contract tests."""

from httpx import ASGITransport, AsyncClient

from app.main import app


async def test_health_endpoint() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "assistant-api",
        "version": "0.1.0",
    }


async def test_openapi_includes_health_endpoint() -> None:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/openapi.json")

    assert "/api/v1/health" in response.json()["paths"]
