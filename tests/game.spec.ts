import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("altitude-mode", "demo");
    Math.random = () => 0.5;
  });
  await page.clock.install({ time: new Date("2026-09-25T10:00:00Z") });
  await page.clock.pauseAt(new Date("2026-09-25T10:00:00.100Z"));
  await page.goto("/");
});

test("two bets, refund, auto settlement, manual cash out and demo wallet", async ({
  page,
}) => {
  const panels = page.locator(".bet-panel");
  await panels
    .nth(0)
    .getByRole("button", { name: /Place bet/ })
    .click();
  await expect(page.locator(".wallet strong")).toHaveText("24,000 RWF");
  await panels
    .nth(0)
    .getByRole("button", { name: /Cancel bet/ })
    .click();
  await expect(page.locator(".wallet strong")).toHaveText("25,000 RWF");
  await page.getByLabel("Auto cash out multiplier 2").fill("1.1");
  await page.getByRole("switch", { name: "Auto cash out panel 2" }).click();
  await panels
    .nth(0)
    .getByRole("button", { name: /Place bet/ })
    .click();
  await panels
    .nth(1)
    .getByRole("button", { name: /Place bet/ })
    .click();
  await expect(page.locator(".wallet strong")).toHaveText("23,000 RWF");
  await page.clock.runFor(7500);
  await expect(
    panels.nth(1).getByRole("button", { name: /Bet won/ }),
  ).toBeVisible();
  await expect(page.locator(".wallet strong")).toHaveText("24,100 RWF");
  await panels
    .nth(0)
    .getByRole("button", { name: /Cash out/ })
    .click();
  await expect(
    panels.nth(0).getByRole("button", { name: /Bet won/ }),
  ).toBeDisabled();
  await expect(page.locator(".wallet strong")).not.toHaveText("24,100 RWF");
  await page.getByRole("button", { name: "My bets", exact: true }).click();
  await expect(page.locator(".player-won")).toHaveCount(2);
  await page.getByRole("button", { name: "Deposit", exact: true }).click();
  await page.getByRole("button", { name: "Add 10,000 demo RWF" }).click();
  await page.clock.runFor(500);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("loss, round history and repeating automatic bets", async ({ page }) => {
  const panel = page.locator(".bet-panel").first();
  await panel.getByRole("button", { name: "Auto", exact: true }).click();
  await page
    .getByRole("switch", { name: "Auto bet panel 1", exact: true })
    .click();
  await panel.getByRole("button", { name: /Place bet/ }).click();
  await page.clock.fastForward(6000);
  await page.clock.fastForward(17000);
  await expect(page.getByText("FLEW AWAY", { exact: true })).toBeVisible();
  await expect(panel.getByRole("button", { name: /Bet lost/ })).toBeVisible();
  await expect(page.locator(".history-chip").first()).toHaveText("4.50×");
  await page.clock.fastForward(3600);
  await expect(panel.getByRole("button", { name: /Cancel bet/ })).toBeVisible();
  await expect(page.locator(".wallet strong")).toHaveText("23,000 RWF");
});

test("invalid amounts are rejected and dialogs support keyboard dismissal", async ({
  page,
}) => {
  await page.getByLabel("Bet amount").first().fill("999999");
  await page
    .locator(".bet-panel")
    .first()
    .getByRole("button", { name: /Place bet/ })
    .click();
  await page.clock.runFor(100);
  await expect(page.getByText("Insufficient demo balance")).toBeVisible();
  await expect(page.locator(".wallet strong")).toHaveText("25,000 RWF");
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.clock.runFor(500);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

for (const width of [320, 768, 1024, 1440]) {
  test(`responsive layout at ${width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.clock.runFor(12000);
    await expect(page.locator(".aircraft")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const panels = await page.locator(".bet-panel").all();
    for (const panel of panels) {
      const box = await panel.boundingBox();
      expect(box!.x + box!.width).toBeLessThanOrEqual(width);
    }
    expect(errors).toEqual([]);
    await page.screenshot({
      path: `test-results/altitude-${width}.png`,
      fullPage: true,
    });
  });
}
