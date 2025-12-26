import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from dsa_interviewer.api.interview import router as interview_router
from dsa_interviewer.api.auth import router as auth_router
from dsa_interviewer.api.google_auth import router as google_auth_router
from dsa_interviewer.core.config import settings
from starlette.middleware.sessions import SessionMiddleware
from dsa_interviewer.core.database import create_db_and_tables
from dsa_interviewer.models.user import User # Import User to ensure model is registered with Base.metadata

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="DSA Interviewer API",
    on_startup=[create_db_and_tables],
    description="AI-powered technical interview practice system",
    version="1.0.0",
    debug=settings.DEBUG
)

app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview_router, prefix="/api", tags=["interview"])
app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
app.include_router(google_auth_router, prefix="/api/auth/google", tags=["auth"])

@app.get("/health")
async def health_check():
    return JSONResponse({"status": "healthy", "version": "1.0.0"})

@app.get("/")
async def root():
    return {"message": "DSA Interviewer API", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "dsa_interviewer.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
