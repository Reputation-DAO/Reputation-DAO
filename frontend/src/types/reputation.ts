import type { Principal } from "@dfinity/principal";

export type ReputationTransactionType = "award" | "revoke" | "decay";

export interface TransactionEntry {
  id: string;
  type: ReputationTransactionType;
  amount: number;
  from: string;
  to: string;
  reason: string;
  timestamp: Date;
}

export interface AwarderSummary {
  principal: Principal;
  name: string | null;
  awardsGiven: number;
  lastActive: Date | null;
}

export interface BalanceSummary {
  principal: string;
  displayName: string;
  balance: number;
  lastActivity?: Date;
}
