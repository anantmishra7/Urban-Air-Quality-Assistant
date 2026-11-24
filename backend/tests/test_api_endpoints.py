from unittest.mock import patch

from fastapi.testclient import TestClient


def test_health_check_endpoints(client: TestClient):
    res1 = client.get("/health")
    assert res1.status_code == 200
    assert res1.json()["status"] == "healthy"

    res2 = client.get("/api/health")
    assert res2.status_code == 200
    assert res2.json()["aqi_standard"] == "CPCB India National AQI"


def test_geocode_search(client: TestClient):
    with patch("backend.app.routers.geocode.geocode_search") as mock_geo:
        mock_geo.return_value = [
            {"name": "Delhi", "latitude": 28.6139, "longitude": 77.2090, "country": "India"}
        ]
        res = client.get("/api/geocode/?q=Delhi")
        assert res.status_code == 200
        data = res.json()
        assert data["count"] == 1
        assert data["results"][0]["name"] == "Delhi"


def test_geocode_empty_query_422(client: TestClient):
    res = client.get("/api/geocode/?q=")
    assert res.status_code in [400, 422]


def test_get_aqi_endpoint_success(client: TestClient):
    sample_aqi_data = {
        "city": "Delhi",
        "latitude": 28.61,
        "longitude": 77.21,
        "pollutants": {"pm2_5": 140.0, "pm10": 260.0},
        "aqi": 315.0,
        "sub_indices": {"pm2_5": 315.0, "pm10": 210.0},
        "dominant_pollutant": "pm2_5",
        "aqi_category": "Very Poor",
        "health_implications": "Respiratory illness to people on prolonged exposure.",
        "weather": {"temperature": 26.5, "windspeed": 8.5},
        "last_updated": "2026-11-18T18:00:00Z",
        "source": "Open-Meteo + CPCB AQI Methodology",
    }
    with patch("backend.app.routers.aqi.get_aqi_data", return_value=sample_aqi_data):
        res = client.get("/api/aqi/?city=Delhi")
        assert res.status_code == 200
        data = res.json()
        assert data["city"] == "Delhi"
        assert data["aqi"] == 315.0
        assert data["aqi_category"] == "Very Poor"
        assert data["dominant_pollutant"] == "pm2_5"


def test_get_aqi_endpoint_city_not_found(client: TestClient):
    with patch("backend.app.routers.aqi.get_aqi_data", return_value=None):
        res = client.get("/api/aqi/?city=NonExistentCityXYZ999")
        assert res.status_code == 404
        assert "not found" in res.json()["detail"].lower()


def test_compare_cities_endpoint(client: TestClient):
    def mock_get_aqi(city: str):
        if city.lower() == "delhi":
            return {
                "city": "Delhi",
                "aqi": 320.0,
                "aqi_category": "Very Poor",
                "pollutants": {"pm2_5": 150.0},
            }
        if city.lower() == "mumbai":
            return {
                "city": "Mumbai",
                "aqi": 85.0,
                "aqi_category": "Satisfactory",
                "pollutants": {"pm2_5": 35.0},
            }
        return None

    with patch("backend.app.routers.comparison.get_aqi_data", side_effect=mock_get_aqi):
        res = client.get("/api/compare/?cities=Delhi,Mumbai")
        assert res.status_code == 200
        data = res.json()
        assert data["count"] == 2
        # Should be sorted descending by AQI
        assert data["comparison"][0]["city"] == "Delhi"
        assert data["comparison"][1]["city"] == "Mumbai"


def test_compare_cities_max_limit(client: TestClient):
    cities = ",".join([f"City{i}" for i in range(15)])
    res = client.get(f"/api/compare/?cities={cities}")
    assert res.status_code == 400
    assert "Maximum 10 cities" in res.json()["detail"]


def test_hotspot_endpoint(client: TestClient):
    with (
        patch(
            "backend.app.routers.hotspot.get_coordinates",
            return_value={"latitude": 28.6, "longitude": 77.2, "name": "Delhi"},
        ),
        patch("backend.app.routers.hotspot.fetch_air_quality") as mock_aq,
    ):
        mock_aq.return_value = {
            "hourly": {
                "pm2_5": [45.0, 50.0],
                "pm10": [80.0, 90.0],
            }
        }
        res = client.get("/api/hotspot/?city=Delhi")
        assert res.status_code == 200
        data = res.json()
        assert data["city"] == "Delhi"
        assert len(data["hotspots"]) > 0
        assert "label" in data["hotspots"][0]


def test_get_report_not_found(client: TestClient):
    res = client.get("/api/report/999999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()
