# 🛍️ ShopAI — AI-Powered Smart E-Commerce Platform

A production-grade, full-stack e-commerce platform with AI-powered product recommendations, sales forecasting, a conversational shopping assistant, and a complete analytics dashboard. Built with **FastAPI**, **React**, and **Scikit-Learn**.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi) ![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python) ![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

### 🛒 Customer Experience
- Browse, search & filter products with pagination, sorting, and category/price filters
- Product detail pages with reviews, ratings, similar product suggestions
- Cart, wishlist, multi-address checkout, coupon codes, order tracking & history
- PDF-ready order summaries, COD & simulated online payment
- AI Shopping Assistant chatbot (product search, order tracking, FAQs)
- Personalized AI recommendations (content + collaborative filtering)

### 🛠️ Admin Dashboard
- Revenue/orders/users overview with growth metrics
- Product, category, inventory, coupon & user management (full CRUD)
- Order status management with tracking numbers
- Low-stock alerts and inventory table
- Interactive charts: revenue trend, category performance, order distribution, ratings
- **AI Sales Forecasting** — Linear Regression-based revenue & demand prediction

### 🤖 AI/ML Modules
| Module | Technique |
|---|---|
| Recommendation Engine | Content-based (cosine similarity) + Collaborative filtering |
| Trending Products | Weighted scoring (views, purchases, ratings) with time decay |
| Sales Forecasting | Polynomial Regression (Scikit-Learn) |
| Shopping Chatbot | Rule-based NLP intent classification |

---

## 🧱 Tech Stack

**Frontend:** React (Vite), React Router, Redux Toolkit, Tailwind CSS, Framer Motion, Recharts, React Hook Form, Axios, React Toastify

**Backend:** FastAPI, SQLAlchemy ORM, SQLite, JWT Auth, Passlib (bcrypt), Pydantic v2

**AI/ML:** Scikit-Learn, Pandas, NumPy

**DevOps:** Docker, Docker Compose, Nginx

---

---

## 🚀 Quick Start

### Option 1 — Docker (Recommended)

```bash
git clone <repo-url> && cd ecommerce
docker compose up --build
```

- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

### Option 2 — Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # edit as needed
uvicorn main:app --reload
```
The database auto-creates and seeds demo data on first run.

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Visit http://localhost:5173

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@ecommerce.com | Admin@123 |
| Customer | nikhilesh77@gmail.com | 12345678 |

---

## 🧪 Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

Test coverage includes: authentication flows, product CRUD, cart/order lifecycle, AI module sanity checks.

---

## 📡 API Overview

All endpoints are prefixed with `/api/v1`. Full interactive docs at `/docs` (Swagger) or `/redoc`.

| Group | Examples |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` |
| Products | `GET /products`, `GET /products/{id}`, `POST /products` (admin) |
| Cart | `GET /cart`, `POST /cart/items`, `PUT /cart/items/{id}` |
| Orders | `POST /orders`, `GET /orders`, `PUT /admin/orders/{id}/status` |
| AI | `GET /recommendations/personalized`, `GET /trending`, `POST /chatbot/message`, `GET /forecast/revenue` |
| Analytics | `GET /analytics/overview`, `GET /analytics/revenue-trend` |

---

## 🔐 Environment Variables

See `backend/.env.example` and `frontend/.env.example`. Key backend vars:

```
SECRET_KEY=                  # JWT signing key (min 32 chars in production)
DATABASE_URL=sqlite:///./ecommerce.db
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=http://localhost:5173
```

---

## 🏭 Production Deployment Notes

1. Replace `SECRET_KEY` with a securely generated random value.
2. Swap SQLite for PostgreSQL by changing `DATABASE_URL` (SQLAlchemy supports this with no code changes beyond the connection string + driver install).
3. Set `ENVIRONMENT=production` and `DEBUG=False`.
4. Serve the frontend build via Nginx (already configured in `frontend/Dockerfile`) behind a reverse proxy/TLS terminator.
5. Run the backend with multiple Uvicorn workers (`--workers 4`) or behind Gunicorn+Uvicorn workers.
6. Configure persistent volumes for the SQLite file, logs, and uploads (see `docker-compose.yml`).
7. Set up automated backups for the database volume.

---

## 📜 License

MIT — free to use for academic, portfolio, and commercial purposes.

---

Built with ❤️ using React, FastAPI, and AI.
=======
# shopai-ecommerce-platform
project shopping 
>>>>>>> e5d8cbb232904f66fc94a39b60592cc054edbff5
<<<<<<< HEAD
# 🛍️ ShopAI — AI-Powered Smart E-Commerce Platform

A production-grade, full-stack e-commerce platform with AI-powered product recommendations, sales forecasting, a conversational shopping assistant, and a complete analytics dashboard. Built with **FastAPI**, **React**, and **Scikit-Learn**.

![Tech Stack](https://img.shields.io/badge/React-18-61DAFB?logo=react) ![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi) ![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python) ![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

### 🛒 Customer Experience
- Browse, search & filter products with pagination, sorting, and category/price filters
- Product detail pages with reviews, ratings, similar product suggestions
- Cart, wishlist, multi-address checkout, coupon codes, order tracking & history
- PDF-ready order summaries, COD & simulated online payment
- AI Shopping Assistant chatbot (product search, order tracking, FAQs)
- Personalized AI recommendations (content + collaborative filtering)

### 🛠️ Admin Dashboard
- Revenue/orders/users overview with growth metrics
- Product, category, inventory, coupon & user management (full CRUD)
- Order status management with tracking numbers
- Low-stock alerts and inventory table
- Interactive charts: revenue trend, category performance, order distribution, ratings
- **AI Sales Forecasting** — Linear Regression-based revenue & demand prediction

### 🤖 AI/ML Modules
| Module | Technique |
|---|---|
| Recommendation Engine | Content-based (cosine similarity) + Collaborative filtering |
| Trending Products | Weighted scoring (views, purchases, ratings) with time decay |
| Sales Forecasting | Polynomial Regression (Scikit-Learn) |
| Shopping Chatbot | Rule-based NLP intent classification |

---

## 🧱 Tech Stack

**Frontend:** React (Vite), React Router, Redux Toolkit, Tailwind CSS, Framer Motion, Recharts, React Hook Form, Axios, React Toastify

**Backend:** FastAPI, SQLAlchemy ORM, SQLite, JWT Auth, Passlib (bcrypt), Pydantic v2

**AI/ML:** Scikit-Learn, Pandas, NumPy

**DevOps:** Docker, Docker Compose, Nginx

---


---

## 🚀 Quick Start

### Option 1 — Docker (Recommended)

```bash
git clone <repo-url> && cd ecommerce
docker compose up --build
```

- Frontend: http://localhost
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

### Option 2 — Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # edit as needed
uvicorn main:app --reload
```
The database auto-creates and seeds demo data on first run.

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```
Visit http://localhost:5173

---

## 🔑 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@ecommerce.com | Admin@123 |
| Customer | john@example.com | Customer@123 |

---

## 🧪 Running Tests

```bash
cd backend
pip install -r requirements.txt
pytest tests/ -v
```

Test coverage includes: authentication flows, product CRUD, cart/order lifecycle, AI module sanity checks.

---

## 📡 API Overview

All endpoints are prefixed with `/api/v1`. Full interactive docs at `/docs` (Swagger) or `/redoc`.

| Group | Examples |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` |
| Products | `GET /products`, `GET /products/{id}`, `POST /products` (admin) |
| Cart | `GET /cart`, `POST /cart/items`, `PUT /cart/items/{id}` |
| Orders | `POST /orders`, `GET /orders`, `PUT /admin/orders/{id}/status` |
| AI | `GET /recommendations/personalized`, `GET /trending`, `POST /chatbot/message`, `GET /forecast/revenue` |
| Analytics | `GET /analytics/overview`, `GET /analytics/revenue-trend` |

---

## 🔐 Environment Variables

See `backend/.env.example` and `frontend/.env.example`. Key backend vars:

```
SECRET_KEY=                  # JWT signing key (min 32 chars in production)
DATABASE_URL=sqlite:///./ecommerce.db
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_URL=http://localhost:5173
```

---

## 🏭 Production Deployment Notes

1. Replace `SECRET_KEY` with a securely generated random value.
2. Swap SQLite for PostgreSQL by changing `DATABASE_URL` (SQLAlchemy supports this with no code changes beyond the connection string + driver install).
3. Set `ENVIRONMENT=production` and `DEBUG=False`.
4. Serve the frontend build via Nginx (already configured in `frontend/Dockerfile`) behind a reverse proxy/TLS terminator.
5. Run the backend with multiple Uvicorn workers (`--workers 4`) or behind Gunicorn+Uvicorn workers.
6. Configure persistent volumes for the SQLite file, logs, and uploads (see `docker-compose.yml`).
7. Set up automated backups for the database volume.

---

## 📜 License

MIT — free to use for academic, portfolio, and commercial purposes.

---

Built with ❤️ using React, FastAPI, and AI.
