# TaskFlow — Full-Stack Task Management

A production-grade task management application with a Kanban board, real-time updates, JWT auth, role-based access control, file attachments, and a polished UI inspired by Linear.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | FastAPI (Python 3.12), SQLAlchemy 2.0 |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens), bcrypt |
| Real-time | WebSockets |
| Drag & Drop | @dnd-kit |
| State | Zustand + TanStack Query |
| Deploy | Docker Compose / Railway |
| CI | GitHub Actions |

## Features

- **Kanban Board** — Drag & drop across Backlog → Done columns
- **Task List** — Sortable, filterable, paginated table view
- **Authentication** — JWT with refresh tokens, persisted across page reloads
- **Real-time** — WebSocket push when tasks change (create/update/delete)
- **File Attachments** — Upload images, PDF, Word, Excel per task
- **Activity Log** — Full history of field-level changes per task
- **Dark Mode** — System-aware theme, persisted preference
- **Role-based Access** — `user` → `admin` → `super_admin` hierarchy
- **Admin Panel** — View all users, manage roles, browse any user's tasks + activity log
- **Super Admin** — Auto-seeded account that cannot be demoted; only super admin can promote/demote others
- **Search + Filter** — Status, priority, label, and text search all work together

## Quick Start (Docker Compose)

```bash
# 1. Clone and copy environment
cp .env.example .env
# Edit .env — change SECRET_KEY and adjust ALLOWED_ORIGINS if needed

# 2. Start everything
docker compose up --build

# Frontend: http://localhost:3002
# API:      http://localhost:8001
# API docs: http://localhost:8001/docs
```

### Super Admin Account

A super admin is automatically created on first startup:

| Field | Value |
|---|---|
| Email | `superadmin@taskflow.com` |
| Password | `SuperAdmin123!` |

The super admin can promote any user to `admin` and cannot be demoted.

## Local Development

### Prerequisites
- Python 3.12+
- Node.js 20+
- PostgreSQL 16 running locally

### Backend

```bash
cd backend

python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

pip install -r requirements.txt

# Copy and configure env
cp ../.env.example .env
# Set DATABASE_URL=postgresql://..., SECRET_KEY=...

alembic upgrade head

uvicorn app.main:app --reload --port 8001
```

API docs: http://localhost:8001/docs

### Frontend

```bash
cd frontend

npm install

# Create env file
echo "NEXT_PUBLIC_API_URL=http://localhost:8001" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://localhost:8001" >> .env.local

npm run dev
```

App: http://localhost:3000

### Running Tests

```bash
cd backend

# Run all tests
pytest tests/ -v

# With coverage
pytest tests/ -v --cov=app --cov-report=term-missing

# Specific files
pytest tests/test_auth.py -v
pytest tests/test_tasks.py -v
```

Tests use an in-memory SQLite database — no PostgreSQL required.

## API Reference

Base URL: `http://localhost:8001/api/v1`

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Login, get tokens |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Get current user |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/tasks` | Create task |
| GET | `/tasks` | List tasks (filter, sort, paginate) |
| GET | `/tasks/{id}` | Get single task with attachments |
| PATCH | `/tasks/{id}` | Update task |
| PATCH | `/tasks/{id}/move` | Move on Kanban (status + position) |
| DELETE | `/tasks/{id}` | Delete task |
| GET | `/tasks/{id}/activities` | Get activity log |

**List Tasks query params:** `status`, `priority`, `search`, `label`, `sort_by`, `sort_dir`, `page`, `page_size` (max 500)

### Attachments
| Method | Endpoint | Description |
|---|---|---|
| POST | `/tasks/{id}/attachments` | Upload file (image, PDF, Word, Excel — max 10 MB) |
| DELETE | `/tasks/{id}/attachments/{att_id}` | Delete attachment |
| GET | `/tasks/{id}/attachments/{att_id}/download` | Download file |

### Admin (admin or super_admin role required)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/admin/users` | List all users |
| GET | `/admin/tasks` | List all tasks across all users |
| GET | `/admin/tasks/{id}` | Get any task's full detail |
| GET | `/admin/tasks/{id}/activities` | Get activity log for any task |
| GET | `/admin/stats` | System-wide stats |
| PATCH | `/admin/users/{id}/role` | Change user role (super_admin only) |

### WebSocket
Connect: `ws://localhost:8001/ws?token=<access_token>`

```json
{ "type": "task_created", "data": { ...task } }
{ "type": "task_updated", "data": { ...task } }
{ "type": "task_deleted", "data": { "id": "uuid" } }
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | — |
| `SECRET_KEY` | JWT signing secret (use 256-bit random) | — |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `60` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `30` |
| `ALLOWED_ORIGINS` | CORS allowed origins (JSON array) | `["http://localhost:3002"]` |
| `UPLOAD_DIR` | File upload directory | `uploads` |
| `MAX_FILE_SIZE` | Max upload bytes | `10485760` (10 MB) |
| `NEXT_PUBLIC_API_URL` | Backend API URL seen by browser | `http://localhost:8001` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL seen by browser | `ws://localhost:8001` |

## Project Structure

```
TaskFlow/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── deps.py          # Auth dependencies (get_current_user, require_admin, require_super_admin)
│   │   │   └── routes/          # auth, tasks, attachments, admin
│   │   ├── core/
│   │   │   ├── security.py      # JWT encode/decode, bcrypt hashing
│   │   │   └── websocket.py     # WebSocket connection manager
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── schemas/             # Pydantic request/response schemas
│   │   ├── config.py            # Settings via pydantic-settings
│   │   ├── database.py          # DB engine + session factory
│   │   └── main.py              # FastAPI app, CORS, WebSocket endpoint, super admin seed
│   ├── alembic/                 # DB migrations
│   ├── tests/                   # pytest suite (SQLite, no external deps)
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/                 # Next.js App Router pages
│       │   ├── (auth)/          # login, register
│       │   └── (dashboard)/     # tasks, kanban, admin
│       ├── components/          # Kanban, TaskForm, Layout, shared UI
│       ├── hooks/               # useTasks, useWebSocket
│       ├── lib/                 # axios client, utils, constants
│       ├── store/               # Zustand auth store (persisted)
│       └── types/               # TypeScript interfaces
├── .github/workflows/ci.yml     # CI: test + build on every push
├── docker-compose.yml
└── .env.example
```

## Assumptions & Trade-offs

- **Auth storage**: Access token in localStorage + Zustand persist. For higher security, use httpOnly cookies.
- **File uploads**: Stored on local disk. In production, use S3/GCS — swap the upload handler in `attachments.py`.
- **WebSockets**: Per-user connections. Shared real-time collaboration across users would need broadcast rooms.
- **Kanban**: Fetches up to 500 tasks at once for smooth drag-drop. For very large datasets, add virtual scrolling.
- **Tests**: Backend uses SQLite for zero-setup CI. The production database is PostgreSQL.
