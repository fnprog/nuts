import { describe, it, expect } from "vitest";
import { render, screen } from "../../test-utils";
import { ErrorBoundary } from "./index";
import React from "react";

// Helper for error-throwing component
function Boom() {
  throw new Error("Test crash");
}

describe("ErrorBoundary", () => {
  it("renders child contents when no error occurs", () => {
    render(
      <ErrorBoundary>
        <span>safe content</span>
      </ErrorBoundary>
    );
    expect(screen.getByText("safe content")).toBeInTheDocument();
  });

  it("renders fallback UI on error", () => {
    // Your ErrorBoundary likely expects a fallback prop or uses a default fallback
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>
    );
    expect(screen.getByText(/error|something went wrong/i)).toBeInTheDocument();
  });
});
