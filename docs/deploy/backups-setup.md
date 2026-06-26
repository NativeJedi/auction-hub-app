# Backups — PostgreSQL dumps to S3 + EBS snapshots

Two independent safety nets:

1. **Nightly `pg_dump` → S3** — the precise, restorable copy of the database.
2. **Daily EBS snapshots (DLM)** — a coarse whole-disk fallback (the entire instance volume, including Docker volumes).

Region: `eu-north-1`. Replace `<ACCOUNT_ID>`, `<INSTANCE_ID>`, `<BACKUP_BUCKET>`.

---

## 1. Create the S3 backup bucket

```bash
aws s3api create-bucket \
  --bucket <BACKUP_BUCKET> \
  --region eu-north-1 \
  --create-bucket-configuration LocationConstraint=eu-north-1
aws s3api put-public-access-block --bucket <BACKUP_BUCKET> \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

Add a **lifecycle rule** so old dumps expire (keeps ~30 days). `lifecycle.json`:

```json
{
  "Rules": [
    {
      "ID": "expire-db-dumps",
      "Filter": { "Prefix": "postgres/" },
      "Status": "Enabled",
      "Expiration": { "Days": 30 }
    }
  ]
}
```

```bash
aws s3api put-bucket-lifecycle-configuration --bucket <BACKUP_BUCKET> --lifecycle-configuration file://lifecycle.json
```

## 2. Let the instance write (and read) backups

Add this inline policy to the instance role (`auction-hub-ec2-ssm`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:ListBucket"],
      "Resource": [
        "arn:aws:s3:::<BACKUP_BUCKET>",
        "arn:aws:s3:::<BACKUP_BUCKET>/*"
      ]
    }
  ]
}
```

(`GetObject`/`ListBucket` are there so you can restore from the instance too.)

## 3. Configure and schedule the dump

- Set `BACKUP_BUCKET=<BACKUP_BUCKET>` in the server `.env`.
- Install the cron entry as **ssm-user** (can run docker + aws):

```bash
crontab -e
# add:
0 3 * * * /home/ssm-user/auction-hub-app/scripts/backup-db.sh >> /home/ssm-user/auction-backup.log 2>&1
```

- Run it once by hand to confirm it works end-to-end:

```bash
/home/ssm-user/auction-hub-app/scripts/backup-db.sh
aws s3 ls s3://<BACKUP_BUCKET>/postgres/
```

## 4. EBS snapshots via Data Lifecycle Manager

AWS console → **EC2 → Lifecycle Manager → Create lifecycle policy** → *EBS snapshot policy*:

- Target by **tag** (tag the instance's volume, e.g. `Backup=auction-hub`, and target that tag).
- Schedule: daily, e.g. 03:30 UTC.
- Retention: keep **7** snapshots.
- Needs the default **AWSDataLifecycleManagerDefaultRole** (the wizard offers to create it).

## 5. Restore

**From a SQL dump (precise):**

```bash
# pick a dump
aws s3 ls s3://<BACKUP_BUCKET>/postgres/
aws s3 cp s3://<BACKUP_BUCKET>/postgres/auction-hub-db-YYYYMMDD-HHMMSS.sql.gz /tmp/restore.sql.gz

cd /home/ssm-user/auction-hub-app
set -a; . ./.env; set +a

# Restore into the running db container (this overwrites current data — be sure).
gunzip -c /tmp/restore.sql.gz | docker compose exec -T db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
```

**From an EBS snapshot (whole disk):** create a volume from the snapshot and attach it,
or launch a replacement instance from it — use only for disaster recovery.

## 6. Test a restore (do this at least once)

The only backup that counts is one you've restored. Safe drill without touching prod data:

```bash
# spin a throwaway postgres, load the dump into it, check a table
docker run -d --name restore-test -e POSTGRES_PASSWORD=test postgres:16
sleep 5
gunzip -c /tmp/restore.sql.gz | docker exec -i restore-test psql -U postgres
docker exec -it restore-test psql -U postgres -c "\dt"   # tables present?
docker rm -f restore-test
```

If the tables and rows are there, the backup chain works.
