#!/bin/sh

set -eu

if [ ! -d "node_modules" ]; then
  echo "Installing Node dependencies..."
  npm install
else
  echo "Node dependencies already installed."
fi

if [ ! -d ".venv" ]; then
  echo "Creating Python virtual environment..."
  python3 -m venv .venv
else
  echo "Python virtual environment already exists."
fi

echo "Installing Python dependencies..."
.venv/bin/pip install -r worker/requirements.txt

if [ ! -f ".env" ] && [ -f ".env.example" ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
else
  echo ".env already exists."
fi

echo
echo "Setup complete."
echo "Run: npm run dev:all"
