// Decay System Components Export Index
export { default as DecayStatusCard } from './DecayStatusCard';
export { default as DecayConfigPanel } from './DecayConfigPanel';
export { default as DecayTransactionFilter } from './DecayTransactionFilter';
export { default as DecayAnalytics } from './DecayAnalytics';
export { default as DecayHistoryChart } from './DecayHistoryChart';
export { default as DecayDashboard } from './DecayDashboard';

// Re-export types for convenience
export type {
  DecayConfig,
  UserDecayInfo,
  BalanceWithDetails,
  TransactionType,
} from '../canister/reputationDao';
