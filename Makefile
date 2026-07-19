.PHONY: setup dev dev-web dev-api migrate test test-api test-web docker-up docker-down

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

migrate:
	cd apps/api && ../../$(PYTHON) -m alembic upgrade head

test-api:
	cd apps/api && ../../$(PYTHON) -m pytest -q

test-web:
	cd apps/web && ./node_modules/.bin/tsc --noEmit && ./node_modules/.bin/next build

test: test-api test-web

docker-up:
	docker compose up --build

docker-down:
	docker compose down -v
