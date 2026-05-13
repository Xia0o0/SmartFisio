from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.database import Base, SessionLocal, engine
from app.routers import auth, exercises, sessions, users
from app.seed import seed_initial_data


app = FastAPI(
    title="SmartFisio API",
    version="1.0.0",
    description="Backend simples para cadastro, login, catalogo de exercicios e historico de sessoes.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()


@app.get("/health", tags=["Sistema"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(exercises.router)
app.include_router(sessions.router)
app.include_router(users.router)
