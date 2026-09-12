export interface UserProfile {
  name?: string;
  email?: string;
  photoUrl?: string;
}

export interface SubAccount {
  id: string;
  label?: string;      // e.g. "Work", "Personal", "Secondary"
  email?: string;      // e.g. "user@example.com"
  username?: string;   // e.g. "octocat"
  secret?: string;     // password / token
  notes?: string;      // specific notes for this login
}

export interface VaultRecord {
  id: string;
  type: "password" | "note" | "identity" | "bank" | "license" | "apikey";
  title: string;
  username?: string;
  secret?: string;
  notes?: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  subAccounts?: SubAccount[];
}

export interface VaultMetadata {
  schemaVersion: 1;
  vaultVersion: 1;
  createdAt: string;
  updatedAt: string;
  salt: string;
  verifier: string; // Base64 encoded encrypted verifier
}

export interface VaultData {
  vaultVersion: 1;
  updatedAt: string;
  records: VaultRecord[];
}
