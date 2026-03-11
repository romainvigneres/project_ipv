# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**IPV** is a mobile-first web app for insurance experts to fill first-visit inspection reports on site. Stack: React SPA (Vite + Tailwind) → Nginx → FastAPI (Python 3.12) → PostgreSQL 16, all orchestrated via Docker Compose.

## Commands

### Docker (recommended)
```bash
docker compose up --build -d          # Build and start all services
docker compose exec backend python -m app.db.init_db  # Seed DB (creates admin@example.com / changeme123!)
docker compose logs -f backend        # Follow logs
docker compose down
```

### Backend (local dev)
```bash
cd backend
uv venv && source .venv/bin/activate  # uv is used for venv and package management
uv pip install -r requirements.txt
cp .env.example .env                  # Edit DATABASE_URL to use localhost
uvicorn app.main:app --reload         # http://localhost:8000, Swagger at /api/docs
```

### Frontend (local dev)
```bash
cd frontend
npm install
npm run dev                           # http://localhost:5173, /api proxied to localhost:8000
npm run build
```

### Tests
```bash
cd backend
uv pip install pytest pytest-asyncio httpx aiosqlite
pytest                                # Run all tests
pytest tests/test_auth.py             # Run single test file
```

## Architecture

### Request Flow
`HTTPS:443 (Nginx)` → serves React SPA static files, proxies `/api/**` → `FastAPI:8000` → PostgreSQL

### Backend (`backend/app/`)

| Layer | Path | Purpose |
|-------|------|---------|
| API endpoints | `api/v1/endpoints/` | auth, users, visits, reports |
| Auth & RBAC | `api/dependencies.py` | JWT validation, role guards (expert/supervisor/admin) |
| Services | `services/` | report_service (workflow), pdf_service (WeasyPrint), email_service (SMTP), saas_client |
| Models | `models/` | SQLAlchemy async ORM: User, Visit, Report, ReportSection |
| Schemas | `schemas/` | Pydantic v2 request/response shapes |
| Config | `core/config.py` | pydantic-settings, reads from `.env` |

**Report workflow state machine:** `draft → completed → submitted → validated → sent`

**SaaS client:** `services/saas_client.py` has a `StubSaasClient` used automatically when `SAAS_API_KEY` is not set — safe for development and tests. Uses HTTP/2 for performance.

**SaaS email API:** Emails are sent via the SaaS API (not SMTP) so conversations are stored in the SaaS database and visible to users. Endpoint: `POST {SAAS_BASE_URL}/restapi/v2/emails/send` with payload `{idDossier, idUtilisateur, de, a, objet, messageHTML}`. `API_USER` defaults to `"API"`.

**PDF generation:** WeasyPrint renders `app/templates/report.html` (Jinja2) server-side. Requires system libs (libpango, libcairo) installed via Dockerfile.

### Frontend (`frontend/src/`)

| Layer | Path | Purpose |
|-------|------|---------|
| Router & auth guard | `App.jsx` | `RequireAuth` wraps protected routes |
| Auth state | `store/auth.js` | Zustand store, token persisted to localStorage |
| API client | `api/client.js` | Typed fetch wrapper; `api/auth.js`, `api/visits.js`, `api/reports.js` |
| Pages | `pages/` | Login → Dashboard → VisitPage → ReportForm → ReviewPage → ConfirmationPage |
| Hooks | `hooks/useAuth.js`, `hooks/useVisits.js` | Auth context, visits data fetching |
| UI primitives | `components/ui/` | Button, Input, Card, Badge |

**User flow:** `/login` → `/dashboard` (today's visits) → `/visits/:id` → `/visits/:id/report` (multi-section form) → `/visits/:id/report/review` (PDF preview + email) → confirmation.

### Key Environment Variables (backend `.env`)

| Variable | Notes |
|----------|-------|
| `SECRET_KEY` | JWT signing key — must be long random string in production |
| `DATABASE_URL` | `postgresql+asyncpg://ipv_user:ipv_password@db:5432/ipv_db` (use `localhost` for local dev) |
| `SAAS_API_KEY` | Leave empty to use stub client in development |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `SAAS_BASE_URL` | Default: `https://recette-stelliant.a26.fr/dossier` |
| `API_USER` | SaaS user for email sending, defaults to `"API"` |
| `AZURE_*` | Optional Azure AD SSO — omit for local JWT auth |

### Stelliant Brand (Frontend)

This app belongs to the **Stelliant** insurance services group. Apply the brand consistently in all UI work.

**Colors:**

| Token | Hex | Usage |
|-------|-----|-------|
| Bleu Nuit | `#171D3F` | Primary background, titles, main brand |
| Bleu Roi | `#15347A` | Secondary accents, hover states |
| Bleu Ciel | `#39A1FF` | Links, light elements |
| Orange | `#FA8531` | Stelliant Expertise entity color, CTA accent |
| Jaune | `#F7C800` | Gradient start |
| Fushia | `#EA249E` | Gradient accent |
| Violet | `#7238F7` | Gradient end |
| Vert | `#12D859` | Validation, success states |
| Gris Anthracite | `#4F4E4E` | Secondary text |

**The Stelliant gradient** (central identity element — use on thin elements only, never on large backgrounds):

```css
background: linear-gradient(90deg, #F7C800 0%, #FA8531 33%, #EA249E 66%, #7238F7 100%);
```

Use gradient on: icons, dividers, separators, thin typography. **Never** on full backgrounds or wide cards.

**Tailwind config** — add to `tailwind.config.js`:

```js
colors: {
  stelliant: {
    'bleu-nuit': '#171D3F',
    'bleu-roi': '#15347A',
    'bleu-ciel': '#39A1FF',
    'jaune': '#F7C800',
    'orange': '#FA8531',
    'fushia': '#EA249E',
    'violet': '#7238F7',
    'vert': '#12D859',
    'gris': '#4F4E4E',
  }
}
```

**Typography:** Silka (titles, headings — weights 400/600/700) + Montserrat (body text — weights 400/500/600). Fallback: `Arial, sans-serif`.

**UI patterns:**

- Dark navy (`#171D3F`) headers/navbars with white text
- White cards with `box-shadow: 0 4px 12px rgba(23,29,63,0.1)`
- Gradient border on card headers: `border-image: linear-gradient(90deg, #FA8531, #EA249E, #7238F7) 1`
- Table headers: dark navy background + white text

### Nginx (`nginx/nginx.conf`)
- HTTP → HTTPS redirect, TLS certs expected at `/etc/nginx/ssl/`
- Rate limits: 30 req/min for API, 10 req/min for `/api/v1/auth/login`
- `server_name ipv.yourcompany.example.com` — update before deployment
