import { useState, useEffect } from 'react';
import { Container, Typography, Box, CssBaseline, Snackbar, Alert, LinearProgress } from '@mui/material';

// Helper function to get video duration
const getVideoDuration = async (videoBlob) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => reject(new Error('Failed to load video'));
  });
};

import ScriptInput from './components/ScriptInput.jsx';
import ScriptSegments from './components/ScriptSegments.jsx';
import CharacterSetup from './components/CharacterSetup.jsx';
import { parseScript } from './utils/scriptParser.js';
import { generateVideoFromImage } from './utils/videoGenerator.mjs';
import { getApiInstance } from './utils/elevenLabsApi.js';
import { concatenateVideos, concatenateAudios } from './utils/mediaUtils.js';

function App() {
  const [error, setError] = useState(null);
  const [generationStatus, setGenerationStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [scriptData, setScriptData] = useState({
    characters: [],
    segments: [],
    characterMap: {}
  });
  const [voiceAssignments, setVoiceAssignments] = useState({});
  const [characterImages, setCharacterImages] = useState({});
  const [combinedMedia, setCombinedMedia] = useState({
    video: null,
    audio: null,
    videoUrl: null,
    audioUrl: null
  });

  const handleGenerateScript = async (scriptText) => {
    try {
      console.log('Generating script from text:', scriptText);
      const parsedScript = parseScript(scriptText);
      console.log('Parsed script result:', parsedScript);

      setScriptData(parsedScript);
      setVoiceAssignments({});
      setCharacterImages({});
      setCombinedMedia({
        video: null,
        audio: null,
        videoUrl: null,
        audioUrl: null
      });
      setError(null);

      console.log('Updated script data:', {
        characters: parsedScript.characters,
        segmentsCount: parsedScript.segments.length,
        characterMap: parsedScript.characterMap
      });
    } catch (error) {
      console.error('Error generating script:', error);
      setError('Failed to process script: ' + error.message);
      setScriptData({
        characters: [],
        segments: [],
        characterMap: {}
      });
    }
  };

  const handleVoiceSelect = (character, voiceId) => {
    try {
      console.log('Selecting voice:', { character, voiceId });
      setVoiceAssignments(prev => ({
        ...prev,
        [character]: voiceId
      }));
    } catch (error) {
      console.error('Error selecting voice:', error);
      setError('Failed to select voice: ' + error.message);
    }
  };

  const handleImageUpload = (character, file, preview) => {
    try {
      console.log('Uploading image for character:', { character, fileName: file.name });
      setCharacterImages(prev => ({
        ...prev,
        [character]: { file, preview }
      }));
    } catch (error) {
      console.error('Error uploading image:', error);
      setError('Failed to upload image: ' + error.message);
    }
  };

  const handleUpdateSegment = (index, updatedSegment) => {
    try {
      console.log('Updating segment:', { index, updatedSegment });
      setScriptData(prev => ({
        ...prev,
        segments: prev.segments.map((segment, i) => 
          i === index ? updatedSegment : segment
        )
      }));
    } catch (error) {
      console.error('Error updating segment:', error);
      setError('Failed to update segment: ' + error.message);
    }
  };

  const handleGenerateVideo = async () => {
    try {
      setCombinedMedia({
        video: null,
        audio: null,
        videoUrl: null,
        audioUrl: null
      });
      setError(null);
      setIsGenerating(true);
      
      for (const character of scriptData.characters) {
        if (characterImages[character]) {
          const { file } = characterImages[character];
          const voiceId = voiceAssignments[character];
          
          if (!voiceId) {
            throw new Error(`No voice assigned for character: ${character}`);
          }

          const characterSegments = scriptData.segments
            .filter(segment => segment.character === character);

          const totalSegments = characterSegments.length;
          setGenerationStatus(`Generating audio for ${character} (0/${totalSegments} segments)...`);
          const api = getApiInstance();
          
          for (const segment of characterSegments) {
            const trimmedText = segment.text.trim();
            const segmentIndex = scriptData.segments.indexOf(segment);
            console.log(`Generating audio for ${character} (segment ${segmentIndex + 1}/${scriptData.segments.length}):`, {
              segment: trimmedText,
              segmentIndex,
              totalSegments: scriptData.segments.length
            });
            
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            
            setGenerationStatus(`Generating audio for ${character} (segment ${segmentIndex + 1}/${scriptData.segments.length})...`);
            let audioBlob;
            try {
              audioBlob = await api.generateSpeech(trimmedText, voiceId);
              console.log(`Generated audio for ${character}:`, {
                blobType: audioBlob.type,
                blobSize: audioBlob.size,
                segmentIndex,
                text: trimmedText
              });

              const audioUrl = URL.createObjectURL(audioBlob);
              const audioLink = document.createElement('a');
              audioLink.href = audioUrl;
              audioLink.download = `segment_${segmentIndex + 1}_${character}_${timestamp}_audio.mp3`;
              audioLink.click();
              URL.revokeObjectURL(audioUrl);
              
            } catch (audioError) {
              console.error(`Failed to generate audio for ${character}:`, audioError);
              throw new Error(`Failed to generate audio for ${character}: ${audioError.message}`);
            }
            
            setGenerationStatus(`Generating video for ${character} (segment ${segmentIndex + 1}/${scriptData.segments.length})...\nThis may take a few minutes.`);
            let videoBlob;
            try {
              console.log(`Starting video generation for ${character} (segment ${segmentIndex + 1}/${scriptData.segments.length}):`, {
                segment: trimmedText,
                audioSize: audioBlob.size,
                imageSize: file.size,
                segmentIndex,
                totalSegments: scriptData.segments.length
              });
              videoBlob = await generateVideoFromImage(file, audioBlob);

              const videoUrl = URL.createObjectURL(videoBlob);
              const videoLink = document.createElement('a');
              videoLink.href = videoUrl;
              videoLink.download = `segment_${segmentIndex + 1}_${character}_${timestamp}_${trimmedText.substring(0, 20)}.webm`;
              videoLink.click();
              URL.revokeObjectURL(videoUrl);
              const duration = await getVideoDuration(videoBlob);
              console.log(`Generated video for ${character} segment ${segmentIndex + 1}:`, {
                segment: trimmedText,
                type: videoBlob.type,
                size: videoBlob.size,
                duration,
                isBlob: videoBlob instanceof Blob
              });
              
              setGenerationStatus(`Segment ${segmentIndex + 1}/${scriptData.segments.length} completed and saved for ${character}!`);
              
              const segmentKey = segment.text.trim();
              const segmentRef = `${segmentIndex}:${segmentKey}`;
              await new Promise(resolve => {
                setCharacterImages(prev => {
                  const updated = {
                    ...prev,
                    [character]: {
                      file: prev[character].file,
                      preview: prev[character].preview,
                      segments: {
                        ...(prev[character]?.segments || {}),
                        [segmentRef]: {
                          video: videoBlob,
                          audio: audioBlob,
                          text: segment.text,
                          index: segmentIndex
                        }
                      }
                    }
                  };
                  console.log('Updating characterImages:', {
                    prevSegments: prev[character]?.segments ? Object.keys(prev[character].segments) : [],
                    newSegments: Object.keys(updated[character].segments),
                    currentText: trimmedText
                  });
                  return updated;
                });
                setTimeout(resolve, 0);
              });
              
              console.log('Verifying segment storage:', {
                character,
                text: trimmedText,
                hasSegments: !!characterImages[character]?.segments,
                storedSegments: characterImages[character]?.segments ? 
                  Object.keys(characterImages[character].segments) : []
              });
              
              console.log(`Generated video for ${character} segment:`, { videoBlob });
              setGenerationStatus(`Segment ${segmentIndex + 1}/${scriptData.segments.length} completed for ${character}!`);
              
            } catch (videoError) {
              console.error(`Failed to generate video for ${character}:`, videoError);
              throw new Error(`Failed to generate video for ${character}: ${videoError.message}`);
            }
          }
        }
      }
      
      try {
        if (combinedMedia.videoUrl) URL.revokeObjectURL(combinedMedia.videoUrl);
        if (combinedMedia.audioUrl) URL.revokeObjectURL(combinedMedia.audioUrl);
        
        setCombinedMedia({
          video: null,
          audio: null,
          videoUrl: null,
          audioUrl: null
        });

        const orderedVideos = [];
        const orderedAudios = [];
        
        console.log('Current characterImages state:', characterImages);
        console.log('Processing segments:', scriptData.segments.map(s => ({
          character: s.character,
          text: s.text,
          trimmedText: s.text.trim()
        })));
        
        scriptData.segments.forEach((segment, index) => {
          const charMedia = characterImages[segment.character];
          console.log(`Processing segment ${index}:`, {
            character: segment.character,
            text: segment.text,
            trimmedText: segment.text.trim(),
            hasCharMedia: !!charMedia,
            hasSegments: !!charMedia?.segments,
            availableKeys: charMedia?.segments ? Object.keys(charMedia.segments) : [],
            exactMatch: charMedia?.segments?.[segment.text.trim()]
          });
          
          if (charMedia?.segments) {
            const segmentKey = segment.text.trim();
            const segmentRef = `${index}:${segmentKey}`;
            const segmentMedia = charMedia.segments[segmentRef];
            
            if (segmentMedia) {
              console.log(`Found media for segment ${index}:`, {
                character: segment.character,
                text: segment.text,
                hasVideo: !!segmentMedia.video,
                hasAudio: !!segmentMedia.audio
              });
              
              if (segmentMedia.video instanceof Blob) {
                orderedVideos[index] = segmentMedia.video;
              }
              
              if (segmentMedia.audio) {
                orderedAudios[index] = new Blob([segmentMedia.audio], { type: 'audio/mp3' });
              }
            } else {
              console.log(`No matching media found for segment ${index}:`, {
                character: segment.character,
                text: segment.text,
                availableSegments: Object.keys(charMedia.segments)
              });
            }
          } else {
            console.log(`No segments found for character:`, {
              character: segment.character,
              charMediaKeys: charMedia ? Object.keys(charMedia) : []
            });
          }
        });

        const finalVideos = orderedVideos.filter((video, index) => {
          if (!video) {
            console.error(`Missing video for segment ${index}:`, scriptData.segments[index]);
            return false;
          }
          return true;
        });
        
        const finalAudios = orderedAudios.filter((audio, index) => {
          if (!audio) {
            console.error(`Missing audio for segment ${index}:`, scriptData.segments[index]);
            return false;
          }
          return true;
        });

        const missingVideos = scriptData.segments.filter((segment, index) => !orderedVideos[index]);
        const missingAudios = scriptData.segments.filter((segment, index) => !orderedAudios[index]);
        
        if (missingVideos.length > 0 || missingAudios.length > 0) {
          const formatSegments = (segments, type) => 
            segments.map((segment, index) => 
              `${type} ${index + 1}: "${segment.character}: ${segment.text.trim()}"`
            ).join('\n');
          
          const errorParts = [];
          if (missingVideos.length > 0) {
            errorParts.push(`Missing videos for:\n${formatSegments(missingVideos, 'Segment')}`);
          }
          if (missingAudios.length > 0) {
            errorParts.push(`Missing audio for:\n${formatSegments(missingAudios, 'Segment')}`);
          }
          
          throw new Error(errorParts.join('\n\n'));
        }

        console.log('Media to combine:', {
          totalVideos: finalVideos.length,
          totalAudios: finalAudios.length
        });

        if (finalVideos.length > 0) {
          const totalSegments = scriptData.segments.length;
          setGenerationStatus(`Combining ${totalSegments} video and audio segments...`);
          
          const combinedVideo = await concatenateVideos(finalVideos);
          const combinedAudio = await concatenateAudios(finalAudios);
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const combinedVideoUrl = URL.createObjectURL(combinedVideo);
          const combinedAudioUrl = URL.createObjectURL(combinedAudio);
          
          const videoLink = document.createElement('a');
          videoLink.href = combinedVideoUrl;
          videoLink.download = `combined_video_${timestamp}.webm`;
          videoLink.click();
          
          const audioLink = document.createElement('a');
          audioLink.href = combinedAudioUrl;
          audioLink.download = `combined_audio_${timestamp}.mp3`;
          audioLink.click();
          
          setCombinedMedia({
            video: combinedVideo,
            audio: combinedAudio,
            videoUrl: combinedVideoUrl,
            audioUrl: combinedAudioUrl
          });
          
          setGenerationStatus('Media combined successfully! Final files saved with timestamp:\n- Combined video as "combined_video_[timestamp].webm"\n- Combined audio as "combined_audio_[timestamp].mp3"\n\nIndividual segments were saved during generation.');
        } else {
          console.log('No videos available to combine');
        }
      } catch (error) {
        console.error('Error in media combination:', error);
        setError('Failed to combine media: ' + error.message);
      }
      
      setTimeout(() => {
        setGenerationStatus('');
        setIsGenerating(false);
      }, 10000);
    } catch (error) {
      console.error('Error in video generation:', error);
      let errorMessage = error.message;
      
      if (error.message.includes('timed out')) {
        errorMessage = 'Video generation is taking longer than expected. Please wait a few minutes and try again.';
      } else if (error.message.includes('Missing media')) {
        errorMessage = error.message;
      } else if (error.response?.status === 401) {
        errorMessage = 'API authentication failed. Please check your API keys.';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Network error occurred. Please check your internet connection.';
      } else {
        errorMessage = error.message || 'Failed to generate video';
      }
      
      setError(errorMessage);
      setIsGenerating(false);
      setGenerationStatus('');
    }
  };

  const handleCloseError = () => {
    setError(null);
  };

  const isSetupComplete = () => {
    return scriptData.characters.every(character => 
      voiceAssignments[character] && characterImages[character]
    );
  };

  useEffect(() => {
    console.log('App State:', {
      hasError: !!error,
      isGenerating,
      scriptDataCharacters: scriptData.characters,
      scriptDataSegments: scriptData.segments.length,
      voiceAssignments: Object.keys(voiceAssignments),
      characterImages: Object.keys(characterImages),
      hasCombinedVideo: !!combinedMedia.videoUrl,
      hasCombinedAudio: !!combinedMedia.audioUrl
    });
  }, [error, isGenerating, scriptData, voiceAssignments, characterImages, combinedMedia]);

  useEffect(() => {
    return () => {
      if (combinedMedia.videoUrl) {
        URL.revokeObjectURL(combinedMedia.videoUrl);
      }
      if (combinedMedia.audioUrl) {
        URL.revokeObjectURL(combinedMedia.audioUrl);
      }
    };
  }, [combinedMedia]);

  return (
    <>
      <CssBaseline />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Videocast Generator
        </Typography>
        
        <Box sx={{ mt: 4 }}>
          <ScriptInput onGenerateScript={handleGenerateScript} />
          {scriptData.characters.length > 0 && (
            <CharacterSetup
              characters={scriptData.characters}
              voiceAssignments={voiceAssignments}
              characterImages={characterImages}
              onVoiceSelect={handleVoiceSelect}
              onImageUpload={handleImageUpload}
            />
          )}
          {scriptData.segments.length > 0 && (
            <>
              <ScriptSegments
                segments={scriptData.segments}
                voiceAssignments={voiceAssignments}
                characterImages={characterImages}
                onGenerate={handleGenerateVideo}
                onUpdateSegment={handleUpdateSegment}
                disabled={!isSetupComplete()}
                combinedMedia={combinedMedia}
              />
              {combinedMedia?.videoUrl && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Combined Video Preview
                  </Typography>
                  <video
                    src={combinedMedia.videoUrl}
                    controls
                    style={{ width: '100%', borderRadius: 4 }}
                  />
                </Box>
              )}
            </>
          )}
        </Box>
      </Container>
      {isGenerating && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: 'background.paper',
            p: 2,
            boxShadow: 3,
            zIndex: 1000,
          }}
        >
          <Typography variant="body2" gutterBottom>
            {generationStatus}
          </Typography>
          <LinearProgress />
        </Box>
      )}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}

export default App;
