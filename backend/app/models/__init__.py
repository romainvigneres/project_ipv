# Import all models so Alembic can discover them via Base.metadata
from app.models.user import User, UserRole  # noqa: F401
from app.models.visit import Visit, VisitStatus  # noqa: F401
from app.models.report import Report, ReportSection, ReportStatus, SectionType  # noqa: F401
