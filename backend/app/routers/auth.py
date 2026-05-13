from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import models, schemas
from app.auth import create_access_token, get_current_user, hash_password, normalize_role, verify_password
from app.database import get_db


router = APIRouter(prefix="/auth", tags=["Autenticacao"])


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: schemas.UserCreate, db: Session = Depends(get_db)) -> models.User:
    email = payload.email.lower()
    existing_user = db.query(models.User).filter(models.User.email == email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este e-mail ja esta cadastrado.",
        )

    user = models.User(
        name=payload.name,
        email=email,
        hashed_password=hash_password(payload.password),
        role=normalize_role(payload.role),
        mobility_level=payload.mobility_level,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)) -> schemas.TokenOut:
    user = db.query(models.User).filter(models.User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha invalidos.",
        )

    token = create_access_token({"sub": str(user.id), "role": user.role})
    return schemas.TokenOut(access_token=token, user=user)


@router.get("/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(get_current_user)) -> models.User:
    return current_user
