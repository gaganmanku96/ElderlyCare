# Elderly Care Assistant

AI-powered smartphone assistant that helps seniors navigate their phones with voice guidance and simple interfaces.

## What it does

This app helps elderly people learn to use smartphones by:
- Showing them a safe practice phone interface
- Giving step-by-step voice instructions
- Analyzing what's on their screen to provide specific help
- Using simple language and large buttons

## How it works

1. **Phone Simulator**: Web-based Android interface with WhatsApp, Phone, Messages, and Settings
2. **AI Assistant**: Uses Gemma 3n via Ollama to understand screenshots and provide guidance
3. **Voice Interface**: Speech-to-text input and text-to-speech responses
4. **Context Awareness**: Different help for different apps

## Getting Started

### Prerequisites
- Node.js 18+
- Ollama installed locally

### Setup

```bash
# Install Ollama and model
curl -fsSL https://ollama.com/install.sh | sh
ollama pull gemma3n:e2b
ollama serve

# Run the app
cd app
npm install
npm run dev
```

Open `http://localhost:5173`

## Usage

1. Click the red floating assistant button
2. Ask questions like "How do I call someone?" or use the microphone
3. The AI sees your current screen and gives specific instructions
4. Practice safely without affecting real apps

## Key Features

- **Safe Practice Environment**: Can't break anything, just learn
- **Voice Controlled**: Speak naturally to get help
- **Screen Analysis**: AI sees exactly what you see
- **Large UI Elements**: Easy to see and tap
- **Emergency Contacts**: Quick access to important numbers
- **Local Privacy**: All AI processing happens on your computer

## Technical Details

- **Frontend**: React + TypeScript + Vite
- **AI**: Ollama + Gemma 3n for local inference
- **Vision**: html2canvas for screen capture, optimized to 800x450 for context limits
- **Voice**: Web Speech API for input/output

## Project Structure

```
app/
├── src/
│   ├── components/     # Phone interface components
│   ├── services/       # AI and conversation logic
│   └── types/          # TypeScript definitions
└── public/             # Static assets
```

## Development

```bash
npm run dev      # Start development
npm run build    # Build for production
npm run lint     # Check code quality
```

## Troubleshooting

**AI not working?**
- Check if Ollama is running: `ollama serve`
- Verify model is installed: `ollama list`

**Voice not working?**
- Allow microphone permissions in browser
- Chrome/Edge work best

## License

MIT License