
// ============================================================
// src/core/Button.js
// Concrete component — maps to Figma nodes that act as buttons.
// ============================================================

import { UIComponent } from "./uiComponent.js";

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