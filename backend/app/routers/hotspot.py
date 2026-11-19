"""
Hotspot router – show AQI variation across nearby grid points for a city.
GET /hotspot?city=Delhi
"""
import logging
from typing import List, Dict, Any, Optional

from fastapi import APIRouter, HTTPException, Query

from ..utils import (
    get_coordinates,
    fetch_air_quality,
    compute_cpcb_aqi,
    categorize_aqi,
)

logger = logging.getLogger("breathecity.hotspot")

router = APIRouter(prefix="/hotspot", tags=["Hotspot"])

# Grid offsets in degrees (~5-10 km per offset at Indian latitudes)
GRID_OFFSETS = [
    (0.0, 0.0, "Center"),
    (0.05, 0.0, "North"),
    (-0.05, 0.0, "South"),
    (0.0, 0.05, "East"),
    (0.0, -0.05, "West"),
    (0.05, 0.05, "North-East"),
    (0.05, -0.05, "North-West"),
    (-0.05, 0.05, "South-East"),
    (-0.05, -0.05, "South-West"),
]


def _extract_latest_pollutants(aq_data: Dict[str, Any]) -> Optional[Dict[str, float]]:
    """Extract the latest hourly pollutant values from an Open-Meteo response."""
    try:
        hourly = aq_data.get("hourly", {})
        pollutants: Dict[str, float] = {}
        for key in ["pm2_5", "pm10", "carbon_monoxide", "nitrogen_dioxide", "sulphur_dioxide", "ozone"]:
            vals = hourly.get(key, [])
            if vals:
                # Find the last non-None value
                for v in reversed(vals):
                    if v is not None:
                        pollutants[key] = float(v)
                        break
        return pollutants if pollutants else None
    except Exception:
        return None


@router.get("/")
async def get_hotspots(
    city: str = Query(..., description="City name"),
    grid_size: float = Query(0.05, ge=0.01, le=0.2, description="Grid spacing in degrees"),
) -> Dict[str, Any]:
    """
    Return AQI values for a grid of points around the city center.
    Shows pollution variation / hotspots within a metro area.
    """
    coords = get_coordinates(city)
    if not coords:
        raise HTTPException(status_code=404, detail="City not found")

    center_lat = coords["latitude"]
    center_lon = coords["longitude"]
    logger.info("Fetching hotspot data for %s (%.4f, %.4f)", city, center_lat, center_lon)

    # Build grid with custom or default spacing
    if grid_size != 0.05:
        grid = [
            (0.0, 0.0, "Center"),
            (grid_size, 0.0, "North"),
            (-grid_size, 0.0, "South"),
            (0.0, grid_size, "East"),
            (0.0, -grid_size, "West"),
            (grid_size, grid_size, "North-East"),
            (grid_size, -grid_size, "North-West"),
            (-grid_size, grid_size, "South-East"),
            (-grid_size, -grid_size, "South-West"),
        ]
    else:
        grid = GRID_OFFSETS

    points: List[Dict[str, Any]] = []
    for d_lat, d_lon, label in grid:
        lat = round(center_lat + d_lat, 4)
        lon = round(center_lon + d_lon, 4)
        aq_data = fetch_air_quality(lat, lon)
        if not aq_data:
            continue
        pollutants = _extract_latest_pollutants(aq_data)
        if not pollutants:
            continue
        aqi_result = compute_cpcb_aqi(pollutants)
        aqi_val = aqi_result["aqi"]
        category = categorize_aqi(aqi_val)
        points.append({
            "label": label,
            "latitude": lat,
            "longitude": lon,
            "aqi": aqi_val,
            "aqi_category": category,
            "dominant_pollutant": aqi_result.get("dominant_pollutant"),
            "pollutants": pollutants,
            "sub_indices": aqi_result.get("sub_indices", {}),
        })

    if not points:
        raise HTTPException(status_code=502, detail="Unable to fetch air quality data for grid points")

    # Sort by AQI descending so worst hotspot is first
    points.sort(key=lambda p: p.get("aqi") or 0, reverse=True)

    return {
        "city": coords.get("name", city),
        "center": {"latitude": center_lat, "longitude": center_lon},
        "grid_size_degrees": grid_size,
        "points_count": len(points),
        "hotspots": points,
    }
