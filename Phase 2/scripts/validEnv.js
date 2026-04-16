#!/usr/bin/env node

// ============================================================
// scripts/validEnv.js
// Validates .env file before running audits
// ============================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Check if .env exists
const envPath = path.join(projectRoot, '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found');
  console.error('\n💡 Run: npm run setup');
  process.exit(1);
}

// Load environment variables
dotenv.config({ path: envPath });

// Validation rules
const validations = [
  {
    name: 'FIGMA_PERSONAL_ACCESS_TOKEN',
    required: true,
    validate: (val) => {
      if (!val || val === 'your-token-here') {
        return 'Invalid token. Get from: https://www.figma.com/settings';
      }
      if (val.length < 20) {
        return 'Token seems too short. Check your Figma settings.';
      }
      return null;
    }
  },
  {
    name: 'FIGMA_FILE_KEY',
    required: true,
    validate: (val) => {
      if (!val || val === 'your-file-key-here') {
        return 'Invalid file key. Extract from Figma file URL.';
      }
      if (val.length < 10) {
        return 'File key seems too short.';
      }
      return null;
    }
  },
  {
    name: 'EXTENSION_NAME',
    required: true,
    validate: (val) => {
      if (!val || val.length < 5) {
        return 'Extension name must be at least 5 characters';
      }
      return null;
    }
  },
  {
    name: 'EXTENSION_VERSION',
    required: true,
    validate: (val) => {
      if (!val || !/^\d+\.\d+\.\d+$/.test(val)) {
        return 'Version must follow semver format (e.g., 0.2.0)';
      }
      return null;
    }
  },
  {
    name: 'EXTENSION_DESCRIPTION',
    required: true,
    validate: (val) => {
      if (!val || val.length < 10) {
        return 'Description must be at least 10 characters';
      }
      return null;
    }
  }
];

// Run validations
let hasErrors = false;

console.log('🔍 Validating .env configuration...\n');

for (const rule of validations) {
  const value = process.env[rule.name];
  
  if (rule.required && !value) {
    console.error(`❌ ${rule.name}: Missing (required)`);
    hasErrors = true;
    continue;
  }
  
  if (rule.validate) {
    const error = rule.validate(value);
    if (error) {
      console.error(`❌ ${rule.name}: ${error}`);
      hasErrors = true;
    } else {
      console.log(`✓ ${rule.name}`);
    }
  }
}

console.log('');

if (hasErrors) {
  console.error('❌ Validation failed. Fix the errors above.\n');
  process.exit(1);
} else {
  console.log('✅ All validations passed!\n');
  process.exit(0);
}