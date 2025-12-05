/**
 * AI Providers Module
 * Supports multiple AI providers: OpenAI, Anthropic, Google Gemini, and Blackbox AI
 */

const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  GEMINI: 'gemini',
  BLACKBOX: 'blackbox',
};

const AI_MODELS = {
  [AI_PROVIDERS.OPENAI]: {
    'gpt-4': 'gpt-4',
    'gpt-4-turbo': 'gpt-4-turbo-preview',
    'gpt-3.5-turbo': 'gpt-3.5-turbo',
  },
  [AI_PROVIDERS.ANTHROPIC]: {
    'claude-3.5-sonnet': 'claude-3-5-sonnet-20241022',
    'claude-3-opus': 'claude-3-opus-20240229',
    'claude-3-sonnet': 'claude-3-sonnet-20240229',
    'claude-3-haiku': 'claude-3-haiku-20240307',
  },
  [AI_PROVIDERS.GEMINI]: {
    'gemini-1.5-pro': 'gemini-1.5-pro-latest',
    'gemini-1.5-flash': 'gemini-1.5-flash-latest',
    'gemini-pro': 'gemini-pro',
  },
  [AI_PROVIDERS.BLACKBOX]: {
    'gpt-4o': 'blackboxai/openai/gpt-4o',
    'claude-sonnet': 'blackboxai/anthropic/claude-sonnet-3.5',
    'gemini-pro': 'blackboxai/google/gemini-pro',
  },
};

const SYSTEM_PROMPT = 'Eres un experto en recursos humanos y redacción de CVs profesionales. Ayudas a optimizar CVs para que sean más efectivos y atractivos para reclutadores. Responde en español de forma clara y concisa.';

/**
 * Call OpenAI API
 */
async function callOpenAI(apiKey, model, prompt, cvData) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'gpt-3.5-turbo',
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
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return {
    provider: AI_PROVIDERS.OPENAI,
    model: model || 'gpt-3.5-turbo',
    suggestion: data.choices[0].message.content,
    usage: data.usage,
  };
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(apiKey, model, prompt, cvData) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nDatos del CV actual:\n${JSON.stringify(cvData, null, 2)}`,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return {
    provider: AI_PROVIDERS.ANTHROPIC,
    model: model || 'claude-3-5-sonnet-20241022',
    suggestion: data.content[0].text,
    usage: data.usage,
  };
}

/**
 * Call Google Gemini API
 */
async function callGemini(apiKey, model, prompt, cvData) {
  const modelName = model || 'gemini-1.5-flash-latest';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `${SYSTEM_PROMPT}\n\n${prompt}\n\nDatos del CV actual:\n${JSON.stringify(cvData, null, 2)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini API returned no candidates');
  }

  return {
    provider: AI_PROVIDERS.GEMINI,
    model: modelName,
    suggestion: data.candidates[0].content.parts[0].text,
    usage: data.usageMetadata,
  };
}

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
 * Main function to optimize CV with AI
 * @param {Object} options - Configuration options
 * @param {string} options.provider - AI provider to use
 * @param {string} options.model - Model to use (optional)
 * @param {string} options.prompt - User prompt
 * @param {Object} options.cvData - CV data
 * @param {Object} options.apiKeys - API keys for different providers
 * @returns {Promise<Object>} AI response
 */
export async function optimizeWithAI(options) {
  const { provider, model, prompt, cvData, apiKeys } = options;

  if (!prompt || !cvData) {
    throw new Error('Prompt and CV data are required');
  }

  try {
    switch (provider) {
      case AI_PROVIDERS.OPENAI:
        if (!apiKeys.openai) {
          throw new Error('OpenAI API key not configured');
        }
        return await callOpenAI(apiKeys.openai, model, prompt, cvData);

      case AI_PROVIDERS.ANTHROPIC:
        if (!apiKeys.anthropic) {
          throw new Error('Anthropic API key not configured');
        }
        return await callAnthropic(apiKeys.anthropic, model, prompt, cvData);

      case AI_PROVIDERS.GEMINI:
        if (!apiKeys.gemini) {
          throw new Error('Google Gemini API key not configured');
        }
        return await callGemini(apiKeys.gemini, model, prompt, cvData);

      case AI_PROVIDERS.BLACKBOX:
        if (!apiKeys.blackbox) {
          throw new Error('Blackbox API key not configured');
        }
        return await callBlackbox(apiKeys.blackbox, model, prompt, cvData);

      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error calling ${provider}:`, error);
    throw error;
  }
}

/**
 * Compare responses from multiple AI providers
 * @param {Object} options - Configuration options
 * @param {Array<string>} options.providers - List of providers to compare
 * @param {string} options.prompt - User prompt
 * @param {Object} options.cvData - CV data
 * @param {Object} options.apiKeys - API keys for different providers
 * @returns {Promise<Array>} Array of AI responses
 */
export async function compareProviders(options) {
  const { providers, prompt, cvData, apiKeys } = options;

  if (!providers || providers.length === 0) {
    throw new Error('At least one provider is required');
  }

  const results = await Promise.allSettled(
    providers.map((provider) =>
      optimizeWithAI({
        provider,
        prompt,
        cvData,
        apiKeys,
      })
    )
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
        provider: providers[index],
        error: result.reason.message,
      };
    }
  });
}

/**
 * Get available providers based on configured API keys
 */
export function getAvailableProviders(apiKeys) {
  const available = [];

  if (apiKeys.openai) available.push(AI_PROVIDERS.OPENAI);
  if (apiKeys.anthropic) available.push(AI_PROVIDERS.ANTHROPIC);
  if (apiKeys.gemini) available.push(AI_PROVIDERS.GEMINI);
  if (apiKeys.blackbox) available.push(AI_PROVIDERS.BLACKBOX);

  return available;
}

export { AI_PROVIDERS, AI_MODELS };
