# Aviator frontend

React and TypeScript client for the Aviator backend. The client uses the REST API for authoritative account and bet operations and `/ws` for live round events.

The frontend displays server-supplied countdown seconds, multipliers, payouts and action availability. It does not run game timers, execute automatic bets, calculate winnings, or resolve bets. The backend persists automatic settings and executes bets and cashouts even when the browser is closed.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the frontend folder structure, state ownership, and extension points.

## Local development

Start the backend from `P:\Aviator`, then run:

```powershell
npm install
npm run dev
```

The Vite proxy forwards `/api`, `/health`, and `/ws` to `http://localhost:7000` by default. Set `BACKEND_URL` for the development proxy target or `VITE_API_BASE_URL` for a direct browser API/WebSocket origin.

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

Open `/admin`. The dashboard shares the existing account session and validates admin access with the backend. It includes overview/charts, users/details and actions, bets, auto bets, auto cashouts, audit logs, rounds/fairness details, deposits, withdrawals, wallet history, analytics, system monitoring, and read-only configuration. Admin links appear after signing in with an ADMIN account.

Apply the backend migrations, including `000002_auto_bet.up.sql`, and promote your own development account using the operator SQL in `../Aviator/ADMIN.md`. There are no default admin credentials. Backend APIs enforce role checks independently of the route guard.

Charts use Chart.js, loaded with the overview/analytics pages. API calls reuse the shared account client; wallet adjustments and status changes require confirmation. Run `npm run build`, `npm run lint`, and `npm test`. The admin suite is `tests/admin/admin.spec.ts`; player tests are in `tests/game/backend.spec.ts`.

See [ADMIN_GAP_ANALYSIS.md](ADMIN_GAP_ANALYSIS.md) for the capability audit, endpoints, migration details, verification, and remaining limitations.

## Admin access troubleshooting

Signing in authenticates an account; it does not grant administrator permissions. The backend requires both `role = ADMIN` and `status = ACTIVE`. The access screen identifies the signed-in email, explains 403 responses, and supports retry or signing in with another account. Expired sessions return to sign-in automatically.

A database operator can inspect the specific account with `SELECT id, email, role, status FROM users WHERE email = 'your-email@example.com';` and follow `../Aviator/ADMIN.md` to provision an administrator. The frontend never promotes users or bypasses this check.

See [FRONTEND_REFACTOR.md](FRONTEND_REFACTOR.md) for the complete ownership inventory and refactor decisions.
