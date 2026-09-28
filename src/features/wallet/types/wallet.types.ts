export type WalletResource = "deposits" | "withdrawals" | "transactions";
export interface WalletEntry {
  id: number;
  amount: string;
  provider?: string;
  status?: string;
  type?: string;
  created_at: string;
  provider_reference?: string;
  reference?: string;
  balance_after?: string;
  balance_before?: string;
}
