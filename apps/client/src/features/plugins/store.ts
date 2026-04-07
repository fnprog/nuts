import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PluginConfig } from "./types";
import { loadPluginModule } from "./loader";
import { crdtService } from "@/core/sync/crdt";
import { PluginMigrationRunner } from "@nuts/migrations";
import { dbClient } from "@/core/storage";

interface PluginState {
  pluginConfigs: PluginConfig[];
  installedPluginIds: string[];
  addPlugin: (pluginId: string) => Promise<void>;
  removePlugin: (id: string) => void;
  enablePlugin: (id: string) => void;
  disablePlugin: (id: string) => void;
  installPlugin: (pluginId: string) => Promise<void>;
  uninstallPlugin: (pluginId: string) => Promise<void>;
  getEnabledPluginConfigs: () => PluginConfig[];
  getPluginConfigById: (id: string) => PluginConfig | undefined;
}

export const usePluginStore = create<PluginState>()(
  persist(
    (set, get) => ({
      pluginConfigs: [],
      installedPluginIds: [],

      addPlugin: async (pluginId) => {
        // Check if already installed
        if (get().installedPluginIds.includes(pluginId)) {
          return;
        }

        try {
          // Dynamically load the plugin
          const pluginModule = await loadPluginModule(pluginId);

          if (!pluginModule) {
            throw new Error(`Plugin ${pluginId} does not exist`);
          }

          // Convert from plugin interface to storable config
          const pluginConfig: PluginConfig = {
            id: pluginModule.id,
            name: pluginModule.name,
            description: pluginModule.description,
            version: pluginModule.version,
            author: pluginModule.author,
            iconName: pluginModule.icon.name || "Plugin",
            enabled: true,
            routeConfigs: pluginModule.routes.map((route) => ({
              path: route.path,
              label: route.label,
              iconName: route.icon.name || "Route",
              subroutes: route.subroutes?.map((subroute) => ({
                path: subroute.path,
                label: subroute.label,
              })),
            })),
            chartConfigs: pluginModule.charts.map((chart) => ({
              id: chart.id,
              type: chart.type,
              title: chart.title,
              defaultSize: chart.defaultSize,
            })),
          };

          set((state) => ({
            pluginConfigs: [...state.pluginConfigs, pluginConfig],
            installedPluginIds: [...state.installedPluginIds, pluginId],
          }));
        } catch (error) {
          console.error(`Failed to load plugin ${pluginId}:`, error);
        }
      },

      removePlugin: (id) => {
        set((state) => ({
          pluginConfigs: state.pluginConfigs.filter((config) => config.id !== id),
          installedPluginIds: state.installedPluginIds.filter((pluginId) => pluginId !== id),
        }));
      },

      installPlugin: async (pluginId) => {
        if (get().installedPluginIds.includes(pluginId)) {
          console.log(`Plugin ${pluginId} is already installed`);
          return;
        }

        try {
          const pluginModule = await loadPluginModule(pluginId);

          if (!pluginModule) {
            throw new Error(`Plugin ${pluginId} does not exist`);
          }

          const migrationRunner = dbClient.getMigrationRunner();
          const pluginRunner = new PluginMigrationRunner(crdtService, migrationRunner);

          await pluginRunner.initializePluginMigrationTable();

          await pluginRunner.installPlugin(pluginModule);

          const pluginConfig: PluginConfig = {
            id: pluginModule.id,
            name: pluginModule.name,
            description: pluginModule.description,
            version: pluginModule.version,
            author: pluginModule.author,
            iconName: pluginModule.icon.name || "Plugin",
            enabled: true,
            routeConfigs: pluginModule.routes.map((route) => ({
              path: route.path,
              label: route.label,
              iconName: route.icon.name || "Route",
              subroutes: route.subroutes?.map((subroute) => ({
                path: subroute.path,
                label: subroute.label,
              })),
            })),
            chartConfigs: pluginModule.charts.map((chart) => ({
              id: chart.id,
              type: chart.type,
              title: chart.title,
              defaultSize: chart.defaultSize,
            })),
          };

          set((state) => ({
            pluginConfigs: [...state.pluginConfigs, pluginConfig],
            installedPluginIds: [...state.installedPluginIds, pluginId],
          }));

          console.log(`✅ Plugin ${pluginId} installed successfully`);
        } catch (error) {
          console.error(`Failed to install plugin ${pluginId}:`, error);
          throw error;
        }
      },

      uninstallPlugin: async (pluginId) => {
        try {
          const pluginModule = await loadPluginModule(pluginId);

          if (!pluginModule) {
            throw new Error(`Plugin ${pluginId} does not exist`);
          }

          const migrationRunner = dbClient.getMigrationRunner();
          const pluginRunner = new PluginMigrationRunner(crdtService, migrationRunner);

          await pluginRunner.uninstallPlugin(pluginId, pluginModule);

          set((state) => ({
            pluginConfigs: state.pluginConfigs.filter((config) => config.id !== pluginId),
            installedPluginIds: state.installedPluginIds.filter((id) => id !== pluginId),
          }));

          console.log(`✅ Plugin ${pluginId} uninstalled successfully`);
        } catch (error) {
          console.error(`Failed to uninstall plugin ${pluginId}:`, error);
          throw error;
        }
      },

      enablePlugin: async (id) => {
        try {
          const pluginModule = await loadPluginModule(id);

          if (!pluginModule) {
            throw new Error(`Plugin ${id} does not exist`);
          }

          const migrationRunner = dbClient.getMigrationRunner();
          const pluginRunner = new PluginMigrationRunner(crdtService, migrationRunner);

          await pluginRunner.enablePlugin(id, pluginModule);

          set((state) => ({
            pluginConfigs: state.pluginConfigs.map((config) => (config.id === id ? { ...config, enabled: true } : config)),
          }));

          console.log(`✅ Plugin ${id} enabled successfully`);
        } catch (error) {
          console.error(`Failed to enable plugin ${id}:`, error);
          throw error;
        }
      },

      disablePlugin: async (id) => {
        try {
          const pluginModule = await loadPluginModule(id);

          if (!pluginModule) {
            throw new Error(`Plugin ${id} does not exist`);
          }

          const migrationRunner = dbClient.getMigrationRunner();
          const pluginRunner = new PluginMigrationRunner(crdtService, migrationRunner);

          await pluginRunner.disablePlugin(id, pluginModule);

          set((state) => ({
            pluginConfigs: state.pluginConfigs.map((config) => (config.id === id ? { ...config, enabled: false } : config)),
          }));

          console.log(`✅ Plugin ${id} disabled successfully`);
        } catch (error) {
          console.error(`Failed to disable plugin ${id}:`, error);
          throw error;
        }
      },

      getEnabledPluginConfigs: () => {
        return get().pluginConfigs.filter((config) => config.enabled);
      },

      getPluginConfigById: (id) => {
        return get().pluginConfigs.find((config) => config.id === id);
      },
    }),
    {
      name: "plugin-storage",
    }
  )
);
