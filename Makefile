.PHONY: setup dev-web dev-api seed-api docker-up docker-down

setup:
\tpnpm install
\tpython -m pip install -r apps/api/requirements.txt

dev-web:
\tpnpm --dir apps/web dev

dev-api:
\tcd apps/api && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

seed-api:
\tcd apps/api && python -m app.seed.demo

docker-up:
\tdocker compose up --build

docker-down:
\tdocker compose down -v

