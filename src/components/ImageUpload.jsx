import { useState } from 'react';
import { Button, Paper, Box, Typography } from '@mui/material';

export default function ImageUpload({ onImageUpload }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        onImageUpload(file);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6">Upload Avatar Image</Typography>
        
        {previewUrl && (
          <Box sx={{ maxWidth: 200, maxHeight: 200, overflow: 'hidden', mb: 2 }}>
            <img 
              src={previewUrl} 
              alt="Preview" 
              style={{ width: '100%', height: 'auto' }}
            />
          </Box>
        )}

        <Button
          variant="contained"
          component="label"
        >
          Choose Image
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleImageChange}
          />
        </Button>
      </Box>
    </Paper>
  );
}
