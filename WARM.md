# WARM.md

## Overview

SpeakWell is an English speaking-practice MVP. Users choose a phrase, record or type a response, and receive deterministic feedback for pronunciation clarity, correctness, and fluency. Browser speech recognition is used when available; typed transcript entry is the fallback.

## Structure

- `frontend/src/App.jsx` — React dashboard, prompt selection, microphone recording, scoring, and feedback.
- `frontend/src/main.jsx` — React/Vite entrypoint.
- `frontend/src/styles.css` — responsive visual design and component styles.
- `frontend/package.json` — Vite scripts and frontend dependencies.
- `frontend/vite.config.js` — Vite configuration and `/api` development proxy.
- `backend/server.py` — dependency-free Python API server, prompt API, and MVP scoring API.

## Run and test

Start the API from the repository root:

```bash
python3 backend/server.py
```

In a second terminal, install and start the React/Vite frontend:

```bash
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>. Vite proxies `/api` requests to the backend at port 8000. For a production bundle, run `npm run build` and `npm run preview` from `frontend/`.

The backend exposes:

- `GET /api/prompts` returns practice prompts.
- `POST /api/score` accepts `{ "promptId": "...", "transcript": "...", "duration": 0 }`.

Syntax and smoke checks:

```bash
python3 -m py_compile backend/server.py
curl http://localhost:8000/api/prompts
curl -X POST http://localhost:8000/api/score -H 'Content-Type: application/json' -d '{"promptId":"daily-routine","transcript":"I usually start my day with a cup of coffee and a short walk.","duration":15}'
```

The frontend uses npm and Vite; there is no automated test suite yet.

## Conventions

- Keep frontend and backend concerns isolated in their directories.
- Keep the frontend dependency-free unless a deliberate framework migration is made.
- Add new prompts to `PROMPTS` in `backend/server.py` and preserve stable prompt IDs.
- Keep API responses JSON and validate user-provided input at the backend boundary.
- Score intelligibility and pronunciation clarity, not whether a user has a particular accent.
- Update this guide whenever structure, commands, or conventions change.
