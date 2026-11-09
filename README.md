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
