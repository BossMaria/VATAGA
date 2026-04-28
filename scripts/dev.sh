#!/bin/sh

set -eu

cleanup() {
  if [ -n "${WEB_PID:-}" ]; then
    kill "$WEB_PID" >/dev/null 2>&1 || true
  fi

  if [ -n "${WORKER_PID:-}" ]; then
    kill "$WORKER_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup INT TERM EXIT

PYTHON_BIN="${PYTHON_BIN:-.venv/bin/python}"

if [ ! -x "$PYTHON_BIN" ]; then
  echo "Python environment not found. Create it with:"
  echo "python3 -m venv .venv && .venv/bin/pip install -r worker/requirements.txt"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "Node dependencies not found. Run:"
  echo "npm install"
  exit 1
fi

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

"$PYTHON_BIN" -m uvicorn worker.app:app --host 127.0.0.1 --port 8000 &
WORKER_PID=$!

npm run dev &
WEB_PID=$!

wait "$WORKER_PID" "$WEB_PID"
