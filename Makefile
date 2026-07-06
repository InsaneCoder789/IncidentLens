.PHONY: setup dev dev-web dev-api seed seed-api docker-up docker-down

PYTHON=.venv/bin/python
UVICORN=.venv/bin/uvicorn

setup:
	pnpm install
	python3 -m venv .venv
	$(PYTHON) -m pip install -r apps/api/requirements.txt

dev:
	pnpm --dir apps/web dev & cd apps/api && ../../$(UVICORN) app.main:app --reload --host 0.0.0.0 --port 8000

dev-web:
	pnpm --dir apps/web dev

dev-api:
	cd apps/api && ../../$(UVICORN) app.main:app --reload --host 0.0.0.0 --port 8000

seed-api:
	cd apps/api && ../../$(PYTHON) -m app.seed.demo

seed: seed-api

docker-up:
	docker compose up --build

docker-down:
	docker compose down -v
