# IPV — Inspection Report Tool

Mobile-first web application for insurance experts to fill first-visit inspection reports on site.

---

## Architecture overview

```text
┌─────────────────────────────────────────────────┐
│                   DMZ Server                    │
│                                                 │
│  ┌─────────┐    ┌──────────┐    ┌────────────┐  │
│  │  Nginx  │───▶│ Frontend │    │  Backend   │  │
│  │ (443)   │    │  React   │    │  FastAPI   │  │
│  └────┬────┘    └──────────┘    └─────┬──────┘  │
│       │                               │         │
│       └───────── /api/** ─────────────┘         │
│                                       │         │
│                               ┌───────┴──────┐  │
│                               │  PostgreSQL  │  │
│                               └──────────────┘  │
└─────────────────────────────────────────────────┘
         │
         ▼  (HTTP client, outbound)
   External SaaS API
```

### Request flow

1. Expert opens the app on their phone (HTTPS via Nginx)
2. React SPA served by Nginx (static files)
3. API calls proxied by Nginx to the FastAPI backend (`/api/v1/...`)
4. Backend authenticates with JWT, queries PostgreSQL, calls SaaS when needed
5. PDF generated server-side with WeasyPrint, emailed via SMTP

---

## Project structure

```text
project_ipv/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/   # auth, users, visits, reports
│   │   ├── core/               # config, database, security
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # business logic + external integrations
│   │   │   ├── saas_client.py  # SaaS abstraction layer
│   │   │   ├── report_service.py
│   │   │   ├── email_service.py
│   │   │   └── pdf_service.py
│   │   ├── templates/          # Jinja2 HTML template for PDF
│   │   └── db/init_db.py       # seed script
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/                # typed fetch wrappers
│   │   ├── components/         # UI primitives + report components
│   │   ├── hooks/              # useAuth, useVisits
│   │   ├── pages/              # Login, Dashboard, VisitPage, ReportForm, Review, Confirmation
│   │   └── store/auth.js       # Zustand auth store (persisted)
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf              # reverse proxy + TLS + rate limiting
├── docker-compose.yml
└── README.md
```

---

## Database models

| Model           | Key fields                                                   |
|-----------------|--------------------------------------------------------------|
| `User`          | email, full_name, hashed_password, role, azure_oid           |
| `Visit`         | saas_id, claim_reference, expert_id, client_name, visit_time |
| `Report`        | visit_id, expert_id, status, requires_validation             |
| `ReportSection` | report_id, section_type, content (JSON)                      |

**Report statuses:** `draft → completed → submitted → validated → sent`

**Section types:** `general_info`, `circumstances`, `damage_description`, `emergency_measures`, `additional_observations`

---

## Getting started

### Prerequisites

- Docker & Docker Compose
- (Optional) Node 20+ and Python 3.12+ for local development without Docker

### 1. Configure environment

```bash
cp backend/.env.example backend/.env
# Edit backend/.env:
#   - Set SECRET_KEY to a long random string
#   - Set SAAS_BASE_URL and SAAS_API_KEY (leave blank to use stub data)
#   - Set SMTP_* for email sending
```

### 2. Add TLS certificates

```bash
mkdir -p nginx/ssl
# Copy your certificates:
cp /path/to/fullchain.pem nginx/ssl/
cp /path/to/privkey.pem   nginx/ssl/
# Update nginx/nginx.conf: replace `ipv.yourcompany.example.com` with your domain
# for dev we can use self signed certs:
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/CN=localhost"
```

### 3. Start the stack

```bash
docker compose up --build -d
```

### 4. Create the first admin user

```bash
docker compose exec backend python -m app.db.init_db
# Default credentials: admin@example.com / changeme123!
# CHANGE THE PASSWORD immediately after first login.
```

### 5. Open the app

Navigate to `https://your-domain.example.com`

---

## Local development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Start a local PostgreSQL (or use Docker just for DB):
docker run -d -p 5432:5432 -e POSTGRES_DB=ipv_db -e POSTGRES_USER=ipv_user \
  -e POSTGRES_PASSWORD=ipv_password postgres:16-alpine

# Set DATABASE_URL in backend/.env to point to localhost
uvicorn app.main:app --reload
# API available at http://localhost:8000
# Swagger UI at  http://localhost:8000/api/docs
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Dev server at http://localhost:5173
# API calls are proxied to http://localhost:8000 (see vite.config.js)
```

---

## Running tests

```bash
cd backend
pip install pytest pytest-asyncio httpx aiosqlite
pytest
```

---

## Authentication

The system supports two modes (swap via `app/api/dependencies.py`):

| Mode      | When to use                                     |
|-----------|-------------------------------------------------|
| Local JWT | Default — credentials stored in `users` DB      |
| Azure AD  | Set `AZURE_TENANT_ID/CLIENT_ID/SECRET` env vars |

---

## SaaS integration

`backend/app/services/saas_client.py` is the **only** file that talks to the external SaaS API.

- `HttpSaasClient` — real HTTP calls (used when `SAAS_API_KEY` is set)
- `StubSaasClient` — returns fake data (used in dev / tests when key is absent)
- `AbstractSaasClient` — interface; implement a new class here when changing vendor

---

## PDF generation

Reports are rendered as HTML via Jinja2 (`app/templates/report.html`) and converted to PDF by WeasyPrint.

The PDF is either:

- Streamed for preview: `GET /api/v1/reports/{id}/pdf`
- Emailed to the client: `POST /api/v1/reports/{id}/send`

WeasyPrint requires system libraries (`libpango`, `libcairo`) — installed in the backend `Dockerfile`.

---

## Deployment checklist

- [ ] `SECRET_KEY` is a cryptographically random 32+ byte string
- [ ] `DATABASE_URL` points to production PostgreSQL
- [ ] TLS certificates are mounted and `nginx.conf` server_name is set
- [ ] `ALLOWED_ORIGINS` in `.env` contains only your production domain
- [ ] SMTP credentials configured and tested
- [ ] Admin password changed after first login
- [ ] `APP_ENV=production` (disables SQLAlchemy query logging)
- [ ] PostgreSQL `postgres_data` volume backed up regularly
- [ ] Firewall allows only port 80/443 from external networks
