"""
main.py — FastAPI application entry point.
Run with: uvicorn main:app --reload --port 8000
Docs at:  http://localhost:8000/docs
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import upload, statistics, probability, sampling, hypothesis, solutions

app = FastAPI(
    title="Student Analytics API",
    description="Probability of Task Completion Before Deadline & Its Impact on Academic Performance",
    version="1.0.0",
)

# ── CORS ───────────────────────────────────────────────────────────────────────
# Allow all origins in production so any Vercel deployment can connect.
# Set ALLOWED_ORIGIN env var on Render to restrict to your exact Vercel URL.
allowed_origin = os.getenv("ALLOWED_ORIGIN", "*")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[allowed_origin] if allowed_origin != "*" else ["*"],
    allow_credentials=allowed_origin != "*",
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(upload.router)
app.include_router(statistics.router)
app.include_router(probability.router)
app.include_router(sampling.router)
app.include_router(hypothesis.router)
app.include_router(solutions.router)


@app.get("/")
def health():
    return {"status": "ok", "message": "Student Analytics API is running."}
