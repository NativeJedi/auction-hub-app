# 🏦 Auction Hub

**Auction Hub** is a simple server and client app for creating auctions, managing lots, and running real-time bidding rooms.

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

### E2E Tests
```bash
npm run test:e2e
```

### 📦 Environment Variables

Set these variables in your `docker-compose.yml` or `.env` file:

API variables:

| Variable                              | Description                                              |
| ------------------------------------- | -------------------------------------------------------- |
| `DATABASE_URL`                        | PostgreSQL connection URL with credentials               |
| `REDIS_URL`                           | Redis connection URL                                     |
| `PORT`                                | Server port                                              |
| `NODE_ENV`                            | Environment (`development` or `production`)              |
| `JWT_ACCESS_SECRET`                   | Access token secret for the admin app (TTL = 15 minutes) |
| `JWT_REFRESH_SECRET`                  | Refresh token secret for the admin app (TTL = 2 days)    |
| `JWT_ROOM_MEMBER_INVITE_TOKEN_SECRET` | Secret for room member invite token (TTL = 15 minutes)   |
| `JWT_ROOM_MEMBER_TOKEN_SECRET`        | Secret for room member token (TTL = 1 day)               |
| `EMAIL_HOST`                          | Email server host                                        |
| `EMAIL_PORT`                          | Email server port                                        |
| `EMAIL_USER`                          | Email server user                                        |
| `EMAIL_PASSWORD`                      | Email server password                                    |

Client variables:

| Variable                               | Description          |
|----------------------------------------|----------------------|
| `NEXT_PUBLIC_API_WEBSOCKET_URL`        | Websocket url of API |
| `API_URL`                              | URL of API           |


## 📚 Tech Stack
- NestJS — server framework
- PostgreSQL + TypeORM — database
- Redis — caching and pub/sub for real-time events
- Socket.IO — WebSocket communication for auctions
- JWT — authentication & authorization
- Docker Compose — local development environment

## 📄 API Documentation

You can explore the API endpoints using Swagger:  
http://localhost:3000/api/v1

## 📌 TODO
- [ ] Add unauth middlewares to client
- [ ] Add loading states / validation to client
- [ ] Add breadcrums navigation to client
- [ ] Add pagination to lots list
- [ ] Add finish auction status
- [ ] Block action edit by status
- [ ] Add lot images upload
- [ ] Add events throttling to avoid race condition
- [ ] Add normal JWT refresh token rotation
