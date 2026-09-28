# Frontend refactor review

The entire source tree, existing tests and root configuration were reviewed. The proposed ownership structure was shown before changes. This is a refinement of the existing product, not a replacement of its game engine or UI. The case of the original pages/Game directory is preserved; folder casing does not change its ownership.

## Moves and decisions

| Previous location | Final owner and reason |
| --- | --- |
| app/AppProviders.tsx | pages/Game/GameProvider.tsx: game subscriptions, sounds and game UI preferences are player-screen concerns. |
| app/AppDialogs.tsx | pages/Game/GameDialogs.tsx: these dialogs compose player features. |
| store/app.store.ts | features/game/state/game.context.ts: game/UI context is not global application state. |
| hooks/useSound.ts | features/game/hooks/useSound.ts: depends specifically on game status. |
| components/shared/Header.tsx and Footer.tsx | layouts/player: these are the player shell, not generic reusable controls. |
| features/admin/AdminPage.tsx | Split into AdminGate, AdminLayout, independent route pages and admin-local reusable components/hooks. |
| features/admin/admin.api.ts | pages/admin/shared/admin.api.ts: admin-scoped request namespace uses the shared auth session directly. |
| features/admin/AdminCharts.tsx and LiveRound.tsx | pages/admin/analytics and system: specific dashboard capabilities. |
| features/auth/components/BackendAccount.tsx | Split into independent AuthForm and pages/Game/components/PlayerAccount: player account/wallet composition is not authentication infrastructure. |
| services/backendApi.ts | features/game/services/backendApi.ts: API composition belongs to its sole consumer, the game synchronizer. Authentication is removed from that facade. |
| types/api.types.ts | Split among auth, game and betting domain contract files. |
| types/app.types.ts | features/game/state/game-ui.types.ts: dialog union is game UI state. |
| constants/betting.constants.ts | features/betting/betting.constants.ts: domain-specific presets. |
| features/game/components/FlightTip, GameStats, GameHeading, GameInfo | pages/Game/components: page-only presentation. Core Aircraft/GameCanvas/round history/fairness remain in the game domain. |
| WalletActivity request logic | Wallet API/type modules own endpoints and data contracts, with shared session requests. |
| Settings game-context dependency | Replaced by explicit preference values/callbacks. |
| BettingSection game-context dependency | Replaced by an explicit game snapshot prop. |
| tests/admin.spec.ts and tests/backend.spec.ts | tests/admin/admin.spec.ts and tests/game/backend.spec.ts; useful existing coverage retained. |
| assets/react.svg, assets/vite.svg, bets/types/live-bet.types.ts | Removed unused starter art and obsolete simulated public-player contract. |

## Deliberately retained

Betting, wallet, game and bet history remain domain features because they are composed together in the existing player screen. Wallet/account/settings/fairness remain dialogs, not invented routes. Modal/Toggle are genuinely shared UI primitives. Transport, root tool configuration, public assets, deployment files and formatting helpers remain shared infrastructure. Existing CSS and class names are preserved. No new router/state dependency was introduced. Existing anchor navigation reloads the selected screen as before.

## Access diagnosis

The supplied screenshot corresponds to the backend auth middleware rejecting an account that is not both ADMIN and ACTIVE. Authentication and administrator authorization are separate. No account role was silently modified. The frontend now distinguishes 403, expired 401 and temporary failures, identifies the account on denial, and lets the user retry or switch accounts. Backend role checks remain authoritative even when the saved frontend role differs. README contains the operator lookup/provisioning path.

## File ownership inventory

Every source file and retained browser test is listed below. Grouped root tooling is covered after the table.

| File | Responsibility / placement decision |
| --- | --- |
| `src/app/App.tsx` | Application initialization/bootstrap |
| `src/assets/hero.png` | Existing product artwork retained; unused starter icons removed |
| `src/components/ui/Modal.tsx` | Global reusable UI primitive |
| `src/components/ui/Toggle.tsx` | Global reusable UI primitive |
| `src/constants/config.ts` | Global runtime configuration |
| `src/features/auth/components/AuthForm.tsx` | Shared authentication domain; independent of game and admin UI |
| `src/features/auth/hooks/useSession.ts` | Shared authentication domain; independent of game and admin UI |
| `src/features/auth/services/auth.api.ts` | Shared authentication domain; independent of game and admin UI |
| `src/features/auth/services/session.ts` | Shared authentication domain; independent of game and admin UI |
| `src/features/auth/types/auth.types.ts` | Shared authentication domain; independent of game and admin UI |
| `src/features/bets/components/LiveBets.tsx` | Player bet history presentation |
| `src/features/betting/betting.constants.ts` | Betting domain: controls, requests, settings and contracts |
| `src/features/betting/components/BetPanel.tsx` | Betting domain: controls, requests, settings and contracts |
| `src/features/betting/components/BettingSection.tsx` | Betting domain: controls, requests, settings and contracts |
| `src/features/betting/hooks/useBet.ts` | Betting domain: controls, requests, settings and contracts |
| `src/features/betting/services/betting.api.ts` | Betting domain: controls, requests, settings and contracts |
| `src/features/betting/types/betting-api.types.ts` | Betting domain: controls, requests, settings and contracts |
| `src/features/betting/types/betting.types.ts` | Betting domain: controls, requests, settings and contracts |
| `src/features/game/components/Aircraft.tsx` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/components/FairnessView.tsx` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/components/GameCanvas.tsx` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/components/GameHelp.tsx` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/components/IntegrationStatus.tsx` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/components/RoundHistory.tsx` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/hooks/useGameEngine.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/hooks/useGameNotifications.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/hooks/useRoundMonitor.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/hooks/useSound.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/services/backendApi.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/services/backendGameService.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/services/game.api.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/services/game.service.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/state/game-ui.types.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/state/game.context.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/types/game-api.types.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/types/game-service.types.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/types/game.types.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/game/types/round-event.types.ts` | Game domain: server state, round presentation and screen-scoped game context |
| `src/features/settings/components/Settings.tsx` | Reusable player preference controls with explicit props |
| `src/features/wallet/components/WalletActivity.tsx` | Wallet domain: activity, funding APIs, types and invalidation |
| `src/features/wallet/services/wallet.api.ts` | Wallet domain: activity, funding APIs, types and invalidation |
| `src/features/wallet/types/wallet.types.ts` | Wallet domain: activity, funding APIs, types and invalidation |
| `src/layouts/AdminLayout.tsx` | Application shell/structural layout, no page data fetching |
| `src/layouts/GameLayout.tsx` | Application shell/structural layout, no page data fetching |
| `src/layouts/MainLayout.tsx` | Application shell/structural layout, no page data fetching |
| `src/layouts/player/Footer.tsx` | Application shell/structural layout, no page data fetching |
| `src/layouts/player/Header.tsx` | Application shell/structural layout, no page data fetching |
| `src/main.tsx` | Application initialization/bootstrap |
| `src/pages/Game/GameDialogs.tsx` | Player-screen composition, dialogs, providers or page-specific presentation |
| `src/pages/Game/GamePage.tsx` | Player-screen composition, dialogs, providers or page-specific presentation |
| `src/pages/Game/GameProvider.tsx` | Player-screen composition, dialogs, providers or page-specific presentation |
| `src/pages/Game/components/FlightTip.tsx` | Player-screen composition, dialogs, providers or page-specific presentation |
| `src/pages/Game/components/GameHeading.tsx` | Player-screen composition, dialogs, providers or page-specific presentation |
| `src/pages/Game/components/GameInfo.tsx` | Player-screen composition, dialogs, providers or page-specific presentation |
| `src/pages/Game/components/GameStats.tsx` | Player-screen composition, dialogs, providers or page-specific presentation |
| `src/pages/Game/components/PlayerAccount.tsx` | Player-screen composition, dialogs, providers or page-specific presentation |
| `src/pages/admin/AdminGate.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/admin.css` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/analytics/AdminCharts.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/analytics/AnalyticsPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/analytics/AnalyticsSummary.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/audit/AuditLogsPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/bets/AutoBetsPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/bets/AutoCashoutsPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/bets/BetsPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/bets/bet-filters.ts` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/config/ConfigPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/overview/OverviewPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/payments/DepositsPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/payments/WithdrawalsPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/payments/payment-filters.ts` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/rounds/RoundDetailPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/rounds/RoundsPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/shared/ErrorNotice.tsx` | Reusable within admin only: requests, presentation and local query state |
| `src/pages/admin/shared/Filters.tsx` | Reusable within admin only: requests, presentation and local query state |
| `src/pages/admin/shared/Metrics.tsx` | Reusable within admin only: requests, presentation and local query state |
| `src/pages/admin/shared/PageFrame.tsx` | Reusable within admin only: requests, presentation and local query state |
| `src/pages/admin/shared/RecordList.tsx` | Reusable within admin only: requests, presentation and local query state |
| `src/pages/admin/shared/Table.tsx` | Reusable within admin only: requests, presentation and local query state |
| `src/pages/admin/shared/admin-access.context.ts` | Reusable within admin only: requests, presentation and local query state |
| `src/pages/admin/shared/admin.api.ts` | Reusable within admin only: requests, presentation and local query state |
| `src/pages/admin/shared/display.ts` | Reusable within admin only: requests, presentation and local query state |
| `src/pages/admin/shared/filter.types.ts` | Reusable within admin only: requests, presentation and local query state |
| `src/pages/admin/shared/useAdminData.ts` | Reusable within admin only: requests, presentation and local query state |
| `src/pages/admin/system/LiveRound.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/system/SystemPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/users/AdminAction.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/users/UserDetailPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/users/UsersPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/pages/admin/wallet/WalletPage.tsx` | Admin screen/domain owner; independent route or page-specific component/configuration |
| `src/routes/AppRoutes.tsx` | Central routing or navigation metadata |
| `src/routes/admin-navigation.ts` | Central routing or navigation metadata |
| `src/services/api.ts` | Global transport infrastructure |
| `src/services/socket.ts` | Global transport infrastructure |
| `src/styles/app.css` | Existing shared theme/player/dialog styling retained for compatibility |
| `src/styles/globals.css` | Existing shared theme/player/dialog styling retained for compatibility |
| `src/utils/format.ts` | Shared display formatting, no financial decisions |
| `src/vite-env.d.ts` | Build/environment declaration |
| `tests/admin/admin.spec.ts` | Browser regression coverage grouped by owning screen/domain |
| `tests/game/backend.spec.ts` | Browser regression coverage grouped by owning screen/domain |

## Root and static resources

- package.json/package-lock.json: existing dependency and command definitions; no new runtime dependencies.
- vite.config.ts, tsconfig*.json, eslint.config.ts, playwright.config.ts: build, aliases, static analysis and browser test infrastructure retained. The tests directory remains the Playwright root and discovers the reorganized suites.
- index.html and public/: application entry/static assets retained.
- Dockerfile/nginx.conf: deployment shell and history fallback retained; route URLs are unchanged.
- .env.example and local environment: existing configuration retained; no credentials or backend data changed by this refactor.
- README.md/ARCHITECTURE.md: updated ownership, route/test locations and access troubleshooting.
- ADMIN_GAP_ANALYSIS.md: existing capability report retained; backend contracts/migrations remain unchanged by this refactor.

## Verification and limits

Build, lint and all browser suites are run after the refactor. Regression coverage includes server-controlled countdown/flight, cashout, cancellation, automatic settings, wallet updates, admin pages/actions/filters, 401 expiry, 403/retry, stale cached roles, absence of player API requests on admin, and read-only live monitoring through crash/countdown.

Browser suites use controlled API responses; they do not prove a particular live account has administrator permissions. No database promotion, deployment or migration was performed for this frontend-only refactor. Existing backend integration/payment limitations remain as documented in ADMIN_GAP_ANALYSIS.md.
