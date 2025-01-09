export function parseScript(text) {
  try {
    console.log('Starting script parsing:', { text }); // Debug log

    if (!text || typeof text !== 'string') {
      console.error('Invalid script text:', text);
      throw new Error('Script text is required and must be a string');
    }

    // Split the text into lines and process each line
    const lines = text
      .split(/\r?\n/) // Split only on actual line breaks
      .map(line => line.trim())
      .filter(line => line.length > 0);

    console.log('Lines after splitting:', lines); // Debug log
    
    if (lines.length === 0) {
      throw new Error('Script cannot be empty');
    }

    // Extract characters and their lines
    const characterMap = new Map();
    const segments = [];
    let hasValidLine = false;
    let currentCharacter = null;
    let currentDialogue = [];
    
    lines.forEach((line, index) => {
      try {
        // Look for character name followed by dialogue
        const match = line.match(/^([^:]+):\s*(.+)$/);
        if (match) {
          // If we have a previous character's dialogue, add it to segments
          if (currentCharacter && currentDialogue.length > 0) {
            segments.push({
              character: currentCharacter,
              text: currentDialogue.join(' ')
            });
            currentDialogue = [];
          }

          hasValidLine = true;
          const [, character, dialogue] = match;
          currentCharacter = character.trim();
          
          if (!currentCharacter) {
            throw new Error(`Line ${index + 1}: Character name cannot be empty`);
          }

          if (!dialogue.trim()) {
            throw new Error(`Line ${index + 1}: Dialogue cannot be empty`);
          }
          
          console.log(`Line ${index + 1} parsed:`, { currentCharacter, dialogue }); // Debug log
          
          // Add character to map if not already present
          if (!characterMap.has(currentCharacter)) {
            characterMap.set(currentCharacter, []);
            console.log(`New character found: ${currentCharacter}`); // Debug log
          }
          
          currentDialogue.push(dialogue.trim());
        } else {
          // If line doesn't start with a character name, treat it as continuation of previous dialogue
          if (currentCharacter) {
            currentDialogue.push(line.trim());
          } else {
            console.warn(`Line ${index + 1} does not match expected format:`, line); // Debug log
            throw new Error(`Line ${index + 1}: Invalid format. Expected "Character: Dialogue"`);
          }
        }
      } catch (lineError) {
        console.error(`Error processing line ${index + 1}:`, lineError); // Debug log
        throw new Error(`Error in line ${index + 1}: ${lineError.message}`);
      }
    });

    // Add the last character's dialogue if any
    if (currentCharacter && currentDialogue.length > 0) {
      segments.push({
        character: currentCharacter,
        text: currentDialogue.join(' ')
      });
    }

    if (!hasValidLine) {
      throw new Error('No valid script lines found. Each line should be in the format "Character: Dialogue"');
    }

    // Validate that we have at least two characters for a conversation
    if (characterMap.size < 2) {
      throw new Error('Script must contain at least two different characters');
    }

    // Store segment references for each character
    segments.forEach((segment, index) => {
      characterMap.get(segment.character).push(index);
    });
    
    const result = {
      characters: Array.from(characterMap.keys()),
      segments,
      characterMap: Object.fromEntries(characterMap)
    };
    
    console.log('Parsed script result:', result); // Debug log
    return result;
    
  } catch (error) {
    console.error('Error parsing script:', error); // Debug log
    throw error; // Re-throw to let the caller handle the error
  }
}
