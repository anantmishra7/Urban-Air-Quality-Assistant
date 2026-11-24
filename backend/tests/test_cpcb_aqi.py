from backend.app.utils import (
    CPCB_BREAKPOINTS,
    categorize_aqi,
    compute_cpcb_aqi,
    health_implications,
    sub_index,
)


def test_sub_index_pm25_good():
    # 0-30 µg/m3 maps to 0-50 index
    # At 15 µg/m3, sub-index = 25.0
    val = sub_index(15.0, CPCB_BREAKPOINTS["pm2_5"])
    assert round(val, 1) == 25.0


def test_sub_index_pm25_moderate():
    # 60.01-90 µg/m3 maps to 101-200 index
    # At 75 µg/m3, sub-index should be around 150.0
    val = sub_index(75.0, CPCB_BREAKPOINTS["pm2_5"])
    assert 140.0 <= val <= 160.0


def test_sub_index_pm10_breakpoints():
    # 0-50 -> 0-50
    assert sub_index(25.0, CPCB_BREAKPOINTS["pm10"]) == 25.0
    # 50.01-100 -> 51-100
    val = sub_index(75.0, CPCB_BREAKPOINTS["pm10"])
    assert 70.0 <= val <= 80.0


def test_sub_index_clamp_high():
    # Beyond highest breakpoint (>500 for PM2.5), should clamp to 500
    val = sub_index(800.0, CPCB_BREAKPOINTS["pm2_5"])
    assert val == 500.0


def test_compute_cpcb_aqi_all_six_pollutants():
    # Test realistic Delhi smog data: PM2.5 dominant
    pollutants = {
        "pm2_5": 180.0,  # 120.01-250 -> 301-400 (Very Poor)
        "pm10": 260.0,  # 250.01-350 -> 201-300 (Poor)
        "nitrogen_dioxide": 65.0,  # 40.01-80 -> 51-100 (Satisfactory)
        "sulphur_dioxide": 20.0,  # 0-40 -> 0-50 (Good)
        "carbon_monoxide": 2500.0,  # 2500 µg/m³ = 2.5 mg/m³ -> 101-200 (Moderate)
        "ozone": 45.0,  # 0-50 -> 0-50 (Good)
    }
    result = compute_cpcb_aqi(pollutants)
    assert result["aqi"] is not None
    assert 300.0 <= result["aqi"] <= 400.0
    assert result["dominant_pollutant"] == "pm2_5"
    assert categorize_aqi(result["aqi"]) == "Very Poor"


def test_compute_cpcb_aqi_pm10_dominant():
    # Test dust storm scenario where PM10 dominates
    pollutants = {
        "pm2_5": 40.0,
        "pm10": 380.0,  # 350.01-430 -> 301-400 (Very Poor)
    }
    result = compute_cpcb_aqi(pollutants)
    assert result["aqi"] is not None
    assert 300.0 <= result["aqi"] <= 400.0
    assert result["dominant_pollutant"] == "pm10"


def test_compute_cpcb_aqi_missing_pollutant_data():
    # Missing some pollutants gracefully computes from available ones
    pollutants = {"pm2_5": 25.0}
    result = compute_cpcb_aqi(pollutants)
    assert result["aqi"] is not None
    assert result["aqi"] <= 50.0
    assert result["dominant_pollutant"] == "pm2_5"
    assert categorize_aqi(result["aqi"]) == "Good"


def test_compute_cpcb_aqi_empty_data():
    # Fully empty returns None
    result = compute_cpcb_aqi({})
    assert result["aqi"] is None
    assert result["dominant_pollutant"] is None
    assert categorize_aqi(result["aqi"]) == "unknown"


def test_aqi_categories():
    assert categorize_aqi(25) == "Good"
    assert categorize_aqi(75) == "Satisfactory"
    assert categorize_aqi(150) == "Moderate"
    assert categorize_aqi(250) == "Poor"
    assert categorize_aqi(350) == "Very Poor"
    assert categorize_aqi(450) == "Severe"
    assert categorize_aqi(None) == "unknown"


def test_health_implications_output():
    for cat in ["Good", "Satisfactory", "Moderate", "Poor", "Very Poor", "Severe"]:
        text = health_implications(cat)
        assert len(text) > 10


def test_sub_index_at_exact_boundaries():
    """Test exact boundary points on sub-index curve."""
    assert sub_index(0.0, CPCB_BREAKPOINTS["pm2_5"]) == 0.0
    assert sub_index(30.0, CPCB_BREAKPOINTS["pm2_5"]) == 50.0
    val_60 = sub_index(60.0, CPCB_BREAKPOINTS["pm2_5"])
    assert 99.0 <= val_60 <= 100.0


def test_sub_index_boundary_clamp():
    """Negative concentration falls outside breakpoints and clamps to 500."""
    val = sub_index(-10.0, CPCB_BREAKPOINTS["pm2_5"])
    assert val == 500.0


def test_categorize_aqi_all_boundaries():
    """Verify all CPCB category boundary transitions."""
    assert categorize_aqi(0) == "Good"
    assert categorize_aqi(50) == "Good"
    assert categorize_aqi(50.1) == "Satisfactory"
    assert categorize_aqi(100) == "Satisfactory"
    assert categorize_aqi(100.1) == "Moderate"
    assert categorize_aqi(200) == "Moderate"
    assert categorize_aqi(200.1) == "Poor"
    assert categorize_aqi(300) == "Poor"
    assert categorize_aqi(301) == "Very Poor"
    assert categorize_aqi(400) == "Very Poor"
    assert categorize_aqi(401) == "Severe"
    assert categorize_aqi(500) == "Severe"
