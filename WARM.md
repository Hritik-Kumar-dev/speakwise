# WARM.md

## Overview

SpeakWell is an English speaking-practice MVP. Users choose a scenario (Stage, Concert, Interview, Classroom), see a fullscreen background, speak their own words, and receive deterministic feedback for pronunciation clarity, correctness, and fluency. Browser speech recognition is used when available; typed transcript entry is the fallback. Users can also create custom scenarios by uploading their own background image.

## Structure

- `app/page.jsx` — Next.js App Router entry point that renders the main React app.
- `app/layout.jsx` — Next.js root layout with metadata and global styles.
- `src/App.jsx` — React app with scenario selector, custom scenario creation, fullscreen practice view, recording, and feedback.
- `src/styles.css` — responsive visual design and component styles.
- `src/lib/scenarios.js` — built-in scenarios data.
- `src/lib/score.js` — scoring logic.
- `app/api/scenarios/route.js` — GET scenarios API route.
- `app/api/score/route.js` — POST score API route.
- `package.json` — Next.js scripts and dependencies.
- `next.config.mjs` — Next.js configuration.
- `public/` — scenario background images (stage.png, concert.png, interview.png, classroom.png).

## Run and test

Start the Next.js app from the repository root:

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. For a production build, run `npm run build` then `npm start` from the repository root.

The app exposes:

- `GET /api/scenarios` returns built-in scenarios.
- `POST /api/score` accepts `{ "transcript": "...", "duration": 0 }` for free-form scoring.

Smoke checks:

```bash
curl -s http://localhost:3000/api/scenarios
curl -s -X POST http://localhost:3000/api/score -H 'Content-Type: application/json' -d '{"transcript":"I love speaking English every day.","duration":15}'
```

The app uses npm and Next.js App Router; there is no automated test suite yet.

## Conventions

- Add new built-in scenarios to `src/lib/scenarios.js` and place their images in `public/`.
- Keep API responses JSON and validate user-provided input.
- Score intelligibility and pronunciation clarity, not whether a user has a particular accent.
- Update this guide whenever structure, commands, or conventions change.