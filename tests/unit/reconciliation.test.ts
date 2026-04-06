import { describe, expect, it } from "vitest";
import {
  detectConflictType,
  employeeKey,
  normalizeEmail,
  normalizeText,
  scoreConfidence
} from "../../scripts/reconciliation";

describe("reconciliation helpers", () => {
  it("normaliza texto y email", () => {
    expect(normalizeText("  Juan   Perez ")).toBe("juan perez");
    expect(normalizeEmail("  JP@TARANTO.COM.AR ")).toBe("jp@taranto.com.ar");
  });

  it("arma employee key por prioridad", () => {
    expect(employeeKey({ legajo: "1234", nombre: "X" })).toBe("legajo:1234");
    expect(employeeKey({ email: "a@b.com", nombre: "X" })).toBe("email:a@b.com");
    expect(employeeKey({ nombre: "Juan Perez" })).toBe("name:juan perez");
  });

  it("calcula confianza", () => {
    expect(scoreConfidence({ legajo: "1", email: "a@b.com", nombre: "X" })).toBe("AUTO_OK");
    expect(scoreConfidence({ nombre: "X", email: "a@b.com" })).toBe("REVIEW_REQUIRED");
  });

  it("detecta tipo de conflicto", () => {
    expect(detectConflictType("a", "b")).toBe("MANAGER_MISMATCH");
    expect(detectConflictType(null, null)).toBe("MISSING_MANAGER");
    expect(detectConflictType("a", "a")).toBeNull();
  });
});
