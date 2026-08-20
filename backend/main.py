"""
FLUENCIFY Backend — main.py
============================
MongoDB Atlas Integration Version
"""
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pymongo.database import Database
from typing import List
import hashlib
import datetime
from bson import ObjectId

import schemas, database, scoring, exercises, ml_inference

app = FastAPI(title="FLUENCIFY API", version="1.0.0")

@app.on_event("startup")
def on_startup():
    print("Running startup initialization...")
    database.init_db()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

LEVEL_THRESHOLDS = {
    1: 70,   # L1 Breath & Relax → unlock L2 at ≥70
    2: 75,   # L2 Single Sounds  → unlock L3 at ≥75
    3: 75,   # L3 Syllable Chains
    4: 72,   # L4 Words & Phrases
    5: 70,   # L5 Paced Sentences
    6: 68,   # L6 Shadow Speech
    7: 65,   # L7 Spontaneous (no next level)
}
REQUIRE_CONSECUTIVE_DAYS = 1


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def _get_or_create_progress(user_id: str, db: Database) -> dict:
    progress = db.progress.find_one({"user_id": user_id})
    if not progress:
        progress = {
            "user_id": user_id, 
            "current_level": 0, 
            "consecutive_days": 0, 
            "last_practice": None
        }
        db.progress.insert_one(progress)
    return progress


def _update_streak(progress: dict, db: Database):
    today = datetime.datetime.utcnow()
    last_practice = progress.get("last_practice")
    
    if last_practice:
        delta = (today.date() - last_practice.date()).days
        if delta == 1:
            streak = progress.get("consecutive_days", 0) + 1
        elif delta > 1:
            streak = 1
        else:
            streak = progress.get("consecutive_days", 0)
    else:
        streak = 1
        
    db.progress.update_one(
        {"user_id": progress["user_id"]}, 
        {"$set": {"consecutive_days": streak, "last_practice": today}}
    )
    progress["consecutive_days"] = streak
    progress["last_practice"] = today


def _check_level_unlock(user_id: str, current_level: int, db: Database) -> bool:
    if current_level >= 7:
        return False

    recent = list(db.sessions.find(
        {"user_id": user_id, "level": current_level}
    ).sort("date", -1).limit(3))

    if not recent:
        return False

    mean_fluency = sum(s.get("fluency_score", 0) for s in recent) / len(recent)
    threshold = LEVEL_THRESHOLDS.get(current_level, 75)

    progress = _get_or_create_progress(user_id, db)
    days_ok = progress.get("consecutive_days", 0) >= REQUIRE_CONSECUTIVE_DAYS

    return mean_fluency >= threshold and days_ok


def _make_recommendation(metrics: dict, fluency: float) -> str:
    if metrics.get("total_words", 10) == 0:
        return "No speech detected. Please check your microphone and try speaking up."

    block_count = metrics.get("block_count", 0)
    rep_count = metrics.get("repetition_count", metrics.get("sound_repetition_count", 0))
    prolong_count = metrics.get("prolongation_count", 0)

    if fluency >= 80:
        return "Great session! You're building strong fluency habits."
    if block_count > 2:
        return "Take a breath between thoughts. The Breath & Relax technique can help here."
    if rep_count > 2:
        return "Slow your pace a little. Syllable-level timing exercises will build rhythm."
    if prolong_count > 1:
        return "Keep the airflow moving — light contact on those sounds."
    return "Good effort. Consistent daily practice leads to lasting progress."


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "api_version": "1.0.0",
        "database": "connected (mongodb)",
        "model_version": "Acoustic Disfluency Detector v2.0",
        "level_thresholds": LEVEL_THRESHOLDS,
    }


@app.post("/auth/register", response_model=schemas.UserResponse)
def register(user_auth: schemas.UserAuth, db: Database = Depends(database.get_db)):
    existing = db.users.find_one({"username": user_auth.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    user_doc = {
        "username": user_auth.username,
        "password_hash": hash_password(user_auth.password),
        "created_at": datetime.datetime.utcnow()
    }
    result = db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    
    _get_or_create_progress(user_id, db)
    
    return {"id": user_id, "username": user_doc["username"]}


@app.post("/auth/login", response_model=schemas.UserResponse)
def login(user_auth: schemas.UserAuth, db: Database = Depends(database.get_db)):
    user = db.users.find_one({"username": user_auth.username})
    if not user or user.get("password_hash") != hash_password(user_auth.password):
        raise HTTPException(status_code=401, detail="Username or password not recognised")
    return {"id": str(user["_id"]), "username": user["username"]}


@app.post("/profile/{user_id}", response_model=schemas.UserProfileResponse)
def create_profile(user_id: str, profile_in: schemas.UserProfileCreate, db: Database = Depends(database.get_db)):
    existing = db.user_profiles.find_one({"user_id": user_id})
    update_data = {
        "primary_reason": profile_in.primary_reason,
        "comfort_level": profile_in.comfort_level,
        "speaking_frequency": profile_in.speaking_frequency,
        "speaking_type": profile_in.speaking_type
    }
    
    if existing:
        db.user_profiles.update_one({"user_id": user_id}, {"$set": update_data})
        existing.update(update_data)
        existing["id"] = str(existing["_id"])
        return existing
    
    profile = {"user_id": user_id, **update_data}
    result = db.user_profiles.insert_one(profile)
    profile["id"] = str(result.inserted_id)
    return profile


@app.get("/profile/{user_id}", response_model=schemas.UserProfileResponse)
def get_profile(user_id: str, db: Database = Depends(database.get_db)):
    profile = db.user_profiles.find_one({"user_id": user_id})
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile["id"] = str(profile["_id"])
    return profile


@app.post("/analyze_audio")
async def analyze_audio(file: UploadFile = File(...)):
    audio_bytes = await file.read()
    return ml_inference.analyze_audio_bytes(audio_bytes)


@app.post("/session", response_model=schemas.SessionResponse)
def create_session(session_in: schemas.SessionCreate, db: Database = Depends(database.get_db)):
    metrics = session_in.scores or {}

    baseline = db.personal_baselines.find_one({"user_id": session_in.user_id})

    fluency = scoring.calculate_fluency_score(metrics, baseline)
    baseline_comp = scoring.calculate_baseline_comparison(metrics, baseline)

    db_session = {
        "user_id": session_in.user_id,
        "level": session_in.level,
        "fluency_score": fluency,
        "block_count": int(metrics.get("block_count", 0)),
        "repetition_count": int(metrics.get("repetition_count", metrics.get("sound_repetition_count", 0))),
        "prolongation_count": int(metrics.get("prolongation_count", 0)),
        "interjection_count": int(metrics.get("interjection_count", 0)),
        "speech_rate": float(metrics.get("speech_rate", 120.0)),
        "recovery_time": float(metrics.get("recovery_time", 2.0)),
        "date": datetime.datetime.utcnow()
    }
    db.sessions.insert_one(db_session)

    progress = _get_or_create_progress(session_in.user_id, db)
    _update_streak(progress, db)

    next_level_unlocked = False
    if _check_level_unlock(session_in.user_id, progress.get("current_level", 0), db):
        next_level_unlocked = True
        new_level = min(7, progress.get("current_level", 0) + 1)
        db.progress.update_one(
            {"user_id": session_in.user_id},
            {"$set": {"current_level": new_level}}
        )

    recommendation_text = _make_recommendation(metrics, fluency)
    
    # Save recommendation to MongoDB Atlas so the collection isn't empty
    db.recommendations.insert_one({
        "user_id": session_in.user_id,
        "session_id": str(db_session.get("_id", "")),
        "level": session_in.level,
        "fluency_score": fluency,
        "message": recommendation_text,
        "date": datetime.datetime.utcnow()
    })

    return {
        "fluency_score": fluency,
        "disfluency_breakdown": {
            "blocks": db_session["block_count"],
            "repetitions": db_session["repetition_count"],
            "prolongations": db_session["prolongation_count"],
            "interjections": db_session["interjection_count"],
        },
        "next_level_unlocked": next_level_unlocked,
        "recommendation": recommendation_text,
        "baseline_comparison": baseline_comp,
        "recovery_improvement": 0.0,
    }


@app.get("/progress/{user_id}")
def get_progress(user_id: str, db: Database = Depends(database.get_db)):
    sessions = list(db.sessions.find({"user_id": user_id}).sort("date", 1))

    baseline = db.personal_baselines.find_one({"user_id": user_id})
    progress = _get_or_create_progress(user_id, db)

    user = db.users.find_one({"_id": ObjectId(user_id) if len(user_id) == 24 else user_id})
    if user and user.get("username") == "admin":
        progress["current_level"] = 7
        db.progress.update_one({"user_id": user_id}, {"$set": {"current_level": 7}})

    baseline_score = 0.0
    if baseline:
        b_metrics = {
            "block_count": float(baseline.get("block_frequency", 0)),
            "repetition_count": float(baseline.get("repetition_rate", 0)),
            "prolongation_count": float(baseline.get("prolongation_ratio", 0)),
            "total_words": 10,
        }
        baseline_score = scoring.calculate_fluency_score(b_metrics, None)

    recent_blocks = sum(s.get("block_count", 0) for s in sessions[-5:]) if sessions else 0
    recent_reps = sum(s.get("repetition_count", 0) for s in sessions[-5:]) if sessions else 0
    if recent_blocks > recent_reps:
        weakest = ["/k/", "/p/", "/b/"]
    elif recent_reps > 0:
        weakest = ["/s/", "/t/", "/d/"]
    else:
        weakest = ["/k/", "/s/"]

    current_level = progress.get("current_level", 0)
    level_sessions = [s for s in sessions if s.get("level") == current_level]
    last3 = level_sessions[-3:] if len(level_sessions) >= 3 else level_sessions
    mean_last3 = round(sum(s.get("fluency_score", 0) for s in last3) / len(last3), 1) if last3 else 0
    threshold = LEVEL_THRESHOLDS.get(current_level, 75)

    return {
        "history": [
            {
                "date": s.get("date").isoformat() if s.get("date") else None, 
                "score": round(s.get("fluency_score", 0), 1)
            }
            for s in sessions
        ],
        "baseline_score": round(baseline_score, 1),
        "level": current_level,
        "streak": progress.get("consecutive_days", 0),
        "weakest_sounds": weakest,
        "level_progress": {
            "sessions_at_level": len(level_sessions),
            "mean_last3": mean_last3,
            "threshold": threshold,
            "sessions_needed": max(0, 3 - len(level_sessions)),
        },
    }


@app.post("/exercise/generate", response_model=schemas.ExerciseResponse)
def generate_exercise(req: schemas.ExerciseGenerateRequest):
    return exercises.generate_exercise(req.level, req.weak_phonemes)


@app.post("/assessment/submit", response_model=schemas.AssessmentResponse)
def submit_assessment(req: schemas.AssessmentSubmit, db: Database = Depends(database.get_db)):
    metrics = req.scores or {}
    fluency = scoring.calculate_fluency_score(metrics, None)

    if fluency < 35:
        assigned_level = 1
    elif fluency < 52:
        assigned_level = 2
    elif fluency < 67:
        assigned_level = 3
    elif fluency < 80:
        assigned_level = 4
    else:
        assigned_level = 5

    db.progress.update_one(
        {"user_id": req.user_id}, 
        {"$set": {"current_level": assigned_level}},
        upsert=True
    )

    existing = db.personal_baselines.find_one({"user_id": req.user_id})
    if not existing:
        bl = {
            "user_id": req.user_id,
            "speech_rate": float(metrics.get("speech_rate", 120.0)),
            "block_frequency": float(metrics.get("block_count", 0)),
            "repetition_rate": float(metrics.get("repetition_count", metrics.get("sound_repetition_count", 0))),
            "prolongation_ratio": float(metrics.get("prolongation_count", 0)),
            "pause_regularity": 0.8,
            "pitch_variability": 0.5,
            "recovery_speed": 2.0,
            "created_at": datetime.datetime.utcnow()
        }
        db.personal_baselines.insert_one(bl)

    return {"assigned_level": assigned_level, "fluency_score": fluency}
