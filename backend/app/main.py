"""
BreatheCity AI Backend – FastAPI Application.
Integrates live Open-Meteo air quality and weather data, computes Indian CPCB AQI,
serves smart rule-based AI recommendations, handles citizen pollution reports,
supports city comparisons, hotspot analysis, and geocoding.
"""

import logging
import os
import re
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from . import db
from .routers import aqi, assistant, comparison, forecast, geocode, hotspot, report

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("breathecity.main")

# Rate Limiter setup
limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])


@asynccontextmanager
async def lifespan(application: FastAPI):
    """Application lifespan: initialize resources on startup."""
    logger.info("Initializing BreatheCity database...")
    db.init_db()
    logger.info("Database initialized successfully.")
    yield


app = FastAPI(
    title="BreatheCity AI Backend",
    description="Intelligent Urban Air Quality Assistant API with CPCB AQI, Hotspot Detection, and AI Recommendations",
    version="1.0.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration – secure environment-based trusted origins
_default_origins = (
    "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000"
)
origins = [
    o.strip() for o in os.environ.get("CORS_ORIGINS", _default_origins).split(",") if o.strip()
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


# File upload configuration
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
CHUNK_SIZE = 8192  # 8 KB chunks for streaming read

# Magic byte signatures for image validation
IMAGE_SIGNATURES = {
    b"\xff\xd8\xff": "image/jpeg",
    b"\x89PNG\r\n\x1a\n": "image/png",
}


def _check_webp_signature(header: bytes) -> bool:
    """Check for WebP RIFF...WEBP signature."""
    return len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WEBP"


def validate_magic_bytes(header: bytes) -> bool:
    """Verify file content matches an allowed image format via magic bytes."""
    for sig in IMAGE_SIGNATURES:
        if header.startswith(sig):
            return True
    return _check_webp_signature(header)


def validate_upload_metadata(file: UploadFile) -> str:
    """Validate file extension and MIME type. Returns the extension."""
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
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
    return ext


@app.post("/api/upload", tags=["Utility"])
async def upload_file(file: UploadFile = File(...)):
    validate_upload_metadata(file)

    # Stream-read file in chunks to enforce size limit safely without excessive memory consumption
    chunks: list[bytes] = []
    total_size = 0
    while True:
        chunk = await file.read(CHUNK_SIZE)
        if not chunk:
            break
        total_size += len(chunk)
        if total_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="File too large. Maximum allowed size is 5 MB.",
            )
        chunks.append(chunk)

    contents = b"".join(chunks)
    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Empty file cannot be uploaded.")

    # Verify actual file signature via magic bytes
    if not validate_magic_bytes(contents[:12]):
        raise HTTPException(
            status_code=400,
            detail="File content does not match a valid image signature. Please upload an authentic JPEG, PNG, or WebP image.",
        )

    # Sanitize filename: strip path components, prevent path traversal, add unique prefix
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
