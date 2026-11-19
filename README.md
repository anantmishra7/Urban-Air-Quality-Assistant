# BreatheCity AI

**Urban Air Quality Assistant**

A full‑stack application that provides live air‑quality data, forecasts, an AI‑driven assistant, pollution‑hotspot mapping, reporting, and city comparison.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Data Sources](#data-sources)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Testing](#testing)
- [Deployment](#deployment)
- [Limitations & Future Work](#limitations--future-work)
- [License](#license)

---

## Project Overview
BreatheCity AI is an intelligent urban‑air‑quality dashboard designed for the Hack2Skill **Challenge 6 – Urban Air Quality Assistant**. It aggregates live pollutant measurements, weather, and forecasts from open APIs, computes the Indian CPCB AQI, and offers context‑aware health recommendations via a rule‑based AI assistant. Users can explore city‑wide pollution maps, report local observations, and compare multiple locations.

---

## Problem Statement
Provide a reliable, transparent, and user‑friendly tool that helps citizens understand the air they breathe, make informed decisions about outdoor activities, and report pollution issues. The solution must use **real open‑source data**, respect privacy and security, and be demonstrable in a hackathon setting.

---

## Solution
The application consists of:
1. **FastAPI backend** – fetches live data, computes CPCB AQI, stores user reports, and serves REST endpoints.
2. **React + TypeScript frontend** – premium dashboard with charts, maps, AI‑assistant chat, and reporting UI.
3. **SQLite database** – persists user‑submitted reports and cached API responses.
4. **Automated tests** – unit, integration, and end‑to‑end coverage for core flows.

---

## Features
- Professional dashboard with city search, live AQI, pollutant breakdown, weather, timestamp, and source attribution
- CPCB Indian AQI calculation (breakpoints & sub‑index)
- Live data integration: Open‑Meteo Air‑Quality & Weather APIs, Open‑Meteo Geocoding
- Rule‑based AI assistant (fallback when LLM unavailable)
- Hourly/daily forecast (when API provides it)
- Pollution hotspot map (OpenStreetMap + Leaflet)
- Report submission (photo upload, validation, status view)
- City comparison view
- Security hardening (CORS, input validation, file size/type limits)
- Comprehensive test suite (pytest + Playwright)

---

## Technology Stack
| Layer | Technology |
|-------|------------|
| Backend | Python 3.11, FastAPI, httpx, pydantic, python‑dotenv, SQLite |
| Frontend | React 18, TypeScript, Vite, Recharts, Leaflet, TailwindCSS |
| Testing | pytest, httpx‑testclient, Playwright (e2e) |
| CI/CD | GitHub Actions (lint, test, build) |

---

## Architecture
```
┌─────────────────────┐      ┌─────────────────────┐
│  Frontend (React)   │ <--► │  Backend (FastAPI)  │
│  - UI components    │      │  - /aqi, /forecast  │
│  - Charting (Recharts)│    │  - /assistant       │
│  - Map (Leaflet)    │      │  - /report          │
└─────────────────────┘      └─────────────────────┘
        │                              │
        ▼                              ▼
   Open‑Meteo APIs               SQLite DB
   (AQI, Weather, Geo)          (reports, cache)
```

---

## Data Sources
- **Open‑Meteo Air‑Quality API** – real‑time pollutant concentrations (PM2.5, PM10, CO, NO2, SO2, O3)
- **Open‑Meteo Weather API** – temperature, humidity, wind speed
- **Open‑Meteo Geocoding** – city → latitude/longitude
- **CPCB AQI Breakpoints** – official Indian AQI calculation methodology (implemented locally)

---

## Installation
```bash
# Clone repository
git clone https://github.com/your‑username/breathecity-ai.git
cd breathecity-ai

# Backend setup
cd backend
python -m venv venv
venv\\Scripts\\activate   # Windows PowerShell
pip install -r requirements.txt
cp .env.example .env      # No secrets required for Open‑Meteo

# Frontend setup
cd ../frontend
npm install               # Vite + React
```

---

## Running Locally
```bash
# Backend (development)
cd backend
uvicorn app.main:app --reload
# Frontend (development)
cd ../frontend
npm run dev
```
Open `http://localhost:5173` in a browser.

---

## Testing
```bash
# Backend unit tests
cd backend
pytest
# Frontend unit + e2e tests
cd ../frontend
npm run test          # jest/unit
npm run test:e2e      # playwright
```
All tests must pass before submission.

---

## Deployment
The app can be deployed as two independent services:
- **Backend** – any container platform (Docker, Cloud Run, Railway). See `backend/Dockerfile`.
- **Frontend** – static hosting (Netlify, Vercel, GitHub Pages). Build with `npm run build` and serve the `dist/` folder.
Detailed steps are in `DEPLOYMENT.md`.

---

## Limitations & Future Work
- Forecast data depends on Open‑Meteo availability; missing forecasts are shown as “unavailable”.
- AI assistant is rule‑based; integration with a real LLM is planned.
- Map heat‑map clustering is currently static; dynamic heat‑maps will be added later.
- International AQI standards other than CPCB are not supported yet.

---

## License
MIT – free to use, modify, and distribute.

