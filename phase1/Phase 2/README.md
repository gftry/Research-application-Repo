# Semantic Accessibility Extension for Figma

**Research Application Project — Phase 1**

**Repository:** [gftry/Research-application-Repo](https://github.com/gftry/Research-application-Repo)

---

## Project Overview

This project is a prototype browser extension and API integration layer designed to enhance accessibility in UI prototyping tools by introducing a semantic, intent-driven model that works alongside the Figma REST API to act as a semantic and accessibility middleware. The extension extracts structural information from Figma designs and enables screen reader navigation, keyboard-only traversal, and automated accessibility auditing. This prototype will show how accessibility can be embedded earlier in the SDLC during design and prototyping instead of being deferred to testing or development.

---

## Repository Structure

```
/figma-accessibility-extension
│
├── src/
│   ├── api/
│   │   └── figmaClient.js          
# Figma API authentication and communication
│   │
│   ├── core/
│   │   ├── UIComponent.js          
# Abstract base class for all UI components
│   │   ├── Button.js              
# Concrete component — interactive triggers
│   │   ├── InputField.js           
# Concrete component — text entry nodes
│   │   └── NavigationRegion.js     
# Concrete component — navigation landmarks
│   │
│   ├── semantic/
│   │   └── SemanticTree.js         
# Converts Figma nodes into component objects
│   │
│   ├── accessibility/
│   │   ├── ScreenReaderService.js  
# Depth-first reading order output
│   │   ├── KeyboardNavigator.js    
# Focusable element tab-order builder
│   │   └── AuditService.js        
# Rule-based accessibility checks
│   │
│   └── extension/
│       └── popup.js                
# Wires services together AKA extension entry point
│
├── tests/
│   ├── semanticTree.test.js        
# Tests for SemanticTree and core component classes
│   └── accessibility.test.js      
# Tests  ScreenReader, KeyboardNav, AuditService
│
├── docs/
│   └── design-notes.md            
# Architecture decisions and design rationale
│
├── popup.html                      
# Extension popup UI / Live Server entry point
├── manifest.json                   
# Browser extension manifest (Manifest V3)
└── README.md
```

---

## Initialisation

### Prerequisites

Ensure the following are installed before running anything:

- [Node.js](https://nodejs.org) v18 or higher
- [VS Code](https://code.visualstudio.com)
- VS Code extension: **Live Server** (by Ritwick Dey)
- A free [Figma account](https://figma.com) with at least one file created

---

### Step 1 — Clone and Open the Project

```bash
git clone https://github.com/gftry/Research-application-Repo.git
cd Research-application-Repo
code .
```

---

### Step 2 — Get Your Figma Credentials

You need two values before the extension can connect to Figma: Personal Access Token & the File key.

---

### Step 3 — Install Dependencies (for tests only)

The extension itself has no runtime dependencies. Jest is needed for running tests.

```bash
npm init -y
npm install --save-dev jest
```

Then add the following to your `package.json`:

```json
"scripts": {
  "test": "node --experimental-vm-modules node_modules/.bin/jest"
},
"type": "module"
```

---

### Step 4 — Run the Prototype via Live Server

1.  Right-click anywhere in the file → **Open with Live Server**
2. Your browser opens at `http://localhost/popup.html`
3. Paste your **Figma Personal Access Token** into the first field
4. Paste your **Figma File Key** into the second field
5. Click **Run Audit**

---

### Step 5 — Load it as a Browser Extension

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the root folder of this project (where `manifest.json` lives)
5. The extension icon appears in your toolbar
6. Click it to open the popup and follow Step 4 above

---

### Step 6 — Run the Tests

```bash
npm test
```

Expected output:

```
PASS  tests/semanticTree.test.js
PASS  tests/accessibility.test.js

Test Suites: 2 passed, 2 total
Tests:       XX passed, XX total
```

To run a single test file:

```bash
node --experimental-vm-modules node_modules/.bin/jest tests/semanticTree.test.js
```

---

## APIs Used

1. Figma REST API - Fetch design nodes and metadata
2. axe-core - Accessibility auditing engine 
3. Lighthouse - Automated audit pipeline 
4. WAVE API - Accessibility reporting
5. Jest - Unit testing framework

All current dependencies are open-source or publicly available.

---