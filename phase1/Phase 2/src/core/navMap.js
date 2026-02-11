
// ============================================================
// src/core/NavigationRegion.js
// Concrete component — maps to Figma frames used as nav areas.
// ============================================================

import { UIComponent } from "./uiComponent.js";

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