import type { WalletResource } from "../types/wallet.types";
export function WalletNavigation({ active }: { active?: WalletResource }) {
  return (
    <nav
      aria-label="Wallet pages"
      className="my-4 flex flex-wrap gap-3 text-sm"
    >
      {(["deposits", "withdrawals", "transactions"] as const).map((kind) => (
        <a
          key={kind}
          href={`/${kind}`}
          aria-current={active === kind ? "page" : undefined}
          className="rounded-md bg-[#292830] px-3 py-2 capitalize aria-[current]:bg-brand-btn"
        >
          {kind}
        </a>
      ))}
    </nav>
  );
}
