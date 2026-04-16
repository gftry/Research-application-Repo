// ============================================================
// tests/int.test.js
// Full workflow integration tests
// ============================================================

import { describe, test, expect } from '@jest/globals';
import { FigmaClient } from '../src/api/figmaClient.js';
import { SemanticTree } from '../src/semantic/SemanticTree.js';
import { AuditService } from '../src/accessibility/AuditService.js';
import { mockFigmaResponse } from './setup.js';

describe('Integration: Full Audit Workflow', () => {
  
  test('complete workflow from API to audit report', async () => {
    // Step 1: Fetch from Figma
    const client = new FigmaClient('test-token');
    const fileData = await client.fetchFile('test-file-key');
    
    expect(fileData).toEqual(mockFigmaResponse);
    
    // Step 2: Extract nodes
    const nodes = client.extractNodes(fileData);
    expect(nodes.length).toBeGreaterThan(0);
    
    // Step 3: Extract component metadata
    const metadata = client.extractComponentMetadata(fileData);
    expect(metadata).toBeDefined();
    
    // Step 4: Build semantic tree
    const tree = new SemanticTree(metadata);
    tree.build(nodes);
    
    const roots = tree.getRoots();
    expect(roots.length).toBeGreaterThan(0);
    
    // Step 5: Run audit
    const auditor = new AuditService();
    const results = auditor.runAudit(roots);
    
    expect(results).toHaveProperty('passed');
    expect(results).toHaveProperty('failed');
    expect(results).toHaveProperty('byLevel');
    
    // Step 6: Generate report
    const report = auditor.generateReport(results);
    expect(report).toContain('WCAG');
  });

  test('detects button from RECTANGLE + TEXT structure', async () => {
    const client = new FigmaClient('test-token');
    const fileData = await client.fetchFile('test-key');
    const nodes = client.extractNodes(fileData);
    
    const tree = new SemanticTree({});
    tree.build(nodes);
    
    const roots = tree.getRoots();
    
    // Should find the Login Form frame with button and input inside
    expect(roots.length).toBeGreaterThan(0);
    
    // Find the button component
    const findButton = (components) => {
      for (const comp of components) {
        if (comp.getRole() === 'button') return comp;
        const found = findButton(comp.getChildren());
        if (found) return found;
      }
      return null;
    };
    
    const button = findButton(roots);
    expect(button).not.toBeNull();
    expect(button.getLabel()).toBe('Submit');
  });

  test('WCAG Level A compliance check', async () => {
    const client = new FigmaClient('test-token');
    const fileData = await client.fetchFile('test-key');
    const nodes = client.extractNodes(fileData);
    
    const tree = new SemanticTree({});
    tree.build(nodes);
    
    const auditor = new AuditService();
    const results = auditor.runAudit(tree.getRoots());
    
    // Check Level A compliance
    const levelA = results.byLevel.A;
    expect(levelA).toHaveProperty('passed');
    expect(levelA).toHaveProperty('failed');
    
    // At minimum, should have some Level A checks run
    const totalA = levelA.passed + levelA.failed;
    expect(totalA).toBeGreaterThan(0);
  });

  test('handles rate limiting', async () => {
    const client = new FigmaClient('test-token');
    
    // Make 51 requests to trigger rate limit
    const requests = [];
    for (let i = 0; i < 51; i++) {
      requests.push(client.fetchFile('test-key').catch(e => e));
    }
    
    const results = await Promise.all(requests);
    
    // At least one should fail with rate limit error
    const rateLimitError = results.find(r => 
      r instanceof Error && r.message.includes('Rate limit')
    );
    
    expect(rateLimitError).toBeDefined();
  });
});

describe('Integration: Error Handling', () => {
  
  test('handles 403 authentication error', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      statusText: 'Forbidden'
    });
    
    const client = new FigmaClient('invalid-token');
    
    await expect(client.fetchFile('test-key'))
      .rejects
      .toThrow('Invalid or expired token');
  });

  test('handles 404 file not found', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    });
    
    const client = new FigmaClient('test-token');
    
    await expect(client.fetchFile('invalid-key'))
      .rejects
      .toThrow('File not found');
  });

  test('handles empty file gracefully', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        document: { id: 'doc-1', type: 'DOCUMENT', children: [] },
        components: {},
        styles: {}
      })
    });
    
    const client = new FigmaClient('test-token');
    const fileData = await client.fetchFile('empty-file');
    const nodes = client.extractNodes(fileData);
    
    const tree = new SemanticTree({});
    tree.build(nodes);
    
    expect(tree.getRoots()).toEqual([]);
    expect(tree.getErrors()).toEqual([]);
  });
});