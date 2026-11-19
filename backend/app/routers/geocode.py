"""
Geocode router – city search autocomplete.
GET /geocode?q=Delhi
"""
import logging
from typing import Dict, Any, List

from fastapi import APIRouter, HTTPException, Query

from ..utils import geocode_search

logger = logging.getLogger("breathecity.geocode")

router = APIRouter(prefix="/geocode", tags=["Geocode"])


@router.get("/")
async def geocode(
    q: str = Query(..., min_length=1, max_length=200, description="City name or search query"),
    count: int = Query(5, ge=1, le=20, description="Maximum number of results"),
) -> Dict[str, Any]:
    """
    Geocode a city name and return matching locations with lat/lon.
    Useful for search autocomplete in the frontend.
    """
    logger.info("Geocode search: q=%s count=%s", q, count)
    results = geocode_search(q, count=count)
    if not results:
        raise HTTPException(status_code=404, detail="No locations found for the given query")
    return {
        "query": q,
        "count": len(results),
        "results": results,
    }
