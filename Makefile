# Create DB container
docker-run:
	@if docker compose -f docker-compose.dev.yml up 2>/dev/null; then \
		: ; \
	else \
		echo "Falling back to Docker Compose V1"; \
		docker-compose -f docker-compose.dev.yml up --build; \
	fi

# Shutdown DB container
docker-down:
	@if docker compose -f docker-compose.dev.yml down 2>/dev/null; then \
		: ; \
	else \
		echo "Falling back to Docker Compose V1"; \
		docker-compose -f docker-compose.dev.yml down; \
	fi

docker-prod:
	@if docker compose -f docker-compose.prod.yml  --env-file .env up; then \
		: ; \
		echo "Falling back to Docker Compose V1"; \
		docker-compose -f docker-compose.prod.yml  --env-file .env up; \
	fi
