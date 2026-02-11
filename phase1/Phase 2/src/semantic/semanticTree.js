// ============================================================
// src/semantic/SemanticTree.js
// Converts raw Figma nodes into a tree of UIComponent objects.
// Consider it the "parser" that takes tokens from the lexer
// and builds an Abstract Syntax Tree of semantic meaning.
// ============================================================

import { Button }            from "../core/Button.js";
import { InputField }        from "../core/InputField.js";
import { NavigationRegion }  from "../core/NavigationRegion.js";

// Maps Figma node name patterns to component constructors.
// Extend this map to support new component types without
// modifying core parsing logic (Open/Closed Principle).
const COMPONENT_MAP = {
  button:     (node) => new Button(node.id, node.name),
  input:      (node) => new InputField(node.id, node.name),
  textbox:    (node) => new InputField(node.id, node.name),
  nav:        (node) => new NavigationRegion(node.id, node.name),
  navigation: (node) => new NavigationRegion(node.id, node.name),
};

export class SemanticTree {
  constructor() {
    this._roots = [];
    this._errors = [];
  }

  getRoots()  { return [...this._roots]; }
  getErrors() { return [...this._errors]; }

  /**
   * Builds the semantic tree from an array of raw Figma nodes.
   * @param {Array} nodes - From FigmaClient.extractNodes()
   */
  build(nodes) {
    if (!Array.isArray(nodes)) {
      throw new TypeError("SemanticTree.build() expects an array of nodes.");
    }
    this._roots  = [];
    this._errors = [];

    for (const node of nodes) {
      try {
        const component = this._parseNode(node);
        if (component) this._roots.push(component);
      } catch (e) {
        // Log and continue — graceful degradation per README spec
        this._errors.push({ nodeId: node?.id ?? "unknown", message: e.message });
      }
    }
  }

  /**
   * Recursively maps a single Figma node to a UIComponent.
   * @param {object} node
   * @returns {UIComponent|null}
   */
  _parseNode(node) {
    if (!node || typeof node !== "object") {
      throw new TypeError("Invalid node: expected an object.");
    }

    const key       = this._resolveKey(node.name);
    const factory   = COMPONENT_MAP[key];
    let component   = null;

    if (factory) {
      component = factory(node);
    } else {
      // Unsupported type — skip but record for audit log
      this._errors.push({
        nodeId:  node.id ?? "unknown",
        message: `Unsupported component type: "${node.name}". Skipped.`
      });
      return null;
    }

    // Recursively process children
    if (Array.isArray(node.children)) {
      for (const child of node.children) {
        try {
          const childComponent = this._parseNode(child);
          if (childComponent) component.addChild(childComponent);
        } catch (e) {
          this._errors.push({ nodeId: child?.id ?? "unknown", message: e.message });
        }
      }
    }

    return component;
  }

  /**
   * Normalises a Figma node name to a lowercase lookup key.
   * e.g. "Submit Button" → "button"
   */
  _resolveKey(name = "") {
    const lower = name.toLowerCase();
    for (const key of Object.keys(COMPONENT_MAP)) {
      if (lower.includes(key)) return key;
    }
    return lower;
  }

  /**
   * Serialises the full tree to a plain object for rendering/testing.
   */
  toJSON() {
    return {
      components: this._roots.map(r => r.toAuditObject()),
      errors:     this._errors,
    };
  }
}