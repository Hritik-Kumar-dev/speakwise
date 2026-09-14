"""Dependency-free HTTP API for the SpeakWell MVP."""
from __future__ import annotations

import json
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

PROMPTS = [
    {
        "id": "daily-routine",
        "title": "Talk about your day",
        "level": "A2 · Everyday English",
        "text": "I usually start my day with a cup of coffee and a short walk.",
        "tip": "Connect usually start and your day smoothly.",
    },
    {
        "id": "opinion",
        "title": "Share an opinion",
        "level": "B1 · Conversation",
        "text": "I believe learning a language is easier when you practice a little every day.",
        "tip": "Stress believe, language, easier, and every day.",
    },
    {
        "id": "story",
        "title": "Tell a short story",
        "level": "B2 · Storytelling",
        "text": "Last weekend, I visited a new place and made an interesting friend.",
        "tip": "Keep last weekend and visited clear, then pause briefly before and.",
    },
]


def words(value: str) -> list[str]:
    return re.findall(r"[a-z]+(?:'[a-z]+)?", value.lower())


def score_response(prompt: dict, transcript: str, duration: float = 0) -> dict:
    expected = words(prompt["text"])
    actual = words(transcript)
    if not actual:
        return {"overall": 0, "pronunciation": 0, "correctness": 0, "fluency": 0, "transcript": transcript, "feedback": [], "alternative": "Try speaking the phrase one short chunk at a time."}

    expected_set = set(expected)
    matched = sum(word in expected_set for word in actual)
    coverage = matched / max(len(expected), 1)
    correctness = round(min(100, coverage * 100))
    extra = sum(word not in expected_set for word in actual)
    pronunciation = round(max(35, min(98, 72 + coverage * 24 - extra * 3)))
    duration = float(duration or 0)
    pace_penalty = 0 if not duration else min(25, abs((len(actual) / duration) - 1.8) * 8)
    fluency = round(max(35, min(98, 88 - pace_penalty - max(0, len(expected) - len(actual)) * 2)))
    overall = round(pronunciation * 0.4 + correctness * 0.4 + fluency * 0.2)

    feedback = []
    missing = [word for word in expected if word not in actual]
    if missing:
        feedback.append({"type": "missed", "label": "Words to revisit", "detail": "Try including: " + ", ".join(missing[:5]) + "."})
    if extra:
        feedback.append({"type": "clarity", "label": "Keep it focused", "detail": "The target phrase is shorter and more direct. Remove extra words where possible."})
    if coverage >= 0.85:
        feedback.append({"type": "strength", "label": "Strong message", "detail": "You covered most of the target meaning. Now focus on smooth connections between words."})
    feedback.append({"type": "tip", "label": "Pronunciation tip", "detail": prompt["tip"]})

    return {
        "overall": overall,
        "pronunciation": pronunciation,
        "correctness": correctness,
        "fluency": fluency,
        "transcript": transcript,
        "feedback": feedback,
        "alternative": "I think practicing a little every day makes learning a language much easier.",
    }


class Handler(BaseHTTPRequestHandler):
    def _send(self, payload: object, status: int = 200, content_type: str = "application/json") -> None:
        body = json.dumps(payload).encode() if content_type == "application/json" else payload
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self) -> None:
        route = urlparse(self.path).path
        if route == "/api/prompts":
            self._send(PROMPTS)
        else:
            self._send({"error": "Not found"}, 404)

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/score":
            self._send({"error": "Not found"}, 404)
            return
        try:
            length = int(self.headers.get("Content-Length", 0))
            data = json.loads(self.rfile.read(length))
            prompt = next(item for item in PROMPTS if item["id"] == data.get("promptId"))
            result = score_response(prompt, str(data.get("transcript", "")), data.get("duration", 0))
            self._send(result)
        except (ValueError, KeyError, StopIteration, json.JSONDecodeError):
            self._send({"error": "Provide a valid promptId and transcript."}, 400)

    def log_message(self, *_args: object) -> None:
        return


if __name__ == "__main__":
    print("SpeakWell running at http://localhost:8000")
    ThreadingHTTPServer(("127.0.0.1", 8000), Handler).serve_forever()
