"""
Comparison router – compare AQI across multiple cities.
GET /compare?cities=Delhi,Mumbai,Chennai
"""
import logging
from typing import List, Dict, Any

from fastapi import APIRouter, HTTPException, Query

from ..utils import get_aqi_data

logger = logging.getLogger("breathecity.comparison")

router = APIRouter(prefix="/compare", tags=["Comparison"])


@router.get("/")
async def compare_cities(
    cities: str = Query(
        ...,
        description="Comma-separated list of city names (e.g. Delhi,Mumbai,Chennai)",
        min_length=1,
    ),
) -> Dict[str, Any]:
    """
    Fetch AQI data for each city and return a comparative array.
    Cities are separated by commas.  Maximum 10 cities per request.
    """
    city_list = [c.strip() for c in cities.split(",") if c.strip()]
    if not city_list:
        raise HTTPException(status_code=400, detail="Provide at least one city name")
    if len(city_list) > 10:
        raise HTTPException(status_code=400, detail="Maximum 10 cities per comparison")

    logger.info("Comparing cities: %s", city_list)
    results: List[Dict[str, Any]] = []
    errors: List[str] = []

    for city in city_list:
        data = get_aqi_data(city)
        if data:
            results.append({
                "city": data.get("city", city),
                "latitude": data.get("latitude"),
                "longitude": data.get("longitude"),
                "aqi": data.get("aqi"),
                "aqi_category": data.get("aqi_category"),
                "dominant_pollutant": data.get("dominant_pollutant"),
                "pollutants": data.get("pollutants", {}),
                "sub_indices": data.get("sub_indices", {}),
                "health_implications": data.get("health_implications", ""),
                "weather": data.get("weather", {}),
                "last_updated": data.get("last_updated"),
            })
        else:
            errors.append(city)
            logger.warning("AQI data not found for city: %s", city)

    if not results:
        raise HTTPException(status_code=404, detail="AQI data not found for any of the requested cities")

    # Sort by AQI descending (worst first)
    results.sort(key=lambda r: r.get("aqi") or 0, reverse=True)

    return {
        "count": len(results),
        "comparison": results,
        "errors": errors if errors else None,
    }
