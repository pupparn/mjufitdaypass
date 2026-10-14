import { describe, expect, it } from "vitest";
import { dmy, parseDmy } from "./time";

describe("dmy / parseDmy", () => {
  it("round-trips an ISO date through dd/mm/yyyy", () => {
    expect(dmy("2026-10-05")).toBe("05/10/2026");
    expect(parseDmy("05/10/2026")).toBe("2026-10-05");
  });

  it("rejects anything that is not a real dd/mm/yyyy date", () => {
    for (const bad of ["", "5/10/2026", "2026-10-05", "31/02/2026", "10/13/2026", "05/10/26"]) {
      expect(parseDmy(bad)).toBe("");
    }
  });
});
