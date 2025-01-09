import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Paper, Box, Typography, Alert } from '@mui/material';
function ImageUpload({ onImageUpload }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  const validateImage = (file) => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please select an image file');
    }
    
    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      throw new Error('Image size must be less than 5MB');
    }

    // Check dimensions
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        // Check minimum dimensions (e.g., 256x256)
        if (img.width < 256 || img.height < 256) {
          reject(new Error('Image dimensions must be at least 256x256 pixels'));
        }
        resolve(file);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleImageChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      await validateImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        onImageUpload(file);
      };
      reader.readAsDataURL(file);
      
      // Only handle image preview and upload, video generation is handled by App.jsx
    } catch (error) {
      console.error('Failed to process image:', error);
      setError(error.message);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Typography variant="h6">Upload Avatar Image</Typography>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}
        
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
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
          />
        </Button>
      </Box>
    </Paper>
  );
}

ImageUpload.propTypes = {
  onImageUpload: PropTypes.func.isRequired,
};

export default ImageUpload;
