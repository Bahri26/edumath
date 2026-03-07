# EduMath Frontend

Quick start:

1. Install dependencies

```bash
cd frontend
npm install
```

2. Create local env (optional)

```bash
cp .env.example .env
# edit VITE_API_URL if needed
```

3. Run dev server

```bash
npm run dev
```

Notes:
- Project uses Vite + React + TailwindCSS.
- Auth state is stored in `localStorage` under the key `edumath_user`.
- API base URL is read from `VITE_API_URL` (defaults to `/api`).
