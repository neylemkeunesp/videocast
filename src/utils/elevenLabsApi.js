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
      const response = await this.client.get('/voices');
      return response.data.voices;
    } catch (error) {
      console.error('Failed to fetch voices:', error);
      throw error;
    }
  }

  async generateSpeech(text, voiceId) {
    try {
      const response = await this.client.post(
        `/text-to-speech/${voiceId}`,
        {
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        },
        {
          responseType: 'arraybuffer',
        }
      );
      
      // Convert arraybuffer to blob URL for audio playback
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('Failed to generate speech:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
let apiInstance = null;

export const initializeApi = (apiKey) => {
  apiInstance = new ElevenLabsApi(apiKey);
  return apiInstance;
};

export const getApiInstance = () => {
  if (!apiInstance) {
    throw new Error('ElevenLabs API not initialized. Call initializeApi first.');
  }
  return apiInstance;
};
