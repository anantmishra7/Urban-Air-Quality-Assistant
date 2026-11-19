# BreatheCity AI – Backend API

FastAPI backend providing real-time air quality metrics, official CPCB AQI calculations, spatial hotspot analysis, AI contextual recommendations, and citizen incident reporting.

## Setup & Running

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate   # Windows PowerShell
# source venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn backend.app.main:app --reload --port 8000
```

## API Endpoints Reference

### Health & Core
- `GET /health` & `GET /api/health` – Service status, version, and AQI standard attribution.
- `GET /api/geocode/?q={query}` – Search autocomplete for cities with lat/long.

### Air Quality & Forecast
- `GET /api/aqi/?city={city}` – Current CPCB AQI (PM2.5, PM10, NO₂, SO₂, CO, O₃), dominant pollutant, weather, and health implications.
- `GET /api/forecast/hourly?city={city}` – 48-hour hourly air quality projection.
- `GET /api/forecast/daily?city={city}` – 5-day daily min/max AQI and category projection.

### Spatial & Comparison
- `GET /api/hotspot/?city={city}` – 9-point spatial grid analysis around the metro area.
- `GET /api/compare/?cities={c1,c2,c3}` – Cross-city comparative benchmarking.

### AI Assistant & Community
- `GET /api/assistant/answer?city={city}&question={query}` – Context-aware conversational advisor.
- `GET /api/report/` – List verified citizen pollution reports.
- `POST /api/report/` – Submit a new pollution incident.
- `POST /api/upload` – Safe photo upload (JPG/PNG/WebP, max 5MB).

## Running Tests

```bash
python -m pytest backend/tests -v
```
