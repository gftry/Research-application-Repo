// ============================================================
// tests/semanticTree.test.js
// Unit tests for SemanticTree and core component classes.
// Run with: node --experimental-vm-modules node_modules/.bin/jest
// Or add "type": "module" to package.json for ES modules.
// ============================================================

import { SemanticTree }       from "../src/semantic/SemanticTree.js";
import { Button }             from "../src/core/Button.js";
import { InputField }         from "../src/core/InputField.js";
import { NavigationRegion }   from "../src/core/NavigationRegion.js";
import { UIComponent }        from "../src/core/UIComponent.js";

// ---- UIComponent abstract class ----

describe("UIComponent — Abstract Class", () => {
  test("throws when instantiated directly", () => {
    expect(() => new UIComponent("id1", "label", "button"))
      .toThrow("UIComponent is abstract");
  });

  test("throws when id is missing", () => {
    expect(() => new Button("", "My Button")).toThrow("non-empty id");
  });

  test("throws when label is missing", () => {
    expect(() => new Button("id1", "")).toThrow("non-empty label");
  });
});

// ---- Button ----

describe("Button", () => {
  let btn;
  beforeEach(() => { btn = new Button("btn-1", "Submit"); });

  test("returns correct role", () => {
    expect(btn.getRole()).toBe("button");
  });

  test("is focusable by default", () => {
    expect(btn.getState("focusable")).toBe(true);
  });

  test("describe() includes label", () => {
    expect(btn.describe()).toContain("Submit");
  });

  test("navigate() returns non-empty string", () => {
    expect(btn.navigate().length).toBeGreaterThan(0);
  });

  test("toAuditObject() has correct shape", () => {
    const obj = btn.toAuditObject();
    expect(obj).toHaveProperty("id", "btn-1");
    expect(obj).toHaveProperty("role", "button");
    expect(obj.children).toEqual([]);
  });
});

// ---- InputField ----

describe("InputField", () => {
  let field;
  beforeEach(() => { field = new InputField("inp-1", "Email", "email"); });

  test("returns correct role", () => {
    expect(field.getRole()).toBe("textbox");
  });

  test("getInputType() reflects constructor arg", () => {
    expect(field.getInputType()).toBe("email");
  });

  test("defaults to text type", () => {
    const f = new InputField("inp-2", "Name");
    expect(f.getInputType()).toBe("text");
  });

  test("describe() includes required when set", () => {
    field.setRequired(true);
    expect(field.describe()).toContain("required");
  });
});

// ---- NavigationRegion ----

describe("NavigationRegion", () => {
  test("role is navigation", () => {
    const nav = new NavigationRegion("nav-1", "Main Navigation");
    expect(nav.getRole()).toBe("navigation");
  });

  test("describe() reports child count", () => {
    const nav = new NavigationRegion("nav-1", "Main Nav");
    nav.addChild(new Button("btn-1", "Home"));
    nav.addChild(new Button("btn-2", "About"));
    expect(nav.describe()).toContain("2 items");
  });
});

// ---- Child management ----

describe("UIComponent — Children", () => {
  test("addChild() rejects non-UIComponent", () => {
    const nav = new NavigationRegion("nav-1", "Nav");
    expect(() => nav.addChild({ id: "fake" })).toThrow("UIComponent instance");
  });

  test("getChildren() returns a copy, not the internal array", () => {
    const nav = new NavigationRegion("nav-1", "Nav");
    nav.addChild(new Button("btn-1", "Home"));
    const children = nav.getChildren();
    children.pop();
    expect(nav.getChildren().length).toBe(1);
  });
});

// ---- SemanticTree ----

describe("SemanticTree — build()", () => {
  test("throws for non-array input", () => {
    const tree = new SemanticTree();
    expect(() => tree.build(null)).toThrow("array");
  });

  test("correctly maps a 'button' node", () => {
    const tree = new SemanticTree();
    tree.build([{ id: "b1", name: "Submit Button", children: [] }]);
    expect(tree.getRoots().length).toBe(1);
    expect(tree.getRoots()[0].getRole()).toBe("button");
  });

  test("records unsupported nodes as errors", () => {
    const tree = new SemanticTree();
    tree.build([{ id: "x1", name: "UnknownWidget", children: [] }]);
    expect(tree.getRoots().length).toBe(0);
    expect(tree.getErrors().length).toBeGreaterThan(0);
  });

  test("empty nodes array produces empty roots", () => {
    const tree = new SemanticTree();
    tree.build([]);
    expect(tree.getRoots()).toEqual([]);
    expect(tree.getErrors()).toEqual([]);
  });

  test("nested children are parsed recursively", () => {
    const tree = new SemanticTree();
    tree.build([{
      id: "nav-1",
      name: "Navigation",
      children: [
        { id: "btn-1", name: "Home Button", children: [] }
      ]
    }]);
    const root = tree.getRoots()[0];
    expect(root.getChildren().length).toBe(1);
    expect(root.getChildren()[0].getRole()).toBe("button");
  });
});

