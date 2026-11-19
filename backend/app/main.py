"""
BreatheCity AI Backend – FastAPI Application.
Integrates live Open-Meteo air quality and weather data, computes Indian CPCB AQI,
serves smart rule-based AI recommendations, handles citizen pollution reports,
supports city comparisons, hotspot analysis, and geocoding.
"""
import os
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, UploadFile, File, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from . import db
from .routers import aqi, forecast, assistant, report, comparison, geocode, hotspot

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("breathecity.main")

# Rate Limiter setup
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])

app = FastAPI(
    title="BreatheCity AI Backend",
    description="Intelligent Urban Air Quality Assistant API with CPCB AQI, Hotspot Detection, and AI Recommendations",
    version="1.0.0",
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers with /api prefix
app.include_router(aqi.router, prefix="/api")
app.include_router(forecast.router, prefix="/api")
app.include_router(assistant.router, prefix="/api")
app.include_router(report.router, prefix="/api")
app.include_router(comparison.router, prefix="/api")
app.include_router(geocode.router, prefix="/api")
app.include_router(hotspot.router, prefix="/api")

# Also alias legacy /aqi without prefix for backwards compatibility
app.include_router(aqi.router)


# Health check endpoint
@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "BreatheCity AI Backend",
        "version": "1.0.0",
        "aqi_standard": "CPCB India National AQI",
    }


# Startup: initialize database
@app.on_event("startup")
def on_startup():
    logger.info("Initializing BreatheCity database...")
    db.init_db()
    logger.info("Database initialized successfully.")


# File upload configuration
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


def validate_upload(file: UploadFile):
    filename = file.filename or ""
    ext = filename.split(".")[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file extension .{ext}. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )
    if file.content_type and file.content_type.lower() not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid MIME type: {file.content_type}. Only images (JPEG, PNG, WebP) are allowed.",
        )


@app.post("/upload", tags=["Utility"])
@app.post("/api/upload", tags=["Utility"])
async def upload_file(file: UploadFile = File(...)):
    validate_upload(file)
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large ({len(contents)} bytes). Maximum allowed size is 5 MB.",
        )
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file cannot be uploaded.")

    # Sanitize filename with unique suffix to prevent collisions and directory traversal
    import uuid
    import re
    raw_name = Path(file.filename or "photo.jpg").name
    safe_base = re.sub(r"[^a-zA-Z0-9_\-\.]", "_", raw_name)
    unique_name = f"{uuid.uuid4().hex[:8]}_{safe_base}"
    destination = UPLOAD_DIR / unique_name

    with open(destination, "wb") as f:
        f.write(contents)

    logger.info("File uploaded safely: %s (%d bytes)", unique_name, len(contents))
    return {
        "filename": unique_name,
        "url": f"/uploads/{unique_name}",
        "size_bytes": len(contents),
    }


# Mount uploaded files static directory
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Mount built frontend SPA if available
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    from fastapi.responses import FileResponse
    assets_dir = FRONTEND_DIST / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend_assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Never intercept API, health, docs, or upload endpoints
        api_prefixes = ("api", "uploads", "health", "docs", "redoc", "openapi.json")
        first_segment = full_path.split("/")[0] if full_path else ""
        if first_segment in api_prefixes:
            raise HTTPException(status_code=404, detail="API route not found")
        target_file = FRONTEND_DIST / full_path
        if target_file.exists() and target_file.is_file():
            return FileResponse(target_file)
        index_html = FRONTEND_DIST / "index.html"
        if index_html.exists():
            return FileResponse(index_html)
        raise HTTPException(status_code=404, detail="Frontend build index.html not found.")

