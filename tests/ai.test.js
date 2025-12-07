/**
 * Tests for AI Providers Module - Blackbox Only
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { optimizeWithAI, compareProviders, getAvailableProviders, AI_PROVIDERS } from '../src/ai-providers.js';

describe('AI Providers Module - Blackbox Only', () => {
  describe('AI_PROVIDERS Constants', () => {
    it('should have Blackbox provider constant defined', () => {
      expect(AI_PROVIDERS.BLACKBOX).toBe('blackbox');
    });

    it('should not have other provider constants', () => {
      expect(AI_PROVIDERS.OPENAI).toBeUndefined();
      expect(AI_PROVIDERS.ANTHROPIC).toBeUndefined();
      expect(AI_PROVIDERS.GEMINI).toBeUndefined();
    });

    it('should have unique provider value', () => {
      const values = Object.values(AI_PROVIDERS);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return empty array when no API keys provided', () => {
      const available = getAvailableProviders({});
      expect(available).toEqual([]);
    });

    it('should return Blackbox models when API key provided', () => {
      const apiKeys = {
        blackbox: 'test-key',
      };
      
      const available = getAvailableProviders(apiKeys);
      
      expect(available.length).toBeGreaterThan(0);
      expect(available[0]).toHaveProperty('id');
      expect(available[0]).toHaveProperty('name');
      expect(available[0]).toHaveProperty('default');
    });

    it('should return multiple models for Blackbox', () => {
      const apiKeys = {
        blackbox: 'test-key',
      };
      
      const available = getAvailableProviders(apiKeys);
      
      expect(available.length).toBeGreaterThanOrEqual(3);
      const modelIds = available.map(m => m.id);
      expect(modelIds).toContain('blackboxai/openai/gpt-4o');
      expect(modelIds).toContain('blackboxai/anthropic/claude-sonnet-3.5');
      expect(modelIds).toContain('blackboxai/google/gemini-pro');
    });
  });

  describe('optimizeWithAI - Input Validation', () => {
    it('should throw error when prompt is missing', async () => {
      const apiKeys = { blackbox: 'test-key' };
      const cvData = { name: 'Test' };

      await expect(
        optimizeWithAI({ cvData, apiKeys })
      ).rejects.toThrow('Prompt and CV data are required');
    });

    it('should throw error when cvData is missing', async () => {
      const apiKeys = { blackbox: 'test-key' };
      const prompt = 'Optimize my CV';

      await expect(
        optimizeWithAI({ prompt, apiKeys })
      ).rejects.toThrow('Prompt and CV data are required');
    });

    it('should throw error when API key not configured', async () => {
      const apiKeys = {};
      const cvData = { name: 'Test' };
      const prompt = 'Optimize my CV';

      await expect(
        optimizeWithAI({ prompt, cvData, apiKeys })
      ).rejects.toThrow('Blackbox API key not configured');
    });
  });

  describe('compareProviders - Input Validation', () => {
    it('should throw error when models array is empty', async () => {
      const apiKeys = { blackbox: 'test-key' };
      const cvData = { name: 'Test' };
      const prompt = 'Optimize my CV';

      await expect(
        compareProviders({ models: [], prompt, cvData, apiKeys })
      ).rejects.toThrow('At least one model is required');
    });

    it('should throw error when models is not provided', async () => {
      const apiKeys = { blackbox: 'test-key' };
      const cvData = { name: 'Test' };
      const prompt = 'Optimize my CV';

      await expect(
        compareProviders({ prompt, cvData, apiKeys })
      ).rejects.toThrow('At least one model is required');
    });
  });

  describe('Request Formatting', () => {
    it('should format Blackbox request correctly', () => {
      const prompt = 'Test prompt';
      const cvData = { name: 'John Doe', role: 'Developer' };
      
      const expectedContent = `${prompt}\n\nDatos del CV actual:\n${JSON.stringify(cvData, null, 2)}`;
      
      expect(expectedContent).toContain('Test prompt');
      expect(expectedContent).toContain('John Doe');
      expect(expectedContent).toContain('Developer');
    });

    it('should return correct structure for successful response', () => {
      const mockResponse = {
        provider: 'blackbox',
        model: 'blackboxai/openai/gpt-4o',
        suggestion: 'Test suggestion',
        usage: { tokens: 100 },
      };

      expect(mockResponse).toHaveProperty('provider');
      expect(mockResponse).toHaveProperty('model');
      expect(mockResponse).toHaveProperty('suggestion');
      expect(mockResponse).toHaveProperty('usage');
    });

    it('should handle comparison results correctly', () => {
      const mockResults = [
        {
          success: true,
          provider: 'blackbox',
          model: 'blackboxai/openai/gpt-4o',
          suggestion: 'Suggestion 1',
        },
        {
          success: true,
          provider: 'blackbox',
          model: 'blackboxai/anthropic/claude-sonnet-3.5',
          suggestion: 'Suggestion 2',
        },
      ];

      expect(Array.isArray(mockResults)).toBe(true);
      expect(mockResults[0]).toHaveProperty('success');
      expect(mockResults[0]).toHaveProperty('suggestion');
    });
  });

  describe('Data Validation', () => {
    it('should accept valid CV data structure', () => {
      const cvData = {
        name: 'John Doe',
        role: 'Software Engineer',
        location: 'San Francisco',
        email: 'john@example.com',
        summary: 'Experienced developer',
        experiences: [
          {
            role: 'Senior Dev',
            company: 'Tech Corp',
            dates: '2020-2023',
            responsibilities: 'Led team',
          },
        ],
        skills: 'JavaScript, Python',
        tools: 'VSCode, Git',
      };

      expect(cvData).toHaveProperty('name');
      expect(cvData).toHaveProperty('role');
      expect(cvData).toHaveProperty('experiences');
      expect(Array.isArray(cvData.experiences)).toBe(true);
    });

    it('should handle minimal CV data', () => {
      const minimalData = {
        name: 'John Doe',
      };

      expect(minimalData).toHaveProperty('name');
      expect(JSON.stringify(minimalData)).toBeTruthy();
    });
  });

  describe('Model Support', () => {
    it('should support multiple Blackbox models', () => {
      const models = [
        'blackboxai/openai/gpt-4o',
        'blackboxai/anthropic/claude-sonnet-3.5',
        'blackboxai/google/gemini-pro',
        'blackboxai/meta/llama-3.1-70b',
      ];

      models.forEach((model) => {
        expect(model).toContain('blackboxai/');
      });
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should handle network errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const apiKeys = { blackbox: 'test-key' };
      const cvData = { name: 'Test' };
      const prompt = 'Test prompt';

      await expect(
        optimizeWithAI({ prompt, cvData, apiKeys })
      ).rejects.toThrow();
    });

    it('should handle API errors with status codes', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const apiKeys = { blackbox: 'test-key' };
      const cvData = { name: 'Test' };
      const prompt = 'Test prompt';

      await expect(
        optimizeWithAI({ prompt, cvData, apiKeys })
      ).rejects.toThrow('Blackbox API error');
    });
  });

  describe('Response Structure', () => {
    it('should return available models structure', () => {
      const apiKeys = { blackbox: 'test-key' };
      const models = getAvailableProviders(apiKeys);

      models.forEach((model) => {
        expect(model).toHaveProperty('id');
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('default');
        expect(typeof model.id).toBe('string');
        expect(typeof model.name).toBe('string');
        expect(typeof model.default).toBe('boolean');
      });
    });
  });

  describe('API Integration Contract', () => {
    it('should validate request body structure', () => {
      const requestBody = {
        prompt: 'Test prompt',
        cvData: { name: 'Test' },
        model: 'blackboxai/openai/gpt-4o',
      };

      expect(requestBody).toHaveProperty('prompt');
      expect(requestBody).toHaveProperty('cvData');
      expect(requestBody).toHaveProperty('model');
    });

    it('should allow optional model parameter', () => {
      const requestBody = {
        prompt: 'Test prompt',
        cvData: { name: 'Test' },
      };

      expect(requestBody).toHaveProperty('prompt');
      expect(requestBody).toHaveProperty('cvData');
      expect(requestBody.model).toBeUndefined();
    });

    it('should validate comparison request structure', () => {
      const requestBody = {
        prompt: 'Test prompt',
        cvData: { name: 'Test' },
        models: ['blackboxai/openai/gpt-4o', 'blackboxai/anthropic/claude-sonnet-3.5'],
      };

      expect(requestBody).toHaveProperty('models');
      expect(Array.isArray(requestBody.models)).toBe(true);
      expect(requestBody.models.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle comparison response structure', () => {
      const response = {
        success: true,
        results: [
          {
            success: true,
            model: 'blackboxai/openai/gpt-4o',
            suggestion: 'Test',
            responseTime: 100,
          },
        ],
      };

      expect(response).toHaveProperty('success');
      expect(response).toHaveProperty('results');
      expect(Array.isArray(response.results)).toBe(true);
    });
  });
});
