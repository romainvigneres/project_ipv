import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, expert_user):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": expert_user.email, "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, expert_user):
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": expert_user.email, "password": "wrong"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_without_token(client: AsyncClient):
    response = await client.get("/api/v1/visits/")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_with_token(client: AsyncClient, auth_token: str):
    response = await client.get(
        "/api/v1/visits/",
        headers={"Authorization": f"Bearer {auth_token}"},
    )
    assert response.status_code == 200
