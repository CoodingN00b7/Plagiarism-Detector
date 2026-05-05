from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.api.routes import router
from backend.utils.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name, version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix=settings.api_prefix, tags=["Plagiarism"])


@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "environment": settings.app_env,
        "api_prefix": settings.api_prefix,
        "status": "running",
    }
