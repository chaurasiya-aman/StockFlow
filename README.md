# StockFlow

StockFlow is a small inventory app for one user and one organization. It supports account signup/login, product management, stock thresholds, and a low-stock dashboard.

## Requirements

- Node.js 22 or newer
- npm

## Run locally on Windows

Open two Command Prompt windows from the project root.

### Backend

```cmd
cd backend
npm install
copy .env.example .env
```

Edit `backend/.env` and replace `JWT_SECRET` with a random secret. Then initialize the database and start the API:

```cmd
npx prisma migrate dev --name init
npx prisma generate
npm run dev
```

The API runs at `http://localhost:8080`. SQLite stores data in `backend/dev.db`.

### Frontend

In the second Command Prompt:

```cmd
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## MVP features

- Signup creates an organization and its first user; login uses email and password.
- Products can be added, searched, viewed, edited, and deleted.
- Product SKU values must be unique within their organization.
- Each product may have its own low-stock threshold; otherwise the organization default of 5 is used.
- The Settings page lets the organization change its default low-stock threshold.
- The dashboard shows total products, total quantity, and products at or below their threshold.
- Product and dashboard API queries are scoped to the organization in the authenticated token.

## Scope notes

The MVP does not include password reset, staff invitations, stock movement history, multi-warehouse support, or external integrations.

## Deploy to Render

Deploy the backend and frontend as separate Render services.

### Backend web service

Create a Node web service from this repository with root directory `backend`, build command `npm install && npm run build`, and start command `npm start`. The start script applies Prisma migrations before starting Express.

Attach a persistent disk to the backend service at `/var/data`, then set these environment variables:

- `DATABASE_URL=file:/var/data/stockflow.db`
- `JWT_SECRET` to a generated random secret
- `CLIENT_URL` temporarily to `http://localhost:5173`; replace it with the deployed frontend URL after creating the static site
- `NODE_VERSION=22.23.4`

Render supplies `PORT` automatically. Do not run migrations in the build command: Render disks are only available to the running service.

### Frontend static site

Create a Render static site from the same repository with root directory `frontend`, build command `npm install && npm run build`, and publish directory `dist`. Set `VITE_APP_URL` to `https://<your-backend>.onrender.com/api` and `NODE_VERSION=22.23.4`.

Add a rewrite rule with source `/*`, destination `/index.html`, and action **Rewrite** so React Router routes work when opened directly. Then update the backend's `CLIENT_URL` to the exact deployed frontend URL and redeploy the backend.

**SQLite persistence requires a paid Render web service with a persistent disk.** Render's default filesystem is temporary, and free web services cannot attach persistent disks. If you need a free persistent database, switch this project to a managed PostgreSQL database before deployment.
