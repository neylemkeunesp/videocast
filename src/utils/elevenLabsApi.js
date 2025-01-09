import axios from 'axios';

const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

class ElevenLabsApi {
  constructor(apiKey) {
    this.client = axios.create({
      baseURL: ELEVENLABS_API_URL,
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async getVoices() {
    try {
      console.log('Fetching voices from ElevenLabs API...'); // Debug log
      const response = await this.client.get('/voices');
      console.log('Fetched voices:', response.data.voices); // Debug log
      return response.data.voices;
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      throw error;
    }
  }

  async generateSpeech(text, voiceId, language = 'en') {
    try {
      console.log('Generating speech:', { text, voiceId, language }); // Debug log
      const response = await this.client.post(
        `/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_multilingual_v1',
          language,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          responseType: 'arraybuffer',
        }
      );
      
      console.log('Speech generated successfully'); // Debug log
      
      // Return the audio blob directly
      return new Blob([response.data], { type: 'audio/mpeg' });
    } catch (error) {
      console.error('Failed to generate speech:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
let apiInstance = null;

export const initializeApi = (apiKey) => {
  console.log('Initializing ElevenLabs API...'); // Debug log
  if (!apiKey) {
    throw new Error('ElevenLabs API key is required');
  }
  apiInstance = new ElevenLabsApi(apiKey);
  console.log('ElevenLabs API initialized successfully'); // Debug log
  return apiInstance;
};

export const getApiInstance = () => {
  if (!apiInstance) {
    throw new Error('ElevenLabs API not initialized. Call initializeApi first.');
  }
  return apiInstance;
};
