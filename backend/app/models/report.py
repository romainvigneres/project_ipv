import enum
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, Enum, ForeignKey, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ReportStatus(str, enum.Enum):
    draft = "draft"
    completed = "completed"
    submitted = "submitted"
    validated = "validated"
    sent = "sent"


class SectionType(str, enum.Enum):
    general_info = "general_info"
    circumstances = "circumstances"
    damage_description = "damage_description"
    emergency_measures = "emergency_measures"
    additional_observations = "additional_observations"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    visit_id: Mapped[int] = mapped_column(
        ForeignKey("visits.id"), unique=True, nullable=False
    )
    expert_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[ReportStatus] = mapped_column(
        Enum(ReportStatus), default=ReportStatus.draft, nullable=False, index=True
    )

    # Pre-filled from SaaS data
    claim_reference: Mapped[str] = mapped_column(String(128), nullable=False)
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    visit_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    expert_name: Mapped[str] = mapped_column(String(255), nullable=False)

    # Workflow: who needs to validate before sending
    requires_validation: Mapped[bool] = mapped_column(default=False, nullable=False)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    validated_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    visit: Mapped["Visit"] = relationship("Visit", back_populates="report")  # noqa: F821
    expert: Mapped["User"] = relationship("User", foreign_keys=[expert_id])  # noqa: F821
    validated_by: Mapped["User | None"] = relationship("User", foreign_keys=[validated_by_id])  # noqa: F821
    sections: Mapped[list["ReportSection"]] = relationship(
        "ReportSection", back_populates="report", cascade="all, delete-orphan"
    )


class ReportSection(Base):
    __tablename__ = "report_sections"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("reports.id"), nullable=False)
    section_type: Mapped[SectionType] = mapped_column(Enum(SectionType), nullable=False)
    # Flexible JSON blob — each section type has its own shape (see schemas/report.py)
    content: Mapped[dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    report: Mapped["Report"] = relationship("Report", back_populates="sections")
