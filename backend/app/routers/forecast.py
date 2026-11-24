"""
Enhanced Forecast router – 5-day air quality + weather forecasts.
GET /forecast/hourly?city=Delhi
GET /forecast/daily?city=Delhi
"""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from ..utils import (
    categorize_aqi,
    compute_cpcb_aqi,
    fetch_air_quality,
    fetch_weather,
    get_coordinates,
)

logger = logging.getLogger("breathecity.forecast")

router = APIRouter(prefix="/forecast", tags=["Forecast"])

FORECAST_DAYS = 5


def _build_hourly_aqi_series(aq_data: dict[str, Any]) -> list[dict[str, Any]]:
    """Build an hourly AQI time-series from Open-Meteo hourly data."""
    hourly = aq_data.get("hourly", {})
    times = hourly.get("time", [])
    series: list[dict[str, Any]] = []

    pollutant_keys = [
        "pm2_5",
        "pm10",
        "carbon_monoxide",
        "nitrogen_dioxide",
        "sulphur_dioxide",
        "ozone",
    ]

    for i, ts in enumerate(times):
        pollutants: dict[str, float] = {}
        for key in pollutant_keys:
            vals = hourly.get(key, [])
            if i < len(vals) and vals[i] is not None:
                pollutants[key] = float(vals[i])

        if not pollutants:
            continue

        aqi_result = compute_cpcb_aqi(pollutants)
        category = categorize_aqi(aqi_result["aqi"])

        series.append(
            {
                "timestamp": ts,
                "aqi": aqi_result["aqi"],
                "aqi_category": category,
                "dominant_pollutant": aqi_result.get("dominant_pollutant"),
                "pollutants": pollutants,
                "sub_indices": aqi_result.get("sub_indices", {}),
            }
        )

    return series


def _build_daily_summary(hourly_series: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Aggregate hourly AQI series into daily summaries."""
    from collections import defaultdict

    daily_data: dict[str, list[float]] = defaultdict(list)
    daily_pollutants: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))

    for entry in hourly_series:
        ts = entry.get("timestamp", "")
        date = ts[:10] if len(ts) >= 10 else ts
        aqi_val = entry.get("aqi")
        if aqi_val is not None:
            daily_data[date].append(aqi_val)
        for key, val in entry.get("pollutants", {}).items():
            daily_pollutants[date][key].append(val)

    summaries: list[dict[str, Any]] = []
    for date in sorted(daily_data.keys()):
        aqi_values = daily_data[date]
        avg_aqi = round(sum(aqi_values) / len(aqi_values), 1) if aqi_values else None
        max_aqi = round(max(aqi_values), 1) if aqi_values else None
        min_aqi = round(min(aqi_values), 1) if aqi_values else None
        category = categorize_aqi(avg_aqi)

        avg_pollutants = {}
        for key, vals in daily_pollutants.get(date, {}).items():
            if vals:
                avg_pollutants[key] = round(sum(vals) / len(vals), 1)

        summaries.append(
            {
                "date": date,
                "avg_aqi": avg_aqi,
                "max_aqi": max_aqi,
                "min_aqi": min_aqi,
                "aqi_category": category,
                "avg_pollutants": avg_pollutants,
                "data_points": len(aqi_values),
            }
        )

    return summaries


@router.get("/hourly")
async def hourly_forecast(
    city: str = Query(..., description="City name"),
    days: int = Query(FORECAST_DAYS, ge=1, le=7, description="Number of forecast days"),
) -> dict[str, Any]:
    """
    Return hourly air quality forecast with computed AQI for each hour.
    Default 5 days, up to 7 days available.
    """
    logger.info("Hourly forecast request: city=%s days=%s", city, days)
    coords = get_coordinates(city)
    if not coords:
        raise HTTPException(status_code=404, detail="City not found")

    aq_data = fetch_air_quality(coords["latitude"], coords["longitude"], forecast_days=days)
    if not aq_data:
        raise HTTPException(status_code=502, detail="Failed to fetch air quality forecast")

    hourly_series = _build_hourly_aqi_series(aq_data)

    # Also fetch weather for context
    weather_data = fetch_weather(coords["latitude"], coords["longitude"], forecast_days=days)
    weather_hourly = {}
    if weather_data:
        wh = weather_data.get("hourly", {})
        weather_hourly = {
            "time": wh.get("time", []),
            "temperature_2m": wh.get("temperature_2m", []),
            "relative_humidity_2m": wh.get("relative_humidity_2m", []),
            "windspeed_10m": wh.get("windspeed_10m", []),
            "weathercode": wh.get("weathercode", []),
        }

    logger.info("Hourly forecast: %d data points for %s", len(hourly_series), city)
    return {
        "city": coords.get("name", city),
        "latitude": coords["latitude"],
        "longitude": coords["longitude"],
        "forecast_days": days,
        "total_hours": len(hourly_series),
        "hourly_aqi": hourly_series,
        "weather_hourly": weather_hourly,
    }


@router.get("/daily")
async def daily_forecast(
    city: str = Query(..., description="City name"),
    days: int = Query(FORECAST_DAYS, ge=1, le=7, description="Number of forecast days"),
) -> dict[str, Any]:
    """
    Return daily air quality forecast summary (avg/max/min AQI per day)
    plus daily weather data.  Default 5 days.
    """
    logger.info("Daily forecast request: city=%s days=%s", city, days)
    coords = get_coordinates(city)
    if not coords:
        raise HTTPException(status_code=404, detail="City not found")

    aq_data = fetch_air_quality(coords["latitude"], coords["longitude"], forecast_days=days)
    if not aq_data:
        raise HTTPException(status_code=502, detail="Failed to fetch air quality forecast")

    hourly_series = _build_hourly_aqi_series(aq_data)
    daily_summaries = _build_daily_summary(hourly_series)

    # Fetch daily weather
    weather_data = fetch_weather(coords["latitude"], coords["longitude"], forecast_days=days)
    weather_daily: dict[str, Any] = {}
    if weather_data:
        wd = weather_data.get("daily", {})
        weather_daily = {
            "time": wd.get("time", []),
            "temperature_2m_max": wd.get("temperature_2m_max", []),
            "temperature_2m_min": wd.get("temperature_2m_min", []),
            "weathercode": wd.get("weathercode", []),
            "windspeed_10m_max": wd.get("windspeed_10m_max", []),
        }
        current_weather = weather_data.get("current_weather", {})
    else:
        current_weather = {}

    logger.info("Daily forecast: %d days for %s", len(daily_summaries), city)
    return {
        "city": coords.get("name", city),
        "latitude": coords["latitude"],
        "longitude": coords["longitude"],
        "forecast_days": days,
        "current_weather": current_weather,
        "daily_aqi": daily_summaries,
        "weather_daily": weather_daily,
    }
