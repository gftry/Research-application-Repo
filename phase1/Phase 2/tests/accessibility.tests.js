
// ============================================================
// tests/accessibility.test.js
// Unit tests for ScreenReaderService, KeyboardNavigator, AuditService
// ============================================================

import { ScreenReaderService } from "../src/accessibility/ScreenReaderService.js";
import { KeyboardNavigator }   from "../src/accessibility/KeyboardNavigator.js";
import { AuditService }        from "../src/accessibility/AuditService.js";
import { Button }              from "../src/core/Button.js";
import { InputField }          from "../src/core/InputField.js";
import { NavigationRegion }    from "../src/core/NavigationRegion.js";

// ---- ScreenReaderService ----

describe("ScreenReaderService", () => {
  test("throws for non-array input", () => {
    const svc = new ScreenReaderService();
    expect(() => svc.generateReadingOrder(null)).toThrow("array");
  });

  test("returns descriptions for all components", () => {
    const svc  = new ScreenReaderService();
    const btn  = new Button("b1", "Submit");
    const inp  = new InputField("i1", "Email", "email");
    const out  = svc.generateReadingOrder([btn, inp]);
    expect(out.length).toBe(2);
    expect(out[0]).toContain("Submit");
    expect(out[1]).toContain("Email");
  });

  test("traverses children depth-first", () => {
    const svc = new ScreenReaderService();
    const nav = new NavigationRegion("nav-1", "Main Nav");
    nav.addChild(new Button("btn-1", "Home"));
    const out = svc.generateReadingOrder([nav]);
    expect(out.length).toBe(2);
    expect(out[0]).toContain("Main Nav");
    expect(out[1]).toContain("Home");
  });
});

// ---- KeyboardNavigator ----

describe("KeyboardNavigator", () => {
  test("throws for non-array input", () => {
    const nav = new KeyboardNavigator();
    expect(() => nav.buildTabOrder("bad")).toThrow("array");
  });

  test("only includes focusable components in tab order", () => {
    const kbNav = new KeyboardNavigator();
    const btn   = new Button("b1", "Submit");          // focusable = true
    const nav   = new NavigationRegion("nav-1", "Nav"); // focusable not set
    const order = kbNav.buildTabOrder([btn, nav]);
    expect(order.length).toBe(1);
    expect(order[0].label).toBe("Submit");
  });

  test("tab order hint is non-empty", () => {
    const kbNav = new KeyboardNavigator();
    const btn   = new Button("b1", "Login");
    const order = kbNav.buildTabOrder([btn]);
    expect(order[0].hint.length).toBeGreaterThan(0);
  });
});

// ---- AuditService ----

describe("AuditService", () => {
  test("throws for non-array input", () => {
    const svc = new AuditService();
    expect(() => svc.runAudit({})).toThrow("array");
  });

  test("passes for a well-formed button", () => {
    const svc    = new AuditService();
    const btn    = new Button("b1", "Submit");
    const result = svc.runAudit([btn]);
    expect(result.failed.length).toBe(0);
    expect(result.passed.length).toBeGreaterThan(0);
  });

  test("fails LABEL_EMPTY rule when label is whitespace", () => {
    const svc = new AuditService();
    const btn = new Button("b1", "Submit");
    // Force an empty label after construction to simulate corrupt data
    btn._label = "   ";
    const result = svc.runAudit([btn]);
    const hasLabelError = result.failed.some(f => f.includes("LABEL_EMPTY"));
    expect(hasLabelError).toBe(true);
  });

  test("result object has passed and failed arrays", () => {
    const svc    = new AuditService();
    const result = svc.runAudit([new Button("b1", "OK")]);
    expect(result).toHaveProperty("passed");
    expect(result).toHaveProperty("failed");
    expect(Array.isArray(result.passed)).toBe(true);
    expect(Array.isArray(result.failed)).toBe(true);
  });
});