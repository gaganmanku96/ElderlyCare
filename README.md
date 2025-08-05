# Elderly Care Assistant - Gemma 3 + Ollama Integration

A React-based web application that simulates an Android phone interface to help elderly users learn smartphone functionality safely. Now enhanced with **Gemma 3 Q4 quantized models** via **Ollama** for local AI assistance.

![Demo Status](https://img.shields.io/badge/Demo-Ready-green)
![Ollama](https://img.shields.io/badge/Ollama-Gemma%203-blue)
![Training](https://img.shields.io/badge/Training-Unsloth-orange)

## 🎯 Problem Statement

Many elderly individuals struggle with smartphone technology, requiring constant assistance from family members. This creates barriers to digital communication, emergency services, and essential apps.

## 💡 Solution

An interactive web-based Android phone simulator with **local AI assistance**:
- **Safe Learning Environment**: Practice phone navigation without consequences
- **Local AI Guidance**: Gemma 3 models running via Ollama (no cloud dependency)
- **Multimodal Analysis**: Screenshot analysis with vision capabilities
- **Voice-First Interface**: Natural voice interaction with elderly-friendly responses
- **Training Pipeline**: Custom fine-tuning with Unsloth for elderly-specific guidance

## 🏗️ Project Structure

```
elderly-care-assistant/
├── app/                    # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/     # Android UI components & screens
│   │   ├── services/       # AI service with Ollama integration
│   │   └── types/          # TypeScript definitions
│   ├── package.json
│   └── vite.config.ts
├── training/               # Unsloth fine-tuning pipeline
│   ├── scripts/
│   │   ├── train_gemma3.py    # Main training script
│   │   └── prepare_data.py    # Data preparation utility
│   ├── data/               # Training datasets
│   ├── models/             # Base and fine-tuned models
│   └── requirements.txt
├── api/                    # Optional backend API server
│   ├── server.py           # Flask server for enhanced Ollama integration
│   └── requirements.txt
├── CLAUDE.md              # Detailed project documentation
└── README.md              # This file
```

## 🚀 Quick Start

### 1. Install Ollama & Gemma 3

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Download Gemma 3 Q4 quantized model (4B - fits in 12GB VRAM)
ollama pull hf.co/google/gemma-3-4b-it-qat-q4_0-gguf

# Or larger 27B model (fits in 22GB VRAM)
ollama pull hf.co/google/gemma-3-27b-it-qat-q4_0-gguf

# Start Ollama server
ollama serve
```

### 2. Run the Frontend

```bash
cd app
npm install
npm run dev
```

Visit `http://localhost:5173` to see the application.

### 3. Test AI Integration

1. Click the red floating assistant button
2. Ask: "How do I change my WhatsApp profile picture?"
3. The app will capture a screenshot and query Gemma 3 locally
4. Receive step-by-step elderly-friendly guidance

## 🤖 AI Integration Features

### Ollama + Gemma 3 Integration
- **Local Privacy**: All AI processing happens on your machine
- **Q4 Quantization**: Reduced memory usage (4B model ~6GB, 27B model ~14GB)
- **Multimodal Support**: Analyzes phone screenshots with vision capabilities
- **Context-Aware**: Different guidance for WhatsApp, Phone, Settings apps
- **Elderly-Optimized Prompts**: Patient, clear, step-by-step instructions

### Supported Models
- `gemma3:4b-instruct-q4_0` (Recommended - works on most GPUs)
- `gemma3:27b-instruct-q4_0` (Higher quality - requires more VRAM)
- Custom fine-tuned models via training pipeline

## 🎓 Training Your Own Model

### Quick Training Setup

```bash
cd training

# Install training requirements
pip install -r requirements.txt

# Prepare elderly care training data
python scripts/prepare_data.py --output data/training_conversations.json

# Fine-tune Gemma 3 4B model
python scripts/train_gemma3.py \
    --model_size gemma3-4b \
    --data_path data/training_conversations.json \
    --output_dir outputs/elderly_care_gemma3 \
    --epochs 3
```

### Training Features
- **Unsloth Optimization**: 2x faster training, 70% less VRAM
- **4-bit Quantization**: Train 4B model in 12GB, 27B in 22GB
- **LoRA Adapters**: Memory-efficient fine-tuning
- **Multiple Output Formats**: HuggingFace, GGUF for Ollama
- **Google Colab Compatible**: Works on free T4 GPUs

## 📱 App Simulations

### Completed Features
- **WhatsApp Clone**: Profile management, messaging, DP changes
- **Phone Dialer**: Emergency contacts, call history, large buttons
- **Settings App**: Accessibility controls with live previews
- **Messages App**: SMS interface with contact management
- **Home Screen**: App grid with elderly-friendly icons

### AI Assistant Features
- **Floating Help Button**: Available on all screens
- **Screenshot Analysis**: Automatic DOM capture (no screen sharing prompts)
- **Conversation Persistence**: Maintains context across sessions
- **Voice Interface**: Speech-to-text input, text-to-speech output
- **Elderly Mode**: 25% larger UI elements, higher contrast

## 🎯 Demo Scenarios

### Scenario 1: WhatsApp Profile Picture Change
1. Toggle "Elderly Mode" for larger interface
2. Open WhatsApp simulation
3. Click floating assistant button
4. Ask: "How do I change my profile picture?"
5. Receive contextual guidance with screenshot analysis

### Scenario 2: Emergency Call Setup
1. Open Phone app simulation
2. View emergency contacts with red highlighting
3. Ask assistant: "How do I call my doctor?"
4. Get step-by-step emergency calling guidance

## 🔧 Technical Architecture

### Frontend (React + TypeScript)
- **Vite**: Fast development and building
- **Styled Components**: CSS-in-JS with elderly-friendly themes
- **Web Speech API**: Voice input/output
- **html2canvas**: DOM-based screenshot capture
- **TypeScript**: Type-safe development

### AI Service Integration
- **Ollama REST API**: Direct integration with local models
- **Multimodal Requests**: Base64 image + text prompts
- **Fallback System**: Mock responses when Ollama unavailable
- **Context Management**: App-specific prompt engineering

### Training Pipeline (Python)
- **Unsloth**: Optimized LLM training framework
- **Transformers**: Hugging Face model loading
- **TRL**: Supervised fine-tuning with chat templates
- **Datasets**: Efficient data loading and processing

## 🌟 Competition Advantages

### Technical Innovation
- **Creative Solution**: Web-based phone simulation bypasses mobile app restrictions
- **Local AI**: Privacy-focused, offline-capable assistance
- **Multimodal UX**: Screenshot analysis + voice interaction
- **Memory Efficient**: Q4 quantization enables consumer hardware deployment

### Social Impact
- **Digital Inclusion**: Reduces elderly technology anxiety
- **Family Support**: Decreases burden on caregivers
- **Emergency Access**: Safer emergency communication setup
- **Scalable**: Deployable to assisted living facilities

### Market Potential
- **Growing Market**: Increasing elderly smartphone adoption
- **Cost Reduction**: Reduces support calls and training needs
- **Healthcare Integration**: Potential integration with telemedicine

## 🔍 Model Performance

### Memory Requirements
- **4B Q4 Model**: ~6GB VRAM inference, 12GB training
- **27B Q4 Model**: ~14GB VRAM inference, 22GB training
- **Training Time**: 2-4 hours (4B), 6-12 hours (27B)

### Quality Improvements (Fine-tuned vs Base)
- **Elderly-Appropriate Language**: Simpler vocabulary, patient tone
- **Step-by-Step Clarity**: Better task breakdown
- **Context Awareness**: App-specific guidance
- **Reduced Jargon**: Less technical terminology

## 🚨 Troubleshooting

### Ollama Issues
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Check available models
ollama list

# Pull model if missing
ollama pull gemma3:4b-instruct-q4_0
```

### Memory Issues
- Use 4B model instead of 27B
- Close other GPU applications
- Monitor with `nvidia-smi`

### Training Issues
- Ensure CUDA installation for GPU training
- Check data format in training JSON
- Monitor VRAM usage during training

## 📈 Roadmap

### Phase 1 (Current) ✅
- [x] Ollama integration with Gemma 3
- [x] Multimodal screenshot analysis
- [x] Training pipeline with Unsloth
- [x] Elderly-friendly UI improvements

### Phase 2 (Future)
- [ ] Advanced conversation memory
- [ ] Multi-language support
- [ ] Caregiver dashboard
- [ ] Progressive Web App deployment
- [ ] Voice-only interaction mode

## 🤝 Contributing

This project is built for the **Google Gemma 3n Impact Challenge**. To contribute:

1. Fork the repository
2. Add training data in `training/data/custom_datasets/`
3. Test with elderly users and gather feedback
4. Submit improvements via pull request

## 📄 License

MIT License - see `LICENSE` file for details.

---

**Built with ❤️ for better digital inclusion using Gemma 3 + Ollama**

*Reducing the digital divide one smartphone lesson at a time*