# Aviator frontend

React and TypeScript client for the Aviator backend. Backend mode uses the REST API for authoritative account and bet operations and `/ws` for live round events. Demo mode remains available for isolated UI work.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the frontend folder structure, state ownership, and extension points.

## Local development

Start the backend from `P:\Aviator`, then run:

```powershell
npm install
npm run dev
```

The Vite proxy forwards `/api`, `/health`, and `/ws` to `http://localhost:7000` by default. Set `VITE_API_URL` and `VITE_WS_URL` when the backend is hosted elsewhere.

## Validation

```powershell
npm run lint
npm run build
npm test
```

The Playwright configuration starts the Vite development server automatically. The live smoke test is separate because it requires PostgreSQL, Redis, migrations, and the Go server:

```powershell
npm run test:live
```

See `P:\Aviator\LOCAL_SYSTEM.md` for the full local and Docker Compose workflow.

## Admin dashboard

Open `/admin` in backend mode. The dashboard shares the existing account session and validates admin access with the backend. It includes overview/charts, users/details, bets, rounds/details, deposits, withdrawals, wallet history, analytics, system monitoring, and read-only configuration. Admin links appear after signing in with an ADMIN account.

Apply the consolidated backend initial schema (or rebaseline an already upgraded database as documented) and promote your own development account using the operator SQL in `../Aviator/ADMIN.md`. There are no default admin credentials. Backend APIs enforce role checks independently of the route guard.

Charts use Chart.js, loaded with the admin route. API calls reuse the shared account client; wallet adjustments and status changes require confirmation. Run `npm run build`, `npm run lint`, and `npm test`. The admin suite is `tests/admin.spec.ts`.
