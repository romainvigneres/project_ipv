from fastapi import APIRouter

from app.api.v1.endpoints import auth, reports, users, visits

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(visits.router, prefix="/visits", tags=["visits"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
