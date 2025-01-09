import {
  Paper,
  Box,
  Typography,
  Stack,
  Button,
  Alert,
} from '@mui/material';
import PropTypes from 'prop-types';
import { useState } from 'react';
import CharacterVoices from './CharacterVoices';

export default function CharacterSetup({
  characters, 
  voiceAssignments, 
  characterImages,
  onVoiceSelect,
  onImageUpload 
}) {
  const [error, setError] = useState(null);
  const [loadingImage, setLoadingImage] = useState(false);

  const handleImageChange = async (character, event) => {
    try {
      setLoadingImage(true);
      console.log('Handling image change for character:', character); // Debug log
      const file = event.target.files[0];
      
      if (!file) {
        console.log('No file selected'); // Debug log
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size should be less than 5MB');
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          console.log('Image loaded successfully:', { character, fileName: file.name }); // Debug log
          onImageUpload(character, file, reader.result);
          setError(null);
        } catch (uploadError) {
          console.error('Error in image upload callback:', uploadError);
          setError('Failed to process image upload: ' + uploadError.message);
        }
      };
      reader.onerror = () => {
        console.error('Error reading file:', reader.error);
        setError('Failed to read image file');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling image change:', error);
      setError(error.message || 'Failed to handle image selection');
    } finally {
      setLoadingImage(false);
    }
  };

  // Debug logs for props
  console.log('CharacterSetup props:', {
    characters,
    hasVoiceAssignments: !!voiceAssignments,
    hasCharacterImages: !!characterImages,
    voiceAssignmentsKeys: Object.keys(voiceAssignments || {}),
    characterImagesKeys: Object.keys(characterImages || {})
  });

  if (!characters || characters.length === 0) {
    return null;
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Character Setup
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack spacing={3}>
        {characters.map((character) => {
          const hasImage = characterImages[character]?.preview;
          return (
            <Box
              key={character}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {character}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Box sx={{ minWidth: 100 }}>
                  {hasImage ? (
                    <Box 
                      component="img"
                      src={characterImages[character].preview}
                      alt={character}
                      sx={{ 
                        width: 100,
                        height: 100,
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 100,
                        height: 100,
                        bgcolor: 'grey.200',
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        No Image
                      </Typography>
                    </Box>
                  )}
                </Box>
                
                <Box sx={{ flex: 1 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ mb: 1 }}
                    disabled={loadingImage}
                  >
                    {hasImage ? 'Change Image' : 'Upload Image'}
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => handleImageChange(character, e)}
                    />
                  </Button>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Stack>
      
      <Box sx={{ mt: 3 }}>
        <CharacterVoices
          characters={characters}
          voiceAssignments={voiceAssignments}
          onVoiceSelect={onVoiceSelect}
        />
      </Box>
    </Paper>
  );
}

CharacterSetup.propTypes = {
  characters: PropTypes.arrayOf(PropTypes.string).isRequired,
  voiceAssignments: PropTypes.objectOf(PropTypes.string).isRequired,
  characterImages: PropTypes.objectOf(PropTypes.shape({
    file: PropTypes.object,
    preview: PropTypes.string,
    video: PropTypes.instanceOf(Blob),
    videoUrl: PropTypes.string,
    audio: PropTypes.string
  })).isRequired,
  onVoiceSelect: PropTypes.func.isRequired,
  onImageUpload: PropTypes.func.isRequired,
};
