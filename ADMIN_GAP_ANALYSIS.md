# Admin capability review and implementation

Reviewed the existing frontend routes, shared game/API state, admin components, Go routing/auth middleware, admin repositories, financial services, engine/realtime code, migrations, tests, and generated Swagger. Existing React pages and styling were extended, not replaced. Production admin pages already used real APIs; test fixtures are intentionally mocked browser responses, not application demo data.

| Requested area | Existing implementation | Work completed |
| --- | --- | --- |
| Overview metrics | `/admin`, `/api/admin/overview` | Preserved; corrected player wallet liability to exclude ADMIN balances. |
| Users, user detail, status actions | List/detail pages, server-side ADMIN checks, audited PATCH status action | Preserved and tested authorization, status restrictions, filtering and pagination. |
| Wallet adjustments | Reviewed credit/debit form, transaction, ledger, idempotency reference and audit record | Preserved; concurrency and overdraft tests pass. |
| Bets | Paginated backend list and frontend table | Preserved. Player bet API now supplies payout estimates and action permissions. |
| Auto bets | Browser-triggered automatic placement; no durable settings/API/admin list | Added persistent settings, backend worker, per-round transaction-safe execution, player settings API, and `/admin/auto-bets`. |
| Auto cashouts | Unsupported | Added persisted per-bet targets, backend execution, target payout and risk cap enforcement, execution source, and `/admin/auto-cashouts`. |
| Rounds, current game status | Round list/detail, protected current-game API, WebSocket monitor | Preserved; server supplies countdown seconds and phase. UI no longer decrements time or starts rounds locally. |
| Current/upcoming round, countdown, multiplier | Server events plus client countdown math | Removed client timing; REST and WebSocket values drive the views. Expired flights stay inactive. |
| Deposits and withdrawals | Real database lists and filters | Preserved. External provider completion is not simulated. |
| Wallet transactions | Paginated filtered ledger | Preserved. |
| Revenue, GGR, RTP, house margin | PostgreSQL aggregates over settled rounds | Preserved and tested; cancelled/unresolved bets excluded. |
| Player wallet liability | Included all account balances | Changed aggregation to PLAYER accounts only; regression tested with a funded ADMIN. |
| Daily/period charts | Chart.js using backend daily aggregates and date filters | Preserved. Display conversions do not calculate business outcomes. |
| Redis/PostgreSQL health, WebSocket count, engine leader | `/api/admin/game/status`, instance metrics and Redis lease presence | Preserved. See monitoring limitations below. |
| Safe configuration display | Read-only redacted `/api/admin/config` | Preserved; no credentials or editable runtime engine controls added. |
| Admin audit logs | Written by mutations, but not browsable | Added ADMIN-only API and page with administrator/user/action/reference/date filters and pagination. |
| Provably fair round details | Redacted round detail; browser fairness arithmetic | Preserved commitment/reveal details; added backend verification API using the original Go fairness algorithm. |
| Search, filters, pagination | Backend pagination, user search, per-resource filters | Extended to automatic-operation and audit lists; browser and database tests cover filters. |
| API documentation | Existing admin and game Swagger | Regenerated `docs.go`, `swagger.json`, and `swagger.yaml` for new routes/contracts. |

## Backend routes added

- `GET /api/admin/auto-bets`: persisted automatically placed bets; user, round, status, date and pagination filters.
- `GET /api/admin/auto-cashouts`: bets with configured targets, results and MANUAL/AUTO execution source; same filters.
- `GET /api/admin/audit-logs`: administrator actions; actor, user, action, reference, date and pagination filters.
- `GET /api/bets/auto`: the authenticated user's two automatic settings.
- `PUT /api/bets/auto/{panel}`: enable/disable/update the authenticated user's settings for panel 1 or 2.
- `GET /api/game/rounds/{id}/verify`: verify a settled round's recorded seed commitment and crash result.

Extended contracts:

- `POST /api/bets` accepts an optional decimal-string `auto_cashout_multiplier`.
- `GET /api/bets` includes server-calculated `potential_payout`, `can_cancel`, `can_cashout` and persisted target.
- Current-round snapshots include `phase` and `seconds_remaining`.
- `ROUND_OPENED` and `COUNTDOWN` carry server countdown seconds. `ROUND_STARTED` reports the starting multiplier.

## Frontend changes

Added `/admin/auto-bets`, `/admin/auto-cashouts`, and `/admin/audit-logs` to the existing navigation/table/filter design. Existing user status and wallet adjustment actions remain server-backed and audited. Added player controls for server auto-bet settings and per-bet cashout targets. Automatic settings explain that execution continues offline. Fairness verification calls the backend.

The frontend retains form drafts, loading/error states, API polling/reconnection, and visual rendering. It no longer executes automatic bets, counts down independently, calculates payouts, or marks unresolved bets as losses based on a client assumption. All money and eligibility decisions remain protected on the backend, regardless of UI controls.

## Migration and rollout

Added `000002_auto_bet.up.sql` and its down migration. The up migration adds `auto_bet_settings` and `bets.auto_cashout_multiplier`, `bets.is_auto`, and `bets.cashout_source`. Existing balances and bets are preserved. Both migration directions were tested on isolated schemas.

Run the existing backend migration command (`go run ./cmd/migrate`, with the intended DATABASE_URL configured) and rebuild/restart the backend before serving this frontend. The migration was exercised in temporary test schemas, not applied to the running application database. Existing `.env` and Docker Compose edits were preserved.

## Security and verification

All registered `/api/admin/*` routes are behind backend authentication and current database ADMIN-role checks. Tests verify unauthenticated 401, PLAYER 403, ADMIN access, role revocation, audited money/status actions, filters, and secret redaction. Player automation settings and bets are scoped to the authenticated user; payloads cannot select another owner. Running-round seeds and crash points are not returned before their allowed reveal states.

The Go suite includes isolated PostgreSQL tests for lifecycle recovery, simultaneous automatic workers, duplicate debit/payout prevention, persisted settings across service restart, disabled/failed automatic settings, cashout deadlines, user isolation, server payout values, and verification availability after settlement. Browser tests cover API-driven countdowns, automation settings, manual cashout targets, backend-provided payout amounts, existing admin actions, routes and audit filters. Frontend build and lint are checked separately.

## Remaining limitations

- MTN MoMo and external withdrawal-provider integrations remain pending; no fake provider-success controls were introduced.
- Automatic cashout is evaluated by backend workers at processing time. It pays the saved target only before the authoritative crash boundary; outages or delays can miss a target, without retroactive payouts.
- Automatic betting continues until disabled, even when logged out or offline. A failed automatic attempt disables that panel's setting and records a public error. Existing cancelled bet slots cannot be reused within the same round.
- Runtime configuration is intentionally read-only. Admin account creation/promotion stays with the database operator; there are no default admin credentials.
- WebSocket counts describe the responding instance. Redis lease presence is a leadership indicator, not proof of engine progress. Redis Pub/Sub has no durable replay; REST snapshots/history provide recovery.
- Public player/leaderboard aggregates remain unavailable. Admin lists are paginated; player history remains bounded.
