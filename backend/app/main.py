import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.analysis import router as analysis_router
from app.routes.inspect import router as inspect_router

load_dotenv()

app = FastAPI(title="Video Opportunity Analyzer API")

raw_origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis_router)
app.include_router(inspect_router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "video-opportunity-analyzer"}

