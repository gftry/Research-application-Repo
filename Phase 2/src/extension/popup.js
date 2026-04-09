// ============================================================
// src/extension/popup.js
// Enhanced with component metadata extraction and WCAG reporting
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
  // Also announce to screen readers via aria-live
  statusEl.setAttribute("aria-live", "polite");
}

function renderResults(screenReaderLines, tabOrder, auditResult, errors, wcagReport) {
  resultsEl.hidden = false;
  resultsEl.innerHTML = "";

  const section = (title, lines, isError = false) => {
    const h = document.createElement("strong");
    h.textContent = title;
    h.setAttribute("role", "heading");
    h.setAttribute("aria-level", "2");
    resultsEl.appendChild(h);

    if (lines.length === 0) {
      const p = document.createElement("p");
      p.textContent = "None.";
      resultsEl.appendChild(p);
      return;
    }

    const ul = document.createElement("ul");
    ul.setAttribute("role", "list");
    
    for (const line of lines) {
      const li = document.createElement("li");
      li.textContent = line;
      li.setAttribute("role", "listitem");
      if (isError) {
        li.style.color = "#c0392b";
        li.setAttribute("aria-label", `Error: ${line}`);
      }
      ul.appendChild(li);
    }
    resultsEl.appendChild(ul);
  };

  // WCAG Report first (most important for accessibility)
  if (wcagReport) {
    const reportSection = document.createElement("pre");
    reportSection.textContent = wcagReport;
    reportSection.style.whiteSpace = "pre-wrap";
    reportSection.style.fontFamily = "monospace";
    reportSection.style.background = "#f5f5f5";
    reportSection.style.padding = "1rem";
    reportSection.style.marginBottom = "1rem";
    reportSection.setAttribute("role", "region");
    reportSection.setAttribute("aria-label", "WCAG Compliance Report");
    resultsEl.appendChild(reportSection);
  }

  section("Screen Reader Output:", screenReaderLines);
  section("Keyboard Tab Order:", tabOrder.map((t, i) => `${i + 1}. ${t.hint}`));
  section("Audit — Passed:", auditResult.passed.slice(0, 10)); // Show first 10
  section("Audit — Failed:", auditResult.failed, true);
  section("Parse Errors:", errors.map(e => `[${e.nodeId}] ${e.message}`), true);

  // Add summary announcement for screen readers
  const summary = `Audit complete. ${auditResult.failed.length} accessibility issues found.`;
  const srAnnounce = document.createElement("div");
  srAnnounce.setAttribute("role", "status");
  srAnnounce.setAttribute("aria-live", "assertive");
  srAnnounce.textContent = summary;
  srAnnounce.style.position = "absolute";
  srAnnounce.style.left = "-10000px";
  srAnnounce.style.width = "1px";
  srAnnounce.style.height = "1px";
  resultsEl.appendChild(srAnnounce);
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
  auditBtn.textContent = "Running Audit...";
  setStatus("Connecting to Figma API...");
  resultsEl.hidden = true;

  try {
    // Step 1: Fetch from Figma with geometry data
    const client   = new FigmaClient(token);
    setStatus("Fetching Figma file with positional data...");
    
    const fileData = await client.fetchFile(fileKey, true); // includeGeometry=true
    const nodes    = client.extractNodes(fileData);
    
    setStatus(`Retrieved ${nodes.length} top-level node(s). Extracting component metadata...`);

    // Step 2: Extract component metadata for semantic inference
    const componentMetadata = client.extractComponentMetadata(fileData);
    const componentCount = Object.keys(componentMetadata).length;
    
    if (componentCount > 0) {
      setStatus(`Found ${componentCount} Figma components. Building semantic tree...`);
    } else {
      setStatus(`No Figma components found. Building semantic tree from node structure...`);
    }

    // Step 3: Build semantic tree with metadata
    const tree = new SemanticTree(componentMetadata);
    tree.build(nodes);
    const roots = tree.getRoots();

    if (roots.length === 0) {
      throw new Error("No accessible components detected in this Figma file. The file may contain only visual elements without interactive components.");
    }

    setStatus(`Semantic tree built: ${roots.length} accessible component(s). Running accessibility services...`);

    // Step 4: Set parent context for all components
    const setParentContextRecursive = (component, parentLabel) => {
      component.setParentContext(parentLabel);
      for (const child of component.getChildren()) {
        setParentContextRecursive(child, component.getLabel());
      }
    };
    
    for (const root of roots) {
      setParentContextRecursive(root, "main content");
    }

    // Step 5: Run accessibility services
    const srService  = new ScreenReaderService();
    const kbNav      = new KeyboardNavigator();
    const auditor    = new AuditService();

    const readingOrder = srService.generateReadingOrder(roots);
    const tabOrder     = kbNav.buildTabOrder(roots);
    const auditResult  = auditor.runAudit(roots);
    
    // Step 6: Generate WCAG compliance report
    const wcagReport = auditor.generateReport(auditResult);

    const summary = `Done. ${roots.length} components | `
      + `${auditResult.failed.length} accessibility issues | `
      + `${tree.getErrors().length} parse errors.`;
    setStatus(summary);

    // Step 7: Render to UI
    renderResults(readingOrder, tabOrder, auditResult, tree.getErrors(), wcagReport);

  } catch (err) {
    // User-friendly error messages
    setStatus(`Error: ${err.message}`);
    console.error("[Figma Accessibility Auditor]", err);
    
    // Show error details in results panel
    resultsEl.hidden = false;
    resultsEl.innerHTML = "";
    
    const errorDiv = document.createElement("div");
    errorDiv.style.color = "#c0392b";
    errorDiv.style.padding = "1rem";
    errorDiv.style.background = "#ffe6e6";
    errorDiv.setAttribute("role", "alert");
    
    const errorTitle = document.createElement("strong");
    errorTitle.textContent = "Audit Failed";
    errorDiv.appendChild(errorTitle);
    
    const errorMsg = document.createElement("p");
    errorMsg.textContent = err.message;
    errorDiv.appendChild(errorMsg);
    
    const errorHelp = document.createElement("p");
    errorHelp.textContent = "Check your token and file key, then try again.";
    errorHelp.style.fontSize = "0.9em";
    errorDiv.appendChild(errorHelp);
    
    resultsEl.appendChild(errorDiv);
    
  } finally {
    auditBtn.disabled = false;
    auditBtn.textContent = "Run Audit";
  }
});