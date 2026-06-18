# ExpenseAI — AI-Powered Expense Tracker

> A production-grade expense tracking application with AI-powered categorization, beautiful charts, receipt uploads, recurring expenses, and financial insights.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61dafb)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-green)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED)](https://docker.com)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS (dark mode, glassmorphism) |
| State | Zustand + TanStack Query |
| Charts | Recharts |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (access + refresh tokens) |
| AI | Gemini API / Rule-based fallback |
| Storage | Local (dev) → S3/Cloudinary ready |
| Testing | Vitest + Supertest |
| CI/CD | GitHub Actions |
| Deploy | Docker + Vercel + Railway |

---

## Quick Start (Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

### 1. Clone & Configure
```bash
git clone <your-repo-url>
cd expense-tracker

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 2. Edit `backend/.env`
```env
# Generate secrets with:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_ACCESS_SECRET=your_generated_secret_here
JWT_REFRESH_SECRET=your_other_generated_secret_here

# Optional: Add your Gemini API key for AI categorization
GEMINI_API_KEY=your_gemini_key_here
AI_PROVIDER=gemini
```

### 3. Start Everything
```bash
docker compose up --build
```

That's it! Access:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **DB Studio**: `npm run db:studio` (inside backend container)

### 4. Seed the Database
```bash
# In a new terminal
docker compose exec backend npm run db:seed
```

---

## Development (Without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 16+

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your PostgreSQL connection string
npm run db:migrate
npm run db:seed
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## Project Structure

```
expense-tracker/
├── backend/
│   ├── src/
│   │   ├── config/        # Environment & database config
│   │   ├── controllers/   # HTTP request handlers
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── routes/        # Express route definitions
│   │   ├── services/      # Business logic
│   │   ├── repositories/  # Database access (Prisma)
│   │   ├── ai/            # AI categorization (Strategy Pattern)
│   │   ├── storage/       # File storage (Adapter Pattern)
│   │   └── utils/         # Helpers & logger
│   └── prisma/
│       ├── schema.prisma  # Database schema
│       └── seed.ts        # Database seeder
│
└── frontend/
    └── src/
        ├── api/           # Axios API client
        ├── components/    # Shared UI components
        ├── features/      # Feature modules (auth, dashboard, expenses)
        ├── hooks/         # Custom React hooks
        ├── store/         # Zustand global state
        └── types/         # TypeScript types
```

---

## Available Scripts

### Backend
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Compile TypeScript
npm run test         # Run unit tests
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed default categories
npm run db:studio    # Open Prisma Studio (visual DB browser)
```

### Frontend
```bash
npm run dev          # Start Vite dev server
npm run build        # Production build
npm run test         # Run component tests
npm run typecheck    # Type check without building
```

---

## Architecture Patterns

### AI Categorization — Strategy Pattern
The AI provider is pluggable. Switch between Gemini and rule-based categorization via environment variable — no code changes required.

### Storage — Adapter Pattern
File storage is abstracted behind an interface. Switch from local storage to S3 or Cloudinary by changing one environment variable.

### API Response — Envelope Pattern
All API responses follow a consistent shape:
```json
{ "success": true, "data": { ... }, "meta": { "page": 1, "total": 50 } }
{ "success": false, "error": { "message": "...", "code": "..." } }
```

---

## Environment Variables

See [`backend/.env.example`](./backend/.env.example) for all required variables.

Key variables:
- `JWT_ACCESS_SECRET` — Secret for signing access tokens (min 32 chars)
- `JWT_REFRESH_SECRET` — Secret for signing refresh tokens (min 32 chars)
- `AI_PROVIDER` — `gemini` or `rule-based`
- `GEMINI_API_KEY` — Required if `AI_PROVIDER=gemini`
- `STORAGE_PROVIDER` — `local`, `s3`, or `cloudinary`

---

## Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
# Push to GitHub → connect to Vercel → auto-deploys on push
```

### Backend → Railway
1. Create a Railway project
2. Add PostgreSQL plugin
3. Deploy from GitHub
4. Set all environment variables in Railway dashboard

---

## Milestones Progress

- [x] M1: Project skeleton, Docker, schema
- [x] M2: Auth system (JWT)
- [x] M3: Expense CRUD API
- [x] M4: AI Categorization
- [x] M5: Storage Layer
- [x] M6: Analytics API
- [x] M7: Frontend Auth pages
- [x] M8: Dashboard + Charts
- [x] M9: Expense UI + Search + Filters
- [x] M10: PDF Export + CSV Import
- [x] M11: Testing
- [x] M12: CI/CD + Deployment

---

## License

MIT
