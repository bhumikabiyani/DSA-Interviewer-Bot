from fastapi import FastAPI
from app.api.interview import router as interview_router

app = FastAPI(title="DSA Interviewer Backend")

app.include_router(interview_router, prefix="/api")
