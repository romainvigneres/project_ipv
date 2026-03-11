"""
Email Service
=============
Sends transactional emails (report delivery, notifications).
Uses SMTP with STARTTLS — compatible with Office 365.
"""

import smtplib
import ssl
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import get_settings

settings = get_settings()


class EmailService:
    def _build_message(
        self,
        to: str,
        subject: str,
        body_html: str,
        attachments: list[tuple[str, bytes]] | None = None,
    ) -> MIMEMultipart:
        msg = MIMEMultipart("mixed")
        msg["From"] = settings.SMTP_FROM
        msg["To"] = to
        msg["Subject"] = subject
        msg.attach(MIMEText(body_html, "html", "utf-8"))

        for filename, content in (attachments or []):
            part = MIMEApplication(content, Name=filename)
            part["Content-Disposition"] = f'attachment; filename="{filename}"'
            msg.attach(part)

        return msg

    def send(
        self,
        to: str,
        subject: str,
        body_html: str,
        attachments: list[tuple[str, bytes]] | None = None,
    ) -> None:
        if not settings.SMTP_USER:
            # Dev mode — just log
            print(f"[EmailService] Would send to {to}: {subject}")
            return

        msg = self._build_message(to, subject, body_html, attachments)
        context = ssl.create_default_context()

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)

    def send_report(
        self, to: str, expert_name: str, claim_reference: str, pdf_bytes: bytes
    ) -> None:
        subject = f"Rapport d'expertise — {claim_reference}"
        body = f"""
        <p>Bonjour,</p>
        <p>Veuillez trouver ci-joint le rapport d'expertise établi par <strong>{expert_name}</strong>
        pour le sinistre <strong>{claim_reference}</strong>.</p>
        <p>Cordialement,<br>Le service expertise</p>
        """
        self.send(
            to=to,
            subject=subject,
            body_html=body,
            attachments=[(f"rapport_{claim_reference}.pdf", pdf_bytes)],
        )


email_service = EmailService()
