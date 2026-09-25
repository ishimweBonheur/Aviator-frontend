import { test, expect, type Page, type WebSocketRoute } from "@playwright/test";

test('backend interface fits mobile and desktop without simulated data', async ({ page }) => {
  await backend(page);
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(page.getByText('Player feed not available', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  }
  await page.screenshot({ path: 'test-results/backend-desktop.png', fullPage: true });
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
  let savedBet: Record<string,unknown> | undefined;
  const requests: { path: string; body: unknown; authorization?: string }[] =
    [];
  const current = { id: 102, round_number: 42, status: "BETTING_OPEN", betting_closes_at: new Date(Date.now()+60000).toISOString() };
  await page.addInitScript(() =>
    localStorage.setItem("altitude-mode", "backend"),
  );
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
      return route.fulfill({json:{running:null,upcoming:current,server_time:new Date().toISOString()}});
    if(path==="/api/game/rounds")return route.fulfill({json:[]});
    if(path==="/api/limits")return route.fulfill({json:{MinBet:"50",MaxBet:"1000000",MaxPayout:"100000000"}});
    if(path==="/api/deposits")return route.fulfill({json:[]});
    if(path==="/api/bets" && req.method()==="GET")return route.fulfill({json:savedBet?[savedBet]:[]});
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
      savedBet={id:501,round_id:102,round_number:42,round_status:"BETTING_OPEN",user_id:7,bet_number:1,amount:"1000",status:"ACTIVE",payout:"0"};
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
    if (path === "/api/bets/501/cashout") {
      balance = "25501.75";
      savedBet={...savedBet,status:"CASHED_OUT",payout:"1501.50",cashout_multiplier:"1.50"};
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
    emit: (type: string, round_id = 101, round_number = 41, extra = {}) =>
      socket!.send(JSON.stringify({ type, round_id, round_number, ...extra })),
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

test("backend contracts, distinct upcoming round, bet and authoritative cash-out", async ({
  page,
}) => {
  const mock = await backend(page);
  // REST has already returned upcoming #42; events for the flying #41 must still render.
  mock.emit("MULTIPLIER_UPDATE", 101, 41, { multiplier: "2.31" });
  await expect(page.locator(".multiplier")).toContainText("2.31");
  await login(page);
  await expect(page.locator(".wallet strong")).toHaveText("25,000.25 RWF");
  const panel = page.locator(".bet-panel").first();
  await panel.getByRole("button", { name: /Bet for #42/ }).click();
  await expect(
    panel.getByRole("button", { name: /Cancel bet/ }),
  ).toBeEnabled();
  await expect(page.locator(".wallet strong")).toHaveText("24,000.25 RWF");
  expect(mock.requests.find((r) => r.path === "/api/bets" && r.body)).toMatchObject({
    body: { round_id: 102, bet_number: 1, amount: "1000.00" },
    authorization: "Bearer test-session-token",
  });
  await expect(
    panel.getByRole("switch", { name: "Auto cash out panel 1" }),
  ).toBeDisabled();
  mock.emit("ROUND_CRASHED", 101, 41, { crash_point: "2.45" });
  mock.emit("ROUND_SETTLED");
  mock.emit("ROUND_STARTED", 102, 42);
  mock.emit("MULTIPLIER_UPDATE", 102, 42, { multiplier: "1.50" });
  await panel.getByRole("button", { name: /Cash out/ }).click();
  await expect(page.locator(".wallet strong")).toHaveText("25,501.75 RWF");
  await page.getByRole("button", { name: "My bets", exact: true }).click();
  await expect(page.locator(".player-won")).toHaveCount(1);
  await expect(page.locator(".player-won")).toContainText("1,501.5");
  expect(
    mock.requests.find((r) => r.path === "/api/bets/501/cashout")?.authorization,
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
  expect(mock.requests.filter((r) => r.path === "/api/bets" && r.body)).toHaveLength(1);
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
