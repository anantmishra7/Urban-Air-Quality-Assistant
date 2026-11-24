"""
Enhanced AI Assistant router – handles 15+ question types with keyword matching.
Provides pollutant-specific advice, mask recommendations, sensitive group guidance,
forecast context, and weather context.

GET /assistant/answer?city=Delhi&question=Is it safe to go jogging?
"""

import logging
from typing import Any

from fastapi import APIRouter, HTTPException, Query

from ..utils import (
    get_aqi_data,
    health_implications,
)

logger = logging.getLogger("breathecity.assistant")

router = APIRouter(prefix="/assistant", tags=["Assistant"])

# ---------------------------------------------------------------------------
# Knowledge base for different question types
# ---------------------------------------------------------------------------

MASK_ADVICE = {
    "Good": "No mask is needed. Air quality is healthy.",
    "Satisfactory": "No mask is strictly necessary. If you are highly sensitive, a cloth mask may help during prolonged outdoor exposure.",
    "Moderate": "Consider wearing an N95/KN95 mask if you have respiratory conditions or will be outdoors for extended periods.",
    "Poor": "Wearing an N95/KN95 mask is recommended when outdoors. Cloth masks do not filter fine particles effectively.",
    "Very Poor": "An N95/KN95 mask is strongly recommended outdoors. Limit outdoor time even with a mask.",
    "Severe": "Avoid going outdoors. If you must, an N95/KN95 mask is essential. Consider an N99 or P100 respirator for prolonged exposure.",
}

EXERCISE_ADVICE = {
    "Good": "Outdoor exercise is safe for everyone. Enjoy your workout!",
    "Satisfactory": "Outdoor exercise is generally safe. Sensitive individuals should avoid very strenuous activities.",
    "Moderate": "Reduce prolonged or heavy exertion outdoors. Shift intense workouts indoors. Light walks are okay for healthy individuals.",
    "Poor": "Avoid outdoor exercise. Use indoor gyms or home workouts. Even healthy adults may experience irritation.",
    "Very Poor": "Do not exercise outdoors. Indoor exercise with air purification is recommended.",
    "Severe": "No outdoor physical activity. Stay indoors and minimize all exertion.",
}

SENSITIVE_GROUP_ADVICE = {
    "Good": "No special precautions needed for children, elderly, or those with respiratory/cardiac conditions.",
    "Satisfactory": "Children and elderly should take slightly shorter outdoor trips. Those with asthma should carry inhalers.",
    "Moderate": "Children, elderly, and those with asthma/COPD/heart disease should reduce outdoor time. Keep rescue medications handy.",
    "Poor": "Sensitive groups should stay indoors. Use air purifiers. Children should not play outside. Elderly should avoid all outdoor exposure.",
    "Very Poor": "Sensitive groups must stay indoors with windows and doors closed. Use air purifiers on high. Seek medical attention if symptoms worsen.",
    "Severe": "Emergency-level for sensitive groups. Stay in sealed, air-purified rooms. Seek immediate medical help if experiencing breathing difficulty, chest pain, or dizziness.",
}

INDOOR_TIPS = [
    "Keep windows and doors closed during high pollution hours (morning rush and evening).",
    "Use HEPA air purifiers in bedrooms and living areas.",
    "Avoid burning candles, incense, or using gas stoves without ventilation.",
    "Indoor plants like peace lily, spider plant, and areca palm can help marginally.",
    "Use exhaust fans in kitchens when cooking.",
    "Vacuum with HEPA-filter vacuums regularly to reduce settled particles.",
    "Consider using an air quality monitor indoors to track PM2.5 levels.",
]

POLLUTANT_INFO = {
    "pm2_5": {
        "name": "PM2.5 (Fine Particulate Matter)",
        "description": "Tiny particles ≤2.5 µm diameter. Can penetrate deep into lungs and even enter the bloodstream.",
        "sources": "Vehicle exhaust, industrial emissions, construction dust, crop burning, cooking, wildfires.",
        "health_effects": "Aggravates asthma, causes respiratory infections, increases heart attack and stroke risk. Long-term exposure linked to lung cancer.",
    },
    "pm10": {
        "name": "PM10 (Coarse Particulate Matter)",
        "description": "Particles ≤10 µm diameter. Includes dust, pollen, and mold spores.",
        "sources": "Road dust, construction, mining, agriculture, industrial processes.",
        "health_effects": "Irritates nose, throat, and airways. Worsens asthma and bronchitis.",
    },
    "nitrogen_dioxide": {
        "name": "NO₂ (Nitrogen Dioxide)",
        "description": "Reddish-brown gas with a sharp odor. Key component of smog.",
        "sources": "Vehicle emissions (especially diesel), power plants, industrial boilers.",
        "health_effects": "Inflames airways, reduces lung function, increases susceptibility to respiratory infections.",
    },
    "sulphur_dioxide": {
        "name": "SO₂ (Sulphur Dioxide)",
        "description": "Colorless gas with a pungent smell. Contributes to acid rain.",
        "sources": "Coal and oil combustion in power plants, metal smelting, volcanic emissions.",
        "health_effects": "Irritates eyes, nose, and throat. Bronchoconstriction in asthmatics. Aggravates cardiovascular disease.",
    },
    "carbon_monoxide": {
        "name": "CO (Carbon Monoxide)",
        "description": "Colorless, odorless gas. Reduces blood's ability to carry oxygen.",
        "sources": "Incomplete combustion – vehicle exhaust, generators, fires, industrial processes.",
        "health_effects": "Headaches, dizziness, reduced alertness. At high levels: confusion, unconsciousness, death.",
    },
    "ozone": {
        "name": "O₃ (Ground-level Ozone)",
        "description": "Secondary pollutant formed by reaction of NOx and VOCs in sunlight. Part of photochemical smog.",
        "sources": "Not directly emitted – formed from vehicle and industrial pollutant reactions in sunlight.",
        "health_effects": "Chest pain, coughing, throat irritation. Worsens asthma. Damages lungs with repeated exposure.",
    },
}

TRAVEL_ADVICE = {
    "Good": "Great conditions for travel and sightseeing! No restrictions.",
    "Satisfactory": "Good for travel. Keep bottled water and stay hydrated.",
    "Moderate": "Travel is okay but carry an N95 mask. Avoid prolonged outdoor sightseeing during peak traffic hours.",
    "Poor": "Consider postponing non-essential travel. If traveling, use air-conditioned transport and wear an N95 mask outdoors.",
    "Very Poor": "Travel is not recommended. If essential, minimize outdoor exposure and use sealed, air-conditioned vehicles.",
    "Severe": "Avoid all travel to this area if possible. Health risk is significant even with precautions.",
}

CHILDREN_ADVICE = {
    "Good": "Safe for children to play outside. Encourage outdoor activities.",
    "Satisfactory": "Children can play outside. Limit to 1-2 hours for very young children (under 5).",
    "Moderate": "Reduce outdoor playtime. Keep recesses shorter. Children with asthma should stay indoors.",
    "Poor": "Children should stay indoors. Schools should cancel outdoor activities. Keep children away from busy roads.",
    "Very Poor": "Children must stay indoors. Schools should consider closing or shifting to indoor-only activities.",
    "Severe": "Schools should close. Children must remain in air-purified indoor environments.",
}


# ---------------------------------------------------------------------------
# Helper: determine question type from keywords
# ---------------------------------------------------------------------------


def classify_question(question: str) -> str:
    """Classify a user question into a category using keyword matching."""
    q = question.lower()

    # Order matters – more specific checks first
    if any(w in q for w in ["mask", "n95", "respirator", "face cover"]):
        return "mask"
    if any(
        w in q
        for w in ["exercise", "jog", "run", "walk", "gym", "workout", "sport", "yoga", "cycling"]
    ):
        return "exercise"
    if any(w in q for w in ["child", "kid", "baby", "infant", "school", "playground", "toddler"]):
        return "children"
    if any(w in q for w in ["elderly", "senior", "old age", "grandparent", "aged"]):
        return "sensitive_elderly"
    if any(
        w in q
        for w in [
            "asthma",
            "copd",
            "lung disease",
            "respiratory",
            "heart disease",
            "cardiac",
            "diabetes",
            "pregnant",
            "pregnancy",
        ]
    ):
        return "sensitive_medical"
    if any(w in q for w in ["sensitive", "vulnerable"]):
        return "sensitive"
    if any(
        w in q
        for w in [
            "indoor",
            "inside",
            "home",
            "purifier",
            "air purifier",
            "ventilation",
            "ac",
            "air conditioner",
        ]
    ):
        return "indoor"
    if any(
        w in q for w in ["travel", "visit", "tour", "tourist", "vacation", "trip", "fly", "commute"]
    ):
        return "travel"
    if any(
        w in q
        for w in [
            "forecast",
            "tomorrow",
            "next week",
            "predict",
            "trend",
            "coming days",
            "next few days",
            "week ahead",
        ]
    ):
        return "forecast"
    if any(w in q for w in ["weather", "temperature", "rain", "humidity", "wind", "hot", "cold"]):
        return "weather"
    if any(w in q for w in ["pm2.5", "pm2_5", "pm 2.5", "fine particle"]):
        return "pollutant_pm25"
    if any(w in q for w in ["pm10", "pm 10", "coarse particle", "dust"]):
        return "pollutant_pm10"
    if any(w in q for w in ["no2", "nitrogen", "nox"]):
        return "pollutant_no2"
    if any(w in q for w in ["so2", "sulphur", "sulfur"]):
        return "pollutant_so2"
    if any(w in q for w in ["co ", "carbon monoxide", "co level"]):
        return "pollutant_co"
    if any(w in q for w in ["ozone", "o3"]):
        return "pollutant_o3"
    if any(
        w in q for w in ["pollutant", "pollution", "cause", "source", "what is causing", "why is"]
    ):
        return "pollutant_general"
    if any(w in q for w in ["safe", "safety", "dangerous", "risk", "hazard", "harmful"]):
        return "safety"
    if any(
        w in q
        for w in [
            "precaution",
            "protect",
            "prevention",
            "avoid",
            "reduce exposure",
            "tip",
            "advice",
            "recommend",
        ]
    ):
        return "precaution"
    if any(
        w in q
        for w in ["aqi", "air quality index", "what does", "meaning", "scale", "category", "level"]
    ):
        return "aqi_explain"
    if any(w in q for w in ["compare", "versus", "vs", "better", "worse", "which city"]):
        return "compare"
    if any(w in q for w in ["health", "symptom", "effect", "impact", "disease"]):
        return "health"
    if any(w in q for w in ["plant", "tree", "garden"]):
        return "plants"
    return "general"


# ---------------------------------------------------------------------------
# Generate response for each question type
# ---------------------------------------------------------------------------


def _fmt_pollutants(pollutants: dict[str, float], sub_indices: dict[str, float]) -> str:
    """Format pollutant data as a readable string."""
    lines = []
    names = {
        "pm2_5": "PM2.5",
        "pm10": "PM10",
        "nitrogen_dioxide": "NO₂",
        "sulphur_dioxide": "SO₂",
        "carbon_monoxide": "CO",
        "ozone": "O₃",
    }
    for key, label in names.items():
        conc = pollutants.get(key)
        si = sub_indices.get(key)
        if conc is not None:
            unit = "mg/m³" if key == "carbon_monoxide" else "µg/m³"
            # CO from Open-Meteo is in µg/m³
            if key == "carbon_monoxide":
                conc_display = f"{conc:.0f} µg/m³ ({conc / 1000:.2f} mg/m³)"
            else:
                conc_display = f"{conc:.1f} {unit}"
            si_str = f" (sub-index: {si})" if si is not None else ""
            lines.append(f"  • {label}: {conc_display}{si_str}")
    return "\n".join(lines) if lines else "  Pollutant data unavailable."


_SIMPLE_ADVICE_CONFIG: dict[str, tuple[str, dict[str, str], str]] = {
    "mask": (
        "🏥 **Mask Recommendation for {city}** (AQI: {aqi} – {category}):",
        MASK_ADVICE,
        "Check local AQI before deciding on mask use.",
    ),
    "exercise": (
        "🏃 **Exercise Advice for {city}** (AQI: {aqi} – {category}):",
        EXERCISE_ADVICE,
        "Check local AQI before exercising outdoors.",
    ),
    "children": (
        "👶 **Children & Outdoor Activity in {city}** (AQI: {aqi} – {category}):",
        CHILDREN_ADVICE,
        "Monitor AQI before allowing children outdoors.",
    ),
    "sensitive_elderly": (
        "⚠️ **Sensitive Group Advisory for {city}** (AQI: {aqi} – {category}):",
        SENSITIVE_GROUP_ADVICE,
        "Sensitive individuals should monitor AQI.",
    ),
    "sensitive_medical": (
        "⚠️ **Sensitive Group Advisory for {city}** (AQI: {aqi} – {category}):",
        SENSITIVE_GROUP_ADVICE,
        "Sensitive individuals should monitor AQI.",
    ),
    "sensitive": (
        "⚠️ **Sensitive Group Advisory for {city}** (AQI: {aqi} – {category}):",
        SENSITIVE_GROUP_ADVICE,
        "Sensitive individuals should monitor AQI.",
    ),
    "travel": (
        "✈️ **Travel Advisory for {city}** (AQI: {aqi} – {category}):",
        TRAVEL_ADVICE,
        "Check local AQI advisories before traveling.",
    ),
}


def generate_response(
    question_type: str,
    data: dict[str, Any],
    question: str,
) -> str:
    """Generate a detailed answer based on question type and AQI data."""
    category = data.get("aqi_category", "unknown")
    aqi = data.get("aqi")
    pollutants = data.get("pollutants", {})
    sub_indices = data.get("sub_indices", {})
    dominant = data.get("dominant_pollutant", "")
    weather = data.get("weather", {})
    city = data.get("city", "your city")

    if question_type in _SIMPLE_ADVICE_CONFIG:
        header_tpl, advice_map, fallback = _SIMPLE_ADVICE_CONFIG[question_type]
        header = header_tpl.format(city=city, aqi=aqi, category=category)
        return f"{header}\n\n{advice_map.get(category, fallback)}"

    if question_type == "indoor":
        tips = "\n".join(f"  {i + 1}. {t}" for i, t in enumerate(INDOOR_TIPS))
        return f"🏠 **Indoor Air Quality Tips for {city}** (AQI: {aqi} – {category}):\n\n{tips}"

    if question_type == "forecast":
        return (
            f"📊 **Air Quality Forecast for {city}**:\n\n"
            f"Current AQI: {aqi} ({category})\n"
            f"Dominant pollutant: {(dominant or 'N/A').replace('_', ' ').upper()}\n\n"
            f"For a detailed 5-day forecast, please use the /forecast/hourly or /forecast/daily endpoints with city={city}.\n"
            f"Trends depend on weather patterns, wind speed, and local emission sources."
        )

    if question_type == "weather":
        temp = weather.get("temperature", "N/A")
        wind = weather.get("windspeed", "N/A")
        wcode = weather.get("weathercode", "N/A")
        return (
            f"🌤️ **Weather in {city}**:\n\n"
            f"  • Temperature: {temp}°C\n"
            f"  • Wind Speed: {wind} km/h\n"
            f"  • Weather Code: {wcode}\n"
            f"  • AQI: {aqi} ({category})\n\n"
            f"Note: Higher wind speeds generally help disperse pollutants. "
            f"Calm, cold conditions (temperature inversions) tend to trap pollution near the surface."
        )

    # Specific pollutant queries
    pollutant_map = {
        "pollutant_pm25": "pm2_5",
        "pollutant_pm10": "pm10",
        "pollutant_no2": "nitrogen_dioxide",
        "pollutant_so2": "sulphur_dioxide",
        "pollutant_co": "carbon_monoxide",
        "pollutant_o3": "ozone",
    }
    if question_type in pollutant_map:
        p_key = pollutant_map[question_type]
        info = POLLUTANT_INFO.get(p_key, {})
        conc = pollutants.get(p_key, "N/A")
        si = sub_indices.get(p_key, "N/A")
        return (
            f"🔬 **{info.get('name', p_key.upper())} in {city}**:\n\n"
            f"  • Current Level: {conc}\n"
            f"  • Sub-Index: {si}\n\n"
            f"**What is it?** {info.get('description', 'N/A')}\n"
            f"**Sources:** {info.get('sources', 'N/A')}\n"
            f"**Health Effects:** {info.get('health_effects', 'N/A')}"
        )

    if question_type == "pollutant_general":
        p_summary = _fmt_pollutants(pollutants, sub_indices)
        dom_info = POLLUTANT_INFO.get(dominant, {}) if dominant else {}
        return (
            f"🌫️ **Pollution Breakdown for {city}** (AQI: {aqi} – {category}):\n\n"
            f"Current pollutant levels:\n{p_summary}\n\n"
            f"Dominant pollutant: **{(dominant or 'N/A').replace('_', ' ').upper()}**\n"
            + (
                f"  → {dom_info.get('description', '')}\n  → Sources: {dom_info.get('sources', '')}"
                if dom_info
                else ""
            )
        )

    if question_type == "safety":
        base = EXERCISE_ADVICE.get(category, "")
        mask = MASK_ADVICE.get(category, "")
        return (
            f"🛡️ **Safety Assessment for {city}** (AQI: {aqi} – {category}):\n\n"
            f"**Overall:** {health_implications(category)}\n\n"
            f"**Outdoor Activity:** {base}\n\n"
            f"**Mask:** {mask}"
        )

    if question_type == "precaution":
        tips_list = [
            MASK_ADVICE.get(category, ""),
            EXERCISE_ADVICE.get(category, ""),
            SENSITIVE_GROUP_ADVICE.get(category, ""),
        ]
        numbered = "\n".join(f"  {i + 1}. {t}" for i, t in enumerate(tips_list) if t)
        indoor = "\n".join(f"  • {t}" for t in INDOOR_TIPS[:4])
        return (
            f"🛡️ **Precautions for {city}** (AQI: {aqi} – {category}):\n\n"
            f"{numbered}\n\n**Indoor Tips:**\n{indoor}"
        )

    if question_type == "aqi_explain":
        return (
            f"📏 **Understanding AQI for {city}**:\n\n"
            f"The Air Quality Index (AQI) is a standardized scale from 0-500:\n"
            f"  • 0-50: Good 🟢\n"
            f"  • 51-100: Satisfactory 🟡\n"
            f"  • 101-200: Moderate 🟠\n"
            f"  • 201-300: Poor 🔴\n"
            f"  • 301-400: Very Poor 🟣\n"
            f"  • 401-500: Severe ⚫\n\n"
            f"Current {city} AQI: **{aqi}** ({category})\n"
            f"This is calculated using CPCB (Central Pollution Control Board) methodology, "
            f"taking the maximum sub-index across 6 pollutants."
        )

    if question_type == "compare":
        return (
            f"📊 For comparing multiple cities, use the /compare endpoint:\n"
            f"  GET /compare?cities=Delhi,Mumbai,Chennai\n\n"
            f"Current {city} AQI: {aqi} ({category})"
        )

    if question_type == "health":
        impl = health_implications(category)
        sens = SENSITIVE_GROUP_ADVICE.get(category, "")
        return (
            f"🏥 **Health Impact in {city}** (AQI: {aqi} – {category}):\n\n"
            f"**General:** {impl}\n\n"
            f"**Sensitive Groups:** {sens}\n\n"
            f"**Dominant Pollutant:** {(dominant or 'N/A').replace('_', ' ').upper()}\n"
            f"{'→ ' + POLLUTANT_INFO.get(dominant, {}).get('health_effects', '') if dominant else ''}"
        )

    if question_type == "plants":
        return (
            f"🌱 **Air-Purifying Plants for {city}**:\n\n"
            f"While plants have limited impact on outdoor air quality, indoor plants can help marginally:\n"
            f"  1. **Areca Palm** – excellent at filtering formaldehyde and xylene\n"
            f"  2. **Peace Lily** – removes benzene, formaldehyde, and trichloroethylene\n"
            f"  3. **Spider Plant** – effective against CO and xylene\n"
            f"  4. **Snake Plant** – filters formaldehyde, releases oxygen at night\n"
            f"  5. **Money Plant** – filters VOCs and formaldehyde\n"
            f"  6. **Aloe Vera** – filters formaldehyde and benzene\n\n"
            f"Note: Plants alone cannot substitute for air purifiers in {category.lower()} AQI conditions."
        )

    # General / fallback
    p_summary = _fmt_pollutants(pollutants, sub_indices)
    return (
        f"🌍 **Air Quality in {city}** (AQI: {aqi} – {category}):\n\n"
        f"{health_implications(category)}\n\n"
        f"Pollutant levels:\n{p_summary}\n\n"
        f"I can answer questions about:\n"
        f"  • Safety & outdoor activities\n"
        f"  • Exercise recommendations\n"
        f"  • Mask advice (N95/KN95)\n"
        f"  • Children & schools\n"
        f"  • Sensitive groups (elderly, asthma, heart disease)\n"
        f"  • Indoor air quality tips\n"
        f"  • Travel advisories\n"
        f"  • Specific pollutants (PM2.5, PM10, NO₂, SO₂, CO, O₃)\n"
        f"  • Weather & forecast\n"
        f"  • Health effects\n"
        f"  • AQI scale explanation\n"
        f"  • Air-purifying plants\n\n"
        f"Ask me a specific question for detailed advice!"
    )


# ---------------------------------------------------------------------------
# Endpoint
# ---------------------------------------------------------------------------


@router.get("/answer")
async def get_answer(
    city: str = Query(..., description="City name for AQI context"),
    question: str = Query(..., description="User question about air quality"),
) -> dict[str, Any]:
    """
    AI assistant endpoint – classifies the user question and returns
    contextual advice based on current AQI data.
    """
    logger.info("Assistant query: city=%s question=%s", city, question)
    data = get_aqi_data(city)
    if not data:
        raise HTTPException(status_code=404, detail="AQI data not found for city")

    question_type = classify_question(question)
    answer = generate_response(question_type, data, question)

    logger.info("Answered question type=%s for city=%s", question_type, city)
    return {
        "city": data.get("city", city),
        "question": question,
        "question_type": question_type,
        "answer": answer,
        "aqi": data.get("aqi"),
        "aqi_category": data.get("aqi_category"),
        "dominant_pollutant": data.get("dominant_pollutant"),
    }
