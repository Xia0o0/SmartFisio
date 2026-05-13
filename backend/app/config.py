import os

from dotenv import load_dotenv


load_dotenv()


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://smartfisio:smartfisio@localhost:5432/smartfisio", #talvez tenha que alterar caso não seja o nome do banco, usuário ou senha padrão do postgres
)

SECRET_KEY = os.getenv("SECRET_KEY", "troque-esta-chave-em-producao") #chave API
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")
    if origin.strip()
]
