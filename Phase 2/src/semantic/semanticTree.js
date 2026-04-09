// ============================================================
// src/semantic/SemanticTree.js
// Enhanced with Figma node type detection + heuristic inference
// ============================================================

import { Button }            from "../core/Button.js";
import { InputField }        from "../core/InputField.js";
import { NavigationRegion }  from "../core/NavigationRegion.js";

// Explicit name-to-component mappings (legacy support)
const COMPONENT_MAP = {
  button:     (node, figmaData) => new Button(node.id, extractLabel(node), figmaData),
  input:      (node, figmaData) => new InputField(node.id, extractLabel(node), "text", figmaData),
  textbox:    (node, figmaData) => new InputField(node.id, extractLabel(node), "text", figmaData),
  nav:        (node, figmaData) => new NavigationRegion(node.id, extractLabel(node), figmaData),
  navigation: (node, figmaData) => new NavigationRegion(node.id, extractLabel(node), figmaData),
};

/**
 * Extracts meaningful label from Figma node.
 * Priority: text content > name > id
 */
function extractLabel(node) {
  // If node is TEXT type, use its actual text content
  if (node.type === "TEXT" && node.characters) {
    return node.characters.trim();
  }
  
  // If node has TEXT child, use child's content
  if (node.children) {
    for (const child of node.children) {
      if (child.type === "TEXT" && child.characters) {
        return child.characters.trim();
      }
    }
  }
  
  // Fallback to node name, cleaned up
  return (node.name || node.id).replace(/[_-]/g, " ").trim();
}

export class SemanticTree {
  constructor(componentMetadata = {}) {
    this._roots = [];
    this._errors = [];
    this._componentMetadata = componentMetadata; // From FigmaClient.extractComponentMetadata()
  }

  getRoots()  { return [...this._roots]; }
  getErrors() { return [...this._errors]; }

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
        this._errors.push({ nodeId: node?.id ?? "unknown", message: e.message });
      }
    }
  }

  /**
   * Parses Figma nodes by TYPE, not just name.
   * Uses structural heuristics to infer semantic meaning.
   */
  _parseNode(node) {
    if (!node || typeof node !== "object") {
      throw new TypeError("Invalid node: expected an object.");
    }

    // Step 1: Try explicit name matching (backward compatibility)
    const nameKey = this._resolveKey(node.name);
    if (COMPONENT_MAP[nameKey]) {
      return this._buildComponent(nameKey, node);
    }

    // Step 2: Use Figma node TYPE to infer semantic component
    const inferredType = this._inferTypeFromFigma(node);
    if (inferredType && COMPONENT_MAP[inferredType]) {
      return this._buildComponent(inferredType, node);
    }

    // Step 3: Check component metadata for semantic hints
    if (node.componentId && this._componentMetadata[node.componentId]) {
      const metadata = this._componentMetadata[node.componentId];
      const roleKey = this._roleToComponentKey(metadata.semanticRole);
      if (roleKey && COMPONENT_MAP[roleKey]) {
        return this._buildComponent(roleKey, node);
      }
    }

    // Unsupported: log but don't crash
    this._errors.push({
      nodeId:  node.id ?? "unknown",
      message: `Could not infer component type for node: "${node.name}" (type: ${node.type})`
    });
    return null;
  }

  /**
   * Infers component type from Figma's node structure.
   * Based on official Figma node types + common design patterns.
   */
  _inferTypeFromFigma(node) {
    const nodeType = node.type;
    
    // COMPONENT or INSTANCE nodes often represent reusable UI elements
    if (nodeType === "COMPONENT" || nodeType === "INSTANCE") {
      return this._inferFromComponent(node);
    }

    // FRAME nodes are containers — check their children
    if (nodeType === "FRAME") {
      return this._inferFromFrame(node);
    }

    // RECTANGLE + TEXT child = likely a button
    if (nodeType === "RECTANGLE") {
      return this._hasTextChild(node) ? "button" : null;
    }

    // TEXT nodes alone are not interactive
    if (nodeType === "TEXT") {
      return null; // Skip standalone text nodes
    }

    return null;
  }

  /**
   * Infers semantic type from COMPONENT/INSTANCE nodes.
   */
  _inferFromComponent(node) {
    const name = (node.name || "").toLowerCase();
    
    // Check for common design system naming
    if (name.includes("button") || name.includes("btn") || name.includes("cta")) {
      return "button";
    }
    if (name.includes("input") || name.includes("field") || name.includes("textbox")) {
      return "input";
    }
    if (name.includes("nav") || name.includes("menu")) {
      return "navigation";
    }
    
    return null;
  }

  /**
   * Infers semantic type from FRAME nodes based on children.
   */
  _inferFromFrame(node) {
    const name = (node.name || "").toLowerCase();
    
    // Frames explicitly named as navigation
    if (name.includes("nav") || name.includes("menu") || name.includes("header")) {
      return "navigation";
    }

    // Frames with multiple interactive children = navigation region
    if (this._hasMultipleInteractiveChildren(node)) {
      return "navigation";
    }

    // Frames with input-like children = form
    if (this._hasInputLikeChildren(node)) {
      return null; // Process children individually
    }

    return null; // Default: process children
  }

  /**
   * Checks if node has TEXT children (used for button detection).
   */
  _hasTextChild(node) {
    if (!node.children) return false;
    return node.children.some(child => child.type === "TEXT");
  }

  /**
   * Checks if frame has multiple interactive children.
   */
  _hasMultipleInteractiveChildren(node) {
    if (!node.children || node.children.length < 2) return false;
    
    let interactiveCount = 0;
    for (const child of node.children) {
      const type = child.type;
      if (type === "COMPONENT" || type === "INSTANCE" || 
          (type === "RECTANGLE" && this._hasTextChild(child))) {
        interactiveCount++;
      }
    }
    
    return interactiveCount >= 2;
  }

  /**
   * Checks if frame contains input-like patterns.
   */
  _hasInputLikeChildren(node) {
    if (!node.children) return false;
    
    return node.children.some(child => {
      const name = (child.name || "").toLowerCase();
      return name.includes("input") || name.includes("field") || name.includes("textbox");
    });
  }

  /**
   * Maps semantic role to component key.
   */
  _roleToComponentKey(role) {
    const map = {
      "button": "button",
      "textbox": "input",
      "navigation": "navigation",
      "link": "button", // Treat links as buttons for keyboard nav
      "heading": null,   // Skip headings for now
      "generic": null
    };
    return map[role] || null;
  }

  /**
   * Builds component and recursively parses children.
   */
  _buildComponent(componentKey, node) {
    const factory = COMPONENT_MAP[componentKey];
    const figmaData = {
      type: node.type,
      bounds: node.absoluteBoundingBox,
      styles: node.styles,
      effects: node.effects
    };
    
    const component = factory(node, figmaData);

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
   * Legacy name-based resolution (fallback).
   */
  _resolveKey(name = "") {
    const lower = name.toLowerCase();
    for (const key of Object.keys(COMPONENT_MAP)) {
      if (lower.includes(key)) return key;
    }
    return null;
  }

  toJSON() {
    return {
      components: this._roots.map(r => r.toAuditObject()),
      errors:     this._errors,
    };
  }
}