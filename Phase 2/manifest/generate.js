#!/usr/bin/env node

// ============================================================
// config/generate.js
// Generates manifest.json from .env configuration
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Load environment variables
dotenv.config({ path: path.join(projectRoot, '.env') });

// Validate required environment variables
const requiredVars = ['EXTENSION_NAME', 'EXTENSION_VERSION', 'EXTENSION_DESCRIPTION'];
const missing = requiredVars.filter(varName => !process.env[varName]);

if (missing.length > 0) {
  console.error('❌ Error: Missing required environment variables:');
  missing.forEach(varName => console.error(`   - ${varName}`));
  console.error('\n💡 Copy .env.example to .env and fill in the values.');
  process.exit(1);
}

// Generate manifest
const manifest = {
  manifest_version: 3,
  name: process.env.EXTENSION_NAME,
  version: process.env.EXTENSION_VERSION,
  description: process.env.EXTENSION_DESCRIPTION,
  permissions: ["activeTab", "storage"],
  host_permissions: ["https://api.figma.com/*"],
  action: {
    default_popup: "popup.html",
    default_title: process.env.EXTENSION_NAME
  },
  icons: {
    16: "icons/icon-16.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png"
  },
  // Accessibility-specific metadata
  // Chrome extension best practices for screen readers
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'"
  }
};

// Write manifest.json
const manifestPath = path.join(projectRoot, 'manifest.json');

try {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log('✓ Generated manifest.json');
  console.log(`  Name: ${manifest.name}`);
  console.log(`  Version: ${manifest.version}`);
} catch (err) {
  console.error('❌ Failed to write manifest.json:', err.message);
  process.exit(1);
}