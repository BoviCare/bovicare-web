# BoviCare Web — deployment (consumer)

This repository is a **consumer** of the infrastructure defined in **`aws_infrastructure`** (producer).

## What this repo owns

- React frontend, `Dockerfile`, and [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml).
- **ECR repository name** (must match Terraform): `bovicare-web`.
- **Docker Compose service name on EC2** (must match producer `user_data`): `frontend`.

## What the producer owns

- EC2, ECR, SSM parameters, Secrets Manager — same **producer** stack as the API and RAG services (`aws_infrastructure` Terraform).

## Empty ECR

Repos start **empty** after Terraform. You must run a successful deploy (push to **`staging`** / **`main`**) so **`staging-latest`** or **`production-latest`** exists. Use the **workload** account and **us-east-1** in the ECR console.

## Deploy flow

1. Push to **`main`** or **`staging`** runs deploy (not on PR). GitHub Environments **`main`** and **`staging`** supply `AWS_ACCOUNT_ID` per workload account.
2. `ENV_NAME` is `production` for `main` and `staging` for `staging` (ECR tags `production-latest` / `staging-latest`).
3. `make docker-build` (optional `GIT_SSH_KEY` + `--ssh default`), `make docker-push`, then the **Deploy to EC2 via SSM** step in `.github/workflows/deploy.yml`.

## Required GitHub secrets

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_ACCOUNT_ID` (same pattern as API).
- Optional `GIT_SSH_KEY` if the Docker build needs private repos.

## Contract

`REACT_APP_*` and API URLs for production are baked at **build** time. The producer’s EC2 `docker-compose` sets `REACT_APP_API_URL` from the instance public IP; if you change that behavior, update Terraform `user_data` and keep this workflow’s expectations aligned.
