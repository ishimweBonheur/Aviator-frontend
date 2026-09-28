import { test, expect, type Page, type WebSocketRoute } from "@playwright/test";

async function fixture(page: Page) {
  let socket: WebSocketRoute;
  const rounds = [
    { id: 10, round_number: 10, status: "RUNNING" },
    { id: 11, round_number: 11, status: "BETTING_OPEN" },
  ];
  type SavedBet = {
    id: number;
    round_id: number;
    bet_number: number;
    status: string;
    payout: string;
  };
  const bets: SavedBet[] = [];
  const placed: Record<string, unknown>[] = [];
  let seconds = 0;
  await page.addInitScript(() =>
    sessionStorage.setItem(
      "altitude-backend-session",
      JSON.stringify({
        token: "test",
        user: { id: 7, username: "pilot", email: "pilot@test" },
      }),
    ),
  );
  await page.routeWebSocket("**/ws", (ws) => {
    socket = ws;
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname;
    const running = rounds.find((r) => r.status === "RUNNING");
    const upcoming = rounds.find((r) => r.status === "BETTING_OPEN");
    if (path === "/api/game/rounds/current")
      return route.fulfill({
        json: {
          running,
          upcoming,
          current_multiplier: "1.50",
          seconds_remaining: seconds,
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
      return route.fulfill({
        json: bets.map((b) => ({
          ...b,
          round_status: rounds.find((r) => r.id === b.round_id)!.status,
          can_cancel: b.status === "ACTIVE" && b.round_id === upcoming?.id,
          can_cashout: b.status === "ACTIVE" && b.round_id === running?.id,
          potential_payout:
            b.status === "CASHED_OUT"
              ? "1500"
              : b.round_id === running?.id
                ? "1500"
                : "0",
        })),
      });
    if (path === "/api/bets" && request.method() === "POST") {
      const body = request.postDataJSON();
      placed.push(body);
      if (body.round_id !== upcoming?.id) return route.fulfill({ status: 409 });
      const bet = {
        ...body,
        id: bets.length + 100,
        user_id: 7,
        round_number: body.round_id,
        status: "ACTIVE",
        payout: "0",
      };
      bets.unshift(bet);
      return route.fulfill({ status: 201, json: { bet } });
    }
    const action = path.match(/^\/api\/bets\/(\d+)\/(cancel|cashout)$/);
    if (action) {
      const bet = bets.find((b) => b.id === Number(action[1]))!;
      if (action[2] === "cancel") {
        if (bet.round_id !== upcoming?.id)
          return route.fulfill({ status: 409 });
        bet.status = "CANCELLED";
        return route.fulfill({ json: { bet_id: bet.id } });
      }
      if (bet.round_id !== running?.id) return route.fulfill({ status: 409 });
      bet.status = "CASHED_OUT";
      return route.fulfill({
        json: {
          bet_id: bet.id,
          multiplier: "1.50",
          payout: "1500",
          remaining_balance: "25500",
        },
      });
    }
    return route.fulfill({ json: [] });
  });
  await page.goto("/");
  const panels = page
    .locator("section")
    .filter({ has: page.locator('input[id^="amount-"]') });
  await expect(panels).toHaveCount(2);
  await expect(
    panels.first().getByRole("button", { name: "BET", exact: true }),
  ).toBeEnabled();
  return {
    panels,
    placed,
    bets,
    emit(type: string, id = 10, extra: Record<string, unknown> = {}) {
      const round = rounds.find((r) => r.id === id)!;
      if (type === "ROUND_STARTED") round.status = "RUNNING";
      if (type === "ROUND_CRASHED") {
        round.status = "CRASHED";
        bets
          .filter((b) => b.round_id === id && b.status === "ACTIVE")
          .forEach((b) => (b.status = "LOST"));
      }
      if (type === "ROUND_SETTLED") round.status = "SETTLED";
      if (type === "COUNTDOWN") seconds = Number(extra.seconds_remaining);
      socket.send(
        JSON.stringify({ type, round_id: id, round_number: id, ...extra }),
      );
    },
  };
}

test("panels independently queue during flight and keep cancellation through crash/countdown", async ({
  page,
}) => {
  const mock = await fixture(page);
  const first = mock.panels.nth(0),
    second = mock.panels.nth(1);
  await first.getByRole("button", { name: "BET", exact: true }).click();
  await expect(
    first.getByRole("button", { name: "CANCEL", exact: true }),
  ).toBeEnabled();
  await expect(
    second.getByRole("button", { name: "BET", exact: true }),
  ).toBeEnabled();
  expect(mock.placed[0]).toMatchObject({ round_id: 11, bet_number: 1 });
  await expect(first).not.toContainText(/Round #|Upcoming #|queued for round/i);
  await expect(
    first.getByRole("button", { name: "CANCEL", exact: true }),
  ).not.toContainText("1,000");
  mock.emit("MULTIPLIER_UPDATE", 10, { multiplier: "2.00" });
  await page.reload();
  await expect(
    first.getByRole("button", { name: "CANCEL", exact: true }),
  ).toBeEnabled();
  await second.getByRole("button", { name: "BET", exact: true }).click();
  expect(mock.placed[1]).toMatchObject({ round_id: 11, bet_number: 2 });
  await expect(
    second.getByRole("button", { name: "CANCEL", exact: true }),
  ).toBeEnabled();
  mock.emit("ROUND_CRASHED", 10, { crash_point: "2.00" });
  await expect(
    first.getByRole("button", { name: "CANCEL", exact: true }),
  ).toBeEnabled();
  mock.emit("ROUND_SETTLED", 10);
  for (const seconds_remaining of [5, 4, 1, 0]) {
    mock.emit("COUNTDOWN", 11, { seconds_remaining });
    await expect(
      first.getByRole("button", { name: "CANCEL", exact: true }),
    ).toBeEnabled();
    await expect(
      second.getByRole("button", { name: "CANCEL", exact: true }),
    ).toBeEnabled();
  }
  mock.emit("ROUND_STARTED", 11);
  await expect(first.getByRole("button", { name: /CASH OUT/ })).toBeEnabled();
  await expect(second.getByRole("button", { name: /CASH OUT/ })).toBeEnabled();
  await first.getByRole("button", { name: /CASH OUT/ }).click();
  await expect(first.getByRole("status")).toHaveText("Bet won");
  await expect(second.getByRole("button", { name: /CASH OUT/ })).toBeEnabled();
  mock.emit("ROUND_CRASHED", 11, { crash_point: "1.50" });
  await expect(second.getByRole("status")).toHaveText("Bet lost");
});

test("cancelling one queued panel during a flight leaves the other bet intact", async ({
  page,
}) => {
  const mock = await fixture(page);
  for (const panel of [mock.panels.nth(0), mock.panels.nth(1)]) {
    await panel.getByRole("button", { name: "BET", exact: true }).click();
    await expect(
      panel.getByRole("button", { name: "CANCEL", exact: true }),
    ).toBeEnabled();
  }
  await mock.panels
    .first()
    .getByRole("button", { name: "CANCEL", exact: true })
    .click();
  await expect(
    mock.panels.first().getByRole("button", { name: "BET", exact: true }),
  ).toBeEnabled();
  await expect(
    mock.panels.nth(1).getByRole("button", { name: "CANCEL", exact: true }),
  ).toBeEnabled();
  expect(mock.bets.find((b) => b.bet_number === 1)?.status).toBe("CANCELLED");
  mock.emit("ROUND_CRASHED", 10, { crash_point: "2.00" });
  mock.emit("ROUND_SETTLED", 10);
  mock.emit("COUNTDOWN", 11, { seconds_remaining: 3 });
  await mock.panels
    .nth(1)
    .getByRole("button", { name: "CANCEL", exact: true })
    .click();
  await expect(
    mock.panels.nth(1).getByRole("button", { name: "BET", exact: true }),
  ).toBeEnabled();
});

test("a current cashout and an upcoming queued bet remain separate in the same panel", async ({
  page,
}) => {
  const mock = await fixture(page);
  const first = mock.panels.first();
  await first.getByRole("button", { name: "BET", exact: true }).click();
  await expect(
    first.getByRole("button", { name: "CANCEL", exact: true }),
  ).toBeEnabled();
  mock.bets.push({
    id: 200,
    round_id: 10,
    bet_number: 1,
    status: "ACTIVE",
    payout: "0",
  });
  mock.emit("BET_PLACED", 10);
  await expect(first.getByRole("button", { name: /CASH OUT/ })).toBeEnabled();
  await first.getByRole("button", { name: /CASH OUT/ }).click();
  await expect(
    first.getByRole("button", { name: "CANCEL", exact: true }),
  ).toBeEnabled();
  await expect(first.getByRole("status")).toHaveText("Bet won");
  await expect(
    mock.panels.nth(1).getByRole("button", { name: "BET", exact: true }),
  ).toBeEnabled();
});
