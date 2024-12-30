import PropTypes from 'prop-types';
import {
  Paper,
  Box,
  Typography,
  Card,
  CardContent,
  Stack,
  Button,
  IconButton,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { getApiInstance } from '../utils/elevenLabsApi';

export default function ScriptSegments({ 
  segments, 
  voiceAssignments, 
  characterImages,
  onGenerate,
  onUpdateSegment,
  disabled 
}) {
  const [audioUrls, setAudioUrls] = useState({});
  const [isGenerating, setIsGenerating] = useState({});

  const handleGenerateAudio = async (segment, index) => {
    if (!voiceAssignments[segment.character]) {
      console.warn(`No voice assigned for character: ${segment.character}`);
      return;
    }

    setIsGenerating(prev => ({ ...prev, [index]: true }));
    try {
      const api = getApiInstance();
      const audioUrl = await api.generateSpeech(
        segment.text,
        voiceAssignments[segment.character]
      );
      setAudioUrls(prev => ({ ...prev, [index]: audioUrl }));
    } catch (error) {
      console.error('Failed to generate speech:', error);
    } finally {
      setIsGenerating(prev => ({ ...prev, [index]: false }));
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6">Script Preview</Typography>
        
        {segments.map((segment, index) => (
          <Card key={index} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                {characterImages[segment.character] && (
                  <Box
                    component="img"
                    src={characterImages[segment.character].preview}
                    alt={segment.character}
                    sx={{
                      width: 60,
                      height: 60,
                      objectFit: 'cover',
                      borderRadius: 1,
                    }}
                  />
                )}
                <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2" color="primary">
                    {segment.character}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    variant="outlined"
                    size="small"
                    value={segment.text}
                    onChange={(e) => onUpdateSegment(index, { ...segment, text: e.target.value })}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleGenerateAudio(segment, index)}
                      disabled={isGenerating[index] || !voiceAssignments[segment.character]}
                    >
                      <PlayArrowIcon />
                    </IconButton>
                    {audioUrls[index] && (
                      <audio
                        src={audioUrls[index]}
                        controls
                        style={{ height: 30 }}
                      />
                    )}
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>
        ))}

        {segments.length > 0 && (
          <Button
            variant="contained"
            onClick={onGenerate}
            sx={{ mt: 2 }}
            disabled={disabled}
          >
            Generate Video
          </Button>
        )}
      </Box>
    </Paper>
  );
}

ScriptSegments.propTypes = {
  onUpdateSegment: PropTypes.func.isRequired,
  segments: PropTypes.arrayOf(
    PropTypes.shape({
      character: PropTypes.string.isRequired,
      text: PropTypes.string.isRequired,
    })
  ).isRequired,
  voiceAssignments: PropTypes.objectOf(PropTypes.string).isRequired,
  characterImages: PropTypes.objectOf(
    PropTypes.shape({
      preview: PropTypes.string.isRequired,
    })
  ).isRequired,
  onGenerate: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
