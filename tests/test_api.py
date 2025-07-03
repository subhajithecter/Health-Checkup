import pytest
from httpx import AsyncClient
from backend.server import app
from fastapi.testclient import TestClient
from httpx import AsyncClient
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient
from httpx._transports.asgi import ASGITransport
from backend.server import app


@pytest.mark.asyncio
async def test_root_api():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/")
    assert response.status_code == 200
    assert response.json() == {"message": "Remote Diagnosis App API"}


@pytest.mark.asyncio
async def test_diagnosis_success():
    payload = {
        "symptoms": "Cough and cold with mild fever",
        "patient_age": 30,
        "patient_gender": "male",
        "location": "Bangalore",
        "image_base64": None
    }

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/diagnose", json=payload)

    assert response.status_code == 200
    result = response.json()
    assert "diagnosis" in result
    assert isinstance(result["medicines"], list)
    assert "disclaimer" in result


@pytest.mark.asyncio
async def test_diagnosis_invalid_payload():
    payload = {
        "patient_age": 45,
        "patient_gender": "female"
    }

    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.post("/api/diagnose", json=payload)

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_history_returns_list():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        response = await ac.get("/api/history")

    assert response.status_code == 200
    assert isinstance(response.json(), list)
