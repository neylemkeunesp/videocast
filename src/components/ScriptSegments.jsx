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
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { useState } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DownloadIcon from '@mui/icons-material/Download';
import { getApiInstance } from '../utils/elevenLabsApi.js';
import { generateVideoFromImage } from '../utils/videoGenerator.mjs';

export default function ScriptSegments({ 
  segments, 
  voiceAssignments, 
  characterImages,
  onGenerate,
  onUpdateSegment,
  disabled,
  combinedMedia
}) {
  const [audioUrls, setAudioUrls] = useState({});
  const [isGenerating, setIsGenerating] = useState({});
  const [isGeneratingVideo, setIsGeneratingVideo] = useState({});
  const [error, setError] = useState(null);

  const handleGenerateAudio = async (segment, index) => {
    if (!voiceAssignments[segment.character]) {
      console.warn(`No voice assigned for character: ${segment.character}`);
      setError(`No voice assigned for character: ${segment.character}`);
      return;
    }

    if (isGenerating[index]) {
      console.log('Already generating audio for segment:', index);
      return;
    }

    setIsGenerating(prev => ({ ...prev, [index]: true }));
    try {
      console.log('Generating audio for segment:', { index, segment });
      const api = getApiInstance();
      const audioUrl = await api.generateSpeech(
        segment.text,
        voiceAssignments[segment.character]
      );

      // Cleanup previous audio URL if it exists
      if (audioUrls[index]) {
        URL.revokeObjectURL(audioUrls[index]);
      }

      setAudioUrls(prev => ({ ...prev, [index]: audioUrl }));
      setError(null);
    } catch (error) {
      console.error('Failed to generate speech:', error);
      setError(`Failed to generate speech: ${error.message}`);
    } finally {
      setIsGenerating(prev => ({ ...prev, [index]: false }));
    }
  };

  if (!segments || segments.length === 0) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6">Script Preview</Typography>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        
        {segments.map((segment, index) => {
          const characterImage = characterImages[segment.character] || {};
          return (
            <Card key={index} variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <Stack spacing={1} alignItems="center" sx={{ width: 120 }}>
                    {characterImage.preview && (
                      <>
                        <Box
                          component="img"
                          src={characterImage.preview}
                          alt={segment.character}
                          sx={{
                            width: 60,
                            height: 60,
                            objectFit: 'cover',
                            borderRadius: 1,
                          }}
                        />
                      </>
                    )}
                  </Stack>

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
                        {isGenerating[index] ? (
                          <CircularProgress size={24} />
                        ) : (
                          <PlayArrowIcon />
                        )}
                      </IconButton>
                      {audioUrls[index] && (
                        <audio
                          src={audioUrls[index]}
                          controls
                          style={{ height: 30 }}
                        />
                      )}
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!audioUrls[index] || isGeneratingVideo[index]}
                        onClick={async () => {
                          try {
                            setIsGeneratingVideo(prev => ({ ...prev, [index]: true }));
                            const audioResponse = await fetch(audioUrls[index]);
                            const audioBlob = new Blob([await audioResponse.arrayBuffer()], { type: 'audio/mpeg' });
                            const videoBlob = await generateVideoFromImage(
                              characterImage.file,
                              audioBlob
                            );
                            const videoUrl = URL.createObjectURL(videoBlob);
                            onUpdateSegment(index, {
                              ...segment,
                              videoUrl: videoUrl,
                              video: videoBlob
                            });
                          } catch (error) {
                            console.error('Failed to generate video:', error);
                            setError(`Failed to generate video: ${error.message}`);
                          } finally {
                            setIsGeneratingVideo(prev => ({ ...prev, [index]: false }));
                          }
                        }}
                      >
                        {isGeneratingVideo[index] ? (
                          <CircularProgress size={24} />
                        ) : (
                          'Generate Video'
                        )}
                      </Button>
                      {audioUrls[index] && (
                        <IconButton
                          size="small"
                          title="Download Audio"
                          onClick={() => {
                            try {
                              const link = document.createElement('a');
                              link.href = audioUrls[index];
                              link.download = `${segment.character}-audio.mp3`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } catch (error) {
                              console.error('Failed to download audio:', error);
                              setError('Failed to download audio');
                            }
                          }}
                        >
                          <DownloadIcon color="secondary" />
                        </IconButton>
                      )}
                    </Box>
                    {segment.videoUrl && (
                      <Box sx={{ mt: 2, width: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle2">
                            Generated Video
                          </Typography>
                          <IconButton
                            size="small"
                            title="Download Video"
                            onClick={() => {
                              try {
                                const link = document.createElement('a');
                                link.href = segment.videoUrl;
                                link.download = `${segment.character}-video.mp4`;
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                              } catch (error) {
                                console.error('Failed to download video:', error);
                                setError('Failed to download video');
                              }
                            }}
                          >
                            <DownloadIcon />
                          </IconButton>
                        </Box>
                        <video
                          src={segment.videoUrl}
                          controls
                          style={{ width: '100%', borderRadius: 4 }}
                        />
                      </Box>
                    )}
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          );
        })}

        {/* Combined Video Section */}
        {segments.length > 0 && (
          <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Divider sx={{ my: 2 }}>
              <Typography variant="h6" color="text.secondary">
                Combined Video
              </Typography>
            </Divider>
            
            <Button
              variant="contained"
              onClick={onGenerate}
              disabled={disabled}
              size="large"
              sx={{ alignSelf: 'center', minWidth: 200 }}
            >
              Generate Combined Video
            </Button>

            {combinedMedia?.videoUrl && (
              <Card sx={{ mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Combined Video Preview
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <video
                      src={combinedMedia.videoUrl}
                      controls
                      style={{ width: '100%', borderRadius: 4 }}
                    />
                  </Box>

                  <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={<DownloadIcon />}
                      onClick={() => {
                        try {
                          const link = document.createElement('a');
                          link.href = combinedMedia.videoUrl;
                          link.download = 'combined-video.mp4';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } catch (error) {
                          console.error('Failed to download combined video:', error);
                          setError('Failed to download combined video');
                        }
                      }}
                    >
                      Download Combined Video
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      size="large"
                      startIcon={<DownloadIcon />}
                      onClick={() => {
                        try {
                          const link = document.createElement('a');
                          link.href = combinedMedia.audioUrl;
                          link.download = 'combined-audio.mp3';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        } catch (error) {
                          console.error('Failed to download combined audio:', error);
                          setError('Failed to download combined audio');
                        }
                      }}
                    >
                      Download Combined Audio
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Box>
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
      videoUrl: PropTypes.string,
      video: PropTypes.instanceOf(Blob)
    })
  ).isRequired,
  voiceAssignments: PropTypes.objectOf(PropTypes.string).isRequired,
  characterImages: PropTypes.objectOf(
    PropTypes.shape({
      preview: PropTypes.string,
      file: PropTypes.object,
      video: PropTypes.instanceOf(Blob),
      videoUrl: PropTypes.string,
      audio: PropTypes.string
    })
  ).isRequired,
  onGenerate: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  combinedMedia: PropTypes.shape({
    video: PropTypes.instanceOf(Blob),
    audio: PropTypes.instanceOf(Blob),
    videoUrl: PropTypes.string,
    audioUrl: PropTypes.string
  })
};
