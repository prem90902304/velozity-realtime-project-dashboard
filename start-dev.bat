@echo off
start "Postgres" cmd /k "docker compose up postgres"
start "Backend" cmd /k "cd server && npm install && npx prisma generate && npx prisma migrate dev --name init && npm run seed && npm run dev"
start "Frontend" cmd /k "cd client && npm install && npm run dev"
