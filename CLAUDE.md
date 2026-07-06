# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo auction platform with real-time bidding. Two workspaces:
- `client/` — Next.js 15 + React 19 frontend
- `server/` — NestJS 11 backend

Infrastructure (Docker): PostgreSQL 16, Redis Stack, MinIO (S3-compatible storage); Nginx reverse proxy in production. Sentry error tracking on both client and server.

Docs: C4 diagrams in `docs/c4/`, feature specs and ADRs in `docs/features/`, feature list in `README.md`.

## Commands

### Root (Docker-based dev environment)
```bash
npm run dev          # Start full stack with Docker Compose
npm run prod         # Production build
npm run test:e2e     # E2E tests
npm run migration:generate  # Generate TypeORM migration
npm run lint         # ESLint (client + server)
npm run format       # Prettier (client + server)
npm run test         # Unit tests (client + server)
npm run typecheck    # TypeScript check (client + server)
```

### Client (`cd client`)
```bash
npm run dev          # Next.js dev server with Turbopack (port 3001)
npm run build        # Production build
npm run lint         # ESLint (next lint)
npm run format       # Prettier
npm run test         # Vitest unit tests (run mode)
npm run typecheck    # tsc --noEmit --project tsconfig.test.json
```

### Server (`cd server`)
```bash
npm run start:dev    # NestJS watch mode (port 3000)
npm run build        # Compile TypeScript
npm run lint         # ESLint
npm run format       # Prettier
npm run test         # Jest unit tests
npm run typecheck    # tsc --noEmit
npm run test:e2e     # E2E tests (Testcontainers)
npm run migration:run   # Run pending migrations
```

### Running a single server test
```bash
cd server && npx jest --testPathPattern="<filename>"
```

## Architecture

### Client-Server Communication
- **REST API**: `http://localhost:3000/api/v1` — Swagger docs at `/api/v1/docs`
- **WebSocket**: Socket.io namespace `/ws/room`, authenticated via token in `handshake.auth`
- **Auth**: JWT Bearer tokens on HTTP (access + refresh with rotation); Google Sign-In (GIS, verified server-side by `GoogleAuthService`); room-scoped tokens stored in `localStorage` as `room:${auctionId}:token`. Rooms are identified by `auctionId` (see ADR FEAT-002).

### Room Engine (client-side state management)
The core client pattern lives in `client/src/modules/room-engine/`. It's an OOP state machine that integrates directly with React via `useSyncExternalStore`.

- **`RoomEngine<TData>`** (`core/RoomEngine.ts`) — Abstract base: lifecycle state (isLoading, error), socket connection, `subscribe()` for React
- **`AdminRoomEngine`** — Full control: lots, bids, members, invites; actions: `nextLot()`, `finishAuction()`, `sendInvite()`
- **`MemberRoomEngine`** — Bidder view: `placeBid()`, computed `leadingBid`, `isWinning`
- **`PublicRoomEngine`** — Read-only viewer

Each engine has a matching React Context Provider and `useXxxRoom()` hook. Components never touch sockets directly.

### Server Module Structure
```
server/src/modules/
├── room/        # Core: controller (REST) + gateway (WebSocket) + service + repository
├── auth/        # JWT guards, token service, GoogleAuthService, throttler
├── auctions/    # Auction CRUD
├── lots/        # Lot management
├── buyers/      # Buyer records
├── email/       # Nodemailer invite / confirmation emails
├── users/       # User accounts
├── storage/     # AWS S3 / MinIO presigned uploads
├── pagination/  # Pagination DTO + decorator
└── redis/       # Redis client + repositories
```

Config: `server/src/config/app.config.ts` — Zod-validated env, fails fast on boot.

### Real-Time Broadcasting Pattern
`RoomGateway` uses Socket.IO rooms with the Redis adapter (`@socket.io/redis-adapter`, wired in `server/src/redis-io.adapter.ts`) for multi-instance fanout:
- Room-level: `room:${auctionId}` (all participants)
- User-level: `room:${auctionId}:${userId}` (admin-only personal channel: `newInvite`, `newMember`)

Bid flow: client socket → `RoomGateway` handler → `RoomService` → Redis store → `publishRoomEvent()` emits `newBid` → all instances broadcast via the Redis adapter.

### API Client (client-side)
`client/src/api/` — fetch-based wrappers, no Axios:
- `clientFetch.ts` — browser fetch via the BFF `/api` proxy (normalizes errors, redirects on 401)
- `serverFetch.ts` — server-side fetch to the NestJS API with JWT from session
- `makeSCRequest.ts` / `makeSARequest.ts` — wrappers for Server Components / Server Actions that map errors to `redirect()` / `notFound()` / `ApiError`
- `requests/`, `actions/`, `dto/` — endpoint definitions, server actions, shared DTOs

Next.js API routes in `client/app/api/` (auctions, auth, room) act as a BFF proxy, forwarding requests to the NestJS server with server-side auth. Sessions are managed in Redis via `client/src/services/session/`.

### Client Module Structure
```
client/src/modules/
├── room-engine/    # Admin / Member / Public engines (see above)
├── google-auth/    # GIS loader, GoogleSignInButton, useGoogleSignIn
├── forms/ modals/ notifications/ tables/  # UI modules
├── landing/        # Marketing landing page
└── sentry/         # Sentry init (client / server / edge)
```

## Key Conventions

- **TypeScript strict** throughout both workspaces
- **Zod + React Hook Form** for all client-side forms
- **class-validator + class-transformer** for all server DTOs
- **Guards via decorators** on WebSocket handlers: `@RoomRoles(RoomRole.ADMIN)` restricts gateway events
- **Redis** holds active auction state (bids, current lot); PostgreSQL persists finalized records
- **Tailwind CSS 4 + shadcn/ui** for styling and accessible primitives
