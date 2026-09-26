import type { ReactNode } from "react";
export function GameLayout({
  children,
  bets,
}: {
  children: ReactNode;
  bets: ReactNode;
}) {
  return (
    <div className="game-layout">
      <div className="game-column">{children}</div>
      {bets}
    </div>
  );
}
