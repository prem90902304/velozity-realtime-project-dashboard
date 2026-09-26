# Velozity Global Solutions — Real-Time Client Project Dashboard

A TypeScript full-stack project management dashboard built for the technical hiring assessment.

## Live Demo

🚀 **Live Dashboard:**  
https://velozity-realtime-project-dashboard.vercel.app

💻 **GitHub Repository:**  
https://github.com/prem90902304/velozity-realtime-project-dashboard

## Stack

- React + TypeScript + Vite
- Node.js + Express + TypeScript
- PostgreSQL + Prisma
- Socket.IO WebSockets
- JWT access token + rotating refresh token in an HttpOnly cookie
- Zod server-side validation
- node-cron overdue scheduler

## Architecture

`client/` contains the React SPA. `server/` is a layered Express API. Controllers validate requests and delegate database work to Prisma. Socket.IO is initialized beside the HTTP server and uses authenticated sockets plus project/user rooms.

### Why Socket.IO?

Socket.IO provides authenticated connections, rooms, reconnect behavior and event broadcasting with less infrastructure code than native WebSocket.

It is used only for real-time delivery; activity history remains in PostgreSQL.

### Auth / Token Storage

The short-lived access token is held in React memory and sent as a Bearer token.

The long-lived refresh token is stored only in an HttpOnly cookie scoped to `/api/auth`.

Refresh rotates the token and invalidates the previous database record.

### RBAC

Authorization is enforced at API level.

- PM project queries are constrained by `creatorId`.
- Developer task/activity queries are constrained by `developerId`.
- Task status mutations verify resource ownership before updating.
- Frontend hiding is not used as the security boundary.

### Background Job

`node-cron` checks overdue tasks every five minutes.

Overdue status is written by the scheduler, not calculated during page rendering.

### Indexing

Indexes cover:

- Project ownership/client
- Task project/developer/status/priority/due date
- Activity project/user/task plus time
- Unread notifications by user

These are the primary filtering and feed access patterns.

## Local Setup

### Prerequisites

- Node.js
- npm
- Docker Desktop
- Git

### 1. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 2. Backend

Create `server/.env` with the required database and JWT environment variables.

Then run:

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

API: `http://localhost:4000`

### 3. Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Frontend: `http://localhost:5173`

## Seed Accounts

Password for every seed account:

`Password123!`

- Admin: `admin@demo.com`
- PM 1: `pm1@demo.com`
- PM 2: `pm2@demo.com`
- Developers: `dev1@demo.com` through `dev4@demo.com`

The seed creates three projects, six tasks per project, mixed statuses/priorities, overdue tasks, activity records and notifications.

## API Highlights

### Authentication

- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### Projects

- `GET /api/projects`
- `POST /api/projects`

### Tasks

- `GET /api/tasks?status=&priority=&from=&to=`
- `POST /api/tasks`
- `PATCH /api/tasks/:id/status`

### Activity

- `GET /api/activity?projectId=`

### Notifications

- `GET /api/notifications`
- `PATCH /api/notifications/:id/read`
- `POST /api/notifications/read-all`

### Dashboard

- `GET /api/dashboard`

All API errors use:

```json
{
  "error": {
    "code": "...",
    "message": "..."
  }
}
```

Validation is performed server-side.

## Docker / Deployment

The included Compose file runs PostgreSQL.

For production:

- Deploy the React SPA to Vercel.
- Run the persistent Express + Socket.IO process on a Node-compatible host.
- Use a managed PostgreSQL service.
- Set production environment variables instead of committing secrets.

### Production Application

**Frontend:**  
https://velozity-realtime-project-dashboard.vercel.app

**Backend:**  
https://velozity-realtime-dashboard-api-8m9q.onrender.com

## Known Limitations

- The UI intentionally focuses on the assessment's core dashboard/task/feed flows; administrative CRUD screens can be expanded without changing the authorization model.
- Socket presence is process-local; a multi-instance deployment should use a Socket.IO Redis adapter for cross-instance presence/events.
- Refresh-token cleanup can be moved to a scheduled maintenance job for very large installations.

## 150–250 Word Explanation

The hardest problem was keeping the real-time activity feed both live and correctly scoped by role. I treated PostgreSQL as the source of truth instead of relying on a socket-side cache. Every task status change is performed through an authenticated API request and written in a transaction together with an ActivityLog row. Only after the database write succeeds is a Socket.IO event emitted to the relevant project room. Socket connections are authenticated with the same JWT claims used by the API, and room membership is checked against the database so a developer cannot subscribe to an unrelated project. API queries apply the same ownership rules independently, which means changing a token or calling an endpoint directly does not bypass authorization.

For reconnects, the client can fetch the latest permitted activity rows from PostgreSQL, so missed events are recoverable even when the server process has restarted. Notifications follow the same model: assignment and In Review transitions create database records first and then emit a user-scoped WebSocket event. The overdue scheduler is deliberately separate from request handling and marks overdue tasks every five minutes with node-cron.

If I were doing this for a larger production deployment, I would introduce a Redis adapter/queue so WebSocket presence and scheduled work remain coordinated across multiple backend instances.
