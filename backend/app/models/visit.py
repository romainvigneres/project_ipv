import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class VisitStatus(str, enum.Enum):
    scheduled = "scheduled"
    in_progress = "in_progress"
    completed = "completed"


class Visit(Base):
    """
    A visit retrieved from the external SaaS and cached locally.
    The authoritative source is the SaaS; this table is a local cache
    enriched with our own metadata.
    """

    __tablename__ = "visits"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    # Identifier in the external SaaS system
    saas_id: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    # Claim reference number
    claim_reference: Mapped[str] = mapped_column(String(128), index=True, nullable=False)

    expert_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    client_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    visit_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # IPV pre-fill fields — synced from SaaS, editable by expert in the form
    construction_start_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    reception_date: Mapped[str | None] = mapped_column(String(32), nullable=True)
    operation_cost: Mapped[float | None] = mapped_column(Float, nullable=True)
    declared_damage: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[VisitStatus] = mapped_column(
        Enum(VisitStatus), default=VisitStatus.scheduled, nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    synced_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    expert: Mapped["User"] = relationship("User", foreign_keys=[expert_id])  # noqa: F821
    report: Mapped["Report"] = relationship("Report", back_populates="visit", uselist=False)  # noqa: F821
