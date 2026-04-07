/**
 * Feature Flags Developer Panel
 *
 * A simple developer component for testing feature flags during migration.
 * This should only be used in development mode.
 */

import React, { useState, useEffect } from "react";
import { featureFlagsService, type FeatureFlag } from "@/core/sync/feature-flags";

const FEATURE_FLAGS: Array<{ key: FeatureFlag; label: string; description: string }> = [
  {
    key: "sync-enabled",
    label: "Offline-First Sync",
    description: "Enable background sync with server",
  },
  {
    key: "developer-panel-visible",
    label: "Wether to show the dev pannel",
    description: "Force app to work completely offline (no network calls)",
  },
];

export const FeatureFlagsDeveloperPanel: React.FC = () => {
  const [flags, setFlags] = useState(featureFlagsService.getAllFlags());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Update local state when flags change
    const handleFlagsChange = () => {
      setFlags(featureFlagsService.getAllFlags());
    };

    // Simple polling for changes (in production, use proper event system)
    const interval = setInterval(handleFlagsChange, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = (flag: FeatureFlag) => {
    featureFlagsService.toggle(flag);
    setFlags(featureFlagsService.getAllFlags());
  };

  const handleReset = () => {
    featureFlagsService.reset();
    setFlags(featureFlagsService.getAllFlags());
  };

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px", // Changed from right to left to avoid TanStack DevTools
        zIndex: 9999,
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        borderRadius: "8px",
        boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            padding: "8px 12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Feature Flags
        </button>
      ) : (
        <div style={{ padding: "16px", width: "300px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h4 style={{ margin: 0, fontSize: "14px" }}>Feature Flags</h4>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "16px",
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <button
              onClick={handleReset}
              style={{
                padding: "4px 8px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "11px",
              }}
            >
              Reset
            </button>
          </div>

          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {FEATURE_FLAGS.map(({ key, label, description }) => (
              <div
                key={key}
                style={{
                  marginBottom: "8px",
                  padding: "8px",
                  backgroundColor: "#f8f9fa",
                  borderRadius: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "4px",
                  }}
                >
                  <span style={{ fontSize: "12px", fontWeight: "bold" }}>{label}</span>
                  <button
                    onClick={() => handleToggle(key)}
                    style={{
                      padding: "2px 6px",
                      backgroundColor: flags[key] ? "#28a745" : "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "10px",
                    }}
                  >
                    {flags[key] ? "ON" : "OFF"}
                  </button>
                </div>
                <div style={{ fontSize: "10px", color: "#666" }}>{description}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
