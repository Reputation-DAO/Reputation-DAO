// src/features/orgs/model/org.types.ts

export type Plan = "Trial" | "Basic";
export type OrgStatus = "Active" | "Archived";
export type Visibility = "Public" | "Private";

export type OrgRecord = {
  id: string;               // canister id (text)
  name: string;             // display name (note or id)
  canisterId: string;       // same as id (explicit for clarity)
  status: OrgStatus;        // from Child.status variant
  visibility?: Visibility;  // from Child.visibility
  plan?: Plan;              // from Child.plan
  createdAt?: number;       // ms epoch (normalized)
  expiresAt?: number;       // ms epoch (normalized)
  users?: string;           // numeric string (from health)
  cycles?: string;          // numeric string (from health)
  txCount?: string;         // numeric string (from health)
  topUpCount?: string;      // numeric string (from health)
  paused?: boolean;         // from health
  isStopped?: boolean;      // true if child not responding or explicitly stopped
};

export type SortOrder = "recent" | "name" | "usage";
export type StatusFilter = "all" | "active" | "archived" | "stopped";
