import type { ReactNode } from "react";
export function GameLayout({
  children,
  bets,
}: {
  children: ReactNode;
  bets: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_315px] gap-[22px] min-[1440px]:grid-cols-[minmax(0,1fr)_345px] max-[1100px]:grid-cols-[minmax(0,1fr)_270px] max-[1100px]:gap-[15px] max-[900px]:grid-cols-1 max-[600px]:gap-[19px]">
      <div className="min-w-0">{children}</div>
      {bets}
    </div>
  );
}
