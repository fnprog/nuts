import { lazy } from "react";
import { TestTube } from "lucide-react";
import type { PluginConfigExternal, PluginMigration } from "../types";

const TestPage = lazy(() => import("./pages/test-page"));

const migrations: PluginMigration[] = [
  {
    version: 1,
    pluginId: "test-plugin",
    name: "create_test_items_table",
    up: async (execute) => {
      await execute(`
        CREATE TABLE plugin_test_plugin_test_items (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          created_at INTEGER NOT NULL
        );
      `);
      await execute(`
        CREATE INDEX idx_test_items_created_at 
          ON plugin_test_plugin_test_items(created_at);
      `);
    },
    down: async (execute) => {
      await execute("DROP INDEX IF EXISTS idx_test_items_created_at;");
      await execute("DROP TABLE IF EXISTS plugin_test_plugin_test_items;");
    },
  },
  {
    version: 2,
    pluginId: "test-plugin",
    name: "add_test_items_category",
    up: async (execute) => {
      await execute(`
        ALTER TABLE plugin_test_plugin_test_items 
        ADD COLUMN category TEXT DEFAULT 'general';
      `);
    },
    down: async (execute) => {
      await execute(`
        CREATE TABLE plugin_test_plugin_test_items_temp AS 
        SELECT id, name, description, created_at 
        FROM plugin_test_plugin_test_items;
      `);
      await execute("DROP TABLE plugin_test_plugin_test_items;");
      await execute(`
        ALTER TABLE plugin_test_plugin_test_items_temp 
        RENAME TO plugin_test_plugin_test_items;
      `);
    },
  },
];

export default {
  id: "test-plugin",
  name: "Test Plugin",
  description: "A test plugin for validating the plugin system",
  version: "1.0.0",
  author: "Test Team",
  icon: TestTube,
  routes: [
    {
      path: "/test-plugin",
      label: "Test Plugin",
      icon: TestTube,
      component: TestPage,
    },
  ],
  charts: [],
  settings: () => null,
  migrations,
  onInstall: async (context) => {
    console.log("🔧 Test Plugin onInstall hook called");
    await context.crdtService.setPluginData(context.pluginId, "test_collection", {
      initialized: true,
      timestamp: Date.now(),
    });
  },
  onUninstall: async () => {
    console.log("🔧 Test Plugin onUninstall hook called");
  },
  onEnable: async () => {
    console.log("🔧 Test Plugin onEnable hook called");
  },
  onDisable: async () => {
    console.log("🔧 Test Plugin onDisable hook called");
  },
} as PluginConfigExternal;
