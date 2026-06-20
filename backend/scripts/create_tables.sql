-- =====================================================
-- SmartFisio - Script de Criação de Tabelas (PostgreSQL)
-- =====================================================
-- Este script cria todas as tabelas necessárias para o
-- funcionamento do sistema SmartFisio.
--
-- NOTA: As tabelas são criadas automaticamente pelo ORM
-- (SQLAlchemy) ao iniciar o backend. Este script serve
-- como referência e documentação do esquema do banco.
--
-- Pré-requisito: Criar o banco e o usuário:
--   CREATE USER smartfisio WITH PASSWORD 'smartfisio';
--   CREATE DATABASE smartfisio OWNER smartfisio;
-- =====================================================

-- Habilitar extensão para UUIDs (necessário no PostgreSQL < 13)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA: users
-- Armazena os dados dos usuários do sistema.
-- Papéis possíveis: IDOSO, FISIOTERAPEUTA, ADMIN
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(120)    NOT NULL,
    email           VARCHAR(160)    NOT NULL UNIQUE,
    hashed_password VARCHAR(255)    NOT NULL,
    role            VARCHAR(30)     NOT NULL DEFAULT 'IDOSO',
    mobility_level  VARCHAR(50),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);

-- =====================================================
-- 2. TABELA: categories
-- Categorias dos exercícios (ex: Mobilidade, Equilíbrio)
-- =====================================================
CREATE TABLE IF NOT EXISTS categories (
    id              UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(80)     NOT NULL UNIQUE,
    description     VARCHAR(255)
);

-- =====================================================
-- 3. TABELA: exercises
-- Catálogo de exercícios disponíveis no sistema.
-- Contém ângulos-alvo e landmarks para detecção de pose.
-- =====================================================
CREATE TABLE IF NOT EXISTS exercises (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id         UUID            NOT NULL REFERENCES categories(id),
    name                VARCHAR(120)    NOT NULL,
    level               VARCHAR(50)     NOT NULL,
    description         VARCHAR(500)    NOT NULL,
    video_url           VARCHAR(255),
    target_angles       JSONB           NOT NULL DEFAULT '{}'::jsonb,
    target_landmarks    JSONB           NOT NULL DEFAULT '{}'::jsonb,
    active              BOOLEAN         NOT NULL DEFAULT TRUE
);

-- =====================================================
-- 4. TABELA: activity_logs
-- Registro de cada sessão de exercício realizada pelo
-- usuário, contendo métricas de desempenho.
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_logs (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID            NOT NULL REFERENCES users(id),
    exercise_id         UUID            NOT NULL REFERENCES exercises(id),
    started_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    finished_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    repetitions         INTEGER         NOT NULL DEFAULT 0,
    average_angle       DOUBLE PRECISION,
    max_angle           DOUBLE PRECISION,
    duration_seconds    INTEGER         NOT NULL DEFAULT 0
);

-- =====================================================
-- 5. TABELA: posture_alerts
-- Alertas de postura gerados durante a execução de um
-- exercício quando o ângulo detectado diverge do esperado.
-- =====================================================
CREATE TABLE IF NOT EXISTS posture_alerts (
    id                  UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID            NOT NULL REFERENCES users(id),
    exercise_id         UUID            NOT NULL REFERENCES exercises(id),
    activity_log_id     UUID            REFERENCES activity_logs(id),
    joint               VARCHAR(80)     NOT NULL,
    detected_angle      DOUBLE PRECISION NOT NULL,
    expected_angle      DOUBLE PRECISION NOT NULL,
    occurred_at         TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- =====================================================
-- DADOS INICIAIS (Seed) - Categorias e Exercícios
-- =====================================================

-- Inserir categorias iniciais
INSERT INTO categories (id, name, description) VALUES
    (uuid_generate_v4(), 'Mobilidade', 'Exercicios leves para melhorar movimento e flexibilidade.'),
    (uuid_generate_v4(), 'Fortalecimento', 'Exercicios de baixo impacto para ganho de forca.'),
    (uuid_generate_v4(), 'Equilibrio', 'Exercicios para estabilidade e seguranca ao caminhar.')
ON CONFLICT (name) DO NOTHING;

-- Inserir exercícios iniciais (vinculados às categorias criadas acima)
INSERT INTO exercises (id, category_id, name, level, description, target_angles, target_landmarks) VALUES
    (
        uuid_generate_v4(),
        (SELECT id FROM categories WHERE name = 'Mobilidade'),
        'Alongamento de Ombros',
        'iniciante',
        'Elevar os bracos devagar ate a altura indicada e retornar.',
        '{"joint": "ombro", "min": 70, "max": 160, "tolerance": 15}'::jsonb,
        '{"proximal": 12, "joint": 14, "distal": 16}'::jsonb
    ),
    (
        uuid_generate_v4(),
        (SELECT id FROM categories WHERE name = 'Fortalecimento'),
        'Elevacao de Joelho Sentado',
        'iniciante',
        'Sentado, elevar um joelho por vez mantendo o tronco estavel.',
        '{"joint": "quadril", "min": 65, "max": 110, "tolerance": 12}'::jsonb,
        '{"proximal": 12, "joint": 24, "distal": 26}'::jsonb
    ),
    (
        uuid_generate_v4(),
        (SELECT id FROM categories WHERE name = 'Equilibrio'),
        'Equilibrio com Apoio',
        'iniciante',
        'Ficar em pe com apoio lateral e manter a postura pelo tempo indicado.',
        '{"joint": "tronco", "min": 80, "max": 100, "tolerance": 10}'::jsonb,
        '{"proximal": 11, "joint": 23, "distal": 25}'::jsonb
    )
ON CONFLICT DO NOTHING;
