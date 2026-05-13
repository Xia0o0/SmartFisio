import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import require_admin
from app.database import get_db


router = APIRouter(prefix="/exercises", tags=["Exercicios"])


@router.get("/categories", response_model=list[schemas.CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[models.Category]:
    return db.query(models.Category).order_by(models.Category.name).all()


@router.post(
    "/categories",
    response_model=schemas.CategoryOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_admin)],
)
def create_category(payload: schemas.CategoryCreate, db: Session = Depends(get_db)) -> models.Category:
    existing = db.query(models.Category).filter(models.Category.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Categoria ja existe.")

    category = models.Category(name=payload.name, description=payload.description)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.get("", response_model=list[schemas.ExerciseOut])
def list_exercises(
    category: str | None = None,
    level: str | None = None,
    db: Session = Depends(get_db),
) -> list[models.Exercise]:
    query = db.query(models.Exercise).join(models.Category).filter(models.Exercise.active.is_(True))

    if category:
        query = query.filter(models.Category.name.ilike(f"%{category}%"))
    if level:
        query = query.filter(models.Exercise.level.ilike(f"%{level}%"))

    return query.order_by(models.Exercise.name).all()


@router.get("/{exercise_id}", response_model=schemas.ExerciseOut)
def get_exercise(exercise_id: uuid.UUID, db: Session = Depends(get_db)) -> models.Exercise:
    exercise = db.get(models.Exercise, exercise_id)
    if not exercise or not exercise.active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercicio nao encontrado.")
    return exercise


@router.post("", response_model=schemas.ExerciseOut, status_code=status.HTTP_201_CREATED)
def create_exercise(
    payload: schemas.ExerciseCreate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
) -> models.Exercise:
    category = db.get(models.Category, payload.category_id)
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria nao encontrada.")

    exercise = models.Exercise(**payload.model_dump())
    db.add(exercise)
    db.commit()
    db.refresh(exercise)
    return exercise


@router.put("/{exercise_id}", response_model=schemas.ExerciseOut)
def update_exercise(
    exercise_id: uuid.UUID,
    payload: schemas.ExerciseUpdate,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
) -> models.Exercise:
    exercise = db.get(models.Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercicio nao encontrado.")

    data = payload.model_dump(exclude_unset=True)
    if "category_id" in data and not db.get(models.Category, data["category_id"]):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoria nao encontrada.")

    for field, value in data.items():
        setattr(exercise, field, value)

    db.commit()
    db.refresh(exercise)
    return exercise


@router.delete("/{exercise_id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_exercise(
    exercise_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: models.User = Depends(require_admin),
) -> None:
    exercise = db.get(models.Exercise, exercise_id)
    if not exercise:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercicio nao encontrado.")

    exercise.active = False
    db.commit()
