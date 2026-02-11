
// ============================================================
// src/accessibility/KeyboardNavigator.js
// Builds a flat, ordered list of focusable elements and their
// keyboard navigation hints from the semantic tree.
// ============================================================

export class KeyboardNavigator {
  /**
   * Returns tab-order navigation hints for all focusable components.
   * @param {UIComponent[]} roots
   * @returns {Array<{label: string, hint: string}>}
   */
  buildTabOrder(roots) {
    if (!Array.isArray(roots)) {
      throw new TypeError("buildTabOrder expects an array of UIComponents.");
    }
    const order = [];
    for (const component of roots) {
      this._collect(component, order);
    }
    return order;
  }

  _collect(component, order) {
    try {
      const focusable = component.getState("focusable");
      if (focusable) {
        order.push({
          label: component.getLabel(),
          hint:  component.navigate(),
        });
      }
      for (const child of component.getChildren()) {
        this._collect(child, order);
      }
    } catch (e) {
      order.push({ label: "unknown", hint: `[Navigation error: ${e.message}]` });
    }
  }
}
