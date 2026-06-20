from sqlalchemy.orm import Session

from app import models

def seed_initial_data(db: Session) -> None:
    if db.query(models.Category).count() > 0:
        return

    mobilidade = models.Category(
        name="Mobilidade",
        description="Exercicios leves para melhorar movimento e flexibilidade.",
    )
    fortalecimento = models.Category(
        name="Fortalecimento",
        description="Exercicios de baixo impacto para ganho de forca.",
    )
    equilibrio = models.Category(
        name="Equilibrio",
        description="Exercicios para estabilidade e seguranca ao caminhar.",
    )

    db.add_all([mobilidade, fortalecimento, equilibrio])
    db.flush()

    db.add_all(
        [
            models.Exercise(
                category_id=mobilidade.id,
                name="Alongamento de Ombros",
                level="iniciante",
                description="Elevar os bracos devagar ate a altura indicada e retornar.",
                target_angles={"joint": "ombro", "min": 70, "max": 160, "tolerance": 15},
                target_landmarks={"proximal": 12, "joint": 14, "distal": 16},
            ),
            models.Exercise(
                category_id=fortalecimento.id,
                name="Elevacao de Joelho Sentado",
                level="iniciante",
                description="Sentado, elevar um joelho por vez mantendo o tronco estavel.",
                target_angles={"joint": "quadril", "min": 65, "max": 110, "tolerance": 12},
                target_landmarks={"proximal": 12, "joint": 24, "distal": 26},
            ),
            models.Exercise(
                category_id=equilibrio.id,
                name="Equilibrio com Apoio",
                level="iniciante",
                description="Ficar em pe com apoio lateral e manter a postura pelo tempo indicado.",
                target_angles={"joint": "tronco", "min": 80, "max": 100, "tolerance": 10},
                target_landmarks={"proximal": 11, "joint": 23, "distal": 25},
            ),
        ]
    )
    db.commit()
