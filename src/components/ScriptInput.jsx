import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { TextField, Button, Paper, Box, Typography, Alert } from '@mui/material';

export default function ScriptInput({ onGenerateScript }) {
  console.log('ScriptInput rendered'); // Debug log
  const [script, setScript] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  // Debug log whenever script changes
  useEffect(() => {
    console.log('Script state updated:', script);
  }, [script]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current) {
      console.log('Focusing input'); // Debug log
      inputRef.current.focus();
    }
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    console.log('Form submitted'); // Debug log
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      console.log('Processing script:', script); // Debug log

      if (!script.trim()) {
        throw new Error('Script cannot be empty');
      }

      // Format the script to ensure proper line breaks
      const formattedScript = script
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');

      console.log('Formatted script:', formattedScript); // Debug log

      // Check if script has at least one valid line
      const hasValidLine = formattedScript.split(/\r?\n/).some(line => {
        const trimmedLine = line.trim();
        return trimmedLine && trimmedLine.includes(':');
      });

      if (!hasValidLine) {
        throw new Error('Script must contain at least one line in the format "Character: Dialogue"');
      }

      setError(null);
      onGenerateScript(formattedScript);
      console.log('Script processed successfully'); // Debug log
    } catch (error) {
      console.error('Error processing script:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleInputChange(e) {
    const newValue = e.target.value;
    console.log('Input changed:', { 
      value: newValue,
      type: e.type,
      target: e.target.tagName
    }); // Debug log

    setScript(newValue);

    try {
      // Validate script format
      if (newValue.trim()) {
        const hasValidLine = newValue
          .split(/\r?\n/)
          .some(line => line.trim() && line.includes(':'));

        if (!hasValidLine) {
          setError('Script must contain at least one line in the format "Character: Dialogue"');
        } else {
          setError(null);
        }
      } else {
        setError(null);
      }
    } catch (error) {
      console.error('Error validating script:', error);
      setError('Failed to validate script');
    }
  }

  function handleKeyDown(e) {
    console.log('Key pressed:', e.key); // Debug log
    // Allow Shift+Enter for new lines, Enter for submit
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSubmitting && script.trim()) {
        handleSubmit(e);
      }
    }
  }

  function handleClick() {
    console.log('Input clicked'); // Debug log
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <form onSubmit={handleSubmit} noValidate>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6">Enter Your Script</Typography>
          <Typography variant="body2" color="text.secondary">
            Format each line as: &ldquo;Character: Dialogue&rdquo;
            <br />
            Example:
            <br />
            John: Hello, how are you today?
            <br />
            Sarah: I&apos;m doing great, thanks for asking!
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <TextField
            inputRef={inputRef}
            multiline
            rows={6}
            value={script}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onClick={handleClick}
            placeholder="Enter your script here..."
            fullWidth
            error={!!error}
            disabled={isSubmitting}
            inputProps={{
              'aria-label': 'Script input',
              spellCheck: 'true'
            }}
            sx={{
              '& .MuiInputBase-root': {
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.5'
              }
            }}
          />
          <Button 
            variant="contained" 
            type="submit"
            disabled={!script.trim() || isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Process Script'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
}

ScriptInput.propTypes = {
  onGenerateScript: PropTypes.func.isRequired,
};
