// ============================================================
// src/api/figmaClient.js
// Handles all communication with the Figma REST API.
// Analogy: this is the "lexer" — it reads raw source (Figma nodes)
// before the parser (SemanticTree) gives them meaning.
// ============================================================

const FIGMA_BASE_URL = "https://api.figma.com/v1";

export class FigmaClient {
  /**
   * @param {string} token - Figma Personal Access Token
   */
  constructor(token) {
    if (!token) throw new TypeError("FigmaClient requires a Personal Access Token.");
    this._token = token;
  }

  /**
   * Fetches the full file node tree from Figma.
   * @param {string} fileKey
   * @returns {Promise<object>} Raw Figma file JSON
   */
  async fetchFile(fileKey) {
    if (!fileKey) throw new TypeError("fetchFile requires a file key.");

    const url = `${FIGMA_BASE_URL}/files/${fileKey}`;
    let response;

    try {
      response = await fetch(url, {
        headers: { "X-Figma-Token": this._token }
      });
    } catch (networkErr) {
      // Network-level failure (offline, DNS, CORS)
      throw new Error(`Network error reaching Figma API: ${networkErr.message}`);
    }

    if (response.status === 403) {
      throw new Error("Figma API: Invalid or expired token. Check your Personal Access Token.");
    }
    if (response.status === 404) {
      throw new Error(`Figma API: File not found. Check the file key: "${fileKey}".`);
    }
    if (!response.ok) {
      throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
    }

    try {
      return await response.json();
    } catch (parseErr) {
      throw new Error(`Failed to parse Figma API response: ${parseErr.message}`);
    }
  }

  /**
   * Extracts the top-level children from a Figma file response.
   * @param {object} fileData - Raw response from fetchFile()
   * @returns {Array} Array of top-level Figma nodes
   */
  extractNodes(fileData) {
    try {
      return fileData?.document?.children ?? [];
    } catch (e) {
      throw new Error("Malformed Figma file data: could not extract nodes.");
    }
  }
}


