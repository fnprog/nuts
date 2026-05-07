import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "./use-auth";

// NOTE: If useAuth depends on context/provider, adapt to wrap with provider mocks.
describe("useAuth", () => {
  it("default state: user is not authenticated", () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeNull(); // Adapt to actual default shape
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("login updates authentication state", () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.login("testuser", "pw"); // Replace with real test inputs / expected api
    });
    // You may need to use await if login is async
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).not.toBeNull();
  });

  it("logout clears authentication", () => {
    const { result } = renderHook(() => useAuth());
    act(() => {
      result.current.login("testuser", "pw");
      result.current.logout();
    });
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });
});
