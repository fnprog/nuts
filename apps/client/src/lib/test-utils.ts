// src/test-utils.ts
import { render } from "@testing-library/react";
import type { ReactElement } from "react";

// Extend as needed for context providers (e.g. ThemeProvider, Store, Router)
export function renderWithProviders(ui: ReactElement, options = {}) {
  // Could wrap with any global/react context providers here
  return render(ui, { ...options });
}

export * from "@testing-library/react";
export { renderWithProviders as render };
