// ============================================================
// src/accessibility/ScreenReaderService.js
// Traverses the semantic tree and produces ordered, meaningful
// descriptions for screen reader output.
// ============================================================

export class ScreenReaderService {
  /**
   * Generates a flat, ordered list of readable descriptions
   * by doing a depth-first traversal of the semantic tree.
   * @param {UIComponent[]} roots
   * @returns {string[]}
   */
  generateReadingOrder(roots) {
    if (!Array.isArray(roots)) {
      throw new TypeError("generateReadingOrder expects an array of UIComponents.");
    }
    const output = [];
    for (const component of roots) {
      this._traverse(component, output);
    }
    return output;
  }

  _traverse(component, output) {
    try {
      output.push(component.describe());
      for (const child of component.getChildren()) {
        this._traverse(child, output);
      }
    } catch (e) {
      output.push(`[Screen reader error for component: ${e.message}]`);
    }
  }
}



