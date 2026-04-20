import { logger } from "@/lib/logger";

export type ConnectivityStatus = "online" | "offline" | "fully-offline";

export interface ConnectivityState {
  status: ConnectivityStatus;
  isOnline: boolean;
  hasServerAccess: boolean;
  lastServerCheck: Date | null;
}

// Backoff
const CHECK_INTERVAL_BASE_MS = 30_000;
const CHECK_INTERVAL_MAX_MS = 5 * 60_000;
const CHECK_INTERVAL_BACKOFF_FACTOR = 2;
const SERVER_CHECK_TIMEOUT_MS = 5_000;

// A response with any status below 500 means the server is up and reachable.
// 4xx codes (including 401, 403, 404, 405) all indicate the server responded —
// they are auth or routing concerns, not connectivity concerns.
const SERVER_REACHABLE = (status: number): boolean => status < 500;



/**
 * Connectivity Detection Service
 *
 * Detects network reachability and whether the server is accessible.
 * Uses a dedicated /health endpoint to avoid conflating auth state with
 * connectivity state. Falls back gracefully when the endpoint is absent.
 *
 * The polling interval grows exponentially when checks fail (up to 5 minutes)
 * and resets to 30 seconds on success, avoiding hammering a down server.
 */

class ConnectivityService {
  private state: ConnectivityState = {
    status: "offline",
    isOnline: navigator.onLine,
    hasServerAccess: false,
    lastServerCheck: null,
  };

  private listeners: Set<(state: ConnectivityState) => void> = new Set();
  private checkTimeout: ReturnType<typeof setTimeout> | null = null;
  private currentIntervalMs = CHECK_INTERVAL_BASE_MS;
  private consecutiveFailures = 0;
  private isChecking = false;

  // Stored by reference so removeEventListener works correctly in destroy().
  private readonly onlineHandler = () => this.handleBrowserOnline();
  private readonly offlineHandler = () => this.handleBrowserOffline();

  constructor() {
    window.addEventListener("online", this.onlineHandler);
    window.addEventListener("offline", this.offlineHandler);
    // Run an immediate check so the initial state reflects reality, then
    // schedule subsequent checks from there.
    this.runCheckAndSchedule();
  }

  // Public API

  getState(): ConnectivityState {
    return { ...this.state };
  }

  isFullyOffline(): boolean {
    return this.state.status === "fully-offline";
  }

  hasServerAccess(): boolean {
    return this.state.hasServerAccess;
  }

  subscribe(listener: (state: ConnectivityState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Enables or disables user-requested fully-offline mode.
   *
   * When disabling, we transition to "offline" immediately (so listeners see
   * a consistent non-"fully-offline" state while the check is in flight) and
   * then run a server check to determine the real status.
   */
  setFullyOfflineMode(enabled: boolean): void {
    if (enabled) {
      this.stopScheduledChecks();
      this.updateState({ status: "fully-offline", hasServerAccess: false });
      return;
    }

    // Transition away from fully-offline before the async check resolves.
    this.updateState({ status: "offline" });
    this.runCheckAndSchedule();
  }

  async refreshConnectivity(): Promise<ConnectivityState> {
    await this.checkServerConnectivity();
    return this.getState();
  }

  destroy(): void {
    window.removeEventListener("online", this.onlineHandler);
    window.removeEventListener("offline", this.offlineHandler);
    this.stopScheduledChecks();
    this.listeners.clear();
  }


  // Browser event handlers

  private handleBrowserOnline(): void {
    this.updateState({ isOnline: true });
    // Trigger an immediate check rather than waiting for the next scheduled one.
    this.runCheckAndSchedule();
  }

  private handleBrowserOffline(): void {
    this.updateState({ isOnline: false, status: "offline", hasServerAccess: false });
  }

  // Scheduling


  /**
   * Runs a single connectivity check then schedules the next one.
   * Uses setTimeout rather than setInterval so each check fires only after
   * the previous one completes and the interval can vary with backoff.
   */
  private async runCheckAndSchedule(): Promise<void> {
    this.stopScheduledChecks();
    await this.checkServerConnectivity();
    this.scheduleNextCheck();
  }

  private scheduleNextCheck(): void {
    this.checkTimeout = setTimeout(() => {
      this.runCheckAndSchedule();
    }, this.currentIntervalMs);
  }

  private stopScheduledChecks(): void {
    if (this.checkTimeout !== null) {
      clearTimeout(this.checkTimeout);
      this.checkTimeout = null;
    }
  }

  // Server Check

  private async checkServerConnectivity(): Promise<void> {
    // Prevent overlapping checks — e.g. if a manual refresh fires while a
    // scheduled check is already in flight.
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      if (!this.state.isOnline) {
        this.updateState({ status: "offline", hasServerAccess: false });
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SERVER_CHECK_TIMEOUT_MS);

      try {
        const response = await fetch("/health", {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-cache",
        });

        const hasServerAccess = SERVER_REACHABLE(response.status);

        if (hasServerAccess) {
          this.consecutiveFailures = 0;
          this.currentIntervalMs = CHECK_INTERVAL_BASE_MS;
        } else {
          this.recordFailure();
        }

        this.updateState({
          status: hasServerAccess ? "online" : "offline",
          hasServerAccess,
          lastServerCheck: new Date(),
        });
      } catch {
        // fetch threw — network error or timeout abort.
        this.recordFailure();
        this.updateState({
          status: "offline",
          hasServerAccess: false,
          lastServerCheck: new Date(),
        });
      } finally {
        clearTimeout(timeoutId);
      }
    } finally {
      // Always reset — even if we returned early on the !isOnline path.
      this.isChecking = false;
    }
  }

  private recordFailure(): void {
    this.consecutiveFailures++;
    this.currentIntervalMs = Math.min(
      CHECK_INTERVAL_BASE_MS * Math.pow(CHECK_INTERVAL_BACKOFF_FACTOR, this.consecutiveFailures),
      CHECK_INTERVAL_MAX_MS
    );
    logger.warn(
      `Server check failed (attempt ${this.consecutiveFailures}), ` +
      `next check in ${this.currentIntervalMs / 1000}s`
    );
  }

  private updateState(updates: Partial<ConnectivityState>): void {
    const previousStatus = this.state.status;
    this.state = { ...this.state, ...updates };

    if (previousStatus !== this.state.status) {
      logger.info(`Connectivity: ${previousStatus} → ${this.state.status}`);
    }

    this.listeners.forEach((listener) => {
      try {
        listener(this.getState());
      } catch (error) {
        logger.error("Error in connectivity listener:", error);
      }
    });
  }
}

export const connectivityService = new ConnectivityService();
