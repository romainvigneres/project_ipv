"""
PDF Service
===========
Generates a PDF report from a Report model using WeasyPrint + Jinja2.

The HTML template lives at app/templates/report.html.
WeasyPrint converts it to a byte string that can be emailed or streamed.
"""

import os
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from app.models.report import Report

TEMPLATES_DIR = Path(__file__).parent.parent / "templates"


def _get_jinja_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        autoescape=True,
    )


def render_report_html(report: Report) -> str:
    env = _get_jinja_env()
    template = env.get_template("report.html")
    sections_by_type = {s.section_type: s.content for s in report.sections}
    return template.render(report=report, sections=sections_by_type)


def generate_report_pdf(report: Report) -> bytes:
    """
    Returns PDF bytes for the given report.
    WeasyPrint requires system libraries (libpango, libcairo).
    See the Dockerfile for installation.
    """
    try:
        from weasyprint import HTML  # noqa: PLC0415
    except ImportError:
        raise RuntimeError(
            "WeasyPrint is not installed. Add it to requirements.txt "
            "and ensure system dependencies are present."
        )

    html_string = render_report_html(report)
    return HTML(string=html_string, base_url=str(TEMPLATES_DIR)).write_pdf()
