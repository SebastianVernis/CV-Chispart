/**
 * AI Providers Module - Open AI Compatible
 */

const AI_PROVIDERS = {
  OPENAI_COMPATIBLE: 'openai_compatible',
};

const SYSTEM_PROMPT = 'Eres un experto en recursos humanos y redacción de CVs profesionales. Ayudas a optimizar CVs para que sean más efectivos y atractivos para reclutadores. Responde en español de forma clara y concisa.';

/**
 * Call Open AI Compatible API
 */
async function callOpenAICompatible(apiKey, baseUrl, model, prompt, cvData) {
  const url = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
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
    throw new Error(`AI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return {
    provider: AI_PROVIDERS.OPENAI_COMPATIBLE,
    model: model,
    suggestion: data.choices[0].message.content,
    usage: data.usage,
  };
}

/**
 * Main function to optimize CV with AI
 * @param {Object} options - Configuration options
 * @param {string} options.model - Model to use
 * @param {string} options.prompt - User prompt
 * @param {Object} options.cvData - CV data
 * @param {Object} options.apiConfig - API configuration containing key and baseUrl
 * @returns {Promise<Object>} AI response
 */
export async function optimizeWithAI(options) {
  const { model, prompt, cvData, apiConfig } = options;

  if (!prompt || !cvData) {
    throw new Error('Prompt and CV data are required');
  }

  if (!apiConfig || !apiConfig.apiKey || !apiConfig.baseUrl) {
    throw new Error('AI API key or base URL not configured');
  }

  if (!model) {
    throw new Error('Model is required');
  }

  try {
    return await callOpenAICompatible(apiConfig.apiKey, apiConfig.baseUrl, model, prompt, cvData);
  } catch (error) {
    console.error('Error calling AI API:', error);
    throw error;
  }
}

/**
 * Compare responses from multiple models
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.models - List of models to compare
 * @param {string} options.prompt - User prompt
 * @param {Object} options.cvData - CV data
 * @param {Object} options.apiConfig - API configuration containing key and baseUrl
 * @returns {Promise<Array>} Array of AI responses
 */
export async function compareProviders(options) {
  const { models, prompt, cvData, apiConfig } = options;

  if (!models || models.length === 0) {
    throw new Error('At least one model is required');
  }

  if (!apiConfig || !apiConfig.apiKey || !apiConfig.baseUrl) {
    throw new Error('AI API key or base URL not configured');
  }

  const results = await Promise.allSettled(
    models.map((model) => {
      const startTime = Date.now();
      return optimizeWithAI({
        model,
        prompt,
        cvData,
        apiConfig,
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
 * Get available models dynamically from the v1/models endpoint
 */
export async function getAvailableProviders(apiConfig) {
  if (!apiConfig || !apiConfig.apiKey || !apiConfig.baseUrl) {
    return [];
  }

  try {
    const url = `${apiConfig.baseUrl.replace(/\/$/, '')}/v1/models`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiConfig.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch models: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = await response.json();
    if (!data || !data.data || !Array.isArray(data.data)) {
      console.error('Invalid models response format');
      return [];
    }

    return data.data.map((model, index) => ({
      id: model.id,
      name: model.id,
      default: index === 0, // First model is default
    }));
  } catch (error) {
    console.error('Error fetching available models:', error);
    return [];
  }
}

export { AI_PROVIDERS };
