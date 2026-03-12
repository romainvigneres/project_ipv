import enum
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from app.models.report import ReportStatus, SectionType


# ── IPV dropdown enums ───────────────────────────────────────────────────────
# To add/remove options: edit these enums only — no other file needs changing.

class EnjeuAssureur(str, enum.Enum):
    sous_tm   = "< TM"
    tm_5k     = "TM < x < 5k"
    k5_20k    = "5k < x < 20k"
    k20_50k   = "20k < x < 50k"
    k50_av1   = "50k < x < AV1"
    av1_plus  = ">AV1"


class ActionEffectuee(str, enum.Enum):
    option_1 = "Option 1"
    option_2 = "Option 2"
    option_3 = "Option 3"


class ActionAVenir(str, enum.Enum):
    option_1 = "Option 1"
    option_2 = "Option 2"
    option_3 = "Option 3"


# ── IPV section content shape ────────────────────────────────────────────────

class IpvContent(BaseModel):
    # 1. Enjeux
    enjeu_assureur: EnjeuAssureur | None = None
    enjeu_assure_materiel: float | None = None
    enjeu_assure_immateriel: float | None = None
    # enjeu_assure_total is derived: materiel + immateriel (computed on frontend + PDF)

    # 2. Dommages
    dommage_declare: str = ""      # pre-filled from SaaS
    dommage_constate: str = ""     # filled by expert after visit

    # 3. Dates & coût chantier (pre-filled from SaaS, editable)
    date_ouverture_chantier: str = ""
    date_reception: str = ""
    cout_operation: float | None = None

    # 4. Actions
    actions_effectuees: list[ActionEffectuee] = []
    actions_a_venir: list[ActionAVenir] = []

    # 5. Fraude (questions à définir — libellés dans ipvConfig.js côté frontend)
    fraude_q1: bool = False
    fraude_q2: bool = False
    fraude_q3: bool = False
    fraude_q4: bool = False
    fraude_q5: bool = False


# ── API schemas ──────────────────────────────────────────────────────────────

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
    form_type: str
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
