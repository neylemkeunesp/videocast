import axios from 'axios';
import { HEDRA_API_KEY, CONFIG } from '../config.js';

// Validate API key format
function validateApiKey(key) {
  if (!key) {
    throw new Error('Hedra API key is not configured. Please add VITE_HEDRA_API_KEY to your environment variables.');
  }
  if (!key.startsWith('sk_hedra-')) {
    throw new Error('Invalid Hedra API key format. Key should start with "sk_hedra-"');
  }
}

// Validate API key on initialization
validateApiKey(HEDRA_API_KEY);

// Debug logging function
const debug = (...args) => {
  if (CONFIG.debug) {
    console.log('[Hedra]', ...args);
  }
};

// Create axios instance with default config
const api = axios.create({
  baseURL: '/api',  // Use Vite proxy
  headers: {
    'X-API-KEY': HEDRA_API_KEY,
    'Accept': 'application/json'
  },
  // Add default axios config
  timeout: 300000, // 5 minutes for initial requests
  maxContentLength: Infinity,
  maxBodyLength: Infinity
});

// Add request interceptor for debugging
api.interceptors.request.use(request => {
  debug('Request:', {
    method: request.method?.toUpperCase(),
    url: request.url,
    headers: request.headers,
    data: request.data
  });
  return request;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    debug('Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers
    });
    return response;
  },
  error => {
    debug('Response Error:', {
      message: error.message,
      response: {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      }
    });
    return Promise.reject(error);
  }
);

export async function generateVideoFromImage(imageFile, audioFile = null) {
  try {
    // Step 1: Upload image
    debug('Uploading image...', {
      fileName: imageFile.name,
      fileSize: imageFile.size,
      fileType: imageFile.type
    });
    const imageFormData = new FormData();
    imageFormData.append('file', imageFile);
    
    const imageResponse = await api.post('/v1/portrait', imageFormData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (!imageResponse.data?.url) {
      throw new Error('Portrait upload response missing URL');
    }
    
    const avatarUrl = imageResponse.data.url;
    debug('Image uploaded successfully:', avatarUrl);

    // Step 2: Upload audio if provided
    let audioUrl = '';
    if (audioFile) {
      debug('Uploading audio...', {
        fileSize: audioFile.size,
        fileType: audioFile.type,
        duration: audioFile.duration
      });
      const audioFormData = new FormData();
      const audioFileName = 'audio.mp3';
      audioFormData.append('file', audioFile, audioFileName);
      
      const audioResponse = await api.post('/v1/audio', audioFormData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        }
      });
      
      if (!audioResponse.data?.url) {
        throw new Error('Audio upload response missing URL');
      }
      
      audioUrl = audioResponse.data.url;
      debug('Audio uploaded successfully:', audioUrl);
    }

    // Step 3: Generate character video
    debug('Generating character video...');
    debug('Sending character generation request...');
    const videoResponse = await api.post('/v1/characters', {
      avatarImage: avatarUrl,
      audioSource: "audio",
      voiceUrl: audioUrl
    });

    debug('Character generation response:', videoResponse.data);

    if (!videoResponse.data) {
      throw new Error('Empty response from character generation');
    }

    // Step 4: Get job ID and poll for completion
    const jobId = videoResponse.data.jobId;
    if (!jobId) {
      throw new Error('No job ID in response');
    }
    debug('Got job ID:', jobId);

    // Poll for completion with exponential backoff
    let attempts = 0;
    const maxAttempts = CONFIG.maxPollAttempts;
    let pollInterval = CONFIG.pollInterval;
    const maxPollInterval = CONFIG.maxPollInterval;
    
    while (attempts < maxAttempts) {
      debug(`Checking project status (attempt ${attempts + 1}/${maxAttempts}, interval: ${pollInterval}ms)...`);
      const statusResponse = await api.get(`/v1/projects/${jobId}`);
      
      if (statusResponse.data.status === 'Completed') {
        debug('Video generation completed with response:', statusResponse.data);
        const videoUrl = statusResponse.data.videoUrl;
        if (!videoUrl) {
          throw new Error('No video URL in completed status');
        }

        // Download the video
        debug('Downloading video...');
        const videoResponse = await api.get(videoUrl, {
          responseType: 'blob'
        });

        return videoResponse.data;
      }
      
      if (statusResponse.data.status === 'Failed') {
        throw new Error(`Video generation failed: ${statusResponse.data.error || 'Unknown error'}`);
      }
      
      debug(`Status: ${statusResponse.data.status}, progress: ${statusResponse.data.progress || 0}%, waiting ${pollInterval}ms...`);
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
      
      // Increase polling interval with exponential backoff, but cap at maxPollInterval
      pollInterval = Math.min(pollInterval * 1.5, maxPollInterval);
    }

    const timeoutError = new Error('Video generation timed out');
    timeoutError.details = {
      attempts,
      maxAttempts,
      totalTime: attempts * pollInterval,
      jobId
    };
    throw timeoutError;
    
  } catch (error) {
    debug('Error in video generation:', {
      message: error.message,
      details: error.details,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // Enhance error messages with more context
    if (error.message === 'Network Error') {
      throw new Error('Network error occurred while generating video. Please check your internet connection and try again.');
    }
    
    if (error.response?.status === 401) {
      throw new Error('API authentication failed. Please check your Hedra API key.');
    }
    
    if (error.response?.status === 413) {
      throw new Error('File size too large. Please use a smaller image or audio file.');
    }
    
    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please wait a moment before trying again.');
    }
    
    // Include job ID in timeout errors for better tracking
    if (error.details?.jobId) {
      throw new Error(`Video generation timed out (Job ID: ${error.details.jobId}). The video may still be processing - please wait a few minutes and try again.`);
    }
    
    throw new Error(`Video generation failed: ${error.message}`);
  }
}
