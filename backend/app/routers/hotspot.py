"""
Hotspot router – show AQI variation across nearby grid points for a city.
GET /hotspot?city=Delhi
"""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from ..utils import (
    categorize_aqi,
    compute_cpcb_aqi,
    fetch_air_quality,
    get_coordinates,
)

logger = logging.getLogger("breathecity.hotspot")

router = APIRouter(prefix="/hotspot", tags=["Hotspot"])

# Unit grid directions (lat_dir, lon_dir, label) scaled by grid_size degrees
GRID_DIRECTIONS = [
    (0, 0, "Center"),
    (1, 0, "North"),
    (-1, 0, "South"),
    (0, 1, "East"),
    (0, -1, "West"),
    (1, 1, "North-East"),
    (1, -1, "North-West"),
    (-1, 1, "South-East"),
    (-1, -1, "South-West"),
]


def _build_grid(grid_size: float) -> list[tuple[float, float, str]]:
    """Build 9-sector coordinate offsets scaled by grid_size degrees."""
    return [(d_lat * grid_size, d_lon * grid_size, label) for d_lat, d_lon, label in GRID_DIRECTIONS]


def _extract_latest_pollutants(aq_data: dict[str, Any]) -> dict[str, float] | None:
    """Extract the latest hourly pollutant values from an Open-Meteo response."""
    try:
        hourly = aq_data.get("hourly", {})
        pollutants: dict[str, float] = {}
        for key in [
            "pm2_5",
            "pm10",
            "carbon_monoxide",
            "nitrogen_dioxide",
            "sulphur_dioxide",
            "ozone",
        ]:
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
) -> dict[str, Any]:
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

    grid = _build_grid(grid_size)

    points: list[dict[str, Any]] = []
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
        points.append(
            {
                "label": label,
                "latitude": lat,
                "longitude": lon,
                "aqi": aqi_val,
                "aqi_category": category,
                "dominant_pollutant": aqi_result.get("dominant_pollutant"),
                "pollutants": pollutants,
                "sub_indices": aqi_result.get("sub_indices", {}),
            }
        )

    if not points:
        raise HTTPException(
            status_code=502, detail="Unable to fetch air quality data for grid points"
        )

    # Sort by AQI descending so worst hotspot is first
    points.sort(key=lambda p: p.get("aqi") or 0, reverse=True)

    return {
        "city": coords.get("name", city),
        "center": {"latitude": center_lat, "longitude": center_lon},
        "grid_size_degrees": grid_size,
        "points_count": len(points),
        "hotspots": points,
    }
