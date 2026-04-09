// ============================================================
// src/core/Button.js
// Enhanced with positional context and state-rich descriptions
// ============================================================

import { UIComponent } from "./uiComponent.js";

export class Button extends UIComponent {
  constructor(id, label, figmaData = {}) {
    super(id, label, "button", figmaData);
    this._state.focusable = true;
    this._state.disabled  = false;
    
    // Infer button priority from Figma styles
    this._inferPriority(figmaData);
  }

  /**
   * Infers whether this is a primary or secondary button
   * based on Figma fill styles (heuristic).
   */
  _inferPriority(figmaData) {
    // Primary buttons typically have solid, vibrant fills
    // Secondary buttons have outlines or muted colors
    
    // This is a simplified heuristic — can be enhanced with
    // actual style color analysis from figmaData.styles
    
    const name = this._label.toLowerCase();
    const isPrimary = name.includes("submit") || 
                      name.includes("continue") || 
                      name.includes("save") ||
                      name.includes("confirm");
    
    this._state.priority = isPrimary ? "primary" : "secondary";
  }

  /**
   * ADDED: Rich description for blind screen reader users.
   * Must include:
   * 1. Element type (Button)
   * 2. Label/text
   * 3. State (enabled/disabled)
   * 4. Priority/importance (primary/secondary)
   * 5. Position context
   * 6. Parent context
   * 7. Activation method
   */
  
  describe() {
    const parts = [];
    
    // 1. Element type and label
    parts.push(`Button, "${this._label}"`);
    
    // 2. Priority indicator
    const priority = this._state.priority || "secondary";
    parts.push(`(${priority} action button)`);
    
    // 3. State
    const state = this._state.disabled ? "disabled" : "enabled";
    parts.push(`${state}.`);
    
    // 4. Position context
    const position = this.getPosition();
    if (position !== "unknown position") {
      parts.push(`Located in ${position} of`);
    }
    
    // 5. Parent context
    const parent = this.getParentContext();
    parts.push(`"${parent}" region.`);
    
    // 6. Activation method
    if (!this._state.disabled) {
      parts.push("Press Enter or Space to activate.");
    }
    
    return parts.join(" ");
  }

  /**
   * Enhanced navigation hint with positional awareness.
   */
  navigate() {
    const position = this.getPosition();
    const priority = this._state.priority || "secondary";
    
    let hint = `Tab to focus "${this._label}" button`;
    
    if (position !== "unknown position") {
      hint += ` (${position})`;
    }
    
    if (priority === "primary") {
      hint += ". PRIMARY ACTION";
    }
    
    hint += ". Enter or Space to click.";
    
    return hint;
  }

  /**
   * Sets disabled state and updates description.
   */
  setDisabled(disabled) {
    this._state.disabled = Boolean(disabled);
    this._state.focusable = !disabled;
  }
}