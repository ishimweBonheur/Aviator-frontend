# Frontend architecture

The frontend has two independently loaded screens: the player game at / and administration under /admin. All route-to-page mappings are in src/routes/AppRoutes.tsx. Existing URLs and styling are preserved; unknown routes display a not-found view. Wallet, account, fairness and preferences remain dialogs because those are the existing user flows, not independent routes.

## Ownership

- src/app/App.tsx is application bootstrap. It does not subscribe to rounds, wallets or betting.
- src/pages/Game owns player-screen composition, dialogs, the game provider, screen-specific information and account composition. The original Game directory capitalization is retained.
- src/pages/admin contains independent overview, users, bets, rounds, payments, wallet, analytics, audit, system and configuration pages. Each list owns its resource path and filter schema. Shared tables, request hooks, pagination and filter rendering live under pages/admin/shared; they are not global UI components.
- src/layouts provides player/admin shells. Player Header/Footer are scoped under layouts/player. Layouts do not fetch administrative records or select page contents.
- src/features/auth owns login, registration, session storage, identity, authenticated requests and expiry. useSession is shared across screens. Session revision checks prevent a response from a previous identity from being accepted for a newer session. Cached roles are display metadata, never permission authority.
- src/features/game owns server synchronization, round rendering, lifecycle types, game hooks and game-scoped context. The game cache coordinates game/betting/wallet APIs while the player screen is subscribed. It no longer owns authentication or exposes arbitrary authenticated requests to admin/wallet UI.
- src/features/betting owns bet controls, action requests, auto-setting contracts and amount presets. BettingSection takes game data through props.
- src/features/bets owns the existing player bet-history panel. No simulated public-player model remains.
- src/features/wallet owns funding/activity request paths, transaction types and balance invalidation. It uses the shared authenticated client, not the game service.
- src/features/settings contains the reusable preference controls. Their values and callbacks come from the screen, with no subscription to game state.
- src/components/ui contains reusable Modal and Toggle primitives. Domain-specific controls stay in their domains.
- src/services contains HTTP and WebSocket infrastructure. Domain API contracts live beside their owning feature. The old global backendApi facade moved into the game domain, its only consumer.
- src/constants contains application configuration only. Betting presets live in betting. Domain hooks/types are no longer kept in global hooks/types folders.
- src/styles retains the existing shared theme, player UI and dialog classes; admin styling lives with admin. This avoids breaking existing cross-screen modal/form styling. src/utils contains shared display formatting.
- tests/admin and tests/game retain the existing browser coverage and add access/session/monitoring regressions.

## Data flow

Backend -> typed feature APIs / WebSocket -> domain cache or page-local request state -> components.

Auth session -> authenticated requests -> admin and wallet APIs.

Game page -> GameProvider -> game cache + presentation settings -> game/betting/history components.

Admin gate -> backend session check -> AdminLayout -> independent page -> page-owned query/filter/pagination state.

The administrator live monitor uses a read-only round-event subscription with REST fallback. Opening an admin page does not mount the player game service, fetch player auto settings, poll the player wallet, play sounds, or produce player notifications. Chart.js is loaded only with analytics/overview pages.

## Authority and access

The backend owns lifecycle transitions, countdown values, accepted bets, cancellation, automatic execution, fairness, balances, eligibility and payouts. Browser timers only poll/reconnect; they never progress rounds or settle bets. Animation coordinates are presentation-only.

All admin access is checked by GET /api/admin/session and protected backend endpoints. A logged-in account still needs role ADMIN and status ACTIVE in the backend database. A 403 keeps the session but explains the access requirement; a 401 expires it and shows sign-in; connection/server failures retain the account and offer retry. Admin mutations still require review and retain their idempotency reference.

See FRONTEND_REFACTOR.md for the file-level ownership inventory and ADMIN_GAP_ANALYSIS.md for backend capabilities and operational limitations.
