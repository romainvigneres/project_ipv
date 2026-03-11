from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.report import ReportStatus, SectionType


# ── Section content shapes ──────────────────────────────────────────────────

class GeneralInfoContent(BaseModel):
    insurer_name: str = ""
    policy_number: str = ""
    loss_date: str = ""
    loss_type: str = ""
    expert_comments: str = ""


class CircumstancesContent(BaseModel):
    description: str = ""
    witness_present: bool = False
    witness_details: str = ""
    police_report: bool = False
    police_report_number: str = ""


class DamageDescriptionContent(BaseModel):
    affected_rooms: list[str] = []
    structural_damage: bool = False
    structural_details: str = ""
    personal_property_damage: bool = False
    personal_property_details: str = ""
    estimated_amount: float | None = None
    photo_references: list[str] = []


class EmergencyMeasuresContent(BaseModel):
    measures_taken: list[str] = []
    service_provider: str = ""
    intervention_date: str = ""
    cost_estimate: float | None = None
    notes: str = ""


class AdditionalObservationsContent(BaseModel):
    observations: str = ""
    recommendations: str = ""
    follow_up_required: bool = False
    follow_up_details: str = ""


# ── API schemas ─────────────────────────────────────────────────────────────

class ReportSectionRead(BaseModel):
    id: int
    section_type: SectionType
    content: dict[str, Any]
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReportSectionUpsert(BaseModel):
    section_type: SectionType
    content: dict[str, Any]


class ReportRead(BaseModel):
    id: int
    visit_id: int
    expert_id: int
    status: ReportStatus
    claim_reference: str
    client_name: str
    address: str
    visit_date: datetime
    expert_name: str
    requires_validation: bool
    submitted_at: datetime | None
    validated_at: datetime | None
    sent_at: datetime | None
    created_at: datetime
    updated_at: datetime
    sections: list[ReportSectionRead] = []

    model_config = {"from_attributes": True}


class ReportCreate(BaseModel):
    visit_id: int
    requires_validation: bool = False


class ReportSubmit(BaseModel):
    recipient_email: str
