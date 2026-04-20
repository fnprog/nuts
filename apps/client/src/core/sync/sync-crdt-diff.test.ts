import { describe, it, expect } from "vitest";
// Importing Automerge directly for isolated test validation
import * as Automerge from "@automerge/automerge";

// Replicate the actual logic from sync.ts
function hasLocalModifications(local: any, server: any): boolean {
  if (!local || !server) return false;
  const localCopy = { ...local };
  const serverCopy = { ...server };
  const IGNORED_KEYS = ["updated_at", "created_at", "user_id", "version"];
  for (const k of IGNORED_KEYS) {
    delete localCopy[k];
    delete serverCopy[k];
  }
  const localDoc = Automerge.from(localCopy);
  const serverDoc = Automerge.from(serverCopy);
  const localHeads = Automerge.getHeads(localDoc);
  const serverHeads = Automerge.getHeads(serverDoc);
  const patches = Automerge.diff(localDoc, localHeads, serverDoc, serverHeads);
  const isMeaningful = (patch: any) => {
    if ((patch.type === "Put" || patch.type === "Insert") && patch.path?.length > 0) {
      return !IGNORED_KEYS.includes(patch.path[patch.path.length - 1]);
    }
    return false;
  };
  return patches.some(isMeaningful);
}

describe("hasLocalModifications (CRDT diff)", () => {
  it("returns false for identical documents", () => {
    const obj = { id: "1", name: "A", balance: 100, updated_at: "t1" };
    expect(hasLocalModifications(obj, { ...obj })).toBe(false);
  });

  it("returns false for only metadata changes (updated_at)", () => {
    const base = { id: "1", name: "A", balance: 100, updated_at: "t1" };
    const metaChanged = { ...base, updated_at: "t2" };
    expect(hasLocalModifications(base, metaChanged)).toBe(false);
  });

  it("returns true for field-level change (name)", () => {
    const base = { id: "1", name: "A", balance: 100, updated_at: "t1" };
    const changed = { ...base, name: "B" };
    expect(hasLocalModifications(base, changed)).toBe(true);
  });

  it("returns true for added field", () => {
    const a = { id: "1", name: "A", balance: 100, updated_at: "t1" };
    const b = { ...a, memo: "new" };
    expect(hasLocalModifications(a, b)).toBe(true);
  });

  it("returns false if both missing or null", () => {
    expect(hasLocalModifications(null, null)).toBe(false);
    expect(hasLocalModifications(undefined, undefined)).toBe(false);
  });

  it("returns true for removed data field", () => {
    const full = { id: "1", name: "A", balance: 100, updated_at: "t1" };
    const less = { id: "1", updated_at: "t1" };
    expect(hasLocalModifications(full, less)).toBe(true);
    expect(hasLocalModifications(less, full)).toBe(true);
  });
});
