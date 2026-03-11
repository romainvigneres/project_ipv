"""
Seed script — run once to create an initial admin user.

Usage (inside the container or venv):
    python -m app.db.init_db
"""

import asyncio

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal, Base, engine
from app.core.security import hash_password
from app.models import User, UserRole  # noqa: F401 — triggers model registration


async def create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed_admin(db: AsyncSession) -> None:
    from sqlalchemy import select

    result = await db.execute(select(User).where(User.email == "admin@example.com"))
    if result.scalars().first():
        print("Admin user already exists, skipping.")
        return

    admin = User(
        email="admin@example.com",
        full_name="Administrateur",
        hashed_password=hash_password("changeme123!"),
        role=UserRole.admin,
        is_active=True,
    )
    db.add(admin)
    await db.commit()
    print("Admin user created: admin@example.com / changeme123!")
    print("IMPORTANT: change the password after first login.")


async def main() -> None:
    await create_tables()
    async with AsyncSessionLocal() as db:
        await seed_admin(db)


if __name__ == "__main__":
    asyncio.run(main())
