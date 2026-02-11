
// ============================================================
// src/core/InputField.js
// Concrete component — maps to Figma text input nodes.
// ============================================================

import { UIComponent } from "./uiComponent.js";

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