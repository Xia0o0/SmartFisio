# SmartFisio

**SmartFisio** é uma aplicação web responsiva voltada à saúde física na terceira idade, combatendo o sedentarismo e a perda de mobilidade funcional através de tecnologia e acessibilidade.

## 🎯 O Projeto

A plataforma centraliza guias de exercícios de baixo impacto, como alongamentos e fortalecimento muscular leve. O grande diferencial é a **acessibilidade**: a interface utiliza elementos de alto contraste, tipografia de fácil leitura e navegação simplificada, pensando especialmente em usuários idosos com limitações visuais ou motoras finas.

## ✨ Funcionalidades Principais

* **Área de Autenticação Unificada:** Login e Cadastro integrados de forma fluida.
* **Perfis Diferenciados:**
  * **Idosos:** Acesso a rotinas de exercícios guiados.
  * **Fisioterapeutas:** Painel exclusivo (Dashboard do Fisioterapeuta) para acompanhamento.
* **Monitoramento por Visão Computacional (IA):** Integração com o **MediaPipe** da Google para detectar poses corporais em tempo real pelo navegador, auxiliando na execução correta dos movimentos com total privacidade (processamento no próprio dispositivo).
* **Acompanhamento de Progresso:** Módulo de persistência de dados para visualizar a evolução do usuário nas atividades propostas.
* **Interface Inclusiva e Moderna:** Design inspirado no FitUp, utilizando Glassmorphism e uma paleta de cores acolhedora (sem frameworks externos de CSS, garantindo máxima customização com Vanilla CSS).

## 🚀 Tecnologias Utilizadas

### Front-end
- **React.js + Vite:** Alta performance e desenvolvimento ágil.
- **MediaPipe Pose:** Detecção de movimentos em tempo real no lado do cliente via CDN.
- **Vanilla CSS:** Arquitetura limpa utilizando variáveis CSS para manter o design system, sem dependência de Tailwind ou Bootstrap.

### Back-end
- **FastAPI (Python):** API rápida, assíncrona e documentada (Swagger/ReDoc automáticos).
- **PostgreSQL:** Banco de dados relacional robusto e escalável para persistência dos dados de saúde.
- **Autenticação JWT:** Rotas protegidas e baseadas em tokens para segurança dos dados de saúde.
- **Uvicorn:** Servidor ASGI para rodar a aplicação backend.

## 🛠️ Como Executar Localmente

### 1. Clonar o Repositório
```bash
git clone https://github.com/SeuUsuario/SmartFisio.git
cd SmartFisio
```

### 2. Configurar o Banco de Dados (PostgreSQL)
Certifique-se de ter o PostgreSQL instalado e rodando. Em seguida, crie o banco e o usuário:
```sql
CREATE USER smartfisio WITH PASSWORD 'smartfisio';
CREATE DATABASE smartfisio OWNER smartfisio;
```
> O script completo de criação das tabelas está disponível em `backend/scripts/create_tables.sql`. No entanto, as tabelas são criadas automaticamente pelo ORM (SQLAlchemy) ao iniciar o backend pela primeira vez.

### 3. Configurar o Back-end
```bash
cd backend
python -m venv .venv
# Ativar o ambiente virtual:
# Windows: .venv\Scripts\activate
# Linux/Mac: source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### 3. Configurar o Front-end
Em outro terminal:
```bash
cd frontend
npm install
npm run dev
```

> **Acesso:**
> - Front-end: http://localhost:5173
> - Back-end (Documentação da API): http://localhost:8001/docs

## 📄 Licença

Este projeto está sob licença e desenvolvimento contínuo para promover a acessibilidade e o bem-estar na terceira idade.