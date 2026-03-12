from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.api.dependencies import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.visit import Visit, VisitStatus
from app.schemas.visit import VisitListResponse, VisitRead
from app.services.saas_client import AbstractSaasClient, SaasVisit, get_saas_client

router = APIRouter()


def _saas_visit_to_db(saas: SaasVisit, expert_id: int) -> Visit:
    return Visit(
        saas_id=saas.saas_id,
        claim_reference=saas.claim_reference,
        expert_id=expert_id,
        client_name=saas.client_name,
        client_email=saas.client_email,
        address=saas.address,
        visit_time=saas.visit_time,
        construction_start_date=saas.construction_start_date,
        reception_date=saas.reception_date,
        operation_cost=saas.operation_cost,
        declared_damage=saas.declared_damage,
    )


async def _sync_visits(
    db: AsyncSession,
    saas: AbstractSaasClient,
    expert: User,
    target_date: date,
) -> list[Visit]:
    """Fetch visits from SaaS and upsert them into local DB."""
    saas_visits = await saas.get_visits_for_expert(expert.email, target_date)

    result = []
    for sv in saas_visits:
        existing = await db.execute(select(Visit).where(Visit.saas_id == sv.saas_id))
        visit = existing.scalars().first()
        if visit:
            # Refresh mutable fields
            visit.client_name = sv.client_name
            visit.address = sv.address
            visit.visit_time = sv.visit_time
            visit.construction_start_date = sv.construction_start_date
            visit.reception_date = sv.reception_date
            visit.operation_cost = sv.operation_cost
            visit.declared_damage = sv.declared_damage
            visit.synced_at = datetime.now(timezone.utc)
        else:
            visit = _saas_visit_to_db(sv, expert.id)
            db.add(visit)
            await db.flush()
        result.append(visit)

    return result


@router.get("/", response_model=VisitListResponse)
async def list_visits(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    saas: AbstractSaasClient = Depends(get_saas_client),
) -> VisitListResponse:
    """
    Returns:
    - today: visits scheduled for today (synced live from SaaS)
    - pending_report: past visits with no completed report
    """
    today = date.today()
    synced = await _sync_visits(db, saas, current_user, today)

    # Re-fetch today's visits with report relationship eagerly loaded
    # (accessing .report directly on flushed objects triggers a lazy-load which
    # is forbidden in async SQLAlchemy)
    synced_ids = [v.id for v in synced]
    today_result = await db.execute(
        select(Visit)
        .where(Visit.id.in_(synced_ids))
        .options(selectinload(Visit.report))
        .order_by(Visit.visit_time.asc())
    )
    todays_visits = list(today_result.scalars().all())

    # Past visits without a completed report
    result = await db.execute(
        select(Visit)
        .where(
            Visit.expert_id == current_user.id,
            Visit.visit_time < datetime.now(timezone.utc).replace(
                hour=0, minute=0, second=0, microsecond=0
            ),
        )
        .options(selectinload(Visit.report))
        .order_by(Visit.visit_time.desc())
        .limit(20)
    )
    past_visits = result.scalars().all()
    # Show all past visits whose fiche isn't sent yet
    pending = [v for v in past_visits if not v.report or v.report.status != "sent"]

    def to_read(v: Visit) -> VisitRead:
        return VisitRead(
            **{c.name: getattr(v, c.name) for c in v.__table__.columns},
            has_report=v.report is not None,
            report_status=v.report.status.value if v.report else None,
        )

    return VisitListResponse(
        today=[to_read(v) for v in todays_visits],
        pending_report=[to_read(v) for v in pending],
    )


@router.get("/{visit_id}", response_model=VisitRead)
async def get_visit(
    visit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> VisitRead:
    result = await db.execute(
        select(Visit)
        .where(Visit.id == visit_id, Visit.expert_id == current_user.id)
        .options(selectinload(Visit.report))
    )
    visit = result.scalars().first()
    if not visit:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Visit not found")

    return VisitRead(
        **{c.name: getattr(visit, c.name) for c in visit.__table__.columns},
        has_report=visit.report is not None,
        report_status=visit.report.status.value if visit.report else None,
    )
