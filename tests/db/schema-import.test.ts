import { describe, expect, it } from "vitest";

import { createDatabase, getDatabase, getSqlClient } from "../../lib/db/client";
import * as schema from "../../lib/db/schema";

describe("database foundation imports", () => {
  it("exports the core schema objects without eager env access", () => {
    expect(schema.teams).toBeDefined();
    expect(schema.teamConfigs).toBeDefined();
    expect(schema.cycles).toBeDefined();
    expect(schema.tasks).toBeDefined();
    expect(schema.artifacts).toBeDefined();
    expect(schema.decisions).toBeDefined();
    expect(schema.briefings).toBeDefined();
    expect(schema.memoryEntries).toBeDefined();
  });

  it("exports lazy database accessors", () => {
    expect(typeof createDatabase).toBe("function");
    expect(typeof getDatabase).toBe("function");
    expect(typeof getSqlClient).toBe("function");
  });
});
