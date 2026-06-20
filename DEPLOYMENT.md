# Deployment Guide

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## Docker Deployment

```bash
docker compose up --build -d
docker compose logs -f          # tail logs
docker compose down             # stop
```

Services:
- `backend` — FastAPI on port 8000
- `frontend` — Nginx serving the React build on port 80, proxying `/api/*` to backend

---

## Production Checklist

1. **Secrets** — generate a strong `SECRET_KEY`:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```
2. **Database** — for production scale, migrate from SQLite to PostgreSQL:
   - `pip install psycopg2-binary`
   - `DATABASE_URL=postgresql://user:pass@host:5432/dbname`
3. **CORS** — restrict `FRONTEND_URL` / CORS origins to your real domain in `main.py`.
4. **HTTPS** — terminate TLS at a reverse proxy (Nginx/Caddy/Cloud Load Balancer) in front of the containers.
5. **Workers** — increase Uvicorn workers in `backend/Dockerfile` CMD based on CPU cores.
6. **Persistent volumes** — ensure `backend_data`, `backend_logs`, `backend_uploads` volumes are backed up.
7. **Monitoring** — ship `logs/app.log` to your log aggregator (e.g., via a sidecar or Docker logging driver).
8. **Rate limiting** — `slowapi` is included in requirements; wire up per-route limits for public endpoints (auth, chatbot) before going live.

---

## Cloud Deployment Options

- **Render / Railway** — connect repo, set env vars, deploy backend and frontend as separate services.
- **AWS** — ECS/Fargate for containers + RDS Postgres + S3 for uploads + CloudFront for the frontend build.
- **DigitalOcean App Platform** — supports the `docker-compose.yml` directly with minor adaptation.
- **Vercel/Netlify** (frontend only) + a managed backend host (Render/Railway/Fly.io) for the API.

---

## Database Migrations (Alembic)

Alembic is included in `requirements.txt` for schema migrations beyond the initial `create_all()` bootstrap:

```bash
cd backend
alembic init alembic          # one-time setup
# Edit alembic.ini: sqlalchemy.url = sqlite:///./ecommerce.db
# Edit alembic/env.py: import Base from app.database.session and set target_metadata = Base.metadata
alembic revision --autogenerate -m "description"
alembic upgrade head
```

---

## Seeding Data

The app auto-seeds demo data (admin user, customer, categories, products, coupons) on first boot if the database is empty. To re-seed manually:

```bash
cd backend
python -m app.utils.seeder
```
