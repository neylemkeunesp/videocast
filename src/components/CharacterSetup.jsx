import {
  Paper,
  Box,
  Typography,
  Stack,
  Button,
} from '@mui/material';
import PropTypes from 'prop-types';
import CharacterVoices from './CharacterVoices';

export default function CharacterSetup({
  characters, 
  voiceAssignments, 
  characterImages,
  onVoiceSelect,
  onImageUpload 
}) {
  const handleImageChange = (character, event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onImageUpload(character, file, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Character Setup
      </Typography>
      <Stack spacing={3}>
        {characters.map((character) => (
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
                {characterImages[character] ? (
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
                >
                  {characterImages[character] ? 'Change Image' : 'Upload Image'}
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleImageChange(character, e)}
                  />
                </Button>
                
                {/* Voice selection will be handled by CharacterVoices component */}
              </Box>
            </Box>
          </Box>
        ))}
      </Stack>
      
      {/* Add CharacterVoices component */}
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
  })).isRequired,
  onVoiceSelect: PropTypes.func.isRequired,
  onImageUpload: PropTypes.func.isRequired,
};
