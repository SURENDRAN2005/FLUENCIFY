from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class UserAuth(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str

class SessionCreate(BaseModel):
    user_id: str
    level: int
    transcript: str
    audio_blob: Optional[str] = None
    feature_vector: Optional[List[float]] = None
    scores: Optional[dict] = None

class SessionResponse(BaseModel):
    fluency_score: float
    disfluency_breakdown: dict
    next_level_unlocked: bool
    recommendation: str
    baseline_comparison: dict
    recovery_improvement: float

class ExerciseGenerateRequest(BaseModel):
    user_id: str
    level: int
    weak_phonemes: List[str]
    speech_metrics: dict

class ExerciseResponse(BaseModel):
    exercise_text: str
    focus_areas: List[str]
    instructions: str

class AssessmentSubmit(BaseModel):
    user_id: str
    scores: dict

class AssessmentResponse(BaseModel):
    assigned_level: int
    fluency_score: float

class UserProfileCreate(BaseModel):
    primary_reason: str
    comfort_level: str
    speaking_frequency: str
    speaking_type: str

class UserProfileResponse(BaseModel):
    id: str
    user_id: str
    primary_reason: str
    comfort_level: str
    speaking_frequency: str
    speaking_type: str
