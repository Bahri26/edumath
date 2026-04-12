# Edumath Backend

This is the Node.js/Express backend for Edumath.

## Local Development

1. Create `backend/.env` from `.env.example` and fill values.
2. Start MongoDB locally or set `MONGO_URI` to Atlas.
3. Run backend:

```bash
npm run dev
```

- Health: `GET /health`
- Readiness: `GET /ready`

## MongoDB Atlas Setup

- Preferred env vars:
   - `MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<any-db-name>?retryWrites=true&w=majority`
   - `MONGODB_DB=Edumath`
- Backward compatibility is preserved for `MONGO_URI` and `MONGO_DB`.
- If your Atlas URI path contains another database name such as `publisher`, backend now overrides it with `MONGODB_DB` and connects to `Edumath`.

### Expected collection names

Do not manually create `User`, `Question`, or other PascalCase collections in Atlas. The backend uses these collection names:

- `users`
- `students`
- `questions`
- `topics`
- `lessons`
- `assignments`
- `exams`
- `exercises`
- `surveys`
- `notifications`
- `messages`
- `conversations`
- `progress`
- `user_progress`
- `learning_events`
- `ai_chat_logs`
- `admin_audits`
- `password_reset_requests`
- `refresh_tokens`

Collections are created automatically on first write. If you created `User` manually in Atlas, it can remain unused; the application writes to `users`.

## AI (Gemini)
- Add `GEMINI_API_KEY` to `.env` for local.
- Endpoints:
  - `POST /api/ai/smart-parse` (form-data: `image`)
  - `POST /api/ai/smart-parse-text` (JSON body: `{ content }`)
- Without a key, image mode falls back to manual edit and returns `imagePath`.

## Cloud Run Deployment

This repository includes a Dockerfile in `backend/`.

### Steps
1. Create Secret: `GEMINI_API_KEY` in Secret Manager (Console → Security → Secret Manager → Create Secret).
2. Cloud Run → Create Service → Continuously deploy from repository.
   - Repo: `Bahri26/edumath`
   - Build directory: `backend`
   - Build uses Dockerfile automatically
3. Configure service:
   - Env vars: `MONGODB_URI`, `MONGODB_DB`, `FRONTEND_URL`
   - Optional multi-origin CORS: `ALLOWED_ORIGINS=https://edumath-client.onrender.com,http://localhost:5173`
   - Secret env var: `GEMINI_API_KEY` → source: Secret Manager
   - Ingress: allow unauthenticated (testing)
4. Deploy.

### Verify
- `GET /health` and `GET /ready` should return OK.
- AI endpoints as above.

### Frontend Config
- Set `frontend/.env` → `VITE_API_URL=https://<cloud-run-url>`.
- Ensure `FRONTEND_URL` matches the deployed frontend origin for CORS. If you need multiple origins, use `ALLOWED_ORIGINS` with comma-separated values.

## Notes
- Cloud Run filesystem is ephemeral. For persistent uploads, use Google Cloud Storage (GCS).
