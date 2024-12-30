import { useState } from 'react';
import { TextField, Button, Paper, Box, Typography } from '@mui/material';

export default function ScriptInput({ onGenerateScript }) {
  const [script, setScript] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onGenerateScript(script);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6">Enter Your Script</Typography>
          <Typography variant="body2" color="text.secondary">
            Format each line as: "Character: Dialogue"
            <br />
            Example:
            <br />
            John: Hello, how are you today?
            <br />
            Sarah: I'm doing great, thanks for asking!
          </Typography>
          
          <TextField
            multiline
            rows={6}
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Enter your script here..."
            fullWidth
          />
          <Button 
            variant="contained" 
            type="submit"
            disabled={!script.trim()}
          >
            Process Script
          </Button>
        </Box>
      </form>
    </Paper>
  );
}
