# Auction Hub — C4 Architecture Diagrams

## Level 1: System Context

```mermaid
graph TD
    Owner -->|Creates auction,\n Start/stop auction,\n Manage lots| AuctionSystem
    Bidder -->|Join auction room,\n places bids| AuctionSystem
    AuctionSystem -->|Sends invite emails| EmailServer
    AuctionSystem -->|Uploads / serves lot images | S3Bucket
```

## Level 2: Container

```mermaid
graph TD

%% Actors
    Owner[Auction Owner]
    Bidder[Bidder]

%% Client layer
    Browser[Browser Client UI]
    BFF[Next.js BFF - SSR + API proxy]

%% Backend
    API[NestJS API - REST + WebSocket]

%% Data
    Postgres[(PostgreSQL)]
    Redis[(Redis)]
    S3[S3 / MinIO]
    Email[Email Server]

%% User interaction
    Owner -->|uses CRM| Browser
    Bidder -->|joins auction| Browser

%% Client flow
    Browser -->|HTTP| BFF
    BFF -->|HTTP / WS| API

%% Session handling
    BFF -->|session storage| Redis

%% Backend data
    API -->|read/write| Postgres
    API -->|runtime state, pub/sub| Redis

%% External integrations
    API -->|send emails| Email
    API -->|generate presigned URL| S3

%% Direct upload
    Browser -->|upload via presigned URL| S3
```

## Level 3: Component — NestJS API
```mermaid
graph TD

%% Layers
HTTP[HTTP API Layer<br/>Controllers]
WS[WebSocket Gateway]

ENGINE[RoomEngine<br/>Runtime State Machine]

REDIS_REPO[RedisStateRepository]

PERSISTENCE[Persistence Layer<br/>Users / Auctions / Lots / BidHistory]

INFRA[Infrastructure Services<br/>Email / Storage]

%% Databases
Redis[(Redis)]
Postgres[(PostgreSQL)]
Email[Email Server]
S3[S3 / MinIO]

%% Flows

%% HTTP (CRUD)
HTTP -->|CRUD operations| PERSISTENCE

%% WS → Engine
WS -->|join / placeBid / control| ENGINE

%% Engine → State
ENGINE -->|read/write state| REDIS_REPO
REDIS_REPO -->|store state| Redis

%% Engine → DB
ENGINE -->|persist results / audit| PERSISTENCE
PERSISTENCE -->|SQL| Postgres

%% Engine → WS
ENGINE -->|broadcast updates| WS

%% Engine → Infra
ENGINE -->|send emails / manage files| INFRA
INFRA -->|SMTP| Email
INFRA -->|S3 API| S3
```

## Level 3: Component — Next.js Client

```mermaid
graph TD

%% UI
    UI[Browser UI<br/>CRM / Auth / Room]

%% BFF
    BFF[Next.js BFF<br/>SSR + API Proxy]

    Middleware[Middleware<br/>Auth / Redirects]
    Session[Session Service]

%% API clients
    ApiServer[API Server Client<br/>JWT]
    ApiClient[API Browser Client<br/>/api proxy]

%% Realtime
    Socket[WebSocket Client]

%% UI modules
    UIX[UI Modules<br/>Forms / Modals / Toasts]

%% External
    Redis[(Redis)]
    API[NestJS API]

%% Flow

%% Browser → BFF
    UI -->|SSR / navigation| BFF

%% Middleware
    Middleware -->|check session| Session

%% Sessions
    BFF -->|uses| Session
    Session -->|read/write| Redis

%% API (server)
    BFF --> ApiServer
    ApiServer -->|HTTP + JWT| API

%% API (client)
    UI --> ApiClient
    ApiClient -->|/api proxy| BFF

%% WebSocket
    UI --> Socket
    Socket -->|WS| API

%% UI modules
    UI --> UIX
```
