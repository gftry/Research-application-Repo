// ============================================================
// src/extension/popup.js
// Entry point: orchestrates Figma API fetch → SemanticTree
// build → Accessibility services → UI render.
// ============================================================

import { FigmaClient }         from "../api/figmaClient.js";
import { SemanticTree }        from "../semantic/SemanticTree.js";
import { ScreenReaderService } from "../accessibility/ScreenReaderService.js";
import { KeyboardNavigator }   from "../accessibility/KeyboardNavigator.js";
import { AuditService }        from "../accessibility/AuditService.js";

// ---- DOM references ----
const auditBtn   = document.getElementById("auditBtn");
const tokenInput = document.getElementById("tokenInput");
const fileInput  = document.getElementById("fileKeyInput");
const statusEl   = document.getElementById("status");
const resultsEl  = document.getElementById("results");

// ---- Helpers ----

function setStatus(msg) {
  statusEl.textContent = msg;
}

function renderResults(screenReaderLines, tabOrder, auditResult, errors) {
  resultsEl.hidden = false;
  resultsEl.innerHTML = "";

  const section = (title, lines, isError = false) => {
    const h = document.createElement("strong");
    h.textContent = title;
    resultsEl.appendChild(h);

    if (lines.length === 0) {
      const p = document.createElement("p");
      p.textContent = "None.";
      resultsEl.appendChild(p);
      return;
    }

    const ul = document.createElement("ul");
    for (const line of lines) {
      const li = document.createElement("li");
      li.textContent = line;
      if (isError) li.style.color = "#c0392b";
      ul.appendChild(li);
    }
    resultsEl.appendChild(ul);
  };

  section("Screen Reader Output:", screenReaderLines);
  section("Keyboard Tab Order:", tabOrder.map((t, i) => `${i + 1}. ${t.hint}`));
  section("Audit — Passed:", auditResult.passed);
  section("Audit — Failed:", auditResult.failed, true);
  section("Parse Errors:", errors.map(e => `[${e.nodeId}] ${e.message}`), true);
}

// ---- Main handler ----

auditBtn.addEventListener("click", async () => {
  const token   = tokenInput.value.trim();
  const fileKey = fileInput.value.trim();

  // Input validation
  if (!token) {
    setStatus("Please enter your Figma Personal Access Token.");
    tokenInput.focus();
    return;
  }
  if (!fileKey) {
    setStatus("Please enter a Figma File Key.");
    fileInput.focus();
    return;
  }

  auditBtn.disabled = true;
  setStatus("Connecting to Figma API...");
  resultsEl.hidden = true;

  try {
    // Step 1: Fetch from Figma
    const client   = new FigmaClient(token);
    const fileData = await client.fetchFile(fileKey);
    const nodes    = client.extractNodes(fileData);

    setStatus(`Retrieved ${nodes.length} top-level node(s). Building semantic tree...`);

    // Step 2: Build semantic tree
    const tree = new SemanticTree();
    tree.build(nodes);
    const roots = tree.getRoots();

    setStatus(`Semantic tree built: ${roots.length} component(s). Running accessibility services...`);

    // Step 3: Run accessibility services
    const srService  = new ScreenReaderService();
    const kbNav      = new KeyboardNavigator();
    const auditor    = new AuditService();

    const readingOrder = srService.generateReadingOrder(roots);
    const tabOrder     = kbNav.buildTabOrder(roots);
    const auditResult  = auditor.runAudit(roots);

    const summary = `Done. ${roots.length} components | `
      + `${auditResult.passed.length} checks passed | `
      + `${auditResult.failed.length} issues found.`;
    setStatus(summary);

    // Step 4: Render to UI
    renderResults(readingOrder, tabOrder, auditResult, tree.getErrors());

  } catch (err) {
    // All thrown errors surface here with user-friendly messages
    setStatus(`Error: ${err.message}`);
    console.error("[Figma Accessibility Auditor]", err);
  } finally {
    auditBtn.disabled = false;
  }
});