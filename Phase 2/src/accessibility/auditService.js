// ============================================================
// src/accessibility/AuditService.js
// Runs rule-based accessibility checks against the semantic tree.
// New rules can be added to RULES without modifying audit logic
// (Open/Closed Principle — matches README scalability goal).
// ============================================================

// Each rule is a plain object: { id, description, check(component) → string|null }
// check() returns an issue string if the rule fails, null if it passes.
const RULES = [
  {
    id:          "LABEL_EMPTY",
    description: "All components must have a non-empty accessible label.",
    check(c) {
      return (!c.getLabel() || c.getLabel().trim() === "")
        ? `Component [${c.getId()}] has an empty label.`
        : null;
    }
  },
  {
    id:          "ROLE_PRESENT",
    description: "All components must declare an ARIA role.",
    check(c) {
      return (!c.getRole() || c.getRole().trim() === "")
        ? `Component [${c.getId()}] "${c.getLabel()}" is missing an ARIA role.`
        : null;
    }
  },
  {
    id:          "FOCUSABLE_BUTTON",
    description: "All button components must be focusable.",
    check(c) {
      return (c.getRole() === "button" && !c.getState("focusable"))
        ? `Button "${c.getLabel()}" [${c.getId()}] is not marked as focusable.`
        : null;
    }
  },
];

export class AuditService {
  /**
   * Runs all accessibility rules against every component in the tree.
   * @param {UIComponent[]} roots
   * @returns {{ passed: string[], failed: string[] }}
   */
  runAudit(roots) {
    if (!Array.isArray(roots)) {
      throw new TypeError("runAudit expects an array of UIComponents.");
    }
    const passed = [];
    const failed = [];

    for (const root of roots) {
      this._auditComponent(root, passed, failed);
    }

    return { passed, failed };
  }

  _auditComponent(component, passed, failed) {
    try {
      for (const rule of RULES) {
        const issue = rule.check(component);
        if (issue) {
          failed.push(`[${rule.id}] ${issue}`);
        } else {
          passed.push(`[${rule.id}] "${component.getLabel()}" passed.`);
        }
      }
      for (const child of component.getChildren()) {
        this._auditComponent(child, passed, failed);
      }
    } catch (e) {
      failed.push(`[AUDIT_ERROR] Unexpected error auditing component: ${e.message}`);
    }
  }
}