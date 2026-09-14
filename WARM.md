# WARM.md

## Overview

SpeakWell is an English speaking-practice MVP. Users choose a scenario (Stage, Concert, Interview, Classroom), see a fullscreen background, speak their own words, and receive deterministic feedback for pronunciation clarity, correctness, and fluency. Browser speech recognition is used when available; typed transcript entry is the fallback. Users can also create custom scenarios by uploading their own background image.

## Structure

- `frontend/src/App.jsx` — React app with scenario selector, custom scenario creation, fullscreen practice view, recording, and feedback.
- `frontend/src/main.jsx` — React/Vite entrypoint.
- `frontend/src/styles.css` — responsive visual design and component styles.
- `frontend/package.json` — Vite scripts and frontend dependencies.
- `frontend/vite.config.js` — Vite configuration and `/api` development proxy.
- `backend/server.py` — dependency-free Python API server, scenario API, and free-form scoring API.
- `frontend/public/` — scenario background images (stage.png, concert.png, interview.png, classroom.png).

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

- `GET /api/scenarios` returns built-in scenarios.
- `POST /api/score` accepts `{ "transcript": "...", "duration": 0 }` for free-form scoring.

Syntax and smoke checks:

```bash
python3 -m py_compile backend/server.py
curl http://localhost:8000/api/scenarios
curl -X POST http://localhost:8000/api/score -H 'Content-Type: application/json' -d '{"transcript":"I love speaking English every day.","duration":15}'
```

The frontend uses npm and Vite; there is no automated test suite yet.

## Conventions

- Keep frontend and backend concerns isolated in their directories.
- Keep the frontend dependency-free unless a deliberate framework migration is made.
- Add new built-in scenarios to `SCENARIOS` in `backend/server.py` and place their images in `frontend/public/`.
- Keep API responses JSON and validate user-provided input at the backend boundary.
- Score intelligibility and pronunciation clarity, not whether a user has a particular accent.
- Update this guide whenever structure, commands, or conventions change.
