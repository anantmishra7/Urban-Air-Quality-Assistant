"""
Utility functions for BreatheCity AI backend.
Includes CPCB AQI computation (all 6 pollutants), Open-Meteo API helpers,
geocoding, and in-memory caching.
"""

import logging
from datetime import UTC, datetime
from typing import Any

import httpx
from cachetools import TTLCache, cached

logger = logging.getLogger("breathecity")

# ---------------------------------------------------------------------------
# Open-Meteo API endpoints
# ---------------------------------------------------------------------------
GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
AIR_QUALITY_URL = "https://air-quality-api.open-meteo.com/v1/air-quality"
WEATHER_URL = "https://api.open-meteo.com/v1/forecast"

# ---------------------------------------------------------------------------
# CPCB National AQI breakpoints – all 6 criteria pollutants
# Each entry: (C_low, C_high, I_low, I_high)
# Concentrations: PM2.5 & PM10 in µg/m³ (24-hr avg), NO2 & SO2 & O3 in µg/m³,
# CO in mg/m³ (8-hr avg).  Ranges are continuous floats – no integer gaps.
# Source: Central Pollution Control Board, India – National AQI methodology.
# ---------------------------------------------------------------------------
CPCB_BREAKPOINTS: dict[str, list[tuple[float, float, float, float]]] = {
    # PM2.5 (µg/m³, 24-hr avg)
    "pm2_5": [
        (0.0, 30.0, 0.0, 50.0),
        (30.01, 60.0, 51.0, 100.0),
        (60.01, 90.0, 101.0, 200.0),
        (90.01, 120.0, 201.0, 300.0),
        (120.01, 250.0, 301.0, 400.0),
        (250.01, 500.0, 401.0, 500.0),
    ],
    # PM10 (µg/m³, 24-hr avg)
    "pm10": [
        (0.0, 50.0, 0.0, 50.0),
        (50.01, 100.0, 51.0, 100.0),
        (100.01, 250.0, 101.0, 200.0),
        (250.01, 350.0, 201.0, 300.0),
        (350.01, 430.0, 301.0, 400.0),
        (430.01, 600.0, 401.0, 500.0),
    ],
    # NO2 (µg/m³, 24-hr avg)
    "nitrogen_dioxide": [
        (0.0, 40.0, 0.0, 50.0),
        (40.01, 80.0, 51.0, 100.0),
        (80.01, 180.0, 101.0, 200.0),
        (180.01, 280.0, 201.0, 300.0),
        (280.01, 400.0, 301.0, 400.0),
        (400.01, 800.0, 401.0, 500.0),
    ],
    # SO2 (µg/m³, 24-hr avg)
    "sulphur_dioxide": [
        (0.0, 40.0, 0.0, 50.0),
        (40.01, 80.0, 51.0, 100.0),
        (80.01, 380.0, 101.0, 200.0),
        (380.01, 800.0, 201.0, 300.0),
        (800.01, 1600.0, 301.0, 400.0),
        (1600.01, 2400.0, 401.0, 500.0),
    ],
    # CO (mg/m³, 8-hr avg)  — Open-Meteo returns µg/m³; we convert in code
    "carbon_monoxide": [
        (0.0, 1.0, 0.0, 50.0),
        (1.01, 2.0, 51.0, 100.0),
        (2.01, 10.0, 101.0, 200.0),
        (10.01, 17.0, 201.0, 300.0),
        (17.01, 34.0, 301.0, 400.0),
        (34.01, 50.0, 401.0, 500.0),
    ],
    # O3 (µg/m³, 8-hr avg)
    "ozone": [
        (0.0, 50.0, 0.0, 50.0),
        (50.01, 100.0, 51.0, 100.0),
        (100.01, 168.0, 101.0, 200.0),
        (168.01, 208.0, 201.0, 300.0),
        (208.01, 748.0, 301.0, 400.0),
        (748.01, 1000.0, 401.0, 500.0),
    ],
}

# ---------------------------------------------------------------------------
# AQI computation helpers
# ---------------------------------------------------------------------------


def sub_index(concentration: float, breakpoints: list[tuple[float, float, float, float]]) -> float:
    """Compute sub-index for a single pollutant using linear interpolation."""
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= concentration <= c_high:
            return ((i_high - i_low) / (c_high - c_low)) * (concentration - c_low) + i_low
    # If concentration exceeds all breakpoints, clamp to 500
    return 500.0


def compute_cpcb_aqi(pollutants: dict[str, float]) -> dict[str, Any]:
    """
    Compute CPCB National AQI from raw pollutant concentrations.
    Returns overall AQI (max sub-index) and individual sub-indices.
    CO is expected in µg/m³ from Open-Meteo and converted to mg/m³ here.
    """
    sub_indices: dict[str, float] = {}
    for key, bp_key in [
        ("pm2_5", "pm2_5"),
        ("pm10", "pm10"),
        ("nitrogen_dioxide", "nitrogen_dioxide"),
        ("sulphur_dioxide", "sulphur_dioxide"),
        ("carbon_monoxide", "carbon_monoxide"),
        ("ozone", "ozone"),
    ]:
        value = pollutants.get(key)
        if value is None:
            continue
        conc = float(value)
        # Open-Meteo returns CO in µg/m³; CPCB breakpoints use mg/m³
        if key == "carbon_monoxide":
            conc = conc / 1000.0
        sub_indices[key] = round(sub_index(conc, CPCB_BREAKPOINTS[bp_key]), 1)

    overall_aqi = round(max(sub_indices.values()), 1) if sub_indices else None
    dominant = max(sub_indices, key=sub_indices.get) if sub_indices else None
    return {"aqi": overall_aqi, "sub_indices": sub_indices, "dominant_pollutant": dominant}


def categorize_aqi(aqi: float | None) -> str:
    """Map numeric AQI to CPCB category string."""
    if aqi is None:
        return "unknown"
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Satisfactory"
    if aqi <= 200:
        return "Moderate"
    if aqi <= 300:
        return "Poor"
    if aqi <= 400:
        return "Very Poor"
    return "Severe"


def health_implications(category: str) -> str:
    """Return health implications text for an AQI category."""
    implications = {
        "Good": "Minimal impact on health. Air quality is considered satisfactory.",
        "Satisfactory": "Minor breathing discomfort to sensitive people.",
        "Moderate": "Breathing discomfort to people with lung disease such as asthma, and discomfort to people with heart disease, children, and older adults.",
        "Poor": "Breathing discomfort to people on prolonged exposure. Effect on lungs in people with lung disease.",
        "Very Poor": "Respiratory illness to people on prolonged exposure. Effect on lungs in people with lung/heart disease.",
        "Severe": "Respiratory effects even on healthy people. Serious impact on people with lung/heart disease. Early mortality in ill and elderly.",
    }
    return implications.get(category, "Health implications data not available.")


# ---------------------------------------------------------------------------
# API fetch helpers
# ---------------------------------------------------------------------------


def get_coordinates(city: str) -> dict[str, Any] | None:
    """Geocode a city name to lat/lon using Open-Meteo geocoding API."""
    params = {"name": city, "count": 5, "language": "en", "format": "json"}
    try:
        resp = httpx.get(GEOCODING_URL, params=params, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()
        if data.get("results"):
            loc = data["results"][0]
            return {
                "latitude": loc["latitude"],
                "longitude": loc["longitude"],
                "name": loc.get("name", city),
                "country": loc.get("country", ""),
                "admin1": loc.get("admin1", ""),
            }
    except Exception as e:
        logger.error("Geocoding failed for %s: %s", city, e)
    return None


def geocode_search(query: str, count: int = 5) -> list[dict[str, Any]]:
    """Return multiple geocoding results for search autocomplete."""
    params = {"name": query, "count": count, "language": "en", "format": "json"}
    try:
        resp = httpx.get(GEOCODING_URL, params=params, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()
        results = []
        for loc in data.get("results", []):
            results.append(
                {
                    "name": loc.get("name", ""),
                    "latitude": loc["latitude"],
                    "longitude": loc["longitude"],
                    "country": loc.get("country", ""),
                    "admin1": loc.get("admin1", ""),
                    "population": loc.get("population"),
                }
            )
        return results
    except Exception as e:
        logger.error("Geocode search failed for %s: %s", query, e)
        return []


def fetch_air_quality(lat: float, lon: float, forecast_days: int = 1) -> dict[str, Any] | None:
    """Fetch air quality data from Open-Meteo Air Quality API."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": "pm2_5,pm10,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone",
        "forecast_days": forecast_days,
        "timezone": "auto",
    }
    try:
        resp = httpx.get(AIR_QUALITY_URL, params=params, timeout=15.0)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error("Air quality fetch failed (%s, %s): %s", lat, lon, e)
        return None


def fetch_weather(lat: float, lon: float, forecast_days: int = 1) -> dict[str, Any] | None:
    """Fetch weather data from Open-Meteo Weather API."""
    params = {
        "latitude": lat,
        "longitude": lon,
        "current_weather": True,
        "hourly": "temperature_2m,relative_humidity_2m,windspeed_10m,weathercode",
        "daily": "temperature_2m_max,temperature_2m_min,weathercode,windspeed_10m_max",
        "forecast_days": forecast_days,
        "timezone": "auto",
    }
    try:
        resp = httpx.get(WEATHER_URL, params=params, timeout=15.0)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        logger.error("Weather fetch failed (%s, %s): %s", lat, lon, e)
        return None


# ---------------------------------------------------------------------------
# Caching
# ---------------------------------------------------------------------------
CACHE = TTLCache(maxsize=1000, ttl=300)  # 5-minute TTL


@cached(CACHE)
def get_aqi_data(city: str) -> dict[str, Any] | None:
    """
    Master helper: geocode -> air quality -> AQI calculation -> weather.
    Returns a full AQI response dict or None.
    """
    coords = get_coordinates(city)
    if not coords:
        logger.warning("City not found: %s", city)
        return None

    lat, lon = coords["latitude"], coords["longitude"]
    aq_data = fetch_air_quality(lat, lon)
    if not aq_data:
        return None

    try:
        idx = -1  # Latest hourly value
        hourly = aq_data["hourly"]
        pollutants: dict[str, float] = {}
        for key in [
            "pm2_5",
            "pm10",
            "carbon_monoxide",
            "nitrogen_dioxide",
            "sulphur_dioxide",
            "ozone",
        ]:
            val = hourly.get(key, [None])[idx]
            if val is not None:
                pollutants[key] = float(val)

        aqi_info = compute_cpcb_aqi(pollutants)
        category = categorize_aqi(aqi_info["aqi"])

        weather = fetch_weather(lat, lon)
        current_weather = weather.get("current_weather", {}) if weather else {}

        result = {
            "city": coords.get("name", city),
            "latitude": lat,
            "longitude": lon,
            "pollutants": pollutants,
            "aqi": aqi_info["aqi"],
            "sub_indices": aqi_info["sub_indices"],
            "dominant_pollutant": aqi_info["dominant_pollutant"],
            "aqi_category": category,
            "health_implications": health_implications(category),
            "weather": current_weather,
            "last_updated": datetime.now(UTC).isoformat(),
            "source": "Open-Meteo + CPCB AQI Methodology",
        }
        logger.info("AQI data fetched for %s: AQI=%s (%s)", city, aqi_info["aqi"], category)
        return result
    except Exception as e:
        logger.error("AQI processing failed for %s: %s", city, e)
        return None
