import {
  Paper,
  Box,
  Typography,
  Select,
  MenuItem,
  Stack,
  IconButton,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { getApiInstance } from '../utils/elevenLabsApi.js';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export default function CharacterVoices({ characters, voiceAssignments, onVoiceSelect }) {
  const [voices, setVoices] = useState([]);
  const [error, setError] = useState('');
  const [audioUrls, setAudioUrls] = useState({});
  const [loading, setLoading] = useState(true);
  const [generatingPreview, setGeneratingPreview] = useState({});

  useEffect(() => {
    const loadVoices = async () => {
      try {
        console.log('Loading voices...'); // Debug log
        const api = getApiInstance();
        const fetchedVoices = await api.getVoices();
        console.log('Fetched voices:', fetchedVoices); // Debug log
        setVoices(fetchedVoices || []);
        setError('');
      } catch (err) {
        console.error('Failed to fetch voices:', err); // Debug log
        setError(`Failed to fetch voices: ${err.message}`);
        setVoices([]);
      } finally {
        setLoading(false);
      }
    };

    loadVoices();

    // Cleanup audio URLs when component unmounts
    return () => {
      Object.values(audioUrls).forEach(url => {
        if (url) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const handlePreviewVoice = async (character, voiceId) => {
    if (generatingPreview[character]) {
      console.log('Preview already generating for:', character); // Debug log
      return;
    }

    try {
      setGeneratingPreview(prev => ({ ...prev, [character]: true }));
      console.log('Generating preview for:', { character, voiceId }); // Debug log

      // Cleanup previous audio URL if it exists
      if (audioUrls[character]) {
        URL.revokeObjectURL(audioUrls[character]);
      }

      const api = getApiInstance();
      const audioUrl = await api.generateSpeech(
        `Hello, I am ${character}`,
        voiceId
      );
      console.log('Generated preview URL:', audioUrl); // Debug log

      setAudioUrls(prev => ({
        ...prev,
        [character]: audioUrl
      }));
      setError('');
    } catch (err) {
      console.error('Failed to generate preview:', err); // Debug log
      setError(`Failed to generate voice preview: ${err.message}`);
    } finally {
      setGeneratingPreview(prev => ({ ...prev, [character]: false }));
    }
  };

  // Debug logs for props and state
  console.log('CharacterVoices props and state:', {
    characters,
    voiceAssignments,
    availableVoices: voices.length,
    hasError: !!error,
    audioUrlsCount: Object.keys(audioUrls).length,
    generatingPreviews: generatingPreview
  });

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <CircularProgress size={24} />
          <Typography>Loading voices...</Typography>
        </Box>
      </Paper>
    );
  }

  if (!characters || characters.length === 0) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Character Voices
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {voices.length === 0 && !error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No voices available. Please try refreshing the page.
        </Alert>
      )}

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
              onChange={(e) => {
                console.log('Voice selected:', { character, voiceId: e.target.value }); // Debug log
                onVoiceSelect(character, e.target.value);
              }}
              sx={{ minWidth: 150 }}
              disabled={voices.length === 0}
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
                  disabled={generatingPreview[character]}
                >
                  {generatingPreview[character] ? (
                    <CircularProgress size={24} />
                  ) : (
                    <PlayArrowIcon />
                  )}
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
    </Paper>
  );
}

CharacterVoices.propTypes = {
  characters: PropTypes.arrayOf(PropTypes.string).isRequired,
  voiceAssignments: PropTypes.objectOf(PropTypes.string).isRequired,
  onVoiceSelect: PropTypes.func.isRequired,
};
