// ============================================================
// src/api/figmaClient.js
// Handles all communication with the Figma REST API.
// Analogy: this is the "lexer" — it reads raw source (Figma nodes)
// before the parser (SemanticTree) gives them meaning.
// ============================================================

const FIGMA_BASE_URL = "https://api.figma.com/v1";

export class FigmaClient {
  /**
   * @param {string} token - Figma Personal Access Token
   */
  constructor(token) {
    if (!token) throw new TypeError("FigmaClient requires a Personal Access Token.");
    this._token = token;
  }

  /**
   * Fetches the full file node tree from Figma.
   * @param {string} fileKey
   * @returns {Promise<object>} Raw Figma file JSON
   */
  async fetchFile(fileKey) {
    if (!fileKey) throw new TypeError("fetchFile requires a file key.");

    const url = `${FIGMA_BASE_URL}/files/${fileKey}`;
    let response;

    try {
      response = await fetch(url, {
        headers: { "X-Figma-Token": this._token }
      });
    } catch (networkErr) {
      // Network-level failure (offline, DNS, CORS)
      throw new Error(`Network error reaching Figma API: ${networkErr.message}`);
    }

    if (response.status === 403) {
      throw new Error("Figma API: Invalid or expired token. Check your Personal Access Token.");
    }
    if (response.status === 404) {
      throw new Error(`Figma API: File not found. Check the file key: "${fileKey}".`);
    }
    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    try {
      return await response.json();
    } catch (parseErr) {
      throw new Error(`Failed to parse Figma API response: ${parseErr.message}`);
    }
  }

  /**
   * Extracts the top-level children from a Figma file response.
   * @param {object} fileData - Raw response from fetchFile()
   * @returns {Array} Array of top-level Figma nodes
   */
  extractNodes(fileData) {
    try {
      return fileData?.document?.children ?? [];
    } catch (e) {
      throw new Error("Malformed Figma file data: could not extract nodes.");
    }
  }
}


// ============================================================
// src/semantic/SemanticTree.js
// Converts raw Figma nodes into a tree of UIComponent objects.
// Analogy: this is the "parser" — it takes tokens from the lexer
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