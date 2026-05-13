import uuid
from collections import defaultdict
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import ADMIN_ROLES, get_current_user, require_admin
from app.database import get_db


router = APIRouter(prefix="/users", tags=["Usuarios"])


def can_access_user_data(target_user_id: uuid.UUID, current_user: models.User) -> bool:
    return current_user.id == target_user_id or current_user.role.upper() in ADMIN_ROLES


@router.get("", response_model=list[schemas.UserOut], dependencies=[Depends(require_admin)])
def list_users(db: Session = Depends(get_db)) -> list[models.User]:
    return db.query(models.User).order_by(models.User.name).all()


@router.get("/{user_id}/stats", response_model=schemas.UserStatsOut)
def get_user_stats(
    user_id: uuid.UUID,
    exercise_id: uuid.UUID | None = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.UserStatsOut:
    if not can_access_user_data(user_id, current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Voce so pode visualizar seus proprios dados.",
        )

    user = db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario nao encontrado.")

    query = db.query(models.ActivityLog).join(models.Exercise).filter(models.ActivityLog.user_id == user_id)
    if exercise_id:
        query = query.filter(models.ActivityLog.exercise_id == exercise_id)

    activity_logs = query.order_by(models.ActivityLog.started_at).all()

    amplitude_history = [
        schemas.AmplitudePoint(
            activity_id=log.id,
            date=log.started_at,
            exercise_name=log.exercise.name,
            max_angle=log.max_angle,
        )
        for log in activity_logs
    ]

    repetitions_by_week: dict = defaultdict(int)
    for log in activity_logs:
        session_date = log.started_at.date()
        week_start = session_date - timedelta(days=session_date.weekday())
        repetitions_by_week[week_start] += log.repetitions

    weekly_points = [
        schemas.WeeklyRepetitions(week_start=week_start, total_repetitions=total)
        for week_start, total in sorted(repetitions_by_week.items())
    ]

    return schemas.UserStatsOut(
        user_id=user_id,
        exercise_id=exercise_id,
        amplitude_history=amplitude_history,
        repetitions_by_week=weekly_points,
    )
