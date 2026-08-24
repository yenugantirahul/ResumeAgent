# ResumeAgent

Upload your resume + paste a job description → get a match score, skill gaps, and improvement suggestions.

---

## What it does

- Parses your resume and the job description using AI agents
- Scores how well your resume matches the role (overall + skill score)
- Shows matched skills, missing skills, and actionable suggestions

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js, Clerk (auth) |
| Backend | Express, LangGraph, Gemini |
| Storage | Supabase (files + DB) |
| Background jobs | Trigger.dev |

## How it works

```
Upload resume + job description
        ↓
[resume agent ‖ jd agent]   ← run in parallel
        ↓
   analysis agent            ← matching + improvement in one call
        ↓
     Results
```

## Getting started

**Backend**
```bash
cd backend
cp .env.example .env.local   # add your API keys
pnpm install
pnpm dev
```

**Frontend**
```bash
cd frontend
cp .env.example .env.local
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Env vars needed

```
# backend/.env.local
GOOGLE_API_KEY=
GROQ_API_KEY=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLERK_SECRET_KEY=
TRIGGER_SECRET_KEY=

# frontend/.env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```
