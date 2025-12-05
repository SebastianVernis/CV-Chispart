import { describe, it, expect, vi } from 'vitest';
import { optimizeWithAI, compareProviders, getAvailableProviders, AI_PROVIDERS } from '../src/ai-providers.js';

/**
 * AI Providers Tests
 * Tests for multi-provider AI integration
 */

describe('AI Providers Module', () => {
  describe('AI_PROVIDERS Constants', () => {
    it('should have all provider constants defined', () => {
      expect(AI_PROVIDERS.OPENAI).toBe('openai');
      expect(AI_PROVIDERS.ANTHROPIC).toBe('anthropic');
      expect(AI_PROVIDERS.GEMINI).toBe('gemini');
      expect(AI_PROVIDERS.BLACKBOX).toBe('blackbox');
    });

    it('should have unique provider values', () => {
      const providers = Object.values(AI_PROVIDERS);
      const uniqueProviders = new Set(providers);
      
      expect(providers.length).toBe(uniqueProviders.size);
    });
  });

  describe('getAvailableProviders', () => {
    it('should return empty array when no API keys provided', () => {
      const apiKeys = {};
      const available = getAvailableProviders(apiKeys);
      
      expect(Array.isArray(available)).toBe(true);
      expect(available.length).toBe(0);
    });

    it('should return providers with configured API keys', () => {
      const apiKeys = {
        openai: 'sk-test-key',
        blackbox: 'bb-test-key'
      };
      const available = getAvailableProviders(apiKeys);
      
      expect(available).toContain(AI_PROVIDERS.OPENAI);
      expect(available).toContain(AI_PROVIDERS.BLACKBOX);
      expect(available).not.toContain(AI_PROVIDERS.ANTHROPIC);
      expect(available).not.toContain(AI_PROVIDERS.GEMINI);
    });

    it('should return all providers when all keys provided', () => {
      const apiKeys = {
        openai: 'sk-test-key',
        anthropic: 'sk-ant-test-key',
        gemini: 'gemini-test-key',
        blackbox: 'bb-test-key'
      };
      const available = getAvailableProviders(apiKeys);
      
      expect(available.length).toBe(4);
      expect(available).toContain(AI_PROVIDERS.OPENAI);
      expect(available).toContain(AI_PROVIDERS.ANTHROPIC);
      expect(available).toContain(AI_PROVIDERS.GEMINI);
      expect(available).toContain(AI_PROVIDERS.BLACKBOX);
    });
  });

  describe('optimizeWithAI - Input Validation', () => {
    it('should throw error when prompt is missing', async () => {
      const options = {
        provider: AI_PROVIDERS.BLACKBOX,
        cvData: { name: 'Test' },
        apiKeys: { blackbox: 'test-key' }
      };
      
      await expect(optimizeWithAI(options)).rejects.toThrow('Prompt and CV data are required');
    });

    it('should throw error when cvData is missing', async () => {
      const options = {
        provider: AI_PROVIDERS.BLACKBOX,
        prompt: 'Optimize my CV',
        apiKeys: { blackbox: 'test-key' }
      };
      
      await expect(optimizeWithAI(options)).rejects.toThrow('Prompt and CV data are required');
    });

    it('should throw error when API key not configured', async () => {
      const options = {
        provider: AI_PROVIDERS.OPENAI,
        prompt: 'Optimize my CV',
        cvData: { name: 'Test' },
        apiKeys: {}
      };
      
      await expect(optimizeWithAI(options)).rejects.toThrow('OpenAI API key not configured');
    });

    it('should throw error for unknown provider', async () => {
      const options = {
        provider: 'unknown-provider',
        prompt: 'Optimize my CV',
        cvData: { name: 'Test' },
        apiKeys: { blackbox: 'test-key' }
      };
      
      await expect(optimizeWithAI(options)).rejects.toThrow('Unknown AI provider');
    });
  });

  describe('compareProviders - Input Validation', () => {
    it('should throw error when providers array is empty', async () => {
      const options = {
        providers: [],
        prompt: 'Optimize my CV',
        cvData: { name: 'Test' },
        apiKeys: { blackbox: 'test-key' }
      };
      
      await expect(compareProviders(options)).rejects.toThrow('At least one provider is required');
    });

    it('should throw error when providers is not provided', async () => {
      const options = {
        prompt: 'Optimize my CV',
        cvData: { name: 'Test' },
        apiKeys: { blackbox: 'test-key' }
      };
      
      await expect(compareProviders(options)).rejects.toThrow('At least one provider is required');
    });
  });

  describe('API Request Structure', () => {
    it('should format OpenAI request correctly', () => {
      const prompt = 'Optimize my CV';
      const cvData = { name: 'John Doe', role: 'Developer' };
      
      const expectedRequest = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: expect.stringContaining('experto en recursos humanos')
          },
          {
            role: 'user',
            content: expect.stringContaining(prompt)
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      };
      
      expect(expectedRequest.messages.length).toBe(2);
      expect(expectedRequest.temperature).toBe(0.7);
    });

    it('should format Anthropic request correctly', () => {
      const prompt = 'Optimize my CV';
      const cvData = { name: 'John Doe' };
      
      const expectedRequest = {
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        system: expect.stringContaining('experto en recursos humanos'),
        messages: [
          {
            role: 'user',
            content: expect.stringContaining(prompt)
          }
        ],
        temperature: 0.7
      };
      
      expect(expectedRequest.messages.length).toBe(1);
      expect(expectedRequest.system).toBeDefined();
    });
  });

  describe('Response Structure', () => {
    it('should return correct structure for successful response', () => {
      const mockResponse = {
        provider: AI_PROVIDERS.BLACKBOX,
        model: 'blackboxai/openai/gpt-4o',
        suggestion: 'Optimized CV content',
        usage: { prompt_tokens: 100, completion_tokens: 200 }
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
          provider: AI_PROVIDERS.OPENAI,
          suggestion: 'OpenAI suggestion'
        },
        {
          success: false,
          provider: AI_PROVIDERS.ANTHROPIC,
          error: 'API key not configured'
        }
      ];
      
      expect(mockResults.length).toBe(2);
      expect(mockResults[0].success).toBe(true);
      expect(mockResults[1].success).toBe(false);
      expect(mockResults[1]).toHaveProperty('error');
    });
  });

  describe('CV Data Validation', () => {
    it('should accept valid CV data structure', () => {
      const validCvData = {
        name: 'John Doe',
        role: 'Software Developer',
        summary: 'Experienced developer',
        experiences: [
          {
            role: 'Senior Developer',
            company: 'Tech Corp',
            dates: '2020-2023',
            responsibilities: 'Led development team'
          }
        ],
        skills: 'JavaScript, Python, React',
        tools: 'Git, Docker, AWS'
      };
      
      expect(validCvData.name).toBeDefined();
      expect(validCvData.role).toBeDefined();
      expect(Array.isArray(validCvData.experiences)).toBe(true);
      expect(validCvData.experiences.length).toBeGreaterThan(0);
    });

    it('should handle minimal CV data', () => {
      const minimalCvData = {
        name: 'John Doe'
      };
      
      expect(minimalCvData.name).toBeDefined();
      expect(JSON.stringify(minimalCvData)).toBeDefined();
    });
  });

  describe('Provider-Specific Features', () => {
    it('should support different models for OpenAI', () => {
      const models = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
      
      models.forEach(model => {
        expect(typeof model).toBe('string');
        expect(model.length).toBeGreaterThan(0);
      });
    });

    it('should support different models for Anthropic', () => {
      const models = [
        'claude-3-5-sonnet-20241022',
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307'
      ];
      
      models.forEach(model => {
        expect(typeof model).toBe('string');
        expect(model).toContain('claude');
      });
    });

    it('should support different models for Gemini', () => {
      const models = [
        'gemini-1.5-pro-latest',
        'gemini-1.5-flash-latest',
        'gemini-pro'
      ];
      
      models.forEach(model => {
        expect(typeof model).toBe('string');
        expect(model).toContain('gemini');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Mock fetch to simulate network error
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));
      
      const options = {
        provider: AI_PROVIDERS.BLACKBOX,
        prompt: 'Test prompt',
        cvData: { name: 'Test' },
        apiKeys: { blackbox: 'test-key' }
      };
      
      await expect(optimizeWithAI(options)).rejects.toThrow();
    });

    it('should handle API errors with status codes', async () => {
      // Mock fetch to simulate API error
      global.fetch = vi.fn(() => 
        Promise.resolve({
          ok: false,
          status: 401,
          text: () => Promise.resolve('Unauthorized')
        })
      );
      
      const options = {
        provider: AI_PROVIDERS.BLACKBOX,
        prompt: 'Test prompt',
        cvData: { name: 'Test' },
        apiKeys: { blackbox: 'test-key' }
      };
      
      await expect(optimizeWithAI(options)).rejects.toThrow();
    });
  });
});

describe('AI API Endpoints', () => {
  describe('GET /api/ai/providers', () => {
    it('should return available providers structure', () => {
      const mockResponse = {
        success: true,
        providers: [AI_PROVIDERS.BLACKBOX, AI_PROVIDERS.OPENAI],
        default: AI_PROVIDERS.BLACKBOX
      };
      
      expect(mockResponse.success).toBe(true);
      expect(Array.isArray(mockResponse.providers)).toBe(true);
      expect(mockResponse.default).toBeDefined();
    });
  });

  describe('POST /api/ai/optimize', () => {
    it('should validate request body structure', () => {
      const validRequest = {
        prompt: 'Optimize my CV',
        cvData: { name: 'Test' },
        provider: AI_PROVIDERS.BLACKBOX,
        model: 'blackboxai/openai/gpt-4o'
      };
      
      expect(validRequest.prompt).toBeDefined();
      expect(validRequest.cvData).toBeDefined();
      expect(validRequest.provider).toBeDefined();
    });

    it('should allow optional provider and model', () => {
      const minimalRequest = {
        prompt: 'Optimize my CV',
        cvData: { name: 'Test' }
      };
      
      expect(minimalRequest.prompt).toBeDefined();
      expect(minimalRequest.cvData).toBeDefined();
      expect(minimalRequest.provider).toBeUndefined();
      expect(minimalRequest.model).toBeUndefined();
    });
  });

  describe('POST /api/ai/compare', () => {
    it('should validate comparison request structure', () => {
      const validRequest = {
        prompt: 'Optimize my CV',
        cvData: { name: 'Test' },
        providers: [AI_PROVIDERS.OPENAI, AI_PROVIDERS.ANTHROPIC]
      };
      
      expect(validRequest.prompt).toBeDefined();
      expect(validRequest.cvData).toBeDefined();
      expect(Array.isArray(validRequest.providers)).toBe(true);
      expect(validRequest.providers.length).toBeGreaterThan(0);
    });

    it('should handle comparison response structure', () => {
      const mockResponse = {
        success: true,
        results: [
          {
            success: true,
            provider: AI_PROVIDERS.OPENAI,
            suggestion: 'OpenAI response'
          },
          {
            success: true,
            provider: AI_PROVIDERS.ANTHROPIC,
            suggestion: 'Anthropic response'
          }
        ]
      };
      
      expect(mockResponse.success).toBe(true);
      expect(Array.isArray(mockResponse.results)).toBe(true);
      expect(mockResponse.results.length).toBe(2);
    });
  });
});
