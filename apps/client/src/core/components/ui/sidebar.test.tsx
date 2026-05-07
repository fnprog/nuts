import { describe, it, expect } from "vitest";
import { render, screen } from "../../test-utils";
import { Sidebar } from "./sidebar";
import React from "react";

describe("Sidebar", () => {
  it("renders navigation links", () => {
    render(<Sidebar />);
    // Replace 'Dashboard'/'Settings' with real sidebar section labels
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  it("highlights active section", () => {
    render(<Sidebar active="settings" />); // Adapt if your sidebar component expects a prop for active section
    const settingsLink = screen.getByText(/settings/i);
    expect(settingsLink.className).toMatch(/active|selected|current/);
  });
});
