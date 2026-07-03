.PHONY: setup dev dev-web dev-api seed seed-api docker-up docker-down

setup:
\tpnpm install
\tpython3 -m pip install -r apps/api/requirements.txt

dev:
\tpnpm --dir apps/web dev & cd apps/api && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-web:
\tpnpm --dir apps/web dev

dev-api:
\tcd apps/api && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

seed-api:
\tcd apps/api && python3 -m app.seed.demo

seed: seed-api

docker-up:
\tdocker compose up --build

docker-down:
\tdocker compose down -v
