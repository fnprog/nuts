export interface Migration {
  version: number;
  name: string;
  up: (execute: ExecuteFunction) => Promise<void>;
  down: (execute: ExecuteFunction) => Promise<void>;
}

export type ExecuteFunction = (sql: string, params?: unknown[]) => Promise<void>;

export interface MigrationRecord {
  version: number;
  name: string;
  applied_at: number;
}

export interface MigrationResult {
  success: boolean;
  version: number;
  name: string;
  error?: string;
}
