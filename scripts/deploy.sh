#!/usr/bin/env bash
#
# Runs ON the EC2 instance, invoked by GitHub Actions through SSM Run Command.
# Pulls the freshly built images from ECR and restarts the stack. Images are
# built in CI — nothing is built here.
#
# Usage: deploy.sh <image-tag>   (tag is the git SHA from the workflow)
set -euo pipefail

# sudo/SSM run the script with a minimal PATH that can miss the AWS CLI
# (e.g. snap installs it under /snap/bin). Make sure the usual locations are seen.
export PATH="/usr/local/bin:/usr/bin:/snap/bin:$PATH"

TAG="${1:-latest}"
APP_DIR="/home/ssm-user/auction-hub-app"
REGION="eu-north-1"

if ! command -v aws >/dev/null 2>&1; then
  echo "ERROR: AWS CLI not found. Install AWS CLI v2 on the instance." >&2
  exit 1
fi

cd "$APP_DIR"

# Refresh compose/nginx/config (the images themselves come from ECR, not git).
git pull --ff-only

# Load .env so $ECR_REGISTRY (and the rest) is available to compose + login.
set -a
# shellcheck disable=SC1091
. ./.env
set +a

# Authenticate Docker to ECR using the instance IAM role (no stored keys).
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$ECR_REGISTRY"

# Pull exactly the images this deploy produced, then restart only what changed.
export IMAGE_TAG="$TAG"
docker compose pull api client
docker compose up -d

# Keep the small disk from filling up with old image layers.
docker image prune -f

echo "Deployed tag: $TAG"
docker compose ps
