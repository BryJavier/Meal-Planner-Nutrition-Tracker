#!/bin/bash
set -e

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — update ANTHROPIC_API_KEY and SECRET_KEY before production use."
fi

docker compose up --build
