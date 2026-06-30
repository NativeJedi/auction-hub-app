#!/usr/bin/env bash
#
# Dumps the PostgreSQL database and uploads it (gzipped) to an S3 backup bucket.
# Meant to run on the EC2 instance from cron, as the ssm-user.
#
#   crontab -e  ->  0 3 * * * bash /home/ssm-user/auction-hub-app/scripts/backup-db.sh >> /home/ssm-user/auction-backup.log 2>&1
#
# Retention of old dumps is handled by the S3 bucket lifecycle policy, not here.
set -euo pipefail

# cron runs with a minimal PATH; make sure docker + aws are visible.
export PATH="/usr/local/bin:/usr/bin:/snap/bin:$PATH"

APP_DIR="/home/ssm-user/auction-hub-app"
REGION="eu-north-1"

cd "$APP_DIR"

# Load .env for POSTGRES_* and BACKUP_BUCKET.
set -a
# shellcheck disable=SC1091
. ./.env
set +a

: "${BACKUP_BUCKET:?BACKUP_BUCKET is not set in .env}"

TS="$(date -u +%Y%m%d-%H%M%S)"
DUMP="/tmp/auction-hub-db-${TS}.sql.gz"

# -T disables the TTY (required under cron). pg_dump runs inside the db container.
docker compose exec -T db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$DUMP"

aws s3 cp "$DUMP" "s3://${BACKUP_BUCKET}/postgres/auction-hub-db-${TS}.sql.gz" --region "$REGION"

# Don't let local dumps pile up on the small disk.
rm -f "$DUMP"

echo "$(date -u +%FT%TZ) backup OK -> s3://${BACKUP_BUCKET}/postgres/auction-hub-db-${TS}.sql.gz"
