# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Monorepo auction platform with real-time bidding. Two workspaces:
- `client/` — Next.js 15 + React 19 frontend
- `server/` — NestJS 11 backend

Infrastructure (Docker): PostgreSQL 16, Redis 7, MinIO (S3-compatible storage).

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
- **Auth**: JWT Bearer tokens on HTTP; room-scoped tokens stored in `localStorage` as `room:${roomId}:token`

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
├── room/       # Core: controller (REST) + gateway (WebSocket) + service + repository
├── auth/       # JWT guards, token service
├── auctions/   # Auction CRUD
├── lots/       # Lot management
├── buyers/     # Buyer records
├── email/      # Nodemailer invite emails
├── users/      # User accounts
├── storage/    # AWS S3 / MinIO uploads
└── redis/      # Redis client + pub/sub repositories
```

### Real-Time Broadcasting Pattern
`RoomGateway` uses Redis pub/sub for multi-instance fanout:
- Room-level channel: `room:${roomId}`
- User-level channel: `room:${roomId}:${userId}`

Bid flow: client socket → `RoomGateway.handleBid()` → `RoomService.placeBid()` → Redis store → publish `newBid` → all subscribed clients update via socket event.

### API Client (client-side)
`client/src/api/` has two API clients:
- `auctions-api-client/` — Axios instance for the main REST API with three interceptors: auth (adds Bearer), data (extracts `.data`), error (normalizes errors)
- `auctions-api/` — Server-side fetch wrapper (used in Next.js route handlers / RSC)

Next.js API routes in `client/app/api/` act as a BFF proxy, forwarding requests to the NestJS server with server-side auth.

## Key Conventions

- **TypeScript strict** throughout both workspaces
- **Zod + React Hook Form** for all client-side forms
- **class-validator + class-transformer** for all server DTOs
- **Guards via decorators** on WebSocket handlers: `@RoomRoles(RoomRole.ADMIN)` restricts gateway events
- **Redis** holds active auction state (bids, current lot); PostgreSQL persists finalized records
- **Tailwind CSS 4 + shadcn/ui** for styling and accessible primitives
