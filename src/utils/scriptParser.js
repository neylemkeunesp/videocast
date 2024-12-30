export function parseScript(text) {
  // Split the text into lines and process each line
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Extract characters and their lines
  const characterMap = new Map();
  const segments = [];
  
  lines.forEach(line => {
    // Look for character name followed by dialogue
    const match = line.match(/^([A-Za-z\s]+?):\s*(.+)$/);
    if (match) {
      const [, character, dialogue] = match;
      const characterName = character.trim();
      
      // Add character to map if not already present
      if (!characterMap.has(characterName)) {
        characterMap.set(characterName, []);
      }
      
      // Add dialogue to segments and store reference
      const segmentIndex = segments.length;
      segments.push({
        character: characterName,
        text: dialogue.trim()
      });
      
      // Store segment reference for this character
      characterMap.get(characterName).push(segmentIndex);
    }
  });
  
  return {
    characters: Array.from(characterMap.keys()),
    segments,
    characterMap: Object.fromEntries(characterMap)
  };
}
