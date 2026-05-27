# Deployment Notes

## Frontend: Vercel

The frontend is a Next.js app in `frontend/`. If the Vercel project is connected to GitHub, pushing to the production branch will trigger deployment.

Recommended Vercel environment variable when a public backend is available:

```text
NEXT_PUBLIC_API_BASE_URL=https://<your-backend-host>
```

If this variable is not set, the frontend defaults to `http://localhost:8000` and falls back to browser-side analysis when the backend is unavailable.

## Backend: Render

A Render Blueprint is provided at the repository root:

```text
render.yaml
```

It deploys the FastAPI backend from `backend/` with:

```text
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

After Render creates the backend service, copy its public URL into Vercel as:

```text
NEXT_PUBLIC_API_BASE_URL=https://<render-service>.onrender.com
```

## Bio tool API endpoints

```text
GET  /api/bio-tools/status
GET  /api/bio-tools/protein/resolve?query=GFP
POST /api/bio-tools/sequence/analyze
POST /api/bio-tools/plasmid/annotate
GET  /api/bio-tools/pathways/{key}
```

External binaries such as BLAST+, pLannotate, MAFFT, and primer3_core are detected at runtime. If they are unavailable, the backend returns fallback results instead of failing the website.
