import uuid
from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=80)
    role: str = "IDOSO"
    mobility_level: str | None = "iniciante"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: EmailStr
    role: str
    mobility_level: str | None
    created_at: datetime


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: str | None = Field(default=None, max_length=255)


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None


class ExerciseCreate(BaseModel):
    category_id: uuid.UUID
    name: str = Field(min_length=2, max_length=120)
    level: str = Field(min_length=2, max_length=50)
    description: str = Field(min_length=5, max_length=500)
    video_url: str | None = Field(default=None, max_length=255)
    target_angles: dict[str, Any] = Field(default_factory=dict)
    target_landmarks: dict[str, Any] = Field(default_factory=dict)
    active: bool = True


class ExerciseUpdate(BaseModel):
    category_id: uuid.UUID | None = None
    name: str | None = Field(default=None, min_length=2, max_length=120)
    level: str | None = Field(default=None, min_length=2, max_length=50)
    description: str | None = Field(default=None, min_length=5, max_length=500)
    video_url: str | None = Field(default=None, max_length=255)
    target_angles: dict[str, Any] | None = None
    target_landmarks: dict[str, Any] | None = None
    active: bool | None = None


class ExerciseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category_id: uuid.UUID
    name: str
    level: str
    description: str
    video_url: str | None
    target_angles: dict[str, Any]
    target_landmarks: dict[str, Any]
    active: bool
    category: CategoryOut


class ActivityCreate(BaseModel):
    exercise_id: uuid.UUID
    started_at: datetime | None = None
    finished_at: datetime | None = None
    repetitions: int = Field(default=0, ge=0)
    average_angle: float | None = None
    max_angle: float | None = None
    duration_seconds: int | None = Field(default=None, ge=0)


class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    exercise_id: uuid.UUID
    started_at: datetime
    finished_at: datetime
    repetitions: int
    average_angle: float | None
    max_angle: float | None
    duration_seconds: int


class PostureAlertCreate(BaseModel):
    exercise_id: uuid.UUID
    activity_log_id: uuid.UUID | None = None
    joint: str = Field(min_length=2, max_length=80)
    detected_angle: float
    expected_angle: float


class PostureAlertOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    exercise_id: uuid.UUID
    activity_log_id: uuid.UUID | None
    joint: str
    detected_angle: float
    expected_angle: float
    occurred_at: datetime


class AmplitudePoint(BaseModel):
    activity_id: uuid.UUID
    date: datetime
    exercise_name: str
    max_angle: float | None


class WeeklyRepetitions(BaseModel):
    week_start: date
    total_repetitions: int


class UserStatsOut(BaseModel):
    user_id: uuid.UUID
    exercise_id: uuid.UUID | None
    amplitude_history: list[AmplitudePoint]
    repetitions_by_week: list[WeeklyRepetitions]
