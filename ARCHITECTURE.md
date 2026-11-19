# 🏗️ Architecture – BreatheCity AI

## System Overview

BreatheCity AI is a full-stack urban air quality monitoring platform. The backend computes CPCB-standard AQI from live pollutant data; the frontend renders an interactive dashboard with charts, maps, and an AI assistant.

---

## Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                            │
│                                                                     │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │ Dashboard │ │ Forecast  │ │   Map    │ │Assistant │ │ Reports │ │
│  │   Page   │ │   Page    │ │   Page   │ │  Page    │ │  Page   │ │
│  └────┬─────┘ └─────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │
│       │              │            │             │            │      │
│       └──────────────┴────────────┴─────────────┴────────────┘      │
│                               │                                     │
│                        fetch('/api/...')                             │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ HTTPS / Vite Proxy
                                ▼
┌───────────────────────────────────────────────────────────────────────┐
│                     BACKEND (FastAPI + Uvicorn)                       │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                         Middleware                               │  │
│  │  CORS │ Rate Limiting (SlowAPI) │ Logging │ Error Handling      │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌────────────┐ ┌────────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │ /aqi       │ │ /forecast  │ │ /assistant    │ │ /report        │  │
│  │ AQI Router │ │ Forecast   │ │ AI Assistant  │ │ Report Router  │  │
│  │            │ │ Router     │ │ Router        │ │                │  │
│  └──────┬─────┘ └─────┬──────┘ └──────┬───────┘ └───────┬────────┘  │
│         │              │               │                 │           │
│  ┌──────┴──────┐ ┌─────┴─────┐ ┌──────┴──────┐  ┌──────┴──────┐   │
│  │ /compare    │ │ /hotspot  │ │ /geocode    │  │ /upload     │   │
│  │ Comparison  │ │ Hotspot   │ │ Geocoding   │  │ File Upload │   │
│  │ Router      │ │ Router    │ │ Router      │  │ Endpoint    │   │
│  └─────────────┘ └───────────┘ └─────────────┘  └─────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                      Core Services                              │  │
│  │  utils.py: Geocoding │ AQ Fetch │ Weather │ CPCB AQI Calc     │  │
│  │  db.py:    SQLModel ORM │ Session Management                   │  │
│  │  cache:    TTLCache (in-memory, 5-min TTL)                     │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬────────────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
   ┌────────────────┐ ┌───────────────┐ ┌────────────────┐
   │  Open-Meteo    │ │  Open-Meteo   │ │   SQLite /     │
   │  Air Quality   │ │  Weather API  │ │   PostgreSQL   │
   │  API           │ │               │ │   (Reports)    │
   └────────────────┘ └───────────────┘ └────────────────┘
   ┌────────────────┐
   │  Open-Meteo    │
   │  Geocoding API │
   └────────────────┘
```

---

## Data Flow

### Real-Time AQI Request

```
User enters city name
        │
        ▼
Frontend calls GET /api/aqi?city=Delhi
        │
        ▼
Backend: utils.get_aqi_data(city)
   ├─► get_coordinates(city) ──► Open-Meteo Geocoding API
   │       Returns: {latitude, longitude}
   │
   ├─► fetch_air_quality(lat, lon) ──► Open-Meteo Air Quality API
   │       Returns: hourly PM2.5, PM10, CO, NO2, SO2, O3
   │
   ├─► fetch_weather(lat, lon) ──► Open-Meteo Weather API
   │       Returns: temperature, humidity, wind speed
   │
   ├─► compute_cpcb_aqi(pollutants)
   │       Calculates sub-index for each pollutant
   │       Overall AQI = max(sub_indices)
   │       Category = categorize_aqi(overall)
   │
   └─► Return JSON response with all data
        │
        ▼
Frontend renders: AQI gauge, pollutant cards, weather strip
```

### Report Submission Flow

```
User fills report form + optional photo
        │
        ▼
Frontend: POST /api/upload (photo)  ──► Validates type/size ──► Saves to uploads/
Frontend: POST /api/report (data)   ──► Validates fields   ──► Inserts into SQLite
        │
        ▼
Frontend: GET /api/report           ──► Returns all reports
```

---

## API Endpoints

| Method | Endpoint | Description | Query Params |
|--------|----------|-------------|--------------|
| `GET` | `/health` | Health check | — |
| `GET` | `/aqi/` | Current AQI for a city | `city` (required) |
| `GET` | `/forecast/hourly` | Hourly pollutant forecast | `city`, `days` |
| `GET` | `/forecast/daily` | Daily AQI forecast | `city`, `days` |
| `GET` | `/assistant/answer` | AI assistant Q&A | `question`, `city` |
| `POST` | `/report/` | Submit a pollution report | Body: city, lat, lon, description, photo_path |
| `GET` | `/report/` | List all reports | — |
| `GET` | `/report/{id}` | Get a specific report | — |
| `GET` | `/compare/` | Compare AQI across cities | `cities` (comma-separated) |
| `GET` | `/hotspot/` | Pollution hotspot grid | `city` |
| `GET` | `/geocode/` | City name → coordinates | `q` |
| `POST` | `/upload` | Upload a photo | Multipart file |

---

## Database Schema

### `report` Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT | Unique report ID |
| `city` | VARCHAR | NOT NULL | City name |
| `latitude` | FLOAT | NOT NULL | Report latitude |
| `longitude` | FLOAT | NOT NULL | Report longitude |
| `description` | TEXT | NOT NULL | User-provided description |
| `photo_path` | VARCHAR | NULLABLE | Path to uploaded photo |
| `status` | VARCHAR | DEFAULT 'submitted' | Report status (submitted/reviewed/resolved) |
| `created_at` | DATETIME | DEFAULT NOW | Submission timestamp |

### Entity Relationship

```
┌─────────────────────────────┐
│          Report              │
├─────────────────────────────┤
│ PK  id          INTEGER     │
│     city        VARCHAR     │
│     latitude    FLOAT       │
│     longitude   FLOAT       │
│     description TEXT        │
│     photo_path  VARCHAR?    │
│     status      VARCHAR     │
│     created_at  DATETIME    │
└─────────────────────────────┘
```

> **Note:** AQI and weather data are fetched live from external APIs and cached in-memory (TTLCache). They are not persisted to the database.

---

## CPCB AQI Methodology

The backend implements the **National Air Quality Index (AQI)** as defined by India's [Central Pollution Control Board (CPCB)](https://cpcb.nic.in).

### How It Works

1. **Measure** pollutant concentrations (µg/m³, except CO in mg/m³).
2. **Calculate sub-index** for each pollutant using CPCB breakpoint tables and linear interpolation:

   ```
   Sub-Index = ((I_high - I_low) / (C_high - C_low)) × (C - C_low) + I_low
   ```

3. **Overall AQI** = maximum of all sub-indices.
4. **Categorize** based on the AQI value.

### Breakpoint Tables

#### PM2.5 (µg/m³, 24-hour average)

| AQI Range | Category | Concentration (C_low – C_high) |
|-----------|----------|-------------------------------|
| 0–50 | Good | 0–30 |
| 51–100 | Satisfactory | 31–60 |
| 101–200 | Moderate | 61–90 |
| 201–300 | Poor | 91–120 |
| 301–400 | Very Poor | 121–250 |
| 401–500 | Severe | 251–500 |

#### PM10 (µg/m³, 24-hour average)

| AQI Range | Category | Concentration (C_low – C_high) |
|-----------|----------|-------------------------------|
| 0–50 | Good | 0–50 |
| 51–100 | Satisfactory | 51–100 |
| 101–200 | Moderate | 101–250 |
| 201–300 | Poor | 251–350 |
| 301–400 | Very Poor | 351–430 |
| 401–500 | Severe | 431–600 |

#### NO₂ (µg/m³, 24-hour average)

| AQI Range | Concentration |
|-----------|--------------|
| 0–50 | 0–40 |
| 51–100 | 41–80 |
| 101–200 | 81–180 |
| 201–300 | 181–280 |
| 301–400 | 281–400 |
| 401–500 | 401–1000 |

#### SO₂ (µg/m³, 24-hour average)

| AQI Range | Concentration |
|-----------|--------------|
| 0–50 | 0–40 |
| 51–100 | 41–80 |
| 101–200 | 81–380 |
| 201–300 | 381–800 |
| 301–400 | 801–1600 |
| 401–500 | 1601–2620 |

#### CO (mg/m³, 8-hour average)

| AQI Range | Concentration |
|-----------|--------------|
| 0–50 | 0–1.0 |
| 51–100 | 1.1–2.0 |
| 101–200 | 2.1–10.0 |
| 201–300 | 10.1–17.0 |
| 301–400 | 17.1–34.0 |
| 401–500 | 34.1–50.0 |

#### O₃ (µg/m³, 8-hour average)

| AQI Range | Concentration |
|-----------|--------------|
| 0–50 | 0–50 |
| 51–100 | 51–100 |
| 101–200 | 101–168 |
| 201–300 | 169–208 |
| 301–400 | 209–748 |
| 401–500 | 749–1000 |

### AQI Categories & Health Impact

| AQI Range | Category | Color | Health Impact |
|-----------|----------|-------|---------------|
| 0–50 | Good | 🟢 Green | Minimal impact |
| 51–100 | Satisfactory | 🟡 Yellow | Minor breathing discomfort for sensitive people |
| 101–200 | Moderate | 🟠 Orange | Breathing discomfort for people with lung/heart disease |
| 201–300 | Poor | 🔴 Red | Breathing discomfort on prolonged exposure |
| 301–400 | Very Poor | 🟣 Purple | Respiratory illness on prolonged exposure |
| 401–500 | Severe | 🟤 Maroon | Serious health effects; avoid outdoor activity |

---

## Security Measures

| Measure | Implementation |
|---------|---------------|
| **CORS** | Whitelist of allowed origins; configurable via `CORS_ORIGINS` |
| **Input Validation** | Pydantic models validate all request data |
| **File Upload Security** | Extension whitelist (jpg, jpeg, png, webp), 5 MB size limit |
| **Rate Limiting** | SlowAPI middleware (60 req/min per IP) |
| **SQL Injection Prevention** | SQLModel/SQLAlchemy parameterized queries (no raw SQL) |
| **XSS Prevention** | JSON API responses (no HTML rendering); frontend sanitizes display |
| **Path Traversal Protection** | `Path.name` extracts safe filenames; uploads stored in fixed directory |
| **Error Handling** | Generic error messages in production; no stack traces exposed |
| **Dependency Pinning** | All versions pinned in `requirements.txt` |
| **No Secrets Required** | Open-Meteo APIs are free and keyless — no API keys to leak |

---

## Technology Decisions

| Decision | Rationale |
|----------|-----------|
| **FastAPI** | Async, auto-docs (Swagger/ReDoc), Pydantic validation, modern Python |
| **React + TypeScript** | Type safety, component reuse, large ecosystem |
| **Vite** | Fast HMR, native ES modules, optimal production builds |
| **SQLite → PostgreSQL** | Zero-config dev; easy migration path to production Postgres |
| **Open-Meteo** | Free, no API key, global coverage, hourly granularity |
| **CPCB Standard** | Official Indian government methodology; relevant to target users |
| **Leaflet** | Lightweight, open-source mapping; works with OpenStreetMap tiles |
| **Recharts** | React-native charting; declarative API, responsive |
| **TailwindCSS** | Utility-first; fast prototyping; small production bundle |
| **In-memory cache** | Simple TTLCache avoids API spam; no Redis dependency for hackathon |
