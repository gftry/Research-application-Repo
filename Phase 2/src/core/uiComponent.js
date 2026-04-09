// ============================================================
// src/core/UIComponent.js
// Enhanced with Figma metadata storage for positional context
// ============================================================

export class UIComponent {
  /**
   * @param {string} id       - Unique node ID from Figma
   * @param {string} label    - Human-readable accessible label
   * @param {string} role     - ARIA role (button, textbox, navigation, etc.)
   * @param {object} figmaData - Figma-specific metadata (bounds, type, styles)
   */
  constructor(id, label, role, figmaData = {}) {
    if (new.target === UIComponent) {
      throw new Error("UIComponent is abstract and cannot be instantiated directly.");
    }
    if (!id)    throw new TypeError("UIComponent requires a non-empty id.");
    if (!label) throw new TypeError("UIComponent requires a non-empty label.");
    if (!role)  throw new TypeError("UIComponent requires a non-empty role.");

    this._id       = id;
    this._label    = label;
    this._role     = role;
    this._children = [];
    this._state    = {};
    
    // Store Figma metadata for positional announcements
    this._figmaData = {
      type: figmaData.type || "UNKNOWN",
      bounds: figmaData.bounds || null,  // absoluteBoundingBox from Figma
      styles: figmaData.styles || {},
      effects: figmaData.effects || []
    };
  }

  // ---- Getters / Setters (Encapsulation) ----

  getId()    { return this._id; }
  getLabel() { return this._label; }
  getRole()  { return this._role; }
  getFigmaData() { return this._figmaData; }

  setLabel(label) {
    if (!label) throw new TypeError("Label cannot be empty.");
    this._label = label;
  }

  setState(key, val) { this._state[key] = val; }
  getState(key)      { return this._state[key]; }

  addChild(component) {
    if (!(component instanceof UIComponent)) {
      throw new TypeError("Child must be a UIComponent instance.");
    }
    this._children.push(component);
  }

  getChildren() { return [...this._children]; }

  /**
   * Positional context from Figma bounds.
   * Returns: "top-left", "top-right", "middle", "bottom-left", etc.
   */
  getPosition() {
    const bounds = this._figmaData.bounds;
    if (!bounds) return "unknown position";

    const { x, y, width, height } = bounds;
    
    // Simple quadrant detection (can be enhanced with parent context)
    let vertical = "middle";
    let horizontal = "center";

    if (y < 200) vertical = "top";
    else if (y > 600) vertical = "bottom";

    if (x < 200) horizontal = "left";
    else if (x > 600) horizontal = "right";

    if (vertical === "middle" && horizontal === "center") {
      return "center of screen";
    }

    return `${vertical}${horizontal !== "center" ? "-" + horizontal : ""}`;
  }

  /**
   * Gets parent context for "Located in X region" announcements.
   */
  getParentContext() {
    // Will be set by SemanticTree during build
    return this._parentLabel || "main content";
  }

  setParentContext(parentLabel) {
    this._parentLabel = parentLabel;
  }

  // ---- Abstract methods (Polymorphism contract) ----

  /**
   * Returns a screen-reader-friendly description of this component.
   * Each subclass must override this to include positional context.
   */
  describe() {
    throw new Error(`describe() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Returns keyboard navigation hint for this component.
   * Each subclass must override this.
   */
  navigate() {
    throw new Error(`navigate() must be implemented by ${this.constructor.name}`);
  }

  /**
   * Serialises this component to a plain accessibility-audit object.
   */
  toAuditObject() {
    return {
      id:       this._id,
      label:    this._label,
      role:     this._role,
      position: this.getPosition(),
      state:    { ...this._state },
      children: this._children.map(c => c.toAuditObject()),
    };
  }
}