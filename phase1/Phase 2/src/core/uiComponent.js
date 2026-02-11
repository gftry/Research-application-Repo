// Abstract base class for all semantic UI components.
// The "grammar rule" of the compiler — all tokens (Button, Input, Nav) adhere to this contract.

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



