from unittest.mock import patch

from fastapi.testclient import TestClient

MOCK_DELHI_AQI = {
    "city": "Delhi",
    "latitude": 28.61,
    "longitude": 77.21,
    "pollutants": {
        "pm2_5": 160.0,
        "pm10": 280.0,
        "nitrogen_dioxide": 70.0,
        "sulphur_dioxide": 18.0,
        "carbon_monoxide": 2000.0,
        "ozone": 40.0,
    },
    "aqi": 330.0,
    "sub_indices": {"pm2_5": 330.0, "pm10": 230.0},
    "dominant_pollutant": "pm2_5",
    "aqi_category": "Very Poor",
    "health_implications": "Respiratory illness to people on prolonged exposure.",
    "weather": {"temperature": 27.0, "windspeed": 6.0},
    "last_updated": "2026-11-18T18:00:00Z",
    "source": "Open-Meteo + CPCB AQI Methodology",
}


def test_assistant_safe_question(client: TestClient):
    with patch("backend.app.routers.assistant.get_aqi_data", return_value=MOCK_DELHI_AQI):
        res = client.get("/api/assistant/answer?city=Delhi&question=Is+the+air+safe+today%3F")
        assert res.status_code == 200
        data = res.json()
        assert data["city"] == "Delhi"
        assert data["aqi_category"] == "Very Poor"
        assert len(data["answer"]) > 20
        # For "Very Poor", advice should mention precautions or avoiding outdoor exposure
        assert any(
            w in data["answer"].lower() for w in ["indoor", "poor", "exposure", "mask", "limit"]
        )


def test_assistant_exercise_question(client: TestClient):
    with patch("backend.app.routers.assistant.get_aqi_data", return_value=MOCK_DELHI_AQI):
        res = client.get("/api/assistant/answer?city=Delhi&question=Should+I+exercise+outdoors%3F")
        assert res.status_code == 200
        data = res.json()
        assert any(
            w in data["answer"].lower() for w in ["exercise", "indoor", "avoid", "gym", "workout"]
        )


def test_assistant_pollutant_question(client: TestClient):
    with patch("backend.app.routers.assistant.get_aqi_data", return_value=MOCK_DELHI_AQI):
        res = client.get(
            "/api/assistant/answer?city=Delhi&question=Which+pollutants+are+currently+high%3F"
        )
        assert res.status_code == 200
        data = res.json()
        # Should identify PM2.5 or PM10 as high
        assert any(w in data["answer"].lower() for w in ["pm2", "pm10", "pollutant", "highest"])


def test_assistant_children_elderly_precautions(client: TestClient):
    with patch("backend.app.routers.assistant.get_aqi_data", return_value=MOCK_DELHI_AQI):
        res = client.get(
            "/api/assistant/answer?city=Delhi&question=What+precautions+should+children+and+elderly+take%3F"
        )
        assert res.status_code == 200
        data = res.json()
        assert any(
            w in data["answer"].lower()
            for w in ["children", "elderly", "sensitive", "indoor", "mask"]
        )


def test_assistant_mask_question(client: TestClient):
    with patch("backend.app.routers.assistant.get_aqi_data", return_value=MOCK_DELHI_AQI):
        res = client.get(
            "/api/assistant/answer?city=Delhi&question=Do+I+need+to+wear+an+N95+mask%3F"
        )
        assert res.status_code == 200
        data = res.json()
        assert any(
            w in data["answer"].lower() for w in ["mask", "n95", "kn95", "filter", "recommended"]
        )


def test_assistant_unknown_city_404(client: TestClient):
    with patch("backend.app.routers.assistant.get_aqi_data", return_value=None):
        res = client.get("/api/assistant/answer?city=InvalidPlace&question=Is+air+safe%3F")
        assert res.status_code == 404
