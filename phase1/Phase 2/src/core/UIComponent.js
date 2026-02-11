// ============================================================
// src/core/UIComponent.js
// Abstract base class for all semantic UI components.
// Think of this as the "grammar rule" in your language compiler —
// every token (Button, Input, Nav) must conform to this contract.
// ============================================================

export class UIComponent {
  /**
   * @param {string} id       - Unique node ID from Figma
   * @param {string} label    - Human-readable accessible label
   * @param {string} role     - ARIA role (button, textbox, navigation, etc.)
   */
  constructor(id, label, role) {
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
    this._state    = {};         // focusable, disabled, expanded, etc.
  }

  // ---- Getters / Setters (Encapsulation) ----

  getId()    { return this._id; }
  getLabel() { return this._label; }
  getRole()  { return this._role; }

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

  // ---- Abstract methods (Polymorphism contract) ----

  /**
   * Returns a screen-reader-friendly description of this component.
   * Each subclass must override this.
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
      state:    { ...this._state },
      children: this._children.map(c => c.toAuditObject()),
    };
  }
}


// ============================================================
// src/core/Button.js
// Concrete component — maps to Figma nodes that act as buttons.
// ============================================================

import { UIComponent } from "./UIComponent.js";

export class Button extends UIComponent {
  constructor(id, label) {
    super(id, label, "button");
    this._state.focusable = true;
    this._state.disabled  = false;
  }

  describe() {
    const dis = this._state.disabled ? ", disabled" : "";
    return `Button: "${this._label}"${dis}. Press Enter or Space to activate.`;
  }

  navigate() {
    return `Tab to focus "${this._label}" button. Enter or Space to click.`;
  }
}


// ============================================================
// src/core/InputField.js
// Concrete component — maps to Figma text input nodes.
// ============================================================

import { UIComponent } from "./UIComponent.js";

export class InputField extends UIComponent {
  /**
   * @param {string} id
   * @param {string} label
   * @param {string} inputType - e.g. "text", "email", "password"
   */
  constructor(id, label, inputType = "text") {
    super(id, label, "textbox");
    this._inputType       = inputType;
    this._state.focusable = true;
    this._state.required  = false;
  }

  getInputType()          { return this._inputType; }
  setRequired(val)        { this._state.required = Boolean(val); }

  describe() {
    const req = this._state.required ? ", required" : "";
    return `Input field: "${this._label}" (${this._inputType})${req}. Type to enter a value.`;
  }

  navigate() {
    return `Tab to focus "${this._label}" input. Type to enter value.`;
  }
}


// ============================================================
// src/core/NavigationRegion.js
// Concrete component — maps to Figma frames used as nav areas.
// ============================================================

import { UIComponent } from "./UIComponent.js";

export class NavigationRegion extends UIComponent {
  constructor(id, label) {
    super(id, label, "navigation");
    this._state.expanded = true;
  }

  describe() {
    const count = this._children.length;
    return `Navigation region: "${this._label}" with ${count} item${count !== 1 ? "s" : ""}.`;
  }

  navigate() {
    return `Tab into "${this._label}" navigation. Use arrow keys to move between links.`;
  }
}