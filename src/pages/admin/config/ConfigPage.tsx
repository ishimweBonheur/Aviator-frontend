import { useAdminData } from "../shared/useAdminData";
import { PageFrame } from "../shared/PageFrame";
import { Metrics } from "../shared/Metrics";
import type { Row } from "../shared/admin.api";

const settings = [
  [
    "HOUSE_EDGE",
    "house_edge",
    "Expected house edge. The backend accepts a decimal fraction from 0 (inclusive) to 1 (exclusive), shown here as 0% to below 100%.",
  ],
  [
    "MIN_BET_AMOUNT",
    "MinBet",
    "Minimum stake in RWF. At least 50, and no greater than the maximum bet.",
  ],
  [
    "MAX_BET_AMOUNT",
    "MaxBet",
    "Maximum stake in RWF. At least the minimum bet and no greater than the maximum payout.",
  ],
  [
    "MAX_PAYOUT",
    "MaxPayout",
    "Maximum payout per bet in RWF. Must be at least the maximum bet.",
  ],
  [
    "MIN_DEPOSIT_AMOUNT",
    "MinDeposit",
    "Minimum deposit in RWF. Positive and no greater than the maximum deposit.",
  ],
  [
    "MAX_DEPOSIT_AMOUNT",
    "MaxDeposit",
    "Maximum deposit in RWF. Positive and at least the minimum deposit.",
  ],
  [
    "MIN_WITHDRAWAL_AMOUNT",
    "MinWithdrawal",
    "Minimum withdrawal in RWF. Positive and no greater than the maximum withdrawal.",
  ],
  [
    "MAX_WITHDRAWAL_AMOUNT",
    "MaxWithdrawal",
    "Maximum withdrawal in RWF. Positive and at least the minimum withdrawal.",
  ],
] as const;
export function ConfigPage() {
  const state = useAdminData("config");
  const limits = state.data?.limits as Row | undefined;
  return (
    <PageFrame state={state}>
      <p className="my-4 text-xs leading-relaxed text-[#999cac]">
        Read-only server configuration from GET /api/admin/config. All amounts
        use RWF and at most two decimal places. Online updates are unavailable:
        the backend has no configuration update endpoint. Change these
        environment settings on the backend and restart the service to apply
        them.
      </p>
      {state.data && (
        <>
          <section className="mb-4.5 overflow-x-auto rounded-xl border border-[#2c2e39] bg-[#191a22] p-5 max-[650px]:p-3.5">
            <table className="w-full text-left text-xs">
              <thead>
                <tr>
                  {[
                    "Setting",
                    "Current Value",
                    "Description",
                    "Edit/Update",
                  ].map((name) => (
                    <th
                      className="border-b border-[#393b47] p-3"
                      scope="col"
                      key={name}
                    >
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settings.map(([name, key, description]) => {
                  const value =
                    key === "house_edge"
                      ? state.data?.house_edge
                      : limits?.[key];
                  return (
                    <tr key={key}>
                      <th
                        scope="row"
                        className="border-b border-[#393b47] p-3 font-medium"
                      >
                        {name}
                      </th>
                      <td className="border-b border-[#393b47] p-3">
                        {value == null ? (
                          "Not supplied by backend"
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              aria-label={name + " current value"}
                              className="w-36 rounded-md border border-[#393b47] bg-[#111219] p-2"
                              type="number"
                              readOnly
                              value={
                                key === "house_edge"
                                  ? Number(value) * 100
                                  : String(value)
                              }
                              step={key === "house_edge" ? "any" : "0.01"}
                              min={
                                key === "house_edge"
                                  ? 0
                                  : key === "MinBet"
                                    ? 50
                                    : "0.01"
                              }
                            />
                            {key === "house_edge" ? "%" : "RWF"}
                          </div>
                        )}
                      </td>
                      <td className="min-w-56 max-w-96 border-b border-[#393b47] p-3 leading-relaxed">
                        {description}
                      </td>
                      <td className="border-b border-[#393b47] p-3">
                        <button
                          disabled
                          className="rounded-md bg-[#2c2e39] px-3 py-2"
                          title="No backend update endpoint is available"
                        >
                          Update unavailable
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
          <Metrics
            data={state.data}
            keys={["betting_window_seconds", "growth_rate"]}
          />
          <details className="rounded-xl border border-[#2c2e39] bg-[#191a22] p-4 text-xs leading-relaxed">
            <summary>Backend support needed for online updates</summary>
            <p className="mt-3">
              A protected configuration update endpoint (for example PATCH
              /api/admin/config), durable storage or a managed configuration
              service, backend validation of all related limits, and audit
              logging are required. Every betting, payment and payout service
              must consume the updated values consistently. House-edge changes
              must apply to future rounds while preserving each existing round's
              committed configuration. No update API or database migration has
              been added.
            </p>
          </details>
        </>
      )}
    </PageFrame>
  );
}
