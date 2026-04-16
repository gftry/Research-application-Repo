#!/usr/bin/env node

// ============================================================
// scripts/runAudit.js
// CLI tool to run accessibility audit from .env credentials
// Usage: npm run audit [--html] [--json]
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import your modules
import { FigmaClient } from '../src/api/figmaClient.js';
import { SemanticTree } from '../src/semantic/SemanticTree.js';
import { ScreenReaderService } from '../src/accessibility/ScreenReaderService.js';
import { KeyboardNavigator } from '../src/accessibility/KeyboardNavigator.js';
import { AuditService } from '../src/accessibility/AuditService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(projectRoot, '.env') });

// Parse command line arguments
const args = process.argv.slice(2);
const generateHTML = args.includes('--html');
const generateJSON = args.includes('--json');

// Validate required environment variables
const requiredVars = ['FIGMA_PERSONAL_ACCESS_TOKEN', 'FIGMA_FILE_KEY'];
const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.error('❌ Error: Missing required environment variables:');
  missing.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n💡 Add these to your .env file');
  process.exit(1);
}

// Configuration from .env
const config = {
  token: process.env.FIGMA_PERSONAL_ACCESS_TOKEN,
  fileKey: process.env.FIGMA_FILE_KEY,
  includeGeometry: process.env.INCLUDE_GEOMETRY !== 'false',
  outputDir: process.env.OUTPUT_DIR || './output'
};

// Ensure output directory exists
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// ---- Main Audit Function ----

async function runAudit() {
  console.log('🔍 Starting Figma Accessibility Audit...\n');
  console.log(`📄 File Key: ${config.fileKey}`);
  console.log(`📐 Include Geometry: ${config.includeGeometry}\n`);

  try {
    // Step 1: Fetch from Figma
    console.log('⏳ Fetching Figma file...');
    const client = new FigmaClient(config.token);
    const fileData = await client.fetchFile(config.fileKey, config.includeGeometry);
    const nodes = client.extractNodes(fileData);
    console.log(`✓ Retrieved ${nodes.length} top-level nodes\n`);

    // Step 2: Extract component metadata
    console.log('⏳ Extracting component metadata...');
    const componentMetadata = client.extractComponentMetadata(fileData);
    const componentCount = Object.keys(componentMetadata).length;
    console.log(`✓ Found ${componentCount} Figma components\n`);

    // Step 3: Build semantic tree
    console.log('⏳ Building semantic tree...');
    const tree = new SemanticTree(componentMetadata);
    tree.build(nodes);
    const roots = tree.getRoots();
    
    if (roots.length === 0) {
      console.error('❌ No accessible components detected in Figma file');
      console.error('   The file may contain only visual elements.');
      process.exit(1);
    }
    
    console.log(`✓ Built semantic tree with ${roots.length} root components\n`);

    // Step 4: Set parent context
    console.log('⏳ Setting component context...');
    const setParentContextRecursive = (component, parentLabel) => {
      component.setParentContext(parentLabel);
      for (const child of component.getChildren()) {
        setParentContextRecursive(child, component.getLabel());
      }
    };
    
    for (const root of roots) {
      setParentContextRecursive(root, 'main content');
    }
    console.log('✓ Component context set\n');

    // Step 5: Run accessibility services
    console.log('⏳ Running accessibility services...');
    const srService = new ScreenReaderService();
    const kbNav = new KeyboardNavigator();
    const auditor = new AuditService();

    const readingOrder = srService.generateReadingOrder(roots);
    const tabOrder = kbNav.buildTabOrder(roots);
    const auditResult = auditor.runAudit(roots);
    const wcagReport = auditor.generateReport(auditResult);
    
    console.log('✓ Accessibility analysis complete\n');

    // Compile results
    const results = {
      metadata: {
        fileKey: config.fileKey,
        timestamp: new Date().toISOString(),
        componentCount: roots.length,
        errorCount: tree.getErrors().length
      },
      wcagReport,
      screenReaderOutput: readingOrder,
      keyboardTabOrder: tabOrder,
      auditResults: {
        passed: auditResult.passed,
        failed: auditResult.failed,
        byLevel: auditResult.byLevel
      },
      parseErrors: tree.getErrors()
    };

    // Print summary to console
    printSummary(results);

    // Generate reports
    if (generateJSON || (!generateHTML && !generateJSON)) {
      await saveJSONReport(results);
    }
    
    if (generateHTML) {
      await saveHTMLReport(results);
    }

    console.log('\n✅ Audit complete!\n');
    
    // Exit with error code if critical issues found
    if (auditResult.byLevel.A.failed > 0) {
      console.error('⚠️  WCAG Level A failures detected (legal compliance risk)');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ Audit failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// ---- Helper Functions ----

function printSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('ACCESSIBILITY AUDIT SUMMARY');
  console.log('='.repeat(60) + '\n');
  
  console.log(`Components Analyzed: ${results.metadata.componentCount}`);
  console.log(`Parse Errors: ${results.metadata.errorCount}\n`);
  
  const { byLevel } = results.auditResults;
  
  console.log('WCAG 2.2 Compliance:');
  console.log(`  Level A   (Critical):   ${byLevel.A.passed}/${byLevel.A.passed + byLevel.A.failed} passed`);
  console.log(`  Level AA  (Important):  ${byLevel.AA.passed}/${byLevel.AA.passed + byLevel.AA.failed} passed`);
  console.log(`  Level AAA (Best):       ${byLevel.AAA.passed}/${byLevel.AAA.passed + byLevel.AAA.failed} passed\n`);
  
  if (byLevel.A.failed > 0) {
    console.log('⚠️  CRITICAL: Level A failures must be fixed for legal compliance');
  } else if (byLevel.AA.failed > 0) {
    console.log('⚠️  WARNING: Level AA failures affect usability');
  } else if (byLevel.AAA.failed > 0) {
    console.log('ℹ️  INFO: Level AAA failures are best practice improvements');
  } else {
    console.log('🎉 PERFECT: WCAG 2.2 Level AAA Compliant!');
  }
  
  console.log('\n' + '='.repeat(60));
}

async function saveJSONReport(results) {
  const filePath = path.join(config.outputDir, 'audit-report.json');
  
  try {
    fs.writeFileSync(filePath, JSON.stringify(results, null, 2), 'utf8');
    console.log(`\n📄 JSON report saved: ${filePath}`);
  } catch (err) {
    console.error(`❌ Failed to save JSON report: ${err.message}`);
  }
}

async function saveHTMLReport(results) {
  const filePath = path.join(config.outputDir, 'audit-report.html');
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Figma Accessibility Audit Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      background: #f5f5f5;
    }
    header {
      background: #fff;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }
    h1 { color: #1a1a1a; margin-bottom: 0.5rem; }
    .meta { color: #666; font-size: 0.9rem; }
    .section {
      background: #fff;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }
    h2 {
      color: #1a1a1a;
      margin-bottom: 1rem;
      border-bottom: 2px solid #007aff;
      padding-bottom: 0.5rem;
    }
    .wcag-summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .wcag-card {
      background: #f9f9f9;
      padding: 1.5rem;
      border-radius: 4px;
      border-left: 4px solid #007aff;
    }
    .wcag-card.critical { border-left-color: #ff3b30; }
    .wcag-card.important { border-left-color: #ff9500; }
    .wcag-card.best { border-left-color: #34c759; }
    .wcag-card h3 { font-size: 0.875rem; color: #666; margin-bottom: 0.5rem; }
    .wcag-card .score {
      font-size: 2rem;
      font-weight: bold;
      color: #1a1a1a;
    }
    .issue-list {
      list-style: none;
      margin-top: 1rem;
    }
    .issue-list li {
      background: #fff3cd;
      border-left: 4px solid #ff9500;
      padding: 1rem;
      margin-bottom: 0.5rem;
      border-radius: 4px;
    }
    .issue-list li.error {
      background: #ffe6e6;
      border-left-color: #ff3b30;
    }
    pre {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 0.875rem;
    }
    .sr-output {
      background: #e3f2fd;
      border-left: 4px solid #2196f3;
      padding: 1rem;
      margin-bottom: 0.5rem;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <header>
    <h1>Figma Accessibility Audit Report</h1>
    <div class="meta">
      Generated: ${new Date(results.metadata.timestamp).toLocaleString()}<br>
      File Key: ${results.metadata.fileKey}<br>
      Components Analyzed: ${results.metadata.componentCount}
    </div>
  </header>

  <div class="section">
    <h2>WCAG 2.2 Compliance Summary</h2>
    <div class="wcag-summary">
      <div class="wcag-card critical">
        <h3>Level A (Critical)</h3>
        <div class="score">${results.auditResults.byLevel.A.passed}/${results.auditResults.byLevel.A.passed + results.auditResults.byLevel.A.failed}</div>
        <p>Must pass for legal compliance</p>
      </div>
      <div class="wcag-card important">
        <h3>Level AA (Important)</h3>
        <div class="score">${results.auditResults.byLevel.AA.passed}/${results.auditResults.byLevel.AA.passed + results.auditResults.byLevel.AA.failed}</div>
        <p>Affects usability</p>
      </div>
      <div class="wcag-card best">
        <h3>Level AAA (Best Practice)</h3>
        <div class="score">${results.auditResults.byLevel.AAA.passed}/${results.auditResults.byLevel.AAA.passed + results.auditResults.byLevel.AAA.failed}</div>
        <p>Optimal accessibility</p>
      </div>
    </div>
    <pre>${results.wcagReport}</pre>
  </div>

  <div class="section">
    <h2>Failed Accessibility Checks</h2>
    ${results.auditResults.failed.length === 0 
      ? '<p>✅ No accessibility issues found!</p>'
      : `<ul class="issue-list">
          ${results.auditResults.failed.map(issue => `<li class="error">${issue}</li>`).join('')}
         </ul>`
    }
  </div>

  <div class="section">
    <h2>Screen Reader Output (First 10 Items)</h2>
    ${results.screenReaderOutput.slice(0, 10).map(line => 
      `<div class="sr-output">${line}</div>`
    ).join('')}
    ${results.screenReaderOutput.length > 10 
      ? `<p style="margin-top: 1rem; color: #666;">... and ${results.screenReaderOutput.length - 10} more items</p>`
      : ''
    }
  </div>

  <div class="section">
    <h2>Parse Errors</h2>
    ${results.parseErrors.length === 0
      ? '<p>✅ No parse errors</p>'
      : `<ul class="issue-list">
          ${results.parseErrors.map(err => `<li>[${err.nodeId}] ${err.message}</li>`).join('')}
         </ul>`
    }
  </div>
</body>
</html>
  `;

  try {
    fs.writeFileSync(filePath, html, 'utf8');
    console.log(`📄 HTML report saved: ${filePath}`);
  } catch (err) {
    console.error(`❌ Failed to save HTML report: ${err.message}`);
  }
}

// ---- Execute ----
runAudit();