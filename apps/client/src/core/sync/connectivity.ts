import { logger } from "@/lib/logger";

export type ConnectivityStatus = "online" | "offline" | "fully-offline";

export interface ConnectivityState {
  status: ConnectivityStatus;
  isOnline: boolean;
  hasServerAccess: boolean;
  lastServerCheck: Date | null;
}

/**
 * Connectivity Detection Service
 *
 * Handles detection of network connectivity and determines if the app
 * should operate in fully offline mode.
 */

class ConnectivityService {
  private state: ConnectivityState = {
    status: "offline",
    isOnline: navigator.onLine,
    hasServerAccess: false,
    lastServerCheck: null,
  };

  private listeners: Set<(state: ConnectivityState) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;
  private serverCheckUrl = "/auth/sessions"; // Use existing auth endpoint instead of health
  private isChecking = false;

  private onlineHandler: (() => void) | null = null;
  private offlineHandler: (() => void) | null = null;

  constructor() {
    this.setupOnlineStatusListener();
    this.startPeriodicServerCheck();
  }

  /**
   * Get current connectivity state
   */
  getState(): ConnectivityState {
    return { ...this.state };
  }

  /**
   * Check if we're in fully offline mode
   */
  isFullyOffline(): boolean {
    return this.state.status === "fully-offline";
  }

  /**
   * Check if we have server access
   */
  hasServerAccess(): boolean {
    return this.state.hasServerAccess;
  }

  /**
   * Subscribe to connectivity changes
   */
  subscribe(listener: (state: ConnectivityState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Force fully offline mode (for testing or when user wants to work offline)
   */
  setFullyOfflineMode(enabled: boolean): void {
    if (enabled) {
      this.updateState({ status: "fully-offline", hasServerAccess: false });
      return
    }

    // Re-check connectivity when coming out of fully offline mode
    this.checkServerConnectivity();
  }

  /**
   * Setup browser online/offline event listeners
   */
  private setupOnlineStatusListener(): void {
    this.onlineHandler = () => this.updateOnlineStatus();
    this.offlineHandler = () => this.updateOnlineStatus();

    window.addEventListener("online", this.onlineHandler);
    window.addEventListener("offline", this.offlineHandler);
    // Initial check
    // updateOnlineStatus();
  }


  private updateOnlineStatus() {
    const isOnline = navigator.onLine;
    this.updateState({ isOnline });

    // When coming back online, check server connectivity
    if (isOnline) {
      this.checkServerConnectivity();
      return
    }

    // When going offline, update status immediately
    this.updateState({ status: "offline", hasServerAccess: false });
  };


  /**
   * Start periodic server connectivity checks
   */
  private startPeriodicServerCheck(): void {
    // Check immediately
    this.checkServerConnectivity();

    // Check every 30 seconds
    this.checkInterval = setInterval(() => {
      this.checkServerConnectivity();
    }, 30000);
  }

  /**
   * Stop periodic server checks
   */
  stopPeriodicChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Check if the server is accessible
   */
  private async checkServerConnectivity(): Promise<void> {
    if (this.isChecking) return;
    this.isChecking = true;


    if (!this.state.isOnline) {
      this.updateState({ status: "offline", hasServerAccess: false });
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    try {
      // Try a simple fetch to check server connectivity
      const response = await fetch(this.serverCheckUrl, {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-cache",
      });


      const hasServerAccess = response.ok || response.status === 404; // 404 is ok, means server is reachable

      this.updateState({
        status: hasServerAccess ? "online" : "offline",
        hasServerAccess,
        lastServerCheck: new Date(),
      });
    } catch (error) {
      // Server is not accessible
      this.updateState({
        status: "offline",
        hasServerAccess: false,
        lastServerCheck: new Date(),
      });
    } finally {
      clearTimeout(timeoutId);
      this.isChecking = false;
    }
  }

  /**
   * Update connectivity state and notify listeners
   */
  private updateState(updates: Partial<ConnectivityState>): void {
    const previousStatus = this.state.status;
    this.state = { ...this.state, ...updates };

    // Log status changes
    if (previousStatus !== this.state.status) {
      logger.info(`Connectivity status changed: ${previousStatus} → ${this.state.status}`);
    }

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener(this.state);
      } catch (error) {
        logger.error("Error in connectivity listener:", error);
      }
    });
  }

  /**
   * Manual connectivity check (for user-triggered refresh)
   */
  async refreshConnectivity(): Promise<ConnectivityState> {
    await this.checkServerConnectivity();
    return this.getState();
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.onlineHandler) {
      window.removeEventListener("online", this.onlineHandler);
    }

    if (this.offlineHandler) {
      window.removeEventListener("offline", this.offlineHandler);
    }

    this.stopPeriodicChecks();
    this.listeners.clear();
  }
}

export const connectivityService = new ConnectivityService();
