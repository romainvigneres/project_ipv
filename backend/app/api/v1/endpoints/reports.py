from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies import get_current_user, require_supervisor
from app.core.database import get_db
from app.models.report import Report
from app.models.user import User
from app.models.visit import Visit
from app.schemas.report import ReportCreate, ReportRead, ReportSectionUpsert, ReportSubmit
from app.services.email_service import email_service
from app.services.pdf_service import generate_report_pdf
from app.services.report_service import report_service

router = APIRouter()


async def _get_report_for_expert(
    report_id: int, expert: User, db: AsyncSession
) -> Report:
    report = await report_service.get_or_404(db, report_id)
    if report.expert_id != expert.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return report


@router.post("/", response_model=ReportRead, status_code=201)
async def create_report(
    body: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Report:
    result = await db.execute(
        select(Visit).where(Visit.id == body.visit_id, Visit.expert_id == current_user.id)
    )
    visit = result.scalars().first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")
    return await report_service.create_for_visit(db, visit, current_user, body)


@router.get("/", response_model=list[ReportRead])
async def list_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Report]:
    return await report_service.list_for_expert(db, current_user.id)


@router.get("/{report_id}", response_model=ReportRead)
async def get_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Report:
    return await _get_report_for_expert(report_id, current_user, db)


@router.put("/{report_id}/sections", response_model=ReportRead)
async def upsert_section(
    report_id: int,
    body: ReportSectionUpsert,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Report:
    """Save (create or replace) a report section. Used for progressive autosave."""
    report = await _get_report_for_expert(report_id, current_user, db)
    await report_service.upsert_section(db, report, body)
    # Re-fetch with sections
    return await report_service.get_or_404(db, report_id)


@router.post("/{report_id}/submit", response_model=ReportRead)
async def submit_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Report:
    report = await _get_report_for_expert(report_id, current_user, db)
    return await report_service.submit(db, report, current_user)


@router.post("/{report_id}/validate", response_model=ReportRead)
async def validate_report(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    validator: User = Depends(require_supervisor),
) -> Report:
    """Supervisor validates a submitted report before it is sent."""
    report = await report_service.get_or_404(db, report_id)
    return await report_service.validate(db, report, validator)


@router.post("/{report_id}/send")
async def send_report(
    report_id: int,
    body: ReportSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Generate PDF and email the report to the client."""
    report = await report_service.get_or_404(db, report_id)

    if report.expert_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    pdf_bytes = generate_report_pdf(report)
    email_service.send_report(
        to=body.recipient_email,
        expert_name=report.expert_name,
        claim_reference=report.claim_reference,
        pdf_bytes=pdf_bytes,
    )
    await report_service.mark_sent(db, report)
    return {"message": "Report sent successfully"}


@router.get("/{report_id}/pdf")
async def download_pdf(
    report_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    """Stream the PDF for preview or download."""
    report = await _get_report_for_expert(report_id, current_user, db)
    pdf_bytes = generate_report_pdf(report)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="rapport_{report.claim_reference}.pdf"'
        },
    )
