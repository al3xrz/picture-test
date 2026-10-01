.PHONY: help up down stop logs seed backup restore dev build clean

help:
	@echo "Picture Test — make targets"
	@echo "  make up       Build and start with docker compose"
	@echo "  make down     Stop containers (keep data)"
	@echo "  make stop     Alias for down"
	@echo "  make logs     Follow container logs"
	@echo "  make seed     Seed demo questions (ARGS=--force to re-seed)"
	@echo "  make backup   Backup database + uploads into backups/"
	@echo "  make restore  Restore from FILE=backups/....tar.gz"
	@echo "  make dev      Run backend + frontend locally"
	@echo "  make build    Build both docker images"
	@echo "  make clean    Stop and remove volumes (DATA LOSS)"

up:
	./scripts/deploy.sh

down:
	./scripts/stop.sh

stop: down

logs:
	./scripts/logs.sh

seed:
	./scripts/seed.sh $(ARGS)

backup:
	./scripts/backup.sh

restore:
	./scripts/restore.sh $(FILE)

dev:
	./scripts/dev.sh

build:
	docker compose build

clean:
	./scripts/stop.sh --wipe
