"""
Report router – citizen pollution reports.
POST /report   – Create a new report
GET  /report   – List all reports
GET  /report/{id} – Get single report
"""
import logging
from typing import Optional, List
from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field
from sqlmodel import select, Session

from ..db import get_session, Report

logger = logging.getLogger("breathecity.report")

router = APIRouter(prefix="/report", tags=["Reports"])


def _format_datetime(dt: Optional[datetime]) -> str:
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
    photo_path: Optional[str] = Field(None, max_length=500, description="Path/URL of uploaded photo")


class ReportResponse(BaseModel):
    id: int
    city: str
    latitude: float
    longitude: float
    description: str
    photo_path: Optional[str]
    status: str
    created_at: str


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
    except Exception as e:
        session.rollback()
        logger.error("Failed to create report: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to create report: {str(e)}")


@router.get("/", response_model=List[ReportResponse])
async def list_reports(
    city: Optional[str] = Query(None, description="Filter by city"),
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
        return [
            ReportResponse(
                id=r.id,
                city=r.city,
                latitude=r.latitude,
                longitude=r.longitude,
                description=r.description,
                photo_path=r.photo_path,
                status=r.status,
                created_at=_format_datetime(r.created_at),
            )
            for r in reports
        ]
    except Exception as e:
        logger.error("Failed to list reports: %s", e)
        raise HTTPException(status_code=500, detail="Failed to retrieve reports")


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
