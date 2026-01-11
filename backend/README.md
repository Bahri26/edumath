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
   - Env vars: `MONGO_URI`, `FRONTEND_URL`
   - Secret env var: `GEMINI_API_KEY` → source: Secret Manager
   - Ingress: allow unauthenticated (testing)
4. Deploy.

### Verify
- `GET /health` and `GET /ready` should return OK.
- AI endpoints as above.

### Frontend Config
- Set `frontend/.env` → `VITE_API_URL=https://<cloud-run-url>`.
- Ensure `FRONTEND_URL` in Cloud Run matches the deployed frontend origin for CORS.

## Notes
- Cloud Run filesystem is ephemeral. For persistent uploads, use Google Cloud Storage (GCS).
