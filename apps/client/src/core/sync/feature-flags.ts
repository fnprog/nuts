/**
 * Feature Flags Service for Offline-First Migration
 *
 * Manages feature flags to toggle between server-based and offline-first
 * implementations during the migration process.
 */

type FeatureFlag = "sync-enabled" | "developer-panel-visible";

interface FeatureFlagConfig {
  [key: string]: boolean;
}

class FeatureFlagsService {
  private flags: FeatureFlagConfig = {
    "sync-enabled": false,
    "developer-panel-visible": false,
  };

  private storageKey = "nuts-feature-flags";

  constructor() {
    this.loadFromStorage();
    this.initializeDefaultsForDevelopment();
  }

  private initializeDefaultsForDevelopment(): void {
    if (process.env.NODE_ENV === "development") {
      const hasStoredFlags = localStorage.getItem(this.storageKey);
      if (!hasStoredFlags) {
        console.log("Feature flags not found in storage. Use FeatureFlagsDeveloperPanel to configure.");
      }
    }
  }

  /**
   * Load feature flags from local storage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const storedFlags = JSON.parse(stored);
        this.flags = { ...this.flags, ...storedFlags };
      }
    } catch (error) {
      console.warn("Failed to load feature flags from storage:", error);
    }
  }

  /**
   * Save feature flags to local storage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.flags));
    } catch (error) {
      console.warn("Failed to save feature flags to storage:", error);
    }
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flag: FeatureFlag): boolean {
    return this.flags[flag] === true;
  }

  /**
   * Enable a feature flag
   */
  enable(flag: FeatureFlag): void {
    this.flags[flag] = true;
    this.saveToStorage();
    console.log(`Feature flag '${flag}' enabled`);
  }

  /**
   * Disable a feature flag
   */
  disable(flag: FeatureFlag): void {
    this.flags[flag] = false;
    this.saveToStorage();
    console.log(`Feature flag '${flag}' disabled`);
  }

  /**
   * Toggle a feature flag
   */
  toggle(flag: FeatureFlag): boolean {
    const newValue = !this.flags[flag];
    this.flags[flag] = newValue;
    this.saveToStorage();
    console.log(`Feature flag '${flag}' ${newValue ? "enabled" : "disabled"}`);
    return newValue;
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlagConfig {
    return { ...this.flags };
  }

  /**
   * Set multiple feature flags at once
   */
  setFlags(flags: Partial<FeatureFlagConfig>): void {
    // Filter out undefined values
    const validFlags = Object.fromEntries(Object.entries(flags).filter(([, value]) => value !== undefined)) as FeatureFlagConfig;

    this.flags = { ...this.flags, ...validFlags };
    this.saveToStorage();
    console.log("Feature flags updated:", validFlags);
  }

  isSyncEnabled(): boolean {
    return this.isEnabled("sync-enabled");
  }

  isDeveloperPanelVisible(): boolean {
    return this.isEnabled("developer-panel-visible");
  }

  enableSync(): void {
    this.enable("sync-enabled");
  }

  disableSync(): void {
    this.disable("sync-enabled");
  }

  reset(): void {
    localStorage.removeItem(this.storageKey);
    this.flags = {
      "sync-enabled": false,
      "developer-panel-visible": false,
    };
    console.log("Feature flags reset to defaults");
  }
}

// Export singleton instance
export const featureFlagsService = new FeatureFlagsService();

// Export type for use in components
export type { FeatureFlag };
