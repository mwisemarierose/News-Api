# News API — Eskalate Backend Assessment

A production-ready RESTful News API built with **Node.js + TypeScript**, implementing secure authentication, role-based access control, content lifecycle management, and an analytics engine.

---

##  Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Runtime | Node.js + TypeScript | Type safety, modern async support |
| Framework | Express.js | Lightweight, well-understood, fast |
| ORM | Prisma | Type-safe queries, excellent migration tooling |
| Database | PostgreSQL | Relational integrity, UUID support, indexes |
| Auth | JWT + Argon2 | Industry-standard tokens; Argon2 is the strongest password hash |
| Validation | Zod | Runtime type checking with TypeScript inference |
| Job Queue | BullMQ + Redis | Reliable, retryable async jobs for analytics |
| Scheduler | node-cron | Lightweight UTC cron for daily job trigger |
| Rate Limiting | express-rate-limit | IP + user-keyed throttle to prevent read-log spam |
| Testing | Jest + Supertest | Fast unit tests with Prisma mocked via jest-mock-extended |

---

##  Setup & Installation

### Prerequisites
- Node.js v18+
- PostgreSQL (running locally or via Docker)
- Redis (for BullMQ job queue)

### 1. Clone & Install

```bash
git clone https://github.com/mwisemarierose/News-Api.git
cd news-api
cd backend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/newsapi"

# JWT signing secret (use a long random string in production)
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# Server port
PORT=3000
NODE_ENV="development"

# Redis connection (required for BullMQ analytics queue)
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
```

### 3. Run Database Migrations

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start the Server

```bash
# Development (hot reload)
npm run dev

# Production
npm run build
npm start
```

---

##  Running Tests

Tests use **Jest + Supertest** with the Prisma client fully mocked — no real database or Redis connection needed.

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

---

##  API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | None | Create account (author or reader) |
| POST | `/auth/login` | None | Login, receive JWT |

### Articles
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/articles` | None | Public feed (published, not deleted) — supports `?category=`, `?author=`, `?q=`, `?page=`, `?pageSize=` |
| GET | `/articles/:id` | Optional | Article detail — triggers ReadLog (rate-limited: 10/min per user) |
| GET | `/articles/me` | Author | Own articles (draft + published, optional `?includeDeleted=true`) |
| POST | `/articles` | Author | Create article |
| PUT | `/articles/:id` | Author | Edit own article |
| DELETE | `/articles/:id` | Author | Soft-delete own article |

### Author Analytics
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/author/dashboard` | Author | Paginated list of articles with `TotalViews` from DailyAnalytics |

### Other
| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Health check |

---

##  Analytics Engine

ReadLog entries are aggregated into `DailyAnalytics` via a **BullMQ job queue**:

1. A **node-cron** scheduler triggers daily at **00:01 UTC**
2. It enqueues an `aggregate-reads` job for the previous day's reads
3. The **BullMQ worker** groups `ReadLog` entries by `(articleId, UTC date)` and **upserts** the count into `DailyAnalytics`
4. The `GET /author/dashboard` endpoint sums `DailyAnalytics.viewCount` per article

---

##  Read-Log Rate Limiting (Bonus)

To prevent a single user from generating 100 ReadLog entries in 10 seconds, `GET /articles/:id` enforces a **10 requests/minute** rate limit keyed by **IP + userId** (or `guest` for unauthenticated requests). Requests exceeding this return `429 Too Many Requests`.

---

##  Project Structure

```
src/
  config/           # Prisma & Redis singletons
  middleware/        # Auth, RBAC, validation, error handler, rate limiter
  modules/
    auth/            # Signup, login
    articles/        # CRUD + public feed + read tracking
    analytics/       # Author dashboard
  jobs/              # BullMQ queue, worker, cron scheduler
  utils/             # JWT helpers, response helpers
  app.ts             # Express app
  server.ts          # Entry point
prisma/
  schema.prisma      # DB schema
tests/               # Jest unit tests (mocked DB)
```
