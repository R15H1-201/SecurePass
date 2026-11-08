import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.routes.health import router as health_router
from backend.routes.password import router as password_router

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title="SecurePass API",
    description="Password Security Analyzer API",
    version="1.0.0",
)

# Local development uses Live Server. Production serves the frontend and API
# from the same origin, so browser requests do not require cross-origin access.
allowed_origins = os.getenv(
    "FRONTEND_ORIGINS",
    "http://127.0.0.1:5500,http://localhost:5500",
).split(",")
allowed_origins = [origin.strip() for origin in allowed_origins if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# Register API routes before the frontend mount so API and documentation
# endpoints are not swallowed by StaticFiles.
app.include_router(health_router)
app.include_router(password_router)

@app.get("/api", include_in_schema=False)
def api_home():
    return {
        "message": "Welcome to SecurePass API!",
        "status": "Running",
        "project": "SecurePass",
    }

# Vercel deploys this FastAPI app as the application entrypoint. The frontend
# is served from the same domain, while password settings remain an API route.
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")
