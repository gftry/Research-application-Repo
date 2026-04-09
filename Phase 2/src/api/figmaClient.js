// ============================================================
// src/api/figmaClient.js
// Enhanced with: geometry data, component metadata, rate limiting
// ============================================================

const FIGMA_BASE_URL = "https://api.figma.com/v1";

export class FigmaClient {
  constructor(token) {
    if (!token) throw new TypeError("FigmaClient requires a Personal Access Token.");
    this._token = token;
    
    // Rate limiting tracking
    this._requestCount = 0;
    this._lastResetTime = Date.now();
    this._RATE_LIMIT = 50; // Conservative limit for Personal Access Tokens
  }

  /**
   * Fetches file with geometry data for positional context.
   * Critical for blind users: "button in top-right" vs "button in middle"
   */
  async fetchFile(fileKey, includeGeometry = true) {
    if (!fileKey) throw new TypeError("fetchFile requires a file key.");

    // Build URL with geometry parameter for bounding boxes
    let url = `${FIGMA_BASE_URL}/files/${fileKey}`;
    if (includeGeometry) {
      url += "?geometry=paths"; // Returns absoluteBoundingBox for each node
    }

    const response = await this._throttledFetch(url, {
      headers: { "X-Figma-Token": this._token }
    });

    if (response.status === 403) {
      throw new Error("Figma API: Invalid or expired token. Check your Personal Access Token.");
    }
    if (response.status === 404) {
      throw new Error(`Figma API: File not found. Check the file key: "${fileKey}".`);
    }
    if (response.status === 429) {
      throw new Error("Figma API: Rate limit exceeded. Wait 60 seconds and try again.");
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
   * Rate-limited fetch to prevent API quota exhaustion.
   */
  async _throttledFetch(url, options) {
    const now = Date.now();
    const elapsedMinutes = (now - this._lastResetTime) / 60000;

    if (elapsedMinutes >= 1) {
      this._requestCount = 0;
      this._lastResetTime = now;
    }

    if (this._requestCount >= this._RATE_LIMIT) {
      const waitTime = 60000 - (now - this._lastResetTime);
      throw new Error(`Rate limit reached. Retry in ${Math.ceil(waitTime/1000)} seconds.`);
    }

    this._requestCount++;
    
    try {
      return await fetch(url, options);
    } catch (networkErr) {
      throw new Error(`Network error reaching Figma API: ${networkErr.message}`);
    }
  }

  /**
   * Extracts top-level page children from Figma file.
   * Returns nodes with their full metadata including type, bounds, styles.
   */
  extractNodes(fileData) {
    try {
      // Figma structure: document.children are CANVAS (page) nodes
      // Each canvas has children which are the actual frames/components
      const pages = fileData?.document?.children ?? [];
      
      // Flatten all page children into single array for parsing
      const allNodes = [];
      for (const page of pages) {
        if (page.children) {
          allNodes.push(...page.children);
        }
      }
      
      return allNodes;
    } catch (e) {
      throw new Error("Malformed Figma file data: could not extract nodes.");
    }
  }

  /**
   * Extracts component metadata map for semantic inference.
   * Components in Figma can have descriptions that contain accessibility hints.
   */
  extractComponentMetadata(fileData) {
    try {
      const components = fileData?.components ?? {};
      const componentMap = {};
      
      for (const [nodeId, metadata] of Object.entries(components)) {
        componentMap[nodeId] = {
          key: metadata.key,
          name: metadata.name,
          description: metadata.description || "",
          // Infer semantic role from component name/description
          semanticRole: this._inferSemanticRole(metadata)
        };
      }
      
      return componentMap;
    } catch (e) {
      console.warn("Failed to extract component metadata:", e);
      return {};
    }
  }

  /**
   * Infers ARIA role from Figma component metadata.
   * Uses common design system naming conventions.
   */
  _inferSemanticRole(metadata) {
    const text = `${metadata.name} ${metadata.description}`.toLowerCase();
    
    // Common button patterns
    if (text.match(/button|btn|cta|action|submit|cancel/)) return "button";
    
    // Form input patterns
    if (text.match(/input|field|textbox|textarea/)) return "textbox";
    
    // Navigation patterns
    if (text.match(/nav|menu|sidebar|header/)) return "navigation";
    
    // Heading patterns
    if (text.match(/heading|title|h[1-6]/)) return "heading";
    
    // Link patterns
    if (text.match(/link|anchor|hyperlink/)) return "link";
    
    return "generic"; // Fallback
  }

  /**
   * Fetches image URLs for nodes with image fills.
   * Critical for alt text generation and image accessibility.
   */
  async fetchImages(fileKey, nodeIds) {
    if (!nodeIds || nodeIds.length === 0) return {};

    const url = `${FIGMA_BASE_URL}/images/${fileKey}?ids=${nodeIds.join(",")}`;
    
    const response = await this._throttledFetch(url, {
      headers: { "X-Figma-Token": this._token }
    });

    if (!response.ok) {
      console.warn(`Failed to fetch images: ${response.status}`);
      return {};
    }

    try {
      const data = await response.json();
      return data.images || {};
    } catch (e) {
      console.warn("Failed to parse image response:", e);
      return {};
    }
  }
}