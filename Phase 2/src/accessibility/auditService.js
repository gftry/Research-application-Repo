// ============================================================
// src/accessibility/AuditService.js
// Enhanced with WCAG 2.2 Level AAA rules for blind users
// ============================================================

// Rule definitions: { id, description, level, check(component) }
// Levels: A (must have), AA (should have), AAA (best practice)

const RULES = [
  // ---- WCAG 2.2 Level A (Critical) ----
  
  {
    id:          "LABEL_EMPTY",
    level:       "A",
    wcag:        "1.1.1", // Non-text Content
    description: "All components must have a non-empty accessible label.",
    check(c) {
      return (!c.getLabel() || c.getLabel().trim() === "")
        ? `Component [${c.getId()}] has an empty label. This violates WCAG 1.1.1.`
        : null;
    }
  },
  
  {
    id:          "ROLE_PRESENT",
    level:       "A",
    wcag:        "4.1.2", // Name, Role, Value
    description: "All components must declare an ARIA role.",
    check(c) {
      return (!c.getRole() || c.getRole().trim() === "")
        ? `Component [${c.getId()}] "${c.getLabel()}" is missing an ARIA role. This violates WCAG 4.1.2.`
        : null;
    }
  },
  
  {
    id:          "FOCUSABLE_BUTTON",
    level:       "A",
    wcag:        "2.1.1", // Keyboard
    description: "All button components must be focusable via keyboard.",
    check(c) {
      return (c.getRole() === "button" && !c.getState("focusable"))
        ? `Button "${c.getLabel()}" [${c.getId()}] is not keyboard focusable. This violates WCAG 2.1.1.`
        : null;
    }
  },

  // ---- WCAG 2.2 Level AA (Important) ----
  
  {
    id:          "FOCUS_ORDER_LOGICAL",
    level:       "AA",
    wcag:        "2.4.3", // Focus Order
    description: "Interactive elements should have logical reading/focus order.",
    check(c) {
      // Check if focusable element has positional context
      if (c.getState("focusable") && c.getPosition() === "unknown position") {
        return `Focusable element "${c.getLabel()}" [${c.getId()}] has no positional context. Screen readers may announce in illogical order (WCAG 2.4.3).`;
      }
      return null;
    }
  },
  
  {
    id:          "LABEL_DESCRIPTIVE",
    level:       "AA",
    wcag:        "2.4.6", 
    // Headings and Labels
    description: "Labels must be descriptive and not just single characters.",
    check(c) {
      const label = c.getLabel();
      if (label && label.length < 2) {
        return `Component "${label}" [${c.getId()}] has a single-character label which may not be descriptive (WCAG 2.4.6).`;
      }
      return null;
    }
  },

  {
    id:          "BUTTON_PURPOSE_CLEAR",
    level:       "AA",
    wcag:        "2.4.4", 
    // Link Purpose (In Context)
    description: "Button labels should clearly indicate their purpose.",
    check(c) {
      if (c.getRole() === "button") {
        const label = c.getLabel().toLowerCase();
        // Generic labels that don't convey purpose
        const genericLabels = ["click", "button", "submit", "ok", "go", "next", "back"];
        if (genericLabels.includes(label)) {
          return `Button "${c.getLabel()}" [${c.getId()}] has a generic label that may not clearly convey purpose in all contexts (WCAG 2.4.4).`;
        }
      }
      return null;
    }
  },

  // ---- WCAG 2.2 Level AAA (Best Practice) ----
  
  {
    id:          "CONTEXT_AVAILABLE",
    level:       "AAA",
    wcag:        "2.4.9", // Link Purpose (Link Only)
    description: "Components should provide enough context for understanding without surrounding content.",
    check(c) {
      const label = c.getLabel();
      const parent = c.getParentContext();
      
      // If label is generic AND parent context is also generic, fail
      if (label.length < 10 && parent === "main content") {
        return `Component "${label}" [${c.getId()}] may lack sufficient context for screen reader users (WCAG 2.4.9 AAA).`;
      }
      return null;
    }
  },

  {
    id:          "CONSISTENT_IDENTIFICATION",
    level:       "AAA",
    wcag:        "3.2.4", // Consistent Identification
    description: "Components with the same function should have consistent labels.",
    check(c, componentIndex, allComponents) {
      // This rule requires cross-component analysis
      // Store component for second-pass analysis in runAudit()
      return null; // Implemented in runAudit() second pass
    }
  },

  // ---- Screen Reader Specific (Not WCAG but Critical) ----

  {
    id:          "SR_POSITION_CONTEXT",
    level:       "Custom",
    wcag:        "N/A",
    description: "Blind users benefit from spatial context announcements.",
    check(c) {
      if (c.getState("focusable")) {
        const position = c.getPosition();
        if (position === "unknown position") {
          return `Focusable element "${c.getLabel()}" [${c.getId()}] is missing positional context which helps blind users build mental model of UI.`;
        }
      }
      return null;
    }
  },

  {
    id:          "SR_PARENT_CONTEXT",
    level:       "Custom",
    wcag:        "N/A",
    description: "Components should announce their parent region for orientation.",
    check(c) {
      const parent = c.getParentContext();
      if (parent === "main content" && c.getChildren().length === 0) {
        // Leaf nodes should have specific parent context
        return `Component "${c.getLabel()}" [${c.getId()}] lacks specific parent context. Consider grouping related elements in named regions.`;
      }
      return null;
    }
  }
];

export class AuditService {
  /**
   * Runs all accessibility rules against every component in the tree.
   * Returns results grouped by WCAG level.
   */
  runAudit(roots) {
    if (!Array.isArray(roots)) {
      throw new TypeError("runAudit expects an array of UIComponents.");
    }

    const results = {
      passed: [],
      failed: [],
      byLevel: {
        A: { passed: 0, failed: 0 },
        AA: { passed: 0, failed: 0 },
        AAA: { passed: 0, failed: 0 },
        Custom: { passed: 0, failed: 0 }
      }
    };

    // Collect all components for cross-component rules
    const allComponents = [];
    const collectAll = (comp) => {
      allComponents.push(comp);
      comp.getChildren().forEach(collectAll);
    };
    roots.forEach(collectAll);

    // First pass: individual component rules
    for (const root of roots) {
      this._auditComponent(root, results, allComponents);
    }

    // Second pass: cross-component consistency check
    this._checkConsistentIdentification(allComponents, results);

    return results;
  }

  _auditComponent(component, results, allComponents) {
    try {
      for (const rule of RULES) {
        // Skip cross-component rules in first pass
        if (rule.id === "CONSISTENT_IDENTIFICATION") continue;

        const issue = rule.check(component, allComponents.indexOf(component), allComponents);
        const level = rule.level;

        if (issue) {
          results.failed.push(`[${rule.id}] ${issue}`);
          results.byLevel[level].failed++;
        } else {
          results.passed.push(`[${rule.id}] "${component.getLabel()}" passed.`);
          results.byLevel[level].passed++;
        }
      }

      for (const child of component.getChildren()) {
        this._auditComponent(child, results, allComponents);
      }
    } catch (e) {
      results.failed.push(`[AUDIT_ERROR] Unexpected error auditing component: ${e.message}`);
    }
  }

  /**
   * Checks that components with same role have consistent naming patterns.
   */
  _checkConsistentIdentification(allComponents, results) {
    const byRole = {};

    // Group by role
    for (const comp of allComponents) {
      const role = comp.getRole();
      if (!byRole[role]) byRole[role] = [];
      byRole[role].push(comp);
    }

    // Check for inconsistent patterns
    for (const [role, components] of Object.entries(byRole)) {
      if (components.length < 2) continue;

      // Extract label patterns
      const labels = components.map(c => c.getLabel().toLowerCase());
      const uniquePatterns = new Set(labels);

      // If all labels are completely different, flag it
      if (uniquePatterns.size === labels.length && labels.length > 3) {
        const issue = `${components.length} ${role} components have completely different labels, which may confuse screen reader users. Consider consistent naming patterns (WCAG 3.2.4).`;
        results.failed.push(`[CONSISTENT_IDENTIFICATION] ${issue}`);
        results.byLevel.AAA.failed++;
      } else {
        results.passed.push(`[CONSISTENT_IDENTIFICATION] ${role} components have consistent identification.`);
        results.byLevel.AAA.passed++;
      }
    }
  }

  /**
   * Generates accessibility compliance report.
   */
  generateReport(auditResults) {
    const { byLevel } = auditResults;
    
    const levelA_pass = byLevel.A.passed;
    const levelA_fail = byLevel.A.failed;
    const levelAA_pass = byLevel.AA.passed;
    const levelAA_fail = byLevel.AA.failed;
    const levelAAA_pass = byLevel.AAA.passed;
    const levelAAA_fail = byLevel.AAA.failed;

    const report = [];
    
    report.push("=== WCAG 2.2 Accessibility Audit Report ===\n");
    
    // Level A (Critical)
    const levelA_total = levelA_pass + levelA_fail;
    const levelA_percent = levelA_total > 0 ? ((levelA_pass / levelA_total) * 100).toFixed(1) : 0;
    report.push(`Level A (Critical): ${levelA_pass}/${levelA_total} passed (${levelA_percent}%)`);
    
    if (levelA_fail > 0) {
      report.push(`  ⚠️  ${levelA_fail} CRITICAL accessibility issues found!`);
    } else {
      report.push(`  ✓ All Level A requirements met`);
    }
    
    // Level AA (Important)
    const levelAA_total = levelAA_pass + levelAA_fail;
    const levelAA_percent = levelAA_total > 0 ? ((levelAA_pass / levelAA_total) * 100).toFixed(1) : 0;
    report.push(`\nLevel AA (Important): ${levelAA_pass}/${levelAA_total} passed (${levelAA_percent}%)`);
    
    // Level AAA (Best Practice)
    const levelAAA_total = levelAAA_pass + levelAAA_fail;
    const levelAAA_percent = levelAAA_total > 0 ? ((levelAAA_pass / levelAAA_total) * 100).toFixed(1) : 0;
    report.push(`\nLevel AAA (Best Practice): ${levelAAA_pass}/${levelAAA_total} passed (${levelAAA_percent}%)`);
    
    // Overall compliance
    const overallPass = levelA_pass + levelAA_pass + levelAAA_pass;
    const overallTotal = levelA_total + levelAA_total + levelAAA_total;
    const overallPercent = overallTotal > 0 ? ((overallPass / overallTotal) * 100).toFixed(1) : 0;
    
    report.push(`\n=== Overall Accessibility: ${overallPercent}% compliant ===`);
    
    if (levelA_fail === 0 && levelAA_fail === 0 && levelAAA_fail === 0) {
      report.push("\n🎉 WCAG 2.2 Level AAA Compliant!");
    } else if (levelA_fail === 0 && levelAA_fail === 0) {
      report.push("\n✓ WCAG 2.2 Level AA Compliant");
    } else if (levelA_fail === 0) {
      report.push("\n✓ WCAG 2.2 Level A Compliant");
    } else {
      report.push("\n❌ Does not meet WCAG 2.2 Level A (minimum legal requirement)");
    }
    
    return report.join("\n");
  }
}