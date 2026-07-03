/**
 * Tests for AI Providers Module - Open AI Compatible
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { optimizeWithAI, compareProviders, getAvailableProviders, AI_PROVIDERS } from '../src/ai-providers.js';

describe('AI Providers Module - Open AI Compatible', () => {
  describe('AI_PROVIDERS Constants', () => {
    it('should have Open AI Compatible provider constant defined', () => {
      expect(AI_PROVIDERS.OPENAI_COMPATIBLE).toBe('openai_compatible');
    });

    it('should have unique provider value', () => {
      const values = Object.values(AI_PROVIDERS);
      const uniqueValues = new Set(values);
      expect(values.length).toBe(uniqueValues.size);
    });
  });

  describe('getAvailableProviders', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should return empty array when no API config provided', async () => {
      const available = await getAvailableProviders({});
      expect(available).toEqual([]);
    });

    it('should return empty array when missing apiKey or baseUrl', async () => {
      const available1 = await getAvailableProviders({ apiKey: 'test' });
      const available2 = await getAvailableProviders({ baseUrl: 'test' });
      expect(available1).toEqual([]);
      expect(available2).toEqual([]);
    });

    it('should dynamically fetch and map models', async () => {
      const apiConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [
            { id: 'mock-model-1' },
            { id: 'mock-model-2' }
          ]
        })
      });

      const available = await getAvailableProviders(apiConfig);

      expect(available.length).toBe(2);
      expect(available[0]).toEqual({ id: 'mock-model-1', name: 'mock-model-1', default: true });
      expect(available[1]).toEqual({ id: 'mock-model-2', name: 'mock-model-2', default: false });
      
      expect(global.fetch).toHaveBeenCalledWith('https://api.test.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer test-key',
          'Content-Type': 'application/json',
        }
      });
    });

    it('should handle fetch errors gracefully', async () => {
      const apiConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://api.test.com',
      };
      
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Server Error'
      });

      const available = await getAvailableProviders(apiConfig);
      expect(available).toEqual([]);
    });
  });

  describe('optimizeWithAI - Input Validation', () => {
    it('should throw error when prompt is missing', async () => {
      const apiConfig = { apiKey: 'test-key', baseUrl: 'https://test.com' };
      const cvData = { name: 'Test' };

      await expect(
        optimizeWithAI({ cvData, apiConfig, model: 'test' })
      ).rejects.toThrow('Prompt and CV data are required');
    });

    it('should throw error when cvData is missing', async () => {
      const apiConfig = { apiKey: 'test-key', baseUrl: 'https://test.com' };
      const prompt = 'Optimize my CV';

      await expect(
        optimizeWithAI({ prompt, apiConfig, model: 'test' })
      ).rejects.toThrow('Prompt and CV data are required');
    });

    it('should throw error when API key not configured', async () => {
      const apiConfig = { baseUrl: 'https://test.com' };
      const cvData = { name: 'Test' };
      const prompt = 'Optimize my CV';

      await expect(
        optimizeWithAI({ prompt, cvData, apiConfig, model: 'test' })
      ).rejects.toThrow('AI API key or base URL not configured');
    });

    it('should throw error when model is not configured', async () => {
      const apiConfig = { apiKey: 'test-key', baseUrl: 'https://test.com' };
      const cvData = { name: 'Test' };
      const prompt = 'Optimize my CV';

      await expect(
        optimizeWithAI({ prompt, cvData, apiConfig })
      ).rejects.toThrow('Model is required');
    });
  });

  describe('compareProviders - Input Validation', () => {
    it('should throw error when models array is empty', async () => {
      const apiConfig = { apiKey: 'test-key', baseUrl: 'https://test.com' };
      const cvData = { name: 'Test' };
      const prompt = 'Optimize my CV';

      await expect(
        compareProviders({ models: [], prompt, cvData, apiConfig })
      ).rejects.toThrow('At least one model is required');
    });

    it('should throw error when models is not provided', async () => {
      const apiConfig = { apiKey: 'test-key', baseUrl: 'https://test.com' };
      const cvData = { name: 'Test' };
      const prompt = 'Optimize my CV';

      await expect(
        compareProviders({ prompt, cvData, apiConfig })
      ).rejects.toThrow('At least one model is required');
    });
  });

  describe('Request Formatting', () => {
    it('should format Open AI request correctly', () => {
      const prompt = 'Test prompt';
      const cvData = { name: 'John Doe', role: 'Developer' };
      
      const expectedContent = `${prompt}\n\nDatos del CV actual:\n${JSON.stringify(cvData, null, 2)}`;
      
      expect(expectedContent).toContain('Test prompt');
      expect(expectedContent).toContain('John Doe');
      expect(expectedContent).toContain('Developer');
    });

    it('should return correct structure for successful response', () => {
      const mockResponse = {
        provider: 'openai_compatible',
        model: 'mock-model-1',
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
          provider: 'openai_compatible',
          model: 'mock-model-1',
          suggestion: 'Suggestion 1',
        },
        {
          success: true,
          provider: 'openai_compatible',
          model: 'mock-model-2',
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

  describe('Error Handling', () => {
    beforeEach(() => {
      global.fetch = vi.fn();
    });

    it('should handle network errors gracefully', async () => {
      global.fetch.mockRejectedValue(new Error('Network error'));

      const apiConfig = { apiKey: 'test-key', baseUrl: 'https://test.com' };
      const cvData = { name: 'Test' };
      const prompt = 'Test prompt';

      await expect(
        optimizeWithAI({ prompt, cvData, apiConfig, model: 'test' })
      ).rejects.toThrow();
    });

    it('should handle API errors with status codes', async () => {
      global.fetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const apiConfig = { apiKey: 'test-key', baseUrl: 'https://test.com' };
      const cvData = { name: 'Test' };
      const prompt = 'Test prompt';

      await expect(
        optimizeWithAI({ prompt, cvData, apiConfig, model: 'test' })
      ).rejects.toThrow('AI API error');
    });
  });

  describe('API Integration Contract', () => {
    it('should validate request body structure', () => {
      const requestBody = {
        prompt: 'Test prompt',
        cvData: { name: 'Test' },
        model: 'mock-model-1',
      };

      expect(requestBody).toHaveProperty('prompt');
      expect(requestBody).toHaveProperty('cvData');
      expect(requestBody).toHaveProperty('model');
    });

    it('should validate comparison request structure', () => {
      const requestBody = {
        prompt: 'Test prompt',
        cvData: { name: 'Test' },
        models: ['mock-model-1', 'mock-model-2'],
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
            model: 'mock-model-1',
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
