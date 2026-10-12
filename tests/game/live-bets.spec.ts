import { test, expect, type Page } from "@playwright/test";

function seedBets(): Record<string, unknown>[] {
  return [
    {
      id: 1,
      round_id: 11,
      round_number: 11,
      bet_number: 1,
      status: "CASHED_OUT",
      round_status: "RUNNING",
      payout: "1500",
      cashout_multiplier: "1.50",
      user_id: 7,
      amount: "1000",
    },
    {
      id: 2,
      round_id: 10,
      round_number: 10,
      bet_number: 2,
      status: "LOST",
      round_status: "SETTLED",
      payout: "0",
      user_id: 7,
      amount: "2500",
    },
    {
      id: 3,
      round_id: 12,
      round_number: 12,
      bet_number: 1,
      status: "ACTIVE",
      round_status: "BETTING_OPEN",
      payout: "0",
      user_id: 7,
      amount: "500",
    },
  ];
}

async function liveBets(page: Page, bets: Record<string, unknown>[] = seedBets()) {
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "altitude-backend-session",
      JSON.stringify({
        token: "test",
        user: { id: 7, username: "pilot", email: "pilot@test" },
      }),
    ),
  );
  await page.routeWebSocket("**/ws", () => {});
  await page.route("**/api/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname;
    if (path === "/api/game/rounds/current")
      return route.fulfill({
        json: {
          running: null,
          upcoming: { id: 12, round_number: 12, status: "BETTING_OPEN" },
          seconds_remaining: 30,
        },
      });
    if (path === "/api/game/rounds") return route.fulfill({ json: [] });
    if (path === "/api/limits")
      return route.fulfill({
        json: { MinBet: "50", MaxBet: "1000000", MaxPayout: "100000000" },
      });
    if (path === "/api/wallet/balance")
      return route.fulfill({ json: { user_id: 7, balance: "25000" } });
    if (path === "/api/bets/auto" || path === "/api/deposits")
      return route.fulfill({ json: [] });
    if (path === "/api/bets" && request.method() === "GET")
      return route.fulfill({ json: bets });
    return route.fulfill({ status: 404, json: { error: "not found" } });
  });
  await page.goto("/");
}

test("live bets show all bets and total in RWF with a top players leaderboard", async ({
  page,
}) => {
  await liveBets(page);
  await expect(
    page.getByText("Flight manifest", { exact: true }),
  ).toBeVisible();

  // All bets feed with the RWF total bar
  await expect(page.getByText("LIVE", { exact: true })).toBeVisible();
  await expect(page.getByText("All confirmed bets", { exact: true })).toBeVisible();
  await expect(page.getByText("Total bets", { exact: true })).toBeVisible();
  await expect(page.locator("aside")).toContainText("4,000");
  await expect(page.locator("aside")).toContainText("3 bets");
  await expect(
    page.locator("aside").getByText("pilot"),
  ).toHaveCount(3);

  // Top players leaderboard ranks bets by amount
  await page.getByRole("button", { name: "Top", exact: true }).click();
  await expect(page.getByText("Highest bets", { exact: true })).toBeVisible();
  await expect(page.locator("aside")).toContainText("Latest · 3 bets");
  for (const rank of ["1", "2", "3"]) {
    await expect(
      page.locator("aside").getByText(rank, { exact: true }).first(),
    ).toBeVisible();
  }

  // My bets history keeps the acknowledged cash-out row
  await page.getByRole("button", { name: "My bets", exact: true }).click();
  await expect(page.getByText("Your flight history", { exact: true })).toBeVisible();
  await expect(page.locator(".player-won")).toContainText("1,500");
});

test("game page fills the viewport and the footer stays compact", async ({
  page,
}) => {
  await liveBets(page);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight >= innerHeight,
      ),
    ).toBe(true);
    const footer = page.getByRole("contentinfo");
    await expect(footer).toContainText("Play responsibly");
    expect((await footer.boundingBox())!.height).toBeLessThan(50);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  const aside = page.locator("aside");
  await expect(aside).toBeVisible();
  expect((await aside.boundingBox())!.height).toBeGreaterThan(700);
  expect((await aside.boundingBox())!.height).toBeLessThan(1000);
  await page.screenshot({ path: "test-results/live-bets-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 375, height: 800 });
  await page.screenshot({ path: "test-results/live-bets-mobile.png", fullPage: true });
});

test("empty feed keeps the player feed placeholder", async ({ page }) => {
  await liveBets(page, []);
  await expect(
    page.getByText("Player feed not available", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
