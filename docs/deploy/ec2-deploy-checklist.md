# EC2 Deploy Checklist (Auction Hub → production)

Working checklist to get the app live on a single EC2 instance. Step through one item at a time.

**Fixed decisions:** access via **AWS SSM** (port 22 stays closed), reverse proxy is **nginx + Certbot**, lot images served via **CloudFront + OAC**, prod stack runs from the default `docker-compose.yml` + `.env` (dev lives in `docker-compose.dev.yml` + `.env.dev`; no profiles).

---

## ✅ Done

- [x] Account security: root MFA, IAM user, AWS Budgets
- [x] Prod compose is the default `docker-compose.yml` (`name: auction-hub-prod`); dev is `docker-compose.dev.yml` (`name: auction-hub-dev`) — separate Compose projects, separate volumes
- [x] Prod Dockerfiles for client and server
- [x] S3 bucket for lot images (private, CORS, lifecycle)

---

## 1. EC2 + SSM (provision the instance) ✅

- [x] Launch EC2: Ubuntu 24.04 LTS, `t3.small`, region `eu-north-1` (30 GiB gp3, encrypted)
- [x] Create an **instance IAM role** (`InstanceRole`) with `AmazonSSMManagedInstanceCore` (+ `CloudWatchAgentServerPolicy`)
- [x] Attach the role to the instance (instance profile)
- [x] Security Group: open **only 80 and 443** to the world
- [x] Security Group: **do NOT open port 22** (access is via SSM)
- [x] Security Group: DB/Redis ports (5432/6379) closed
- [x] Allocate and associate an **Elastic IP** — `51.21.146.183`
- [x] Verify: instance reachable via Systems Manager → Session Manager (Managed)

## 2. Server preparation ✅

- [x] Connect via **SSM Session Manager** (confirm no SSH needed)
- [x] Install Docker + docker-compose plugin
- [x] Create a **swap file** (2G) (saves from OOM during builds)
- [x] Update the OS (`apt update && apt upgrade`)
- [x] Verify: `docker run hello-world` works

## 3. Production secrets ✅

- [x] Generate **fresh JWT secrets** (not the dev ones)
- [x] **Rotate the AWS access key** from the old `.env.prod` (old IAM key deleted)
- [x] Move app S3 access to the **instance IAM role** (code: keys optional → SDK uses instance role; `auction-hub-ec2-ssm` got inline S3 policy; keys removed from `.env.prod`)
- [x] **Legal / data-protection setup** — UA + EU/GDPR. `/privacy` + `/terms` pages live (Next.js, `LegalLayout` in landing module), linked in footer, public via middleware `alwaysPublicPaths`. Covers controller, data inventory, Art. 6 bases, processors (AWS/Google/SMTP), retention, rights, **deletion by email request** (no self-serve endpoint yet — known gap). Placeholders for controller name/contact email still to fill; get a lawyer review before relying on it.
- [x] **Real SMTP — AWS SES** (`eu-north-1`). Domain `auctionshub.net` verified: DKIM (3× CNAME) + custom MAIL FROM (`mail.auctionshub.net`, MX+SPF) + DMARC, all SUCCESS. Code made provider-agnostic: `secure` derived from port (465 vs 587), `from` via new `EMAIL_FROM`. Prod `.env` → host `email-smtp.eu-north-1.amazonaws.com`, port 587, **SMTP** creds (not the IAM user name — must be the `AKIA…` SMTP username). **Pending:** AWS asked for more use-case detail on the production-access request (still in sandbox → only verified recipients until granted).
- [x] Fill real values in `.env` (domain in `APP_DOMAIN`, SMTP, `EMAIL_FROM`, etc.)
- [x] Verify: no `<...>` placeholders left

## 4. First manual deploy ✅

- [x] Get code onto the server (`git clone` over HTTPS)
- [x] Place `.env` on the server (NOT via git)
- [x] `docker compose up -d --build` (default `docker-compose.yml` + auto-loaded `.env`)
- [x] Verify: `docker compose ps` — all services healthy/Up
- [x] Verify: reach api/client via `curl localhost` on the server
- Notes: prod uses instance IAM role for S3 (no keys); had to `down -v` once
  because pgdata kept the old DB password (postgres ignores POSTGRES_PASSWORD
  on an already-initialized volume). api & client now have healthchecks.

## 5. Domain ✅

- [x] Buy a domain — `auctionshub.net` (apex, no subdomain)
- [x] Add an **A record**: `@` (apex) → Elastic IP `51.21.146.183`, **DNS only (no proxy)**
- [x] Verify: `dig +short auctionshub.net` returns `51.21.146.183`

## 6. nginx + HTTPS ✅

- [x] Add an **nginx** service to `docker-compose.yml` (ports 80/443)
- [x] Remove `ports:` from `api` and `client` (now `expose` only — internal network)
- [x] Write `nginx.conf`: **`/socket.io/` → api:3000** (WS upgrade), everything else (pages + `/api` BFF) → `client:3001`. NOTE: `/api` is the Next.js BFF, NOT NestJS — it goes to client.
- [x] Bring nginx up on **80**, serve the ACME challenge
- [x] **Certbot** (HTTP-01): certificate obtained for `auctionshub.net` (expires 2026-09-22)
- [x] Enable the **443** server block, reload nginx (80 redirects → 443, keeps ACME location)
- [x] Set up **auto-renewal** (certbot renew loop every 12h + nginx reload every 6h)
- [x] Update `CLIENT_URL` / `NEXT_PUBLIC_APP_DOMAIN` / `NEXT_PUBLIC_WS_ORIGIN` to `https://auctionshub.net` (port-less; `/ws/room` appended in code)
- [x] Verify: `https://auctionshub.net` loads, WebSocket bidding works

## 7. CloudFront for images ✅

- [x] Create a **CloudFront distribution** over the private S3 bucket (`auction-hub-images`)
- [x] Configure **OAC** (Origin Access Control) to read the private bucket (wizard auto-applied the bucket policy)
- [x] Set the CloudFront domain in `STORAGE_PUBLIC_URL` (+ `STORAGE_FORCE_PATH_STYLE=false`)
- [x] Verify: a lot image loads through the CloudFront URL
- Code: `getPublicUrl` is path-style-aware (no bucket in path for S3/CloudFront). Bucket CORS updated to allow `https://auctionshub.net` for presigned PUT uploads.

## 8. CI/CD + closed SSH ✅

**Approach:** build images in CI → push to **ECR** → instance pulls (build off the prod box).
Manual trigger (workflow_dispatch). Full AWS wiring in `docs/deploy/ci-cd-oidc-setup.md`.

- [x] Repo-side: `.github/workflows/deploy.yml` (OIDC → build+push to ECR → SSM deploy), `scripts/deploy.sh` (ECR login + `docker compose pull` + restart), `docker-compose.yml` api/client now `image:` (build kept as fallback), `ECR_REGISTRY` in `.env`.
- [x] **OIDC** identity provider + `github-actions-deploy` role (Web-identity wizard; trust scoped to `NativeJedi/auction-hub-app` `main`) + inline policy (ECR push + SSM)
- [x] 2 **ECR repos** (`auction-hub-server`, `auction-hub-client`) + lifecycle (keep last 5); `AmazonEC2ContainerRegistryReadOnly` on the instance role
- [x] Instance prep: `usermod -aG docker ssm-user`, **install AWS CLI v2** (was missing → `aws: command not found`), `ECR_REGISTRY` in `.env`. Gotcha: `chmod +x deploy.sh` made git see a mode change → `git restore` before pull. Script invoked via `bash`, so +x not needed; deploy.sh hardens `PATH` for snap-installed aws.
- [x] GitHub secrets (`AWS_DEPLOY_ROLE_ARN`, `EC2_INSTANCE_ID`) + variables (`NEXT_PUBLIC_*`)
- [x] Verify: **Run workflow** builds → pushes to ECR → deploys; port 22 still closed, no SSH

## 9. Backups

Repo-side ready (`scripts/backup-db.sh`, `BACKUP_BUCKET` in `.env`); AWS wiring in `docs/deploy/backups-setup.md`.

- [ ] Cron `pg_dump` (via `docker compose exec -T db`) → a separate S3 backup bucket — create bucket (private + lifecycle expire 30d), add S3 inline policy to instance role, set `BACKUP_BUCKET` in `.env`, install cron (03:00 UTC as ssm-user)
- [ ] EBS snapshots via Data Lifecycle Manager (tag-targeted, daily, keep 7)
- [ ] **Test a restore** from a backup at least once (throwaway-container drill in the doc)

## 10. Cost + operations

- [ ] Budgets alerts at 50/80/100% (confirm they're active)
- [ ] Basic monitoring (CloudWatch + `docker logs`)
- [ ] Habit: `docker system prune` (keep logs/images from filling the disk)
- [x] `restart: unless-stopped` in prod compose

---

## Dependencies (ordering)

- TLS (6) requires EC2 (1) + domain (5)
- CloudFront (7) is independent — can run in parallel
- CI/CD (8) — only after the manual deploy (4) works
- **Minimum to be live:** 1 → 2 → 3 → 4 → 5 → 6
- Steps 7–10 make the prod setup "grown-up"
