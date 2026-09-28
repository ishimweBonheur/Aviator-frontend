import { test, expect, type Page, type WebSocketRoute } from "@playwright/test";

test("backend interface fits mobile and desktop without simulated data", async ({
  page,
}) => {
  await backend(page);
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(
      page.getByText("Player feed not available", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await page.screenshot({
    path: "test-results/backend-desktop.png",
    fullPage: true,
  });
});

async function backend(
  page: Page,
  options: {
    rejectBet?: boolean;
    ambiguousBet?: boolean;
    expire?: boolean;
  } = {},
) {
  let socket: WebSocketRoute | undefined;
  let balance = "25000.25";
  let multiplier = "1.00";
  let secondsRemaining = 60;
  const autoSettings = [1, 2].map((bet_number) => ({
    bet_number,
    enabled: false,
    amount: "1000.00",
    auto_cashout_multiplier: null as string | null,
    last_round_id: 0,
    last_error: "",
  }));
  const history: Record<string, unknown>[] = [];
  let savedBet: Record<string, unknown> | undefined;
  const requests: { path: string; body: unknown; authorization?: string }[] =
    [];
  const current = {
    id: 102,
    round_number: 42,
    status: "BETTING_OPEN",
    betting_closes_at: new Date(Date.now() + 60000).toISOString(),
  };
  await page.routeWebSocket("**/ws", (ws) => {
    socket = ws;
  });
  await page.route("**/health", (route) =>
    route.fulfill({ json: { status: "ok" } }),
  );
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      path = new URL(req.url()).pathname;
    const body = req.postDataJSON();
    requests.push({ path, body, authorization: req.headers().authorization });
    if (path === "/api/game/rounds/current")
      return route.fulfill({
        json: {
          running: current.status === "RUNNING" ? current : null,
          upcoming: ["BETTING_OPEN", "BETTING_CLOSED"].includes(current.status)
            ? current
            : null,
          current_multiplier: multiplier,
          seconds_remaining: secondsRemaining,
          phase: current.status,
          server_time: new Date().toISOString(),
        },
      });
    if (path === "/api/game/rounds") return route.fulfill({ json: history });
    if (path === "/api/limits")
      return route.fulfill({
        json: { MinBet: "50", MaxBet: "1000000", MaxPayout: "100000000" },
      });
    if (path === "/api/bets/auto") return route.fulfill({ json: autoSettings });
    if (path === "/api/bets/auto/1" && req.method() === "PUT") {
      Object.assign(autoSettings[0], body);
      if (body.enabled)
        savedBet = {
          id: 501,
          round_id: 102,
          round_number: 42,
          round_status: "BETTING_OPEN",
          user_id: 7,
          bet_number: 1,
          amount: "1000",
          status: "ACTIVE",
          payout: "0",
        };
      return route.fulfill({ json: autoSettings });
    }
    if (path === "/api/deposits") return route.fulfill({ json: [] });
    if (path === "/api/bets" && req.method() === "GET")
      return route.fulfill({
        json: savedBet
          ? [
              {
                ...savedBet,
                can_cancel:
                  savedBet.status === "ACTIVE" &&
                  current.status === "BETTING_OPEN",
                can_cashout:
                  savedBet.status === "ACTIVE" && current.status === "RUNNING",
                potential_payout:
                  savedBet.status === "CASHED_OUT"
                    ? savedBet.payout
                    : current.status === "RUNNING"
                      ? "1234.56"
                      : "0.00",
              },
            ]
          : [],
      });
    if (path === "/api/game/rounds/101")
      return route.fulfill({
        json: {
          id: 101,
          round_number: 41,
          status: "CRASHED",
          crash_point: "2.45",
        },
      });
    if (path === "/api/auth/register")
      return route.fulfill({
        status: 201,
        json: {
          user: { ID: 7, Username: "pilot", Email: "pilot@example.com" },
        },
      });
    if (path === "/api/auth/login")
      return route.fulfill({
        json: {
          token: "test-session-token",
          user: { ID: 7, Username: "pilot", Email: "pilot@example.com" },
        },
      });
    if (path === "/api/wallet/balance")
      return options.expire
        ? route.fulfill({ status: 401, body: "invalid token" })
        : route.fulfill({ json: { user_id: 7, balance } });
    if (path === "/api/bets") {
      if (options.rejectBet)
        return route.fulfill({ status: 400, body: "insufficient balance" });
      if (options.ambiguousBet)
        return route.fulfill({ status: 500, body: "database unavailable" });
      balance = "24000.25";
      savedBet = {
        id: 501,
        round_id: 102,
        round_number: 42,
        round_status: "BETTING_OPEN",
        user_id: 7,
        bet_number: 1,
        amount: "1000",
        status: "ACTIVE",
        payout: "0",
      };
      return route.fulfill({
        status: 201,
        json: {
          bet: {
            id: 501,
            round_id: 102,
            user_id: 7,
            bet_number: 1,
            amount: "1000",
            status: "ACTIVE",
            payout: "0",
          },
        },
      });
    }
    if (path === "/api/bets/501/cancel") {
      savedBet = { ...savedBet, status: "CANCELLED" };
      balance = "25000.25";
      return route.fulfill({
        json: {
          bet_id: 501,
          status: "CANCELLED",
          refunded_amount: "1000",
          remaining_balance: balance,
        },
      });
    }
    if (path === "/api/bets/501/cashout") {
      balance = "25501.75";
      savedBet = {
        ...savedBet,
        status: "CASHED_OUT",
        payout: "1501.50",
        cashout_multiplier: "1.50",
      };
      return route.fulfill({
        json: {
          bet_id: 501,
          multiplier: "1.5015",
          bet_amount: "1000",
          payout: "1501.50",
          remaining_balance: balance,
        },
      });
    }
    return route.fulfill({ status: 404, json: { error: "not found" } });
  });
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: /BACKEND.*CONNECTED/ }),
  ).toBeVisible();
  await expect
    .poll(
      () =>
        requests.filter((r) => r.path === "/api/game/rounds/current").length,
    )
    .toBeGreaterThan(0);
  return {
    requests,
    emit: (
      type: string,
      round_id = 101,
      round_number = 41,
      extra: Record<string, unknown> = {},
    ) => {
      if (type === "COUNTDOWN" || type === "ROUND_OPENED")
        secondsRemaining = Number(extra.seconds_remaining ?? 5);
      if (type === "ROUND_OPENED" && round_id > current.id) {
        Object.assign(current, {
          id: round_id,
          round_number,
          status: "BETTING_OPEN",
          betting_closes_at: new Date(
            Date.now() + Number(extra.seconds_remaining ?? 5) * 1000,
          ).toISOString(),
        });
      }
      if (round_id === current.id) {
        if (type === "ROUND_STARTED") {
          current.status = "RUNNING";
          multiplier = "1.00";
        }
        if (type === "MULTIPLIER_UPDATE" && current.status === "RUNNING")
          multiplier = String(extra.multiplier);
        if (type === "COUNTDOWN" && extra.seconds_remaining === 0)
          current.status = "BETTING_CLOSED";
        if (type === "ROUND_CRASHED") {
          current.status = "CRASHED";
          history.unshift({
            id: round_id,
            round_number,
            status: "SETTLED",
            crash_point: extra.crash_point,
          });
        }
        if (type === "ROUND_SETTLED") current.status = "SETTLED";
        if (savedBet?.round_id === round_id) {
          savedBet.round_status = current.status;
          if (
            ["CRASHED", "SETTLED"].includes(current.status) &&
            savedBet.status === "ACTIVE"
          )
            savedBet.status = "LOST";
        }
      }
      socket!.send(JSON.stringify({ type, round_id, round_number, ...extra }));
    },
    close: () => socket!.close(),
    current,
  };
}
async function login(page: Page) {
  await page.getByRole("button", { name: "Open profile" }).click();
  await page.getByLabel("Email", { exact: true }).fill("pilot@example.com");
  await page.getByLabel("Password", { exact: true }).fill("secret123");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByText("pilot", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
}

test("backend contracts, countdown betting and authoritative cash-out", async ({
  page,
}) => {
  const mock = await backend(page);
  await expect(
    page.getByText("PLACE YOUR BETS", { exact: true }),
  ).toBeVisible();
  await login(page);
  await expect(page.locator(".wallet strong")).toHaveText("25,000.25 RWF");
  const panel = page.locator(".bet-panel").first();
  await panel.getByRole("button", { name: /Bet for #42/ }).click();
  await expect(panel.getByRole("button", { name: /Cancel bet/ })).toBeEnabled();
  await expect(page.locator(".wallet strong")).toHaveText("24,000.25 RWF");
  expect(
    mock.requests.find((r) => r.path === "/api/bets" && r.body),
  ).toMatchObject({
    body: { round_id: 102, bet_number: 1, amount: "1000.00" },
    authorization: "Bearer test-session-token",
  });
  await expect(
    panel.getByRole("switch", { name: "Auto cash out panel 1" }),
  ).toBeDisabled();
  mock.emit("COUNTDOWN", 102, 42, { seconds_remaining: 0 });
  mock.emit("ROUND_STARTED", 102, 42);
  mock.emit("MULTIPLIER_UPDATE", 102, 42, { multiplier: "1.50" });
  await panel.getByRole("button", { name: /Cash out/ }).click();
  await expect(page.locator(".wallet strong")).toHaveText("25,501.75 RWF");
  await page.getByRole("button", { name: "My bets", exact: true }).click();
  await expect(page.locator(".player-won")).toHaveCount(1);
  await expect(page.locator(".player-won")).toContainText("1,501.5");
  expect(
    mock.requests.find((r) => r.path === "/api/bets/501/cashout")
      ?.authorization,
  ).toBe("Bearer test-session-token");
  await page.getByRole("button", { name: "Deposit", exact: true }).click();
  await expect(
    page.getByText("SANDBOX deposits credit your local test wallet", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Add 10,000 demo RWF" }),
  ).toHaveCount(0);
});

test("register, round lookup and missing features are available in the UI", async ({
  page,
}) => {
  const mock = await backend(page);
  await page.getByRole("button", { name: "Open profile" }).click();
  await page
    .getByRole("button", { name: "New here? Create an account" })
    .click();
  await page.getByLabel("Username", { exact: true }).fill("pilot");
  await page.getByLabel("Email", { exact: true }).fill("pilot@example.com");
  await page.getByLabel("Password", { exact: true }).fill("secret123");
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  expect(
    mock.requests.find((r) => r.path === "/api/auth/register")?.body,
  ).toEqual({
    username: "pilot",
    email: "pilot@example.com",
    password: "secret123",
  });
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.getByRole("button", { name: /BACKEND.*CONNECTED/ }).click();
  await page.getByLabel("Look up round ID").fill("101");
  await page
    .getByRole("button", { name: "Look up round", exact: true })
    .click();
  await expect(page.getByText("Round #41 · CRASHED · 2.45x")).toBeVisible();
  await expect(page.getByText("Still needed", { exact: true })).toBeVisible();
});

test("plain-text rejection never debits the client wallet", async ({
  page,
}) => {
  await backend(page, { rejectBet: true });
  await login(page);
  await page
    .locator(".bet-panel")
    .first()
    .getByRole("button", { name: /Bet for #42/ })
    .click();
  await expect(
    page.getByText("insufficient balance", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".wallet strong")).toHaveText("25,000.25 RWF");
  await expect(
    page
      .locator(".bet-panel")
      .first()
      .getByRole("button", { name: /Bet for #42/ }),
  ).toBeEnabled();
});

test("uncertain mutation is reconciled from persisted history", async ({
  page,
}) => {
  const mock = await backend(page, { ambiguousBet: true });
  await login(page);
  await page
    .locator(".bet-panel")
    .first()
    .getByRole("button", { name: /Bet for #42/ })
    .click();
  await expect(
    page
      .locator(".bet-panel")
      .first()
      .getByRole("button", { name: /Bet for #42/ }),
  ).toBeEnabled();
  await page.reload();
  await expect(
    page
      .locator(".bet-panel")
      .first()
      .getByRole("button", { name: /Bet for #42/ }),
  ).toBeEnabled();
  expect(
    mock.requests.filter((r) => r.path === "/api/bets" && r.body),
  ).toHaveLength(1);
});

test("expired session clears wallet and prevents betting", async ({ page }) => {
  await backend(page, { expire: true });
  await page.getByRole("button", { name: "Open profile" }).click();
  await page.getByLabel("Email", { exact: true }).fill("pilot@example.com");
  await page.getByLabel("Password", { exact: true }).fill("secret123");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Sign in", exact: true })
    .click();
  await expect(
    page.getByText("Your session expired. Sign in again."),
  ).toBeVisible();
  await expect(page.locator(".wallet strong")).toHaveText("— RWF");
});

test("socket disconnect disables cash-out and betting, reconnect restores round data", async ({
  page,
}) => {
  const mock = await backend(page);
  await login(page);
  mock.close();
  await expect(
    page.getByRole("button", { name: /BACKEND.*OFFLINE/ }),
  ).toBeVisible();
  await expect(page.locator(".bet-action").first()).toBeDisabled();
  await expect(
    page.getByRole("button", { name: /BACKEND.*CONNECTED/ }),
  ).toBeVisible();
  await expect(
    page
      .locator(".bet-panel")
      .first()
      .getByRole("button", { name: /Bet for #42/ }),
  ).toBeEnabled();
});

test("sequential countdown replaces flight, rejects stray ticks and waits for start", async ({
  page,
}) => {
  const mock = await backend(page);
  await login(page);
  await page.clock.install();
  // Pause ahead of the running browser clock to avoid a host/browser timing race.
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  mock.emit("ROUND_STARTED", 102, 42);
  mock.emit("MULTIPLIER_UPDATE", 102, 42, { multiplier: "2.47" });
  await expect(page.locator(".multiplier")).toContainText("2.47");
  mock.emit("ROUND_CRASHED", 102, 42, { crash_point: "2.47" });
  await expect(page.locator(".aircraft")).toHaveCount(0);
  mock.emit("MULTIPLIER_UPDATE", 102, 42, { multiplier: "9.99" });
  await expect(page.locator(".multiplier")).not.toContainText("9.99");
  mock.emit("ROUND_SETTLED", 102, 42);
  mock.emit("ROUND_OPENED", 103, 43, { seconds_remaining: 5 });
  await expect(
    page.getByText("PLACE YOUR BETS", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("timer")).toContainText("5s");
  await expect(
    page.getByText("Previous: 2.47x", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".bet-action").first()).toBeEnabled();
  mock.emit("MULTIPLIER_UPDATE", 103, 43, { multiplier: "8.00" });
  await expect(page.getByRole("timer")).toContainText("5s");
  for (const seconds of [4, 3, 2, 1]) {
    await page.clock.runFor(1000);
    mock.emit("COUNTDOWN", 103, 43, { seconds_remaining: seconds });
    await expect(page.getByRole("timer")).toContainText(seconds + "s");
  }
  await page.clock.runFor(1000);
  mock.emit("COUNTDOWN", 103, 43, { seconds_remaining: 0 });
  await expect(page.locator(".bet-action").first()).toBeDisabled();
  await expect(page.locator(".aircraft")).toHaveCount(0);
  mock.emit("ROUND_STARTED", 103, 43);
  await expect(page.getByRole("timer")).toHaveCount(0);
  await expect(page.locator(".multiplier")).toContainText("1.00");
  mock.emit("MULTIPLIER_UPDATE", 103, 43, { multiplier: "1.02" });
  await expect(page.locator(".multiplier")).toContainText("1.02");
});

test("countdown bets can be cancelled and cannot be cashed out", async ({
  page,
}) => {
  const mock = await backend(page);
  await login(page);
  const panel = page.locator(".bet-panel").first();
  await panel.getByRole("button", { name: /Bet for #42/ }).click();
  await expect(panel.getByRole("button", { name: /Cancel bet/ })).toBeEnabled();
  await expect(panel.getByRole("button", { name: /Cash out/ })).toHaveCount(0);
  await panel.getByRole("button", { name: /Cancel bet/ }).click();
  await expect(page.locator(".wallet strong")).toHaveText("25,000.25 RWF");
  expect(mock.requests.filter((r) => r.path.endsWith("/cancel"))).toHaveLength(
    1,
  );
  expect(mock.requests.filter((r) => r.path.endsWith("/cashout"))).toHaveLength(
    0,
  );
});

test("auto settings use the API and the browser never executes automatic bets", async ({
  page,
}) => {
  const mock = await backend(page);
  await login(page);
  const panel = page.locator(".bet-panel").first();
  await panel.getByRole("button", { name: "Auto", exact: true }).click();
  await panel
    .getByRole("switch", { name: "Auto bet panel 1", exact: true })
    .click();
  await expect(panel.getByText(/Auto bet runs on the server/)).toBeVisible();
  mock.emit("BET_PLACED", 102, 42);
  await expect(panel.getByRole("button", { name: /Cancel bet/ })).toBeEnabled();
  mock.emit("COUNTDOWN", 102, 42, { seconds_remaining: 4 });
  await expect(panel.getByRole("button", { name: /Cancel bet/ })).toBeEnabled();
  mock.emit("COUNTDOWN", 102, 42, { seconds_remaining: 0 });
  await expect(
    panel.getByRole("button", { name: /Cancel bet/ }),
  ).toBeDisabled();
  await expect(panel.getByRole("button", { name: /Cash out/ })).toHaveCount(0);
  mock.emit("ROUND_STARTED", 102, 42);
  await expect(panel.getByRole("button", { name: /Cash out/ })).toBeEnabled();
  expect(
    mock.requests.filter((r) => r.path === "/api/bets" && r.body),
  ).toHaveLength(0);
  expect(
    mock.requests.filter((r) => r.path === "/api/bets/auto/1"),
  ).toHaveLength(1);
  mock.emit("ROUND_CRASHED", 102, 42, { crash_point: "1.10" });
  await expect(panel.getByRole("button", { name: /Cash out/ })).toBeDisabled();
});

test("countdown displays server seconds without advancing the game locally", async ({
  page,
}) => {
  const mock = await backend(page);
  await page.clock.install();
  // Pause ahead of the running browser clock to avoid a host/browser timing race.
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  mock.emit("COUNTDOWN", 102, 42, {
    seconds_remaining: 4,
    timestamp: "2026-01-01T00:00:00Z",
    betting_closes_at: "2026-01-01T00:00:30Z",
  });
  await expect(page.getByRole("timer")).toHaveText("4s");
  await page.clock.runFor(2000);
  await expect(page.getByRole("timer")).toHaveText("4s");
  mock.emit("COUNTDOWN", 102, 42, { seconds_remaining: 0 });
  await expect(page.getByRole("timer")).toHaveText("0s");
  await expect(page.locator(".aircraft")).toHaveCount(0);
});

test("manual auto cashout target is sent to the backend and payout is server supplied", async ({
  page,
}) => {
  const mock = await backend(page);
  await login(page);
  const panel = page.locator(".bet-panel").first();
  await panel
    .getByRole("switch", { name: "Auto cash out panel 1", exact: true })
    .click();
  await panel.getByLabel("Auto cash out multiplier 1").fill("1.25");
  await panel.getByRole("button", { name: /Bet for #42/ }).click();
  expect(
    mock.requests.find((r) => r.path === "/api/bets" && r.body)?.body,
  ).toMatchObject({ auto_cashout_multiplier: "1.25" });
  mock.emit("ROUND_STARTED", 102, 42);
  mock.emit("MULTIPLIER_UPDATE", 102, 42, { multiplier: "3.00" });
  await expect(panel.getByRole("button", { name: /Cash out/ })).toContainText(
    "1,234.56",
  );
  // The browser must not derive 3,000 from the stake and live multiplier.
  await expect(
    panel.getByRole("button", { name: /Cash out/ }),
  ).not.toContainText("3,000");
});
