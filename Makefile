# Used by GitHub Actions (.github/workflows/deploy.yml).
# CI sets: AWS_ACCOUNT_ID, ENV_NAME, GIT_SHA. Optional: DOCKER_BUILD_EXTRA="--ssh default" + ssh-agent.

AWS_REGION     ?= us-east-1
PROJECT_NAME   ?= bovicare
SERVICE_NAME   ?= frontend
ECR_REPOSITORY ?= bovicare-web
ENV_NAME       ?= production
GIT_SHA        ?= $(shell git rev-parse HEAD 2>/dev/null || echo "local")
DOCKER_BUILD_EXTRA ?=

ECR_REGISTRY := $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com
IMAGE        := $(ECR_REGISTRY)/$(ECR_REPOSITORY)
LATEST_TAG   := $(ENV_NAME)-latest

.PHONY: help docker-build docker-push docker-release docker-build-local ecr-login

help:
	@echo "BoviCare Web — Docker / ECR"
	@echo ""
	@echo "  make help                This help"
	@echo "  make docker-build-local    Build $(ECR_REPOSITORY):local (no AWS_ACCOUNT_ID; no --platform)"
	@echo "  make docker-build        Build $(IMAGE):$(GIT_SHA) for linux/amd64 (needs AWS_ACCOUNT_ID)"
	@echo "  make docker-push         Build then tag + push :$(GIT_SHA) and :$(LATEST_TAG)"
	@echo "  make docker-release      Same as docker-push"
	@echo "  make ecr-login           aws ecr get-login-password | docker login"
	@echo ""
	@echo "Optional: DOCKER_BUILD_EXTRA=\"--ssh default\" for private Git deps."
	@echo "Variables: AWS_ACCOUNT_ID, AWS_REGION, ENV_NAME, ECR_REPOSITORY, GIT_SHA"

docker-build-local:
	docker build $(DOCKER_BUILD_EXTRA) --provenance false -f Dockerfile -t $(ECR_REPOSITORY):local .

docker-build:
	@if [ -z "$(AWS_ACCOUNT_ID)" ]; then \
		echo "AWS_ACCOUNT_ID is required for ECR-tagged build. Example:"; \
		echo "  AWS_ACCOUNT_ID=123456789012 ENV_NAME=staging make docker-build"; \
		echo "Or use: make docker-build-local"; \
		exit 1; \
	fi
	docker build $(DOCKER_BUILD_EXTRA) --platform linux/amd64 --provenance false -f Dockerfile -t $(IMAGE):$(GIT_SHA) .

docker-push: docker-build
	docker tag $(IMAGE):$(GIT_SHA) $(IMAGE):$(LATEST_TAG)
	docker push $(IMAGE):$(GIT_SHA)
	docker push $(IMAGE):$(LATEST_TAG)

docker-release: docker-push

ecr-login:
	@if [ -z "$(AWS_ACCOUNT_ID)" ]; then \
		echo "Set AWS_ACCOUNT_ID"; exit 1; \
	fi
	aws ecr get-login-password --region $(AWS_REGION) | \
		docker login --username AWS --password-stdin $(ECR_REGISTRY)
