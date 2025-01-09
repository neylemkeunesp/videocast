/**
 * Configuration for the application
 */

// Environment detection
const isDevelopment = import.meta.env.DEV;
const isTest = import.meta.env.MODE === 'test';

// Debug logging function
const debug = (...args) => {
  console.log('[Config]', ...args);
};

// API Configuration
const hedraApiKey = import.meta.env.VITE_HEDRA_API_KEY;
const elevenLabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;

// Log environment variables for debugging (without exposing full keys)
debug('Environment Variables:', {
  isDevelopment,
  isTest,
  hasHedraKey: !!hedraApiKey,
  hasElevenLabsKey: !!elevenLabsApiKey,
  hedraKeyPrefix: hedraApiKey ? hedraApiKey.substring(0, 8) + '...' : undefined,
  elevenLabsKeyPrefix: elevenLabsApiKey ? elevenLabsApiKey.substring(0, 8) + '...' : undefined,
});

// Validate API keys
if (!hedraApiKey && !isTest) {
  const message = 'VITE_HEDRA_API_KEY is not set in environment variables';
  debug('Error:', message);
  if (!isDevelopment) {
    throw new Error(message);
  }
}

if (!elevenLabsApiKey && !isTest) {
  const message = 'VITE_ELEVENLABS_API_KEY is not set in environment variables';
  debug('Error:', message);
  if (!isDevelopment) {
    throw new Error(message);
  }
}

if (hedraApiKey && !hedraApiKey.startsWith('sk_hedra-')) {
  const message = 'Invalid HEDRA_API_KEY format. Key should start with "sk_hedra-"';
  debug('Error:', message);
  if (!isDevelopment) {
    throw new Error(message);
  }
}

// Export API keys
export const HEDRA_API_KEY = hedraApiKey;
export const ELEVENLABS_API_KEY = elevenLabsApiKey;

// Export configuration object
export const CONFIG = {
  // Environment
  isDevelopment,
  isTest,
  
  // API Configuration
  apiBaseUrl: 'https://mercury.dev.dream-ai.com/api',
  
  // Debug settings
  debug: true, // Always enable debug for now to help diagnose issues
  
  // Video generation settings
  maxPollAttempts: 120, // 2x increase for longer processing
  pollInterval: 5000, // Start with 5 seconds
  maxPollInterval: 15000, // Max 15 seconds between polls
  totalTimeout: 1800000, // 30 minutes total timeout
};

// Log final configuration
debug('Configuration:', CONFIG);
