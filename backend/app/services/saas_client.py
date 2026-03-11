"""
SaaS Client Service
===================
Abstraction layer over the external SaaS API.

Replace the implementation details (URLs, field names) without touching
any other part of the application.  If the vendor changes their API
or you migrate to a different SaaS, only this file needs to change.

For unit tests, inject a mock implementation via dependency injection.
"""

from abc import ABC, abstractmethod
from datetime import date, datetime, timezone
from typing import Any

import httpx

from app.core.config import get_settings

settings = get_settings()


# ── Data Transfer Objects returned by the client ────────────────────────────

class SaasVisit:
    """Normalised visit object from the SaaS."""

    def __init__(self, raw: dict[str, Any]) -> None:
        self.saas_id: str = str(raw["id"])
        self.claim_reference: str = raw["claimReference"]
        self.client_name: str = raw["clientName"]
        self.client_email: str | None = raw.get("clientEmail")
        self.address: str = raw["address"]
        self.visit_time: datetime = datetime.fromisoformat(raw["visitTime"])
        self.expert_email: str = raw["expertEmail"]


class SaasClaim:
    """Normalised claim object from the SaaS."""

    def __init__(self, raw: dict[str, Any]) -> None:
        self.reference: str = raw["reference"]
        self.insurer_name: str = raw.get("insurerName", "")
        self.policy_number: str = raw.get("policyNumber", "")
        self.loss_date: str = raw.get("lossDate", "")
        self.loss_type: str = raw.get("lossType", "")


# ── Abstract interface ───────────────────────────────────────────────────────

class AbstractSaasClient(ABC):
    @abstractmethod
    async def get_visits_for_expert(
        self, expert_email: str, target_date: date
    ) -> list[SaasVisit]:
        """Return all visits assigned to an expert on a given day."""

    @abstractmethod
    async def get_claim(self, claim_reference: str) -> SaasClaim:
        """Return claim details by reference."""


# ── HTTP implementation ──────────────────────────────────────────────────────

class HttpSaasClient(AbstractSaasClient):
    """
    Real HTTP client for the external SaaS.
    Adapt the endpoint paths and field mapping to your vendor's API.
    """

    def __init__(self) -> None:
        self._base_url = settings.SAAS_BASE_URL.rstrip("/")
        self._headers = {
            "Authorization": f"Bearer {settings.SAAS_API_KEY}",
            "Accept": "application/json",
        }
        self._timeout = settings.SAAS_TIMEOUT

    async def get_visits_for_expert(
        self, expert_email: str, target_date: date
    ) -> list[SaasVisit]:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self._base_url}/visits",
                headers=self._headers,
                params={"expertEmail": expert_email, "date": target_date.isoformat()},
            )
            response.raise_for_status()
            return [SaasVisit(item) for item in response.json().get("items", [])]

    async def get_claim(self, claim_reference: str) -> SaasClaim:
        async with httpx.AsyncClient(timeout=self._timeout) as client:
            response = await client.get(
                f"{self._base_url}/claims/{claim_reference}",
                headers=self._headers,
            )
            response.raise_for_status()
            return SaasClaim(response.json())


# ── Stub for development / testing ──────────────────────────────────────────

class StubSaasClient(AbstractSaasClient):
    """
    Returns deterministic fake data.
    Use in tests or when SAAS_API_KEY is not configured.
    """

    async def get_visits_for_expert(
        self, expert_email: str, target_date: date
    ) -> list[SaasVisit]:
        return [
            SaasVisit(
                {
                    "id": "VISIT-001",
                    "claimReference": "SIN-2024-00123",
                    "clientName": "Jean Dupont",
                    "clientEmail": "jean.dupont@example.com",
                    "address": "12 rue de la Paix, 75002 Paris",
                    "visitTime": f"{target_date.isoformat()}T09:00:00+00:00",
                    "expertEmail": expert_email,
                }
            ),
            SaasVisit(
                {
                    "id": "VISIT-002",
                    "claimReference": "SIN-2024-00124",
                    "clientName": "Marie Martin",
                    "clientEmail": "marie.martin@example.com",
                    "address": "5 avenue Victor Hugo, 69002 Lyon",
                    "visitTime": f"{target_date.isoformat()}T14:00:00+00:00",
                    "expertEmail": expert_email,
                }
            ),
        ]

    async def get_claim(self, claim_reference: str) -> SaasClaim:
        return SaasClaim(
            {
                "reference": claim_reference,
                "insurerName": "Assurance Exemple SA",
                "policyNumber": "POL-2024-9876",
                "lossDate": "2024-11-01",
                "lossType": "Dégât des eaux",
            }
        )


# ── Factory ──────────────────────────────────────────────────────────────────

def get_saas_client() -> AbstractSaasClient:
    if not settings.SAAS_API_KEY:
        return StubSaasClient()
    return HttpSaasClient()
