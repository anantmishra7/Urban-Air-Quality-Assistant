"""
Report router – citizen pollution reports.
POST /report   – Create a new report
GET  /report   – List all reports
GET  /report/{id} – Get single report
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from ..db import Report, get_session

logger = logging.getLogger("breathecity.report")

router = APIRouter(prefix="/report", tags=["Reports"])


def _format_datetime(dt: datetime | None) -> str:
    if dt is None:
        return ""
    iso = dt.isoformat()
    if iso.endswith("+00:00"):
        return iso[:-6] + "Z"
    if not iso.endswith("Z"):
        return iso + "Z"
    return iso


# ---- Pydantic models for request/response ----
class ReportCreate(BaseModel):
    city: str = Field(..., min_length=1, max_length=200, description="City name")
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    description: str = Field(..., min_length=1, max_length=2000, description="Report description")
    photo_path: str | None = Field(None, max_length=500, description="Path/URL of uploaded photo")


class ReportResponse(BaseModel):
    id: int
    city: str
    latitude: float
    longitude: float
    description: str
    photo_path: str | None
    status: str
    created_at: str


def _to_report_response(report: Report) -> ReportResponse:
    """Map a Report ORM model instance to the API response schema."""
    return ReportResponse(
        id=report.id,
        city=report.city,
        latitude=report.latitude,
        longitude=report.longitude,
        description=report.description,
        photo_path=report.photo_path,
        status=report.status,
        created_at=_format_datetime(report.created_at),
    )


# ---- Endpoints ----


@router.post("/", response_model=ReportResponse, status_code=201)
async def create_report(
    payload: ReportCreate,
    session: Session = Depends(get_session),
):
    """Create a new citizen pollution report."""
    logger.info("Creating report for city=%s", payload.city)
    try:
        report = Report(
            city=payload.city,
            latitude=payload.latitude,
            longitude=payload.longitude,
            description=payload.description,
            photo_path=payload.photo_path,
        )
        session.add(report)
        session.commit()
        session.refresh(report)
        logger.info("Report created: id=%s city=%s", report.id, report.city)
        return _to_report_response(report)
    except Exception as e:
        session.rollback()
        logger.error("Failed to create report: %s", e)
        raise HTTPException(status_code=500, detail="Failed to create report") from e


@router.get("/", response_model=list[ReportResponse])
async def list_reports(
    city: str | None = Query(None, description="Filter by city"),
    limit: int = Query(50, ge=1, le=200, description="Max results"),
    offset: int = Query(0, ge=0, description="Offset for pagination"),
    session: Session = Depends(get_session),
):
    """List all citizen pollution reports, optionally filtered by city."""
    logger.info("Listing reports: city=%s limit=%s offset=%s", city, limit, offset)
    try:
        stmt = select(Report).order_by(Report.created_at.desc())
        if city:
            stmt = stmt.where(Report.city.ilike(f"%{city}%"))
        stmt = stmt.offset(offset).limit(limit)
        reports = session.exec(stmt).all()
        return [_to_report_response(r) for r in reports]
    except Exception as e:
        logger.error("Failed to list reports: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve reports") from e


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: int,
    session: Session = Depends(get_session),
):
    """Get a single report by ID."""
    logger.info("Fetching report id=%s", report_id)
    report = session.get(Report, report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return _to_report_response(report)
