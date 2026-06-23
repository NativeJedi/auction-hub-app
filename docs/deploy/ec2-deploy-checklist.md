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

## 3. Production secrets

- [x] Generate **fresh JWT secrets** (not the dev ones)
- [x] **Rotate the AWS access key** from the old `.env.prod` (old IAM key deleted)
- [x] Move app S3 access to the **instance IAM role** (code: keys optional → SDK uses instance role; `auction-hub-ec2-ssm` got inline S3 policy; keys removed from `.env.prod`)
- [ ] **Set up a real SMTP server** (replace Mailtrap sandbox `sandbox.smtp.mailtrap.io` — it only captures, never delivers). Pick a provider (Mailtrap Production / AWS SES / Postmark / etc.), fill `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASSWORD`, verify a real invite email is delivered
- [ ] Fill real values in `.env` (domain in `CLIENT_DOMAIN`, SMTP, etc.)
- [ ] Verify: no `<...>` placeholders left

## 4. First manual deploy ✅

- [x] Get code onto the server (`git clone` over HTTPS)
- [x] Place `.env` on the server (NOT via git)
- [x] `docker compose up -d --build` (default `docker-compose.yml` + auto-loaded `.env`)
- [x] Verify: `docker compose ps` — all services healthy/Up
- [x] Verify: reach api/client via `curl localhost` on the server
- Notes: prod uses instance IAM role for S3 (no keys); had to `down -v` once
  because pgdata kept the old DB password (postgres ignores POSTGRES_PASSWORD
  on an already-initialized volume). api/client have no healthcheck → show `Up`.

## 5. Domain

- [ ] Buy a domain (Route 53, or Cloudflare/Namecheap — cheaper)
- [ ] Add an **A record**: `auction.<domain>` → Elastic IP
- [ ] Verify: `dig auction.<domain>` returns the Elastic IP

## 6. nginx + HTTPS

- [ ] Add an **nginx** service to `docker-compose.yml` (ports 80/443)
- [ ] Remove `ports:` from `api` and `client` (keep them on the internal network)
- [ ] Write `nginx.conf`: `/api` + `/ws/room` → `api:3000` (with WebSocket upgrade), everything else → `client:3001`
- [ ] Bring nginx up on **80**, serve the ACME challenge
- [ ] **Certbot** (HTTP-01): obtain the certificate for the domain
- [ ] Enable the **443** server block, reload nginx
- [ ] Set up **auto-renewal** (`certbot renew` + nginx reload)
- [ ] Update `CLIENT_URL` / `NEXT_PUBLIC_SITE_URL` to `https://<domain>`
- [ ] Verify: `https://<domain>` loads, WebSocket bidding works

## 7. CloudFront for images

- [ ] Create a **CloudFront distribution** over the private S3 bucket
- [ ] Configure **OAC** (Origin Access Control) to read the private bucket
- [ ] Set the CloudFront domain in `STORAGE_PUBLIC_URL`
- [ ] Verify: a lot image loads through the CloudFront URL

## 8. CI/CD + closed SSH

- [ ] Set up **OIDC** between GitHub Actions and AWS (no long-lived keys)
- [ ] Add a deploy job to Actions: pull code + restart via **SSM Run Command**
- [ ] Verify: pushing to `main` deploys automatically
- [ ] Verify: port 22 is still closed, deploy runs without SSH

## 9. Backups

- [ ] Cron `pg_dump` (via `docker compose exec db`) → a separate S3 backup bucket
- [ ] EBS snapshots via Data Lifecycle Manager
- [ ] **Test a restore** from a backup at least once

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
