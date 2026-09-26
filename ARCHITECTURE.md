# Frontend structure

`src/main.tsx` mounts `app/App.tsx`, which composes `AppProviders` and `AppRoutes`.

- `app/`: application composition, providers, and dialog selection.
- `routes/`: the existing single-screen entry. Wallet, account, history, help, and settings remain dialogs; no new URLs or router dependency were introduced.
- `pages/Game/`: composes the game features without owning the game engine.
- `layouts/`: the existing main shell and game columns.
- `features/`: game, betting, live bets, authentication, wallet, user, and settings components. Betting panel state and actions live in `betting/hooks/useBet.ts`.
- `components/ui/`: reusable modal and toggle. `components/shared/` contains the header and footer.
- `services/api.ts`: shared HTTP client and error handling. Feature `services/*.api.ts` files own endpoint calls; `services/backendApi.ts` composes them for the existing backend state owner.
- `services/socket.ts`: socket URL and creation. `BackendGameService` retains ownership of connection lifecycle, reconnection, polling, and reconciliation.
- `store/app.store.ts`: context for the current snapshot, open dialog, sound, and motion preferences. Menu and form state remain local.
- `types/`, feature `types/`, `constants/`, `utils/`, and `data/`: shared API contracts, domain types, configuration, formatting, and demo fixtures.
- `styles/`: the existing CSS, unchanged.

## State ownership

`features/game/services/game.service.ts` selects one demo or backend service. These services remain the external store: they own the round lifecycle, wallet balances, accepted bets, settlement, and automatic betting. Keeping these transactions together preserves their ordering and atomic updates.

`AppProviders` subscribes once through `useGameEngine`, runs the existing sound and notification hooks, and shares the snapshot with consumers. `useBet` derives each panel's status and delegates mutations to that same service. Do not instantiate another game service in a component or split wallet/bet mutations into independent stores.

Imports can use `@/` for `src/`, configured in TypeScript and Vite. New screens can be composed in `routes/AppRoutes.tsx` when the application actually needs URL navigation.

## Validation

Run `npm run build`, `npm run lint`, and `npm test`. The existing Playwright tests cover demo betting, cancellation, automatic and manual cash-out, round transitions, dialogs, responsive layouts, and mocked backend authentication, reconciliation, and socket recovery. `npm run test:live` separately requires the backend infrastructure.
