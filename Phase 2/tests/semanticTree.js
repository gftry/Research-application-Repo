// ============================================================
// tests/semanticTree.test.js
// Enhanced with real Figma node type tests
// ============================================================

import { SemanticTree }       from "../src/semantic/SemanticTree.js";
import { Button }             from "../src/core/Button.js";
import { InputField }         from "../src/core/inputField.js";
import { NavigationRegion }   from "../src/core/NavigationRegion.js";
import { UIComponent }        from "../src/core/UIComponent.js";

// ---- SemanticTree with Figma Node Types ----

describe("SemanticTree — Figma Node Type Detection", () => {
  
  test("correctly infers button from RECTANGLE with TEXT child", () => {
    const mockNode = {
      id: "rect-1",
      type: "RECTANGLE",
      name: "CTA_Primary",
      children: [
        { id: "text-1", type: "TEXT", characters: "Submit Form" }
      ],
      absoluteBoundingBox: { x: 100, y: 200, width: 120, height: 40 }
    };
    
    const tree = new SemanticTree();
    tree.build([mockNode]);
    
    const roots = tree.getRoots();
    expect(roots.length).toBe(1);
    expect(roots[0].getRole()).toBe("button");
    expect(roots[0].getLabel()).toBe("Submit Form"); // From TEXT child
  });

  test("correctly infers navigation from FRAME with multiple children", () => {
    const mockNode = {
      id: "frame-1",
      type: "FRAME",
      name: "Main Navigation",
      children: [
        { 
          id: "btn-1", 
          type: "RECTANGLE", 
          name: "Home",
          children: [{ id: "t1", type: "TEXT", characters: "Home" }]
        },
        { 
          id: "btn-2", 
          type: "RECTANGLE", 
          name: "About",
          children: [{ id: "t2", type: "TEXT", characters: "About" }]
        }
      ],
      absoluteBoundingBox: { x: 0, y: 0, width: 800, height: 60 }
    };
    
    const tree = new SemanticTree();
    tree.build([mockNode]);
    
    const roots = tree.getRoots();
    expect(roots.length).toBe(1);
    expect(roots[0].getRole()).toBe("navigation");
    expect(roots[0].getChildren().length).toBe(2);
  });

  test("infers button from COMPONENT node with 'button' in name", () => {
    const mockNode = {
      id: "comp-1",
      type: "COMPONENT",
      name: "Primary Button",
      componentId: "comp-1",
      children: [],
      absoluteBoundingBox: { x: 50, y: 100, width: 100, height: 36 }
    };
    
    const tree = new SemanticTree();
    tree.build([mockNode]);
    
    expect(tree.getRoots()[0].getRole()).toBe("button");
  });

  test("uses component metadata for semantic inference", () => {
    const mockNode = {
      id: "inst-1",
      type: "INSTANCE",
      name: "MyCustomButton",
      componentId: "comp-123",
      children: [],
      absoluteBoundingBox: { x: 0, y: 0, width: 100, height: 40 }
    };
    
    const componentMetadata = {
      "comp-123": {
        key: "key-123",
        name: "ButtonComponent",
        description: "Primary action button",
        semanticRole: "button"
      }
    };
    
    const tree = new SemanticTree(componentMetadata);
    tree.build([mockNode]);
    
    const roots = tree.getRoots();
    expect(roots.length).toBe(1);
    expect(roots[0].getRole()).toBe("button");
  });

  test("records error for unsupported standalone TEXT node", () => {
    const mockNode = {
      id: "text-1",
      type: "TEXT",
      name: "Just Text",
      characters: "Some text content",
      children: []
    };
    
    const tree = new SemanticTree();
    tree.build([mockNode]);
    
    expect(tree.getRoots().length).toBe(0);
    expect(tree.getErrors().length).toBeGreaterThan(0);
  });
});

// ---- Positional Context Tests ----

describe("UIComponent — Positional Context", () => {
  
  test("getPosition() returns correct quadrant", () => {
    const figmaData = {
      type: "RECTANGLE",
      bounds: { x: 50, y: 50, width: 100, height: 40 }
    };
    
    const btn = new Button("btn-1", "Submit", figmaData);
    expect(btn.getPosition()).toBe("top-left");
  });

  test("getPosition() handles center positioning", () => {
    const figmaData = {
      type: "RECTANGLE",
      bounds: { x: 400, y: 400, width: 100, height: 40 }
    };
    
    const btn = new Button("btn-1", "Submit", figmaData);
    expect(btn.getPosition()).toBe("center of screen");
  });

  test("getPosition() returns unknown for missing bounds", () => {
    const btn = new Button("btn-1", "Submit", {});
    expect(btn.getPosition()).toBe("unknown position");
  });
});

// ---- Enhanced describe() Tests ----

describe("Button — Enhanced Screen Reader Description", () => {
  
  test("describe() includes positional context", () => {
    const figmaData = {
      type: "RECTANGLE",
      bounds: { x: 700, y: 50, width: 100, height: 40 }
    };
    
    const btn = new Button("btn-1", "Submit", figmaData);
    const description = btn.describe();
    
    expect(description).toContain("top-right");
    expect(description).toContain("Submit");
    expect(description).toContain("Button");
  });

  test("describe() identifies primary buttons", () => {
    const btn = new Button("btn-1", "Submit Form", {});
    const description = btn.describe();
    
    expect(description).toContain("primary");
  });

  test("describe() identifies secondary buttons", () => {
    const btn = new Button("btn-1", "Cancel", {});
    const description = btn.describe();
    
    expect(description).toContain("secondary");
  });

  test("describe() announces disabled state", () => {
    const btn = new Button("btn-1", "Submit", {});
    btn.setDisabled(true);
    
    const description = btn.describe();
    expect(description).toContain("disabled");
    expect(description).not.toContain("Press Enter");
  });
});

// ---- Backward Compatibility Tests ----

describe("SemanticTree — Legacy Name-Based Detection", () => {
  
  test("still works with explicit 'button' in name", () => {
    const tree = new SemanticTree();
    tree.build([{ id: "b1", name: "Submit Button", children: [] }]);
    expect(tree.getRoots()[0].getRole()).toBe("button");
  });

  test("still works with explicit 'input' in name", () => {
    const tree = new SemanticTree();
    tree.build([{ id: "i1", name: "Email Input", children: [] }]);
    expect(tree.getRoots()[0].getRole()).toBe("textbox");
  });
});