from datetime import datetime

from pydantic import BaseModel

from app.models.visit import VisitStatus


class VisitRead(BaseModel):
    id: int
    saas_id: str
    claim_reference: str
    expert_id: int
    client_name: str
    client_email: str | None
    address: str
    visit_time: datetime
    status: VisitStatus
    has_report: bool = False

    # IPV pre-fill fields (synced from SaaS)
    construction_start_date: str | None = None
    reception_date: str | None = None
    operation_cost: float | None = None
    declared_damage: str | None = None

    model_config = {"from_attributes": True}


class VisitListResponse(BaseModel):
    today: list[VisitRead]
    pending_report: list[VisitRead]
