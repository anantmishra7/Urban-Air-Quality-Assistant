"""
AQI router – fetch current air quality index for a city.
GET /aqi?city=Delhi
"""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from ..utils import get_aqi_data

logger = logging.getLogger("breathecity.aqi")

router = APIRouter(prefix="/aqi", tags=["AQI"])


@router.get("/")
async def get_aqi(
    city: str = Query(..., description="City name to fetch AQI for"),
) -> dict[str, Any]:
    """Fetch current AQI data for a given city."""
    logger.info("AQI request for city=%s", city)
    data = get_aqi_data(city)
    if not data:
        raise HTTPException(status_code=404, detail="AQI data not found for city")
    return data
