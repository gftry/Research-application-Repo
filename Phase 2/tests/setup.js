// ============================================================
// tests/setup.js
// Global test setup and mocks
// ============================================================

import { jest } from '@jest/globals';

// Mock fetch for Figma API calls
global.fetch = jest.fn();

// Mock Figma API response
export const mockFigmaResponse = {
  document: {
    id: 'doc-1',
    type: 'DOCUMENT',
    children: [
      {
        id: 'page-1',
        type: 'CANVAS',
        name: 'Page 1',
        children: [
          {
            id: 'frame-1',
            type: 'FRAME',
            name: 'Login Form',
            children: [
              {
                id: 'rect-1',
                type: 'RECTANGLE',
                name: 'Submit Button',
                children: [
                  {
                    id: 'text-1',
                    type: 'TEXT',
                    characters: 'Submit',
                    name: 'Submit Text'
                  }
                ],
                absoluteBoundingBox: { x: 100, y: 300, width: 120, height: 40 }
              },
              {
                id: 'rect-2',
                type: 'RECTANGLE',
                name: 'Email Input',
                children: [
                  {
                    id: 'text-2',
                    type: 'TEXT',
                    characters: 'Email',
                    name: 'Email Label'
                  }
                ],
                absoluteBoundingBox: { x: 100, y: 200, width: 250, height: 36 }
              }
            ],
            absoluteBoundingBox: { x: 50, y: 150, width: 350, height: 250 }
          }
        ]
      }
    ]
  },
  components: {},
  schemaVersion: 0,
  styles: {},
  name: 'Test File',
  lastModified: '2026-01-01T00:00:00Z',
  thumbnailUrl: 'https://example.com/thumb.png',
  version: '1',
  role: 'owner',
  editorType: 'figma',
  linkAccess: 'view'
};

// Setup fetch mock to return mock data
beforeEach(() => {
  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => mockFigmaResponse
  });
});

afterEach(() => {
  global.fetch.mockClear();
});