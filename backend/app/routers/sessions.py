import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import get_current_user
from app.database import get_db


router = APIRouter(prefix="/sessions", tags=["Sessoes"])


@router.post("", response_model=schemas.ActivityOut, status_code=status.HTTP_201_CREATED)
def create_activity_log(
    payload: schemas.ActivityCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.ActivityLog:
    exercise = db.get(models.Exercise, payload.exercise_id)
    if not exercise or not exercise.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercicio nao encontrado.")

    started_at = payload.started_at or datetime.now(timezone.utc)
    finished_at = payload.finished_at or datetime.now(timezone.utc)
    duration_seconds = payload.duration_seconds
    if duration_seconds is None:
        duration_seconds = max(0, int((finished_at - started_at).total_seconds()))

    activity_log = models.ActivityLog(
        user_id=current_user.id,
        exercise_id=payload.exercise_id,
        started_at=started_at,
        finished_at=finished_at,
        repetitions=payload.repetitions,
        average_angle=payload.average_angle,
        max_angle=payload.max_angle,
        duration_seconds=duration_seconds,
    )
    db.add(activity_log)
    db.commit()
    db.refresh(activity_log)
    return activity_log


@router.get("/history", response_model=list[schemas.ActivityOut])
def get_my_history(
    exercise_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> list[models.ActivityLog]:
    query = db.query(models.ActivityLog).filter(models.ActivityLog.user_id == current_user.id)
    if exercise_id:
        query = query.filter(models.ActivityLog.exercise_id == exercise_id)

    return query.order_by(models.ActivityLog.started_at.desc()).all()


@router.post("/alerts", response_model=schemas.PostureAlertOut, status_code=status.HTTP_201_CREATED)
def create_posture_alert(
    payload: schemas.PostureAlertCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.PostureAlert:
    exercise = db.get(models.Exercise, payload.exercise_id)
    if not exercise or not exercise.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercicio nao encontrado.")

    if payload.activity_log_id:
        activity_log = db.get(models.ActivityLog, payload.activity_log_id)
        if not activity_log or activity_log.user_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sessao nao encontrada.")

    alert = models.PostureAlert(
        user_id=current_user.id,
        exercise_id=payload.exercise_id,
        activity_log_id=payload.activity_log_id,
        joint=payload.joint,
        detected_angle=payload.detected_angle,
        expected_angle=payload.expected_angle,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert
