import { test, expect, type Page } from "@playwright/test";

async function setup(page: Page, forbidden = false) {
  const mutations: { method: string; body: Record<string, unknown> }[] = [];
  await page.addInitScript(() => {
    localStorage.setItem("altitude-mode", "backend");
    sessionStorage.setItem(
      "altitude-backend-session",
      JSON.stringify({
        token: "test-admin",
        user: {
          id: 1,
          username: "operator",
          email: "admin@example.test",
          role: "ADMIN",
        },
      }),
    );
  });
  await page.routeWebSocket("**/ws", () => {});
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname;
    if (path.startsWith("/api/admin/")) {
      expect(req.headers().authorization).toBe("Bearer test-admin");
      if (forbidden)
        return route.fulfill({
          status: 403,
          json: { error: "administrator access required" },
        });
      if (req.method() !== "GET") {
        mutations.push({ method: req.method(), body: req.postDataJSON() });
        return route.fulfill({ json: { status: "completed" } });
      }
      if (path.endsWith("/session"))
        return route.fulfill({ json: { id: 1, role: "ADMIN" } });
      if (path.endsWith("/overview"))
        return route.fulfill({
          json: {
            total_users: 2,
            active_users: 2,
            total_player_balances: "1000.00",
            deposits: "500.00",
            withdrawals: "100.00",
            total_wagered: "100.00",
            total_payouts: "94.00",
            ggr: "6.00",
            rtp_percent: "94.00",
            house_margin_percent: "6.00",
            pending_deposits: 0,
            pending_withdrawals: 0,
            active_bets: 0,
          },
        });
      if (path.endsWith("/analytics"))
        return route.fulfill({
          json: {
            total_wagered: "100.00",
            total_payouts: "94.00",
            ggr: "6.00",
            daily: [
              {
                day: "2026-09-26",
                wagered: "100.00",
                payouts: "94.00",
                ggr: "6.00",
                rtp_percent: "94.00",
                deposits: "500.00",
                withdrawals: "100.00",
              },
            ],
          },
        });
      if (path.endsWith("/users/2"))
        return route.fulfill({
          json: {
            user: {
              id: 2,
              username: "pilot",
              email: "pilot@example.test",
              role: "PLAYER",
              status: "ACTIVE",
              balance: "1000.00",
            },
            bets: [],
            deposits: [],
            withdrawals: [],
            "wallet-transactions": [],
          },
        });
      if (path.endsWith("/users"))
        return route.fulfill({
          json: {
            items: [
              {
                id: 2,
                username:
                  url.searchParams.get("page") === "2"
                    ? "second-page"
                    : "pilot",
                role: "PLAYER",
                status: "ACTIVE",
                balance: "1000.00",
              },
            ],
            total: 26,
            page: Number(url.searchParams.get("page") ?? 1),
            page_size: 25,
          },
        });
      if (path.endsWith("/config"))
        return route.fulfill({
          json: {
            read_only: true,
            house_edge: "0.03",
            limits: { MinBet: "50.00" },
          },
        });
      if (path.endsWith("/game/current"))
        return route.fulfill({
          json: {
            running: null,
            upcoming: null,
            server_time: new Date().toISOString(),
          },
        });
      if (path.endsWith("/game/status"))
        return route.fulfill({
          json: {
            backend: "ok",
            postgresql: "ok",
            redis: "ok",
            engine_leader_present: true,
            websocket_clients_this_instance: 3,
          },
        });
      return route.fulfill({
        json: { items: [], total: 0, page: 1, page_size: 25 },
      });
    }
    if (path.endsWith("/balance"))
      return route.fulfill({ json: { balance: "1000.00" } });
    if (path.endsWith("/current"))
      return route.fulfill({
        json: {
          running: null,
          upcoming: null,
          server_time: new Date().toISOString(),
        },
      });
    if (path.endsWith("/limits"))
      return route.fulfill({
        json: { MinBet: "50", MaxBet: "1000000", MaxPayout: "100000000" },
      });
    return route.fulfill({ json: [] });
  });
  return mutations;
}
test("admin role is verified by the server before displaying data", async ({
  page,
}) => {
  await setup(page, true);
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Admin access unavailable" }),
  ).toBeVisible();
  await expect(page.getByText("administrator access required")).toBeVisible();
  await expect(page.getByText("Player wallet liability")).toHaveCount(0);
});
test("overview uses API values and fits mobile and desktop", async ({
  page,
}) => {
  await setup(page);
  await page.goto("/admin");
  await expect(page.getByText("Player wallet liability")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Daily financial activity" }),
  ).toBeVisible();
  for (const width of [320, 375, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect
      .poll(() =>
        page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      )
      .toBe(true);
  }
  await page.screenshot({
    path: "test-results/admin-dashboard.png",
    fullPage: true,
  });
});
test("users paginate and apply search filters", async ({ page }) => {
  await setup(page);
  await page.goto("/admin/users");
  await expect(
    page.getByRole("cell", { name: "pilot", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("second-page")).toBeVisible();
  await page.getByLabel("Search", { exact: true }).fill("pilot");
  const request = page.waitForRequest(
    (r) => r.url().includes("search=pilot") && r.url().includes("page=1"),
  );
  await page.getByRole("button", { name: "Apply filters" }).click();
  await request;
  await expect(
    page.getByRole("cell", { name: "pilot", exact: true }),
  ).toBeVisible();
});
test("wallet adjustment requires review and explicit confirmation", async ({
  page,
}) => {
  const mutations = await setup(page);
  await page.goto("/admin/users/2");
  await page.getByRole("button", { name: "Adjust wallet" }).click();
  await page.getByLabel("Amount (RWF)").fill("10.25");
  await page.getByLabel("Reason").fill("Reconcile support case");
  await page.getByRole("button", { name: "Review action" }).click();
  expect(mutations).toHaveLength(0);
  await page.getByRole("button", { name: "Confirm action" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(mutations).toHaveLength(1);
  expect(mutations[0].body).toMatchObject({
    direction: "CREDIT",
    amount: "10.25",
    reason: "Reconcile support case",
  });
  expect(mutations[0].body.reference).toBeTruthy();
});
test("account status uses PATCH after confirmation", async ({ page }) => {
  const mutations = await setup(page);
  await page.goto("/admin/users/2");
  await page
    .getByRole("button", { name: "Change account status", exact: true })
    .click();
  await page.getByLabel("Status", { exact: true }).selectOption("SUSPENDED");
  await page.getByLabel("Reason").fill("Account investigation");
  await page.getByRole("button", { name: "Review action" }).click();
  await page.getByRole("button", { name: "Confirm action" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(mutations[0]).toEqual({
    method: "PATCH",
    body: { status: "SUSPENDED", reason: "Account investigation" },
  });
});
test("all list, analytics and system routes load; config is read only", async ({
  page,
}) => {
  await setup(page);
  for (const route of [
    "bets",
    "rounds",
    "deposits",
    "withdrawals",
    "wallet",
    "analytics",
    "system",
    "config",
  ]) {
    await page.goto(`/admin/${route}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(/Last updated/)).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  }
  await expect(page.getByText(/Read-only server configuration/)).toBeVisible();
  await expect(page.getByRole("button", { name: /save/i })).toHaveCount(0);
});
