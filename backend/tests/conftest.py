"""
Test configuration.

Uses an in-memory SQLite database and stubs out the SaaS client.
Run with: pytest
"""

import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.database import Base, get_db
from app.main import app
from app.models import User, UserRole  # noqa: F401
from app.core.security import hash_password
from app.services.saas_client import AbstractSaasClient, StubSaasClient, get_saas_client

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    engine = create_async_engine(TEST_DB_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_db():
        yield db_session

    app.dependency_overrides[get_db] = override_db
    app.dependency_overrides[get_saas_client] = lambda: StubSaasClient()

    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        yield c

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def expert_user(db_session: AsyncSession) -> User:
    user = User(
        email="expert@test.com",
        full_name="Expert Test",
        hashed_password=hash_password("password123"),
        role=UserRole.expert,
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_token(client: AsyncClient, expert_user: User) -> str:
    response = await client.post(
        "/api/v1/auth/login",
        data={"username": expert_user.email, "password": "password123"},
    )
    assert response.status_code == 200
    return response.json()["access_token"]
