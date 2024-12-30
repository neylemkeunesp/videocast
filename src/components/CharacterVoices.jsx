import {
  Paper,
  Box,
  Typography,
  Select,
  MenuItem,
  Stack,
  TextField,
  Button,
  IconButton,
} from '@mui/material';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { initializeApi, getApiInstance } from '../utils/elevenLabsApi';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function CharacterVoices({ characters, voiceAssignments, onVoiceSelect }) {
  const [apiKey, setApiKey] = useState('');
  const [voices, setVoices] = useState([]);
  const [error, setError] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [audioUrls, setAudioUrls] = useState({});

  useEffect(() => {
    // Try to get API key from localStorage
    const savedApiKey = localStorage.getItem('elevenLabsApiKey');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      initializeElevenLabs(savedApiKey);
    }
  }, []);

  const initializeElevenLabs = async (key) => {
    try {
      initializeApi(key);
      const api = getApiInstance();
      const fetchedVoices = await api.getVoices();
      setVoices(fetchedVoices);
      setIsInitialized(true);
      setError('');
      localStorage.setItem('elevenLabsApiKey', key);
    } catch (err) {
      setError(`Failed to initialize ElevenLabs API: ${err.message}`);
      setIsInitialized(false);
    }
  };

  const handleApiKeySubmit = () => {
    initializeElevenLabs(apiKey);
  };

  const handlePreviewVoice = async (character, voiceId) => {
    try {
      const api = getApiInstance();
      const audioUrl = await api.generateSpeech(
        `Hello, I am ${character}`,
        voiceId
      );
      setAudioUrls(prev => ({
        ...prev,
        [character]: audioUrl
      }));
    } catch (err) {
      console.error('Failed to generate preview:', err);
      setError('Failed to generate voice preview');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Character Voices
      </Typography>

      {!isInitialized && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            Enter your ElevenLabs API key to get started:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter API key"
              sx={{ flexGrow: 1 }}
            />
            <Button variant="contained" onClick={handleApiKeySubmit}>
              Initialize
            </Button>
          </Box>
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      )}

      {isInitialized && (
        <Stack spacing={2}>
          {characters.map((character) => (
            <Box
              key={character}
              sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
            >
              <Typography sx={{ minWidth: 120 }}>{character}:</Typography>
              <Select
                size="small"
                value={voiceAssignments[character] || ''}
                onChange={(e) => onVoiceSelect(character, e.target.value)}
                sx={{ minWidth: 150 }}
              >
                {voices.map((voice) => (
                  <MenuItem key={voice.voice_id} value={voice.voice_id}>
                    {voice.name}
                  </MenuItem>
                ))}
              </Select>
              {voiceAssignments[character] && (
                <>
                  <IconButton
                    onClick={() => handlePreviewVoice(character, voiceAssignments[character])}
                    size="small"
                  >
                    <PlayArrowIcon />
                  </IconButton>
                  {audioUrls[character] && (
                    <audio
                      src={audioUrls[character]}
                      controls
                      style={{ height: 30 }}
                    />
                  )}
                </>
              )}
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}

CharacterVoices.propTypes = {
  characters: PropTypes.arrayOf(PropTypes.string).isRequired,
  voiceAssignments: PropTypes.objectOf(PropTypes.string).isRequired,
  onVoiceSelect: PropTypes.func.isRequired,
};
