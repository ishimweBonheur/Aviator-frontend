import { test, expect, type Page } from "@playwright/test";

async function setup(
  page: Page,
  forbidden: boolean | (() => boolean) = false,
  role: "PLAYER" | "ADMIN" = "ADMIN",
) {
  const mutations: { method: string; body: Record<string, unknown> }[] = [];
  await page.addInitScript((role) => {
    sessionStorage.setItem(
      "altitude-backend-session",
      JSON.stringify({
        token: "test-admin",
        user: {
          id: 1,
          username: "operator",
          email: "admin@example.test",
          role,
        },
      }),
    );
  }, role);
  await page.routeWebSocket("**/ws", () => {});
  await page.route("**/api/**", async (route) => {
    const req = route.request(),
      url = new URL(req.url()),
      path = url.pathname;
    if (path.startsWith("/api/admin/")) {
      expect(req.headers().authorization).toBe("Bearer test-admin");
      if (typeof forbidden === "function" ? forbidden() : forbidden)
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
test("admins can change other roles and create administrator accounts", async ({
  page,
}) => {
  const mutations = await setup(page);
  let playerRole = "PLAYER";
  await page.route("**/api/admin/users?**", (route) =>
    route.fulfill({
      json: {
        items: [
          { id: 1, username: "operator", role: "ADMIN", status: "ACTIVE" },
          { id: 2, username: "pilot", role: playerRole, status: "ACTIVE" },
        ],
        total: 2,
        page: 1,
        page_size: 25,
      },
    }),
  );
  await page.route("**/api/admin/users/2/role", async (route) => {
    const body = route.request().postDataJSON() as { role: string };
    mutations.push({ method: "PATCH", body });
    playerRole = body.role;
    await route.fulfill({ json: { status: "updated" } });
  });

  await page.goto("/admin/users");
  await expect(
    page.getByRole("row", { name: /operator/ }).getByRole("button", {
      name: "Make player",
    }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Make admin" }).click();
  await page.getByRole("button", { name: "Confirm role change" }).click();
  await expect(page.getByRole("button", { name: "Make player" }).last()).toBeVisible();
  await page.getByRole("button", { name: "Make player" }).last().click();
  await page.getByRole("button", { name: "Confirm role change" }).click();
  await expect(page.getByRole("button", { name: "Make admin" })).toBeVisible();
  expect(mutations.slice(0, 2)).toEqual([
    { method: "PATCH", body: { role: "ADMIN" } },
    { method: "PATCH", body: { role: "PLAYER" } },
  ]);

  await page.getByRole("button", { name: "Create administrator" }).click();
  await page.getByLabel("Username").fill("new-operator");
  await page.getByLabel("Email").fill("new-operator@example.test");
  await page.getByLabel("Temporary password").fill("password123");
  await page.getByRole("button", { name: "Create admin account" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(mutations[2]).toEqual({
    method: "POST",
    body: {
      username: "new-operator",
      email: "new-operator@example.test",
      password: "password123",
    },
  });
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
    "auto-bets",
    "auto-cashouts",
    "audit-logs",
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

test("audit logs display server records and send administrator/action filters", async ({
  page,
}) => {
  await setup(page);
  const queries: string[] = [];
  await page.route("**/api/admin/audit-logs**", async (route) => {
    queries.push(route.request().url());
    await route.fulfill({
      json: {
        items: [
          {
            id: 10,
            admin_id: 1,
            user_id: 2,
            action: "WALLET_ADJUSTMENT",
            reference: "audit-ref-123",
            details: { reason: "Reconcile support case" },
          },
        ],
        total: 1,
        page: 1,
        page_size: 25,
      },
    });
  });
  await page.goto("/admin/audit-logs");
  await expect(page.getByText("audit-ref-123", { exact: true })).toBeVisible();
  await page.getByLabel("Administrator ID").fill("1");
  await page
    .getByLabel("Action", { exact: true })
    .selectOption("WALLET_ADJUSTMENT");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect
    .poll(() =>
      queries.some(
        (q) =>
          q.includes("admin_id=1") && q.includes("action=WALLET_ADJUSTMENT"),
      ),
    )
    .toBe(true);
});

test("admin access uses the backend role even when cached role is PLAYER", async ({
  page,
}) => {
  await setup(page, false, "PLAYER");
  const playerRequests: string[] = [];
  page.on("request", (request) => {
    const path = new URL(request.url()).pathname;
    if (path.startsWith("/api/") && !path.startsWith("/api/admin/"))
      playerRequests.push(path);
  });
  await page.goto("/admin");
  await expect(page.getByText("Player wallet liability")).toBeVisible();
  expect(playerRequests).toEqual([]);
});

test("forbidden account can retry after backend access changes", async ({
  page,
}) => {
  let forbidden = true;
  await setup(page, () => forbidden);
  await page.goto("/admin");
  await expect(
    page.getByText("Being signed in does not grant admin access.", {
      exact: false,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Sign in with another account" }),
  ).toBeVisible();
  forbidden = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Player wallet liability")).toBeVisible();
});

test("expired admin session returns to sign in and clears the stored token", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/admin/session", (route) =>
    route.fulfill({ status: 401, json: { error: "token expired" } }),
  );
  await page.goto("/admin");
  await expect(
    page.getByRole("heading", { name: "Admin sign in" }),
  ).toBeVisible();
  await expect(page.getByRole("alert")).toHaveText(
    "Your session expired. Sign in again.",
  );
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("altitude-backend-session"),
    ),
  ).toBeNull();
});

test("temporary admin failure can retry without signing out or showing role guidance", async ({
  page,
}) => {
  await setup(page);
  let unavailable = true;
  await page.route("**/api/admin/session", (route) =>
    route.fulfill(
      unavailable
        ? { status: 503, json: { error: "account unavailable" } }
        : { json: { id: 1, role: "ADMIN" } },
    ),
  );
  await page.goto("/admin");
  await expect(page.getByRole("alert")).toContainText("account unavailable");
  await expect(
    page.getByText("Being signed in does not grant admin access.", {
      exact: false,
    }),
  ).toHaveCount(0);
  unavailable = false;
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("Player wallet liability")).toBeVisible();
});

test("access revoked during an admin data request removes protected content", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/admin/users?**", (route) =>
    route.fulfill({
      status: 403,
      json: { error: "administrator access required" },
    }),
  );
  await page.goto("/admin/users");
  await expect(
    page.getByRole("heading", { name: "Admin access unavailable" }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});

test("admin monitor follows server ticks then stops at crash and displays countdown", async ({
  page,
}) => {
  await setup(page);
  let send: ((event: object) => void) | undefined;
  await page.routeWebSocket("**/ws", (ws) => {
    send = (event) => ws.send(JSON.stringify(event));
  });
  await page.route("**/api/admin/game/current", (route) =>
    route.fulfill({
      json: {
        running: { id: 50, round_number: 50, status: "RUNNING" },
        upcoming: null,
        current_multiplier: "1.10",
        seconds_remaining: 0,
      },
    }),
  );
  await page.goto("/admin/system");
  const monitor = page.locator(".admin-live");
  await expect(monitor).toContainText("1.10×");
  await expect.poll(() => !!send).toBe(true);
  send!({
    type: "MULTIPLIER_UPDATE",
    round_id: 50,
    round_number: 50,
    multiplier: "1.75",
  });
  await expect(monitor).toContainText("1.75×");
  send!({
    type: "ROUND_CRASHED",
    round_id: 50,
    round_number: 50,
    crash_point: "1.80",
  });
  send!({
    type: "MULTIPLIER_UPDATE",
    round_id: 50,
    round_number: 50,
    multiplier: "2.50",
  });
  await expect(monitor).toContainText("CRASHED");
  await expect(monitor).not.toContainText("2.50×");
  send!({
    type: "ROUND_OPENED",
    round_id: 51,
    round_number: 51,
    seconds_remaining: 5,
  });
  await expect(monitor).toContainText("BETTING_OPEN");
  await expect(monitor).toContainText("5s");
});
