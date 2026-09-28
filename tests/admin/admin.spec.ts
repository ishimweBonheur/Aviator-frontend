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
  ).toHaveCount(0);
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
test("client details identify the selected account before confirming a role change", async ({
  page,
}) => {
  const mutations = await setup(page);
  let role = "PLAYER";
  await page.route(/\/api\/admin\/users\/2(?:\?.*)?$/, (route) =>
    route.fulfill({
      json: {
        user: {
          id: 2,
          username: "pilot",
          email: "pilot@example.test",
          role,
          status: "ACTIVE",
          balance: "1000.00",
        },
        bets: [],
        deposits: [],
        withdrawals: [],
        "wallet-transactions": [],
      },
    }),
  );
  await page.route("**/api/admin/users/2/role", async (route) => {
    const body = route.request().postDataJSON();
    role = body.role;
    mutations.push({ method: route.request().method(), body });
    await route.fulfill({ json: { status: "updated" } });
  });
  await page.goto("/admin/users");
  await expect(
    page.getByRole("button", { name: "Create administrator" }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "View Client Details" }).click();
  await expect(page).toHaveURL(/\/admin\/users\/2$/);
  await page.getByRole("button", { name: "Grant admin privileges" }).click();
  await expect(page.getByRole("dialog")).toContainText("pilot");
  await expect(page.getByRole("dialog")).toContainText("User ID 2");
  expect(mutations).toHaveLength(0);
  await page.getByRole("button", { name: "Confirm role change" }).click();
  await expect(
    page.getByRole("button", { name: "Remove admin privileges" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove admin privileges" }).click();
  await page.getByRole("button", { name: "Confirm role change" }).click();
  await expect(
    page.getByRole("button", { name: "Grant admin privileges" }),
  ).toBeVisible();
  expect(mutations).toEqual([
    { method: "PATCH", body: { role: "ADMIN" } },
    { method: "PATCH", body: { role: "PLAYER" } },
  ]);
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
    "transactions",
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

test("wallet history has its own route and stays scoped to the selected user", async ({
  page,
}) => {
  await setup(page);
  const queries: string[] = [];
  await page.route("**/api/admin/wallet-transactions?**", (route) => {
    queries.push(route.request().url());
    return route.fulfill({
      json: {
        items: [
          {
            id: 21,
            username: "pilot",
            user_id: 2,
            type: "BET",
            amount: "50.00",
            reference: "BET-21",
            balance_before: "1000.00",
            balance_after: "950.00",
            created_at: "2026-09-28T10:00:00Z",
          },
        ],
        total: 1,
        page: 1,
        page_size: 25,
      },
    });
  });
  await page.goto("/admin/wallet");
  await expect(
    page.getByRole("columnheader", { name: "Username", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "User ID", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View History" }).click();
  await expect(page).toHaveURL(/\/admin\/transactions\?user_id=2$/);
  await expect(page.getByLabel("User ID", { exact: true })).toHaveValue("2");
  await expect(page.getByRole("table")).toContainText("BET-21");
  expect(
    queries.every((q) => new URL(q).searchParams.get("user_id") === "2"),
  ).toBe(true);
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(page.getByLabel("User ID", { exact: true })).toHaveValue("");
  await expect
    .poll(() => new URL(queries.at(-1)!).searchParams.has("user_id"))
    .toBe(false);
});

test("financial and bet lists put backend usernames first", async ({
  page,
}) => {
  await setup(page);
  for (const resource of [
    "bets",
    "auto-bets",
    "auto-cashouts",
    "deposits",
    "withdrawals",
  ]) {
    await page.route(`**/api/admin/${resource}?**`, (route) =>
      route.fulfill({
        json: {
          items: [
            {
              id: 20,
              user_id: 2,
              username: "pilot",
              bet_number: 1,
              amount: "50.00",
              status: "ACTIVE",
              placed_at: "2026-09-28T10:00:00Z",
            },
          ],
          total: 1,
          page: 1,
          page_size: 25,
        },
      }),
    );
    await page.goto(`/admin/${resource}`);
    await expect(page.getByRole("columnheader").first()).toHaveText("Username");
    await expect(
      page.getByRole("table").getByRole("link", { name: "pilot" }),
    ).toHaveAttribute("href", "/admin/users/2");
    await expect(page.locator("time")).toHaveAttribute(
      "datetime",
      "2026-09-28T10:00:00Z",
    );
  }
});

test("audit details wrap and the sidebar stays visible as main content scrolls", async ({
  page,
}) => {
  await setup(page);
  await page.route("**/api/admin/audit-logs?**", (route) =>
    route.fulfill({
      json: {
        items: Array.from({ length: 25 }, (_, i) => ({
          id: i + 1,
          admin_id: 1,
          admin_username: "operator",
          user_id: 2,
          username: "pilot",
          action: "ROLE_CHANGE",
          details: {
            before: "PLAYER",
            after: "ADMIN",
            reason: "Detailed audit reason ".repeat(15),
          },
          reference: "long-reference-".repeat(25),
          created_at: "2026-09-28T10:00:00Z",
        })),
        total: 25,
        page: 1,
        page_size: 25,
      },
    }),
  );
  await page.goto("/admin/audit-logs");
  await expect(page.getByRole("table")).toContainText("Role Change");
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 800 });
    const aside = page.locator("aside");
    const before = await aside.boundingBox();
    await page
      .getByRole("main", { name: "Admin content" })
      .evaluate((el) => (el.scrollTop = 800));
    const after = await aside.boundingBox();
    expect(after?.y).toBe(before?.y);
    expect(
      await page
        .getByRole("main", { name: "Admin content" })
        .evaluate((el) => el.scrollTop),
    ).toBeGreaterThan(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("main", { name: "Admin content" })
      .evaluate((el) => (el.scrollTop = 0));
  }
  await page.screenshot({ path: "test-results/audit-mobile.png" });
});

test("analytics contains trends while overview only requests operational summary", async ({
  page,
}) => {
  await setup(page);
  const requests: string[] = [];
  page.on("request", (req) => requests.push(new URL(req.url()).pathname));
  await page.goto("/admin");
  await expect(page.getByText("Player wallet liability")).toBeVisible();
  expect(requests).not.toContain("/api/admin/analytics");
  await page.goto("/admin/analytics");
  await expect(
    page.getByRole("heading", { name: "Daily financial activity" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Bet volume and player activity" }),
  ).toBeVisible();
  await expect(page.getByText("Player wallet liability")).toHaveCount(0);
});

test("configuration shows actual server values and never pretends to update unsupported settings", async ({
  page,
}) => {
  const mutations = await setup(page);
  await page.goto("/admin/config");
  await expect(page.getByLabel("HOUSE_EDGE current value")).toHaveValue("3");
  await expect(page.getByLabel("MIN_BET_AMOUNT current value")).toHaveValue(
    "50.00",
  );
  await expect(
    page.getByRole("button", { name: "Update unavailable" }),
  ).toHaveCount(8);
  for (const button of await page
    .getByRole("button", { name: "Update unavailable" })
    .all())
    await expect(button).toBeDisabled();
  expect(mutations).toHaveLength(0);
});
