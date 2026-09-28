import { test, expect, type Page } from "@playwright/test";

async function setupWallet(page: Page) {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "altitude-backend-session",
      JSON.stringify({
        token: "wallet-test",
        user: { id: 7, username: "pilot", email: "pilot@test" },
      }),
    ),
  );
  await page.routeWebSocket("**/ws", () => {});
  const requests: string[] = [];
  await page.route("**/api/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    requests.push(path);
    if (path === "/api/wallet/balance")
      return route.fulfill({ json: { user_id: 7, balance: "1000.00" } });
    if (path === "/api/game/rounds/current")
      return route.fulfill({ json: { running: null, upcoming: null } });
    if (path === "/api/limits")
      return route.fulfill({
        json: { MinBet: "50", MaxBet: "1000000", MaxPayout: "100000000" },
      });
    if (path === "/api/wallet/transactions")
      return route.fulfill({
        json: [
          {
            id: 1,
            type: "DEPOSIT",
            amount: "100.00",
            reference: "deposit-example",
            balance_before: "900.00",
            balance_after: "1000.00",
            created_at: "2026-09-28T10:00:00Z",
          },
          {
            id: 2,
            type: "BET",
            amount: "50.00",
            reference: "bet-example",
            balance_before: "1000.00",
            balance_after: "950.00",
            created_at: "2026-09-28T10:10:00Z",
          },
        ],
      });
    return route.fulfill({ json: [] });
  });
  return requests;
}

test("player finance routes are separate and transaction filters use backend records", async ({
  page,
}) => {
  const requests = await setupWallet(page);
  await page.goto("/deposits");
  await expect(
    page.getByRole("heading", { name: "Deposits", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Amount (RWF)")).toBeVisible();
  await page
    .getByRole("navigation", { name: "Wallet pages" })
    .getByRole("link", { name: "withdrawals" })
    .click();
  await expect(page).toHaveURL(/\/withdrawals$/);
  await expect(
    page.getByRole("button", { name: "Request withdrawal" }),
  ).toBeVisible();
  await page
    .getByRole("navigation", { name: "Wallet pages" })
    .getByRole("link", { name: "transactions" })
    .click();
  await expect(page).toHaveURL(/\/transactions$/);
  await expect(page.getByRole("table")).toContainText("deposit-example");
  await expect(page.getByRole("table")).toContainText("bet-example");
  await expect(page.getByLabel("Amount (RWF)")).toHaveCount(0);
  await page.getByLabel("Type", { exact: true }).selectOption("BET");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page.getByRole("table")).not.toContainText("deposit-example");
  await expect(page.getByRole("table")).toContainText("950.00");
  for (const path of [
    "/api/deposits",
    "/api/withdrawals",
    "/api/wallet/transactions",
  ])
    expect(requests).toContain(path);
  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
});

test("bet history modal is removed and footer stays compact", async ({
  page,
}) => {
  await setupWallet(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await expect(page.getByText("My Bet History", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "My bets", exact: true }),
  ).toBeVisible();
  const footer = page.getByRole("contentinfo");
  await expect(footer).toContainText("Play responsibly");
  expect((await footer.boundingBox())!.height).toBeLessThan(50);
  await page.getByRole("link", { name: "Provably fair", exact: true }).click();
  await expect(page).toHaveURL(/\/fairness$/);
  await expect(
    page.getByRole("button", { name: "Inspect fairness" }),
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
