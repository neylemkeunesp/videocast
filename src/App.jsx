import { useState } from 'react';
import { Container, Typography, Box, CssBaseline } from '@mui/material';
import ScriptInput from './components/ScriptInput';
import ScriptSegments from './components/ScriptSegments';
import CharacterSetup from './components/CharacterSetup';
import { parseScript } from './utils/scriptParser';

function App() {
  const [scriptData, setScriptData] = useState({
    characters: [],
    segments: [],
    characterMap: {}
  });
  const [voiceAssignments, setVoiceAssignments] = useState({});
  const [characterImages, setCharacterImages] = useState({});

  const handleGenerateScript = (scriptText) => {
    const parsedScript = parseScript(scriptText);
    setScriptData(parsedScript);
    // Reset voice assignments and images when new script is generated
    setVoiceAssignments({});
    setCharacterImages({});
  };

  const handleVoiceSelect = (character, voiceId) => {
    setVoiceAssignments(prev => ({
      ...prev,
      [character]: voiceId
    }));
  };

  const handleImageUpload = (character, file, preview) => {
    setCharacterImages(prev => ({
      ...prev,
      [character]: { file, preview }
    }));
  };

  const handleUpdateSegment = (index, updatedSegment) => {
    setScriptData(prev => ({
      ...prev,
      segments: prev.segments.map((segment, i) => 
        i === index ? updatedSegment : segment
      )
    }));
  };

  const handleGenerateVideo = async () => {
    // TODO: Implement video generation logic
    // 1. Generate voice audio using ElevenLabs API for each character's lines
    // 2. Process character images with Vedra for lip sync
    // 3. Combine audio and video
    console.log('Generating video with:', {
      segments: scriptData.segments,
      voiceAssignments,
      characterImages
    });
  };

  const isSetupComplete = () => {
    return scriptData.characters.every(character => 
      voiceAssignments[character] && characterImages[character]
    );
  };

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
            <ScriptSegments
              segments={scriptData.segments}
              voiceAssignments={voiceAssignments}
              characterImages={characterImages}
              onGenerate={handleGenerateVideo}
              onUpdateSegment={handleUpdateSegment}
              disabled={!isSetupComplete()}
            />
          )}
        </Box>
      </Container>
    </>
  );
}

export default App;
