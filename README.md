# 🏦 Auction Hub

**Auction Hub** is a server and client app for creating auctions, managing lots, and running real-time bidding rooms.

## 🚀 Flow

1. 👤 **Owner** registers in the system
2. 🏷️ Creates an **auction**
3. 📦 Adds **lots**
4. 🏠 Creates a **room** for bidding
5. 🙋‍♂️ **Bidders** join the room
6. 📝 Bidders register
7. 📧 Bidders confirm their invite via email
8. ▶️ Owner starts the auction
9. 💸 Bidders place bids
10. ⛔ Owner closes the auction

---

## ✨ Features

**Authorization**
- JWT, email confirmation, Google auth
- Token rotation: Client → BFF → API
- Roles system: admin / bidder / public
- BFF sessions in Redis

**CRM system**
- REST API for auctions & lots management
- Auction lifecycle: create → start → finish → restart
- Image upload from client to S3 via presigned URL

**Room bidding system**
- Live bidding: Socket.IO + Redis events fanout
- Joining by QR code
- Separate screens & roles: admin, bidder, public

**Frontend**
- BFF pattern with SSR — Next.js 15
- SEO landing page
- Tailwind + shadcn/ui design system

**Backend & Infra**
- NestJS API, strict TypeScript
- CI/CD: GitHub Actions, automated deploy via ECR to EC2
- Docker + Nginx
- SMTP emails

**Monitoring & Quality**
- Sentry monitoring, Pino logging
- Postgres backup to S3 via cron
- Unit tests: Jest / Vitest

## ⚙️ Running

### Requirements
- Node.js 18+
- Docker

### Development
```bash
npm run dev
```

Go to http://localhost:3001/crm/auth to access the app

### Production
```bash
npm run prod
```

### 📦 Environment Variables

Copy `.env.example` to `.env` and fill in the values — it is the single source of truth with detailed comments for every variable. Summary:

General:

| Variable     | Description                                                    |
| ------------ | -------------------------------------------------------------- |
| `APP_DOMAIN` | Public origin (compose-level; `CLIENT_URL` etc. derive from it) |
| `NODE_ENV`   | Environment (`development` or `production`)                     |
| `LOG_LEVEL`  | Pino log level (`fatal`…`trace`, default `info`)                |

API variables:

| Variable                              | Description                                                       |
| ------------------------------------- | ----------------------------------------------------------------- |
| `DATABASE_URL`                        | PostgreSQL connection URL with credentials                        |
| `REDIS_URL`                           | Redis connection URL                                              |
| `PORT`                                | Server port (default 3000)                                        |
| `CLIENT_URL`                          | Client origin (CORS, links in emails)                             |
| `JWT_ACCESS_SECRET`                   | Access token secret for the admin app                             |
| `JWT_REFRESH_SECRET`                  | Refresh token secret for the admin app                            |
| `JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET` | Secret for room member invite token (TTL = 15 minutes)            |
| `JWT_ROOM_MEMBER_TOKEN_SECRET`        | Secret for room member token (TTL = 1 day)                        |
| `JWT_ACCESS_TTL`                      | Access token TTL in seconds (default 900 = 15 min)                |
| `JWT_REFRESH_TTL`                     | Refresh token TTL in seconds (default 172800 = 2 days)            |
| `EMAIL_HOST`                          | SMTP host (dev: Mailtrap sandbox, prod: Resend)                   |
| `EMAIL_PORT`                          | SMTP port (465 = implicit TLS, 587 = STARTTLS)                    |
| `EMAIL_USER`                          | SMTP user                                                         |
| `EMAIL_PASSWORD`                      | SMTP password / API key                                           |
| `EMAIL_FROM`                          | Envelope "From" address (must be on a verified domain)            |
| `STORAGE_ENDPOINT`                    | S3 endpoint (dev: MinIO, prod: AWS S3)                            |
| `STORAGE_ACCESS_KEY`                  | S3 access key (optional — falls back to IAM role on EC2)          |
| `STORAGE_SECRET_KEY`                  | S3 secret key (optional — falls back to IAM role on EC2)          |
| `STORAGE_BUCKET`                      | Bucket for lot images                                             |
| `STORAGE_REGION`                      | S3 region                                                         |
| `STORAGE_PUBLIC_URL`                  | Public URL for serving images (prod: CloudFront)                  |
| `STORAGE_UPLOAD_URL`                  | Browser-reachable endpoint for presigned PUT uploads              |
| `STORAGE_FORCE_PATH_STYLE`            | `true` for MinIO, `false` for AWS S3                              |
| `SENTRY_DSN`                          | Server-side Sentry DSN (optional; prod only)                      |

Client variables:

| Variable                       | Description                                                        |
| ------------------------------ | ------------------------------------------------------------------ |
| `API_URL`                      | Internal URL of the NestJS API (server-side / BFF)                 |
| `REDIS_URL`                    | Redis connection URL (session storage)                             |
| `NEXT_PUBLIC_WS_ORIGIN`        | WebSocket origin (scheme+host+port); `/ws/room` appended in code   |
| `NEXT_PUBLIC_APP_DOMAIN`       | Public site origin (sitemap, robots, Open Graph / canonical URLs)  |
| `NEXT_PUBLIC_SENTRY_DSN`       | Client-side Sentry DSN (optional; baked in at build time)          |

Shared (client + API):

| Variable                       | Description                                                        |
| ------------------------------ | ------------------------------------------------------------------ |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Web Client ID (GIS sign-in + server ID-token verification) |


## 📚 Tech Stack
- Next.js 15 + React 19 — client (SSR + BFF proxy)
- NestJS — server framework
- PostgreSQL + TypeORM — database
- Redis — runtime auction state, sessions, pub/sub for real-time events
- Socket.IO — WebSocket communication for auctions
- JWT + Google Sign-In — authentication & authorization
- MinIO / AWS S3 — lot image storage (presigned uploads)
- Sentry — error tracking (client + server)
- Docker Compose + Nginx — dev environment and production deployment

## 🏛️ Architecture

C4 diagrams (System Context → Container → Component): [docs/c4/С4.md](docs/c4/С4.md) (simplified graph version: [docs/c4/C4_graph.md](docs/c4/C4_graph.md))

## 📄 API Documentation

You can explore the API endpoints using Swagger:  
http://localhost:3000/api/v1/docs
