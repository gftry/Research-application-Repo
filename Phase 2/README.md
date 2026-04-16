# Figma Accessibility Extension

---

##  Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/gftry/Research-application-Repo.git
cd Research-application-Repo
npm run setup

# 2. Add your Figma credentials to .env
# Edit .env and add:
#   FIGMA_PERSONAL_ACCESS_TOKEN=your-token
#   FIGMA_FILE_KEY=your-file-key

# 3. Run your first audit
npm run audit

# 4. View HTML report
open output/audit-report.html
```

---

## Prerequisites

- **Node.js** v18 or higher
- **Figma account** (free) with at least one design file
- **Personal Access Token** from Figma Settings

---

## Installation

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Credentials

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use any text editor
```

**Required .env values:**

```bash
FIGMA_PERSONAL_ACCESS_TOKEN=figd_xxxxxxxxxxxxxxxxxxxx
FIGMA_FILE_KEY=aBcDeFgHiJkLmNoPqRsT
```

**Get your Personal Access Token:**
1. Go to https://www.figma.com/settings
2. Scroll to "Personal Access Tokens"
3. Click "Generate new token"
4. Copy the token (you won't see it again!)

**Get your File Key:**
1. Open any Figma file
2. Look at the URL: `figma.com/file/YOUR_KEY_HERE/file-name`
3. Copy the string between `/file/` and the next `/`

### Step 3: Validate Configuration

```bash
npm run validate
```

If all checks pass, we ait!

---

## Usage

### Run Accessibility Audit

```bash
# Basic audit (prints to console)
npm run audit

# Generate HTML report
npm run audit:html

# Generate JSON report
npm run audit:json

# Generate both reports
npm run audit:all
```

### Generate Extension Manifest

```bash
npm run manifest
```

This creates `manifest.json` from your .env configuration.

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm test:watch

# Generate coverage report
npm test:coverage
```

### Development Mode

```bash
# Generate manifest + start live server
npm run dev
```

Opens popup.html at http://localhost:5500

### Full Build Pipeline

```bash
# Generate manifest + run audit + run tests
npm run build
```

---

## Output Files

All generated files are saved to `output/` (git-ignored):

| File | Description |
|------|-------------|
| `audit-report.json` | Machine-readable audit results |
| `audit-report.html` | Visual WCAG compliance report |
| `wcag-summary.txt` | Plain text summary |

---

## Testing

### Test Structure

```
tests/
├── semanticTree.test.js      # Core component tests
├── accessibility.test.js     # Accessibility service tests
├── integration.test.js       # Full workflow tests
└── setup.js                  # Mock Figma API responses
```

### Run Specific Tests

```bash
# Run only semantic tree tests
npx jest tests/semanticTree.test.js

# Run only integration tests
npx jest tests/integration.test.js
```

### Test Coverage

```bash
npm run test:coverage
```

Target coverage: **80%** for lines, functions, statements

---

## npm Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run setup` | Initial setup (install + create .env) |
| `npm run validate` | Check .env configuration |
| `npm run manifest` | Generate manifest.json |
| `npm run audit` | Run accessibility audit (console output) |
| `npm run audit:html` | Run audit + generate HTML report |
| `npm run audit:json` | Run audit + generate JSON report |
| `npm run audit:all` | Run audit + generate all reports |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run build` | Full build pipeline (manifest + audit + tests) |
| `npm run dev` | Development mode (manifest + live server) |

---

## What Gets Audited

### WCAG 2.2 Compliance Levels

**Level A (Critical — Legal Requirement):**
- All components have accessible labels
- All components declare ARIA roles
- Interactive elements are keyboard focusable

**Level AA (Important — Usability):**
- Focus order is logical
- Labels are descriptive
- Button purposes are clear

**Level AAA (Best Practice — Optimal):**
- Components provide sufficient context
- Consistent identification across similar elements
- Rich positional and hierarchical context

### Screen Reader Output

For each component, the auditor generates announcements like:

```
Button, "Submit" (primary action button) enabled.
Located in bottom-right of "Login Form" region.
Press Enter or Space to activate.
```

---

## Example .env Configuration

```bash
# Figma API Credentials
FIGMA_PERSONAL_ACCESS_TOKEN=figd_1234567890abcdefghijklmnopqrstuvwxyz
FIGMA_FILE_KEY=aBcDeFgHiJkLmNoPqRsTuVwXyZ

# Extension Metadata
EXTENSION_NAME=Figma Accessibility Auditor
EXTENSION_VERSION=0.2.0
EXTENSION_DESCRIPTION=WCAG 2.2 compliance checker for Figma prototypes

# Audit Configuration
INCLUDE_GEOMETRY=true
RATE_LIMIT_REQUESTS_PER_MINUTE=50

# Output Settings
OUTPUT_DIR=./output
GENERATE_HTML_REPORT=true
GENERATE_JSON_REPORT=true
```

---

## Troubleshooting

### "Missing required environment variables"

**Solution:** Run `npm run validate` to check which variables are missing.

### "Figma API: Invalid or expired token"

**Solutions:**
1. Generate a new token at https://www.figma.com/settings
2. Ensure you copied the full token (starts with `figd_`)
3. Check for extra spaces in .env

### "No accessible components detected"

**Causes:**
- File contains only visual elements (no interactive components)
- Components don't follow naming conventions
- File is empty

**Solution:** Add interactive elements (buttons, inputs, navigation) to your Figma file

### "Rate limit exceeded"

**Solution:** Wait 60 seconds, then retry. Reduce `RATE_LIMIT_REQUESTS_PER_MINUTE` in .env.

---

## License

MIT License - see LICENSE file for details

---

## Acknowledgments

Built with accessibility-first principles for blind and visually impaired designers.

WCAG 2.2 guidelines: https://www.w3.org/WAI/WCAG22/quickref/

Screen reader resources:
- https://usabilitygeek.com/10-free-screen-reader-blind-visually-impaired-users/
- https://www.nvaccess.org/ (NVDA screen reader)

---
