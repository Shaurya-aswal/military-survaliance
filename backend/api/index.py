"""
Vercel Serverless Function Entry Point
Database-only version without ML models (too large for serverless)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from bson import ObjectId
import os

app = FastAPI(
    title="Military Surveillance API",
    description="Database API (ML models run locally)",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
mongo_client = AsyncIOMotorClient(MONGO_URL)
db = mongo_client.military_surveillance

@app.get("/")
async def root():
    return {
        "message": "Military Surveillance API (Vercel)",
        "status": "online",
        "version": "1.0.0",
        "deployment": "serverless",
        "note": "ML models not available. Run locally for image/video analysis."
    }

@app.get("/health")
async def health():
    try:
        await mongo_client.admin.command('ping')
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return {
        "status": "ok",
        "database": db_status,
        "device": "n/a (serverless)",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/db/analyses")
async def get_analyses():
    try:
        analyses = await db.analyses.find().sort("timestamp", -1).to_list(100)
        for analysis in analyses:
            analysis["_id"] = str(analysis["_id"])
        return {"analyses": analyses}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/db/activity-logs")
async def get_activity_logs():
    try:
        logs = await db.activity_logs.find().sort("timestamp", -1).to_list(100)
        for log in logs:
            log["_id"] = str(log["_id"])
        return {"logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/db/analyses")
async def save_analysis(data: dict):
    try:
        result = await db.analyses.insert_one(data)
        return {"id": str(result.inserted_id), "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/db/activity-logs")
async def save_activity_log(data: dict):
    try:
        result = await db.activity_logs.insert_one(data)
        return {"id": str(result.inserted_id), "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/db/analyses/{analysis_id}")
async def delete_analysis(analysis_id: str):
    try:
        result = await db.analyses.delete_one({"_id": ObjectId(analysis_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Analysis not found")
        return {"success": True, "deleted_count": result.deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/db/analyses")
async def clear_all_analyses():
    try:
        result = await db.analyses.delete_many({})
        return {"success": True, "deleted_count": result.deleted_count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ML endpoints return 503 - must run backend locally
@app.post("/detect/pipeline")
async def pipeline_unavailable():
    raise HTTPException(
        status_code=503,
        detail="ML inference not available in serverless deployment. Run backend locally for image analysis."
    )

@app.post("/detect/video")
async def video_unavailable():
    raise HTTPException(
        status_code=503,
        detail="Video processing not available in serverless deployment. Run backend locally for video analysis."
    )

# Vercel handler
handler = app
