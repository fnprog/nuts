export * from "./types";
export * from "./runner";
export * from "./plugin-runner";
export { migration001 } from "./files/001_initial_schema";
export { migration002 } from "./files/002_align_account_schema";
export { migration003 } from "./files/003_sync_schema_alignment";
export { migration004 } from "./files/004_add_rules_table";
export { migration005 } from "./files/005_add_default_categories";
export { migration006 } from "./files/006_add_category_type";
export { migration007 } from "./files/007_add_crdt_documents";
export { migration008 } from "./files/008_add_crdt_backups";
export { migration009 } from "./files/009_add_migration_state";
export { migration010 } from "./files/010_add_file_metadata_table";
export { migration011 } from "./files/011_add_folders_table";

import type { Migration } from "./types";
import { migration001 } from "./files/001_initial_schema";
import { migration002 } from "./files/002_align_account_schema";
import { migration003 } from "./files/003_sync_schema_alignment";
import { migration004 } from "./files/004_add_rules_table";
import { migration005 } from "./files/005_add_default_categories";
import { migration006 } from "./files/006_add_category_type";
import { migration007 } from "./files/007_add_crdt_documents";
import { migration008 } from "./files/008_add_crdt_backups";
import { migration009 } from "./files/009_add_migration_state";
import { migration010 } from "./files/010_add_file_metadata_table";
import { migration011 } from "./files/011_add_folders_table";

export const allMigrations: Migration[] = [migration001, migration002, migration003, migration004, migration005, migration006, migration007, migration008, migration009, migration010, migration011];
