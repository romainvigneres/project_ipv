from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.report import Report, ReportSection, ReportStatus, SectionType
from app.models.visit import Visit
from app.models.user import User
from app.schemas.report import ReportCreate, ReportSectionUpsert


class ReportService:
    async def get_or_404(self, db: AsyncSession, report_id: int) -> Report:
        result = await db.execute(
            select(Report)
            .where(Report.id == report_id)
            .options(selectinload(Report.sections))
        )
        report = result.scalars().first()
        if not report:
            raise HTTPException(status_code=404, detail="Report not found")
        return report

    async def create_for_visit(
        self, db: AsyncSession, visit: Visit, expert: User, data: ReportCreate
    ) -> Report:
        # One report per visit
        existing = await db.execute(select(Report).where(Report.visit_id == visit.id))
        if existing.scalars().first():
            raise HTTPException(status_code=409, detail="Report already exists for this visit")

        report = Report(
            visit_id=visit.id,
            expert_id=expert.id,
            claim_reference=visit.claim_reference,
            client_name=visit.client_name,
            address=visit.address,
            visit_date=visit.visit_time,
            expert_name=expert.full_name,
            requires_validation=data.requires_validation,
            status=ReportStatus.draft,
        )
        db.add(report)
        await db.flush()
        await db.refresh(report)
        return report

    async def upsert_section(
        self, db: AsyncSession, report: Report, data: ReportSectionUpsert
    ) -> ReportSection:
        """Create or update a section. Draft reports only."""
        if report.status not in (ReportStatus.draft, ReportStatus.completed):
            raise HTTPException(
                status_code=400, detail="Cannot edit a submitted or sent report"
            )

        result = await db.execute(
            select(ReportSection).where(
                ReportSection.report_id == report.id,
                ReportSection.section_type == data.section_type,
            )
        )
        section = result.scalars().first()
        if section:
            section.content = data.content
            section.updated_at = datetime.now(timezone.utc)
        else:
            section = ReportSection(
                report_id=report.id,
                section_type=data.section_type,
                content=data.content,
            )
            db.add(section)

        # Auto-promote to 'completed' if all sections are filled
        await db.flush()
        await self._maybe_complete(db, report)
        return section

    async def _maybe_complete(self, db: AsyncSession, report: Report) -> None:
        result = await db.execute(
            select(ReportSection).where(ReportSection.report_id == report.id)
        )
        filled = {s.section_type for s in result.scalars().all()}
        if filled >= {t for t in SectionType}:
            report.status = ReportStatus.completed

    async def submit(
        self, db: AsyncSession, report: Report, expert: User
    ) -> Report:
        if report.status not in (ReportStatus.draft, ReportStatus.completed):
            raise HTTPException(status_code=400, detail="Report is not in a submittable state")
        if report.expert_id != expert.id:
            raise HTTPException(status_code=403, detail="Not your report")

        if report.requires_validation:
            report.status = ReportStatus.submitted
        else:
            report.status = ReportStatus.submitted

        report.submitted_at = datetime.now(timezone.utc)
        await db.flush()
        return report

    async def validate(
        self, db: AsyncSession, report: Report, validator: User
    ) -> Report:
        if report.status != ReportStatus.submitted:
            raise HTTPException(status_code=400, detail="Report is not awaiting validation")
        report.status = ReportStatus.validated
        report.validated_at = datetime.now(timezone.utc)
        report.validated_by_id = validator.id
        await db.flush()
        return report

    async def mark_sent(self, db: AsyncSession, report: Report) -> Report:
        report.status = ReportStatus.sent
        report.sent_at = datetime.now(timezone.utc)
        await db.flush()
        return report

    async def list_for_expert(
        self, db: AsyncSession, expert_id: int
    ) -> list[Report]:
        result = await db.execute(
            select(Report)
            .where(Report.expert_id == expert_id)
            .options(selectinload(Report.sections))
            .order_by(Report.updated_at.desc())
        )
        return list(result.scalars().all())


report_service = ReportService()
