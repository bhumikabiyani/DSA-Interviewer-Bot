import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from dsa_interviewer.api.interview import router as interview_router
from dsa_interviewer.core.config import settings

logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="DSA Interviewer API",
    description="AI-powered technical interview practice system",
    version="1.0.0",
    debug=settings.DEBUG
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview_router, prefix="/api", tags=["interview"])

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
