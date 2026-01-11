/**
 * AI Providers Module - Blackbox AI only
 */

const AI_PROVIDERS = {
  BLACKBOX: 'blackbox',
};

const AI_MODELS = {
  [AI_PROVIDERS.BLACKBOX]: {
    'gpt-4o': 'blackboxai/openai/gpt-4o',
    'claude-sonnet': 'blackboxai/anthropic/claude-sonnet-3.5',
    'gemini-pro': 'blackboxai/google/gemini-pro',
    'llama-3.1-70b': 'blackboxai/meta/llama-3.1-70b',
    'mixtral-8x7b': 'blackboxai/mistralai/mixtral-8x7b',
  },
};

const SYSTEM_PROMPT = 'Eres un experto en recursos humanos y redacción de CVs profesionales. Ayudas a optimizar CVs para que sean más efectivos y atractivos para reclutadores. Responde en español de forma clara y concisa.';

/**
 * Call Blackbox AI API
 */
async function callBlackbox(apiKey, model, prompt, cvData) {
  const response = await fetch('https://api.blackbox.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'blackboxai/openai/gpt-4o',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `${prompt}\n\nDatos del CV actual:\n${JSON.stringify(cvData, null, 2)}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Blackbox API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return {
    provider: AI_PROVIDERS.BLACKBOX,
    model: model || 'blackboxai/openai/gpt-4o',
    suggestion: data.choices[0].message.content,
    usage: data.usage,
  };
}

/**
 * Main function to optimize CV with AI (Blackbox only)
 * @param {Object} options - Configuration options
 * @param {string} options.model - Model to use (optional)
 * @param {string} options.prompt - User prompt
 * @param {Object} options.cvData - CV data
 * @param {Object} options.apiKeys - API keys for providers
 * @returns {Promise<Object>} AI response
 */
export async function optimizeWithAI(options) {
  const { model, prompt, cvData, apiKeys } = options;

  if (!prompt || !cvData) {
    throw new Error('Prompt and CV data are required');
  }

  if (!apiKeys.blackbox) {
    throw new Error('Blackbox API key not configured');
  }

  try {
    return await callBlackbox(apiKeys.blackbox, model, prompt, cvData);
  } catch (error) {
    console.error('Error calling Blackbox:', error);
    throw error;
  }
}

/**
 * Compare responses from multiple models (all through Blackbox)
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.models - List of models to compare
 * @param {string} options.prompt - User prompt
 * @param {Object} options.cvData - CV data
 * @param {Object} options.apiKeys - API keys
 * @returns {Promise<Array>} Array of AI responses
 */
export async function compareProviders(options) {
  const { models, prompt, cvData, apiKeys } = options;

  if (!models || models.length === 0) {
    throw new Error('At least one model is required');
  }

  if (!apiKeys.blackbox) {
    throw new Error('Blackbox API key not configured');
  }

  const results = await Promise.allSettled(
    models.map((model) => {
      const startTime = Date.now();
      return optimizeWithAI({
        model,
        prompt,
        cvData,
        apiKeys,
      }).then(result => ({
        ...result,
        responseTime: Date.now() - startTime,
      }));
    })
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return {
        success: true,
        ...result.value,
      };
    } else {
      return {
        success: false,
        model: models[index],
        error: result.reason.message,
      };
    }
  });
}

/**
 * Get available models based on configured API keys
 */
export function getAvailableProviders(apiKeys) {
  if (!apiKeys.blackbox) {
    return [];
  }

  return [
    { id: 'blackboxai/openai/gpt-4o', name: 'GPT-4o (via Blackbox)', default: true },
    { id: 'blackboxai/anthropic/claude-sonnet-3.5', name: 'Claude Sonnet 3.5 (via Blackbox)', default: false },
    { id: 'blackboxai/google/gemini-pro', name: 'Gemini Pro (via Blackbox)', default: false },
    { id: 'blackboxai/meta/llama-3.1-70b', name: 'Llama 3.1 70B (via Blackbox)', default: false },
    { id: 'blackboxai/mistralai/mixtral-8x7b', name: 'Mixtral 8x7B (via Blackbox)', default: false },
  ];
}

export { AI_PROVIDERS, AI_MODELS };
