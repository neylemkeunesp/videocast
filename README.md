# Videocast - AI-Powered Video Generation

Videocast is a React-based application that enables AI-powered video generation with customizable character voices and script handling. The application integrates with ElevenLabs for voice synthesis and provides tools for script parsing, media processing, and video generation.

## Features

- **Script Management**: Create and edit scripts with structured segments
- **Character Setup**: Configure character voices and settings
- **AI Voice Synthesis**: Integrated with ElevenLabs API for realistic voice generation
- **Video Generation**: Combine audio and visual elements to create final videos
- **Media Processing**: Tools for handling various media formats and transformations

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/videocast.git
   cd videocast
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory
   - Add your ElevenLabs API key:
     ```
     VITE_ELEVENLABS_API_KEY=your_api_key_here
     ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
videocast/
├── public/              # Static assets
├── src/
│   ├── assets/          # Application assets
│   ├── components/      # React components
│   │   ├── CharacterSetup.jsx
│   │   ├── CharacterVoices.jsx
│   │   ├── ScriptInput.jsx
│   │   └── ScriptSegments.jsx
│   ├── utils/           # Utility functions
│   │   ├── elevenLabsApi.js
│   │   ├── mediaUtils.js
│   │   ├── scriptParser.js
│   │   └── videoGenerator.mjs
│   ├── App.jsx          # Main application component
│   └── main.jsx         # Application entry point
├── .gitignore
├── index.html
├── package.json
├── README.md
└── vite.config.js
```

## Usage

1. Start the application:
   ```bash
   npm run dev
   ```

2. Configure characters:
   - Navigate to the Character Setup section
   - Add character details and voice preferences

3. Create your script:
   - Use the Script Input interface to write your script
   - Divide your script into logical segments
   - Assign characters to each segment

4. Generate your video:
   - Review script segments
   - Generate audio using the ElevenLabs integration
   - Combine with visual elements to create final video

## API Integration

The application integrates with the following APIs:

- **ElevenLabs**: Used for text-to-speech voice generation
- **Hedra API**: Used for video processing and generation

API keys should be stored in the `.env` file as environment variables.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
