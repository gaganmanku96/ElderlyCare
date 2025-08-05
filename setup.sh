#!/bin/bash
# Elderly Care Assistant - Complete Setup Script
# Installs Ollama, downloads Gemma 3 models, and prepares the development environment

set -e  # Exit on any error

echo "🚀 Elderly Care Assistant - Complete Setup"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if running on supported system
check_system() {
    print_info "Checking system compatibility..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    
    print_status "Detected OS: $OS"
}

# Install Ollama
install_ollama() {
    print_info "Installing Ollama..."
    
    if command -v ollama &> /dev/null; then
        print_status "Ollama already installed"
        ollama --version
        return
    fi
    
    if [[ "$OS" == "linux" ]]; then
        curl -fsSL https://ollama.com/install.sh | sh
    elif [[ "$OS" == "macos" ]]; then
        print_info "Please download Ollama from https://ollama.com/download"
        print_warning "After installation, press Enter to continue..."
        read -r
    fi
    
    # Verify installation
    if command -v ollama &> /dev/null; then
        print_status "Ollama installed successfully"
    else
        print_error "Ollama installation failed"
        exit 1
    fi
}

# Start Ollama service
start_ollama() {
    print_info "Starting Ollama service..."
    
    # Check if already running
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        print_status "Ollama is already running"
        return
    fi
    
    # Start Ollama in background
    if [[ "$OS" == "linux" ]]; then
        systemctl --user start ollama || ollama serve &
    elif [[ "$OS" == "macos" ]]; then
        ollama serve &
    fi
    
    # Wait for service to start
    echo -n "Waiting for Ollama to start"
    for i in {1..30}; do
        if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
            echo ""
            print_status "Ollama service started"
            return
        fi
        echo -n "."
        sleep 1
    done
    
    echo ""
    print_error "Ollama failed to start within 30 seconds"
    exit 1
}

# Download Gemma 3 models
download_models() {
    print_info "Downloading Gemma 3 models..."
    
    # Check available models
    available_models=$(ollama list | grep gemma3 || true)
    
    if echo "$available_models" | grep -q "gemma3.*4b"; then
        print_status "Gemma 3 4B model already available"
    else
        print_info "Downloading Gemma 3 4B model (Q4 quantized)..."
        if ollama pull hf.co/google/gemma-3-4b-it-qat-q4_0-gguf; then
            print_status "Gemma 3 4B model downloaded"
        else
            print_warning "Failed to download official Q4 model, trying alternative..."
            ollama pull gemma3:4b-instruct-q4_0 || print_error "Failed to download Gemma 3 4B model"
        fi
    fi
    
    # Ask about 27B model
    echo ""
    read -p "Download Gemma 3 27B model? (requires ~14GB VRAM) [y/N]: " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Downloading Gemma 3 27B model (Q4 quantized)..."
        if ollama pull hf.co/google/gemma-3-27b-it-qat-q4_0-gguf; then
            print_status "Gemma 3 27B model downloaded"
        else
            print_warning "Failed to download official Q4 model, trying alternative..."
            ollama pull gemma3:27b-instruct-q4_0 || print_warning "Failed to download Gemma 3 27B model"
        fi
    fi
}

# Setup frontend
setup_frontend() {
    print_info "Setting up React frontend..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js 16+ and npm"
        print_info "Visit: https://nodejs.org/"
        exit 1
    fi
    
    cd app
    
    print_info "Installing frontend dependencies..."
    npm install
    
    print_status "Frontend setup complete"
    cd ..
}

# Setup training environment
setup_training() {
    print_info "Setting up training environment..."
    
    if ! command -v python3 &> /dev/null; then
        print_warning "Python 3 not found. Training features will not be available."
        return
    fi
    
    cd training
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_info "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    print_info "Activating virtual environment and installing dependencies..."
    source venv/bin/activate
    pip install -r requirements.txt
    
    # Prepare sample data
    print_info "Preparing sample training data..."
    python scripts/prepare_data.py --output data/training_conversations.json
    
    print_status "Training environment setup complete"
    cd ..
}

# Setup API server (optional)
setup_api() {
    read -p "Setup optional FastAPI server? [y/N]: " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    print_info "Setting up FastAPI server..."
    
    cd api
    
    if [ ! -d "venv" ]; then
        print_info "Creating API virtual environment..."
        python3 -m venv venv
    fi
    
    source venv/bin/activate
    pip install -r requirements.txt
    
    print_status "FastAPI server setup complete"
    print_info "API documentation will be available at: http://localhost:8000/docs"
    cd ..
}

# Test integration
test_integration() {
    print_info "Testing Ollama integration..."
    
    # Test basic API
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        print_status "Ollama API responding"
    else
        print_error "Ollama API not responding"
        return
    fi
    
    # List available models
    print_info "Available models:"
    ollama list | grep -E "(NAME|gemma)" || print_warning "No Gemma models found"
    
    # Test a simple generation
    print_info "Testing model generation..."
    echo '{"model":"gemma3:4b-instruct-q4_0","prompt":"Hello, how are you?"}' | \
        curl -s -X POST http://localhost:11434/api/generate \
        -H "Content-Type: application/json" \
        -d @- > /dev/null && print_status "Model generation test passed" || print_warning "Model generation test failed"
}

# Print final instructions
print_instructions() {
    echo ""
    echo "🎉 Setup Complete!"
    echo "=================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Start the frontend:"
    echo "   cd app && npm run dev"
    echo ""
    echo "2. Open http://localhost:5173 in your browser"
    echo ""
    echo "3. Click the red assistant button and ask:"
    echo "   'How do I change my WhatsApp profile picture?'"
    echo ""
    echo "4. (Optional) Train a custom model:"
    echo "   cd training && source venv/bin/activate"
    echo "   python scripts/train_gemma3.py --data_path data/training_conversations.json"
    echo ""
    echo "5. (Optional) Start FastAPI server:"
    echo "   cd api && source venv/bin/activate && uvicorn server:app --reload"
    echo "   API docs: http://localhost:8000/docs"
    echo ""
    echo "📚 Documentation:"
    echo "   - Project details: CLAUDE.md"
    echo "   - Training guide: training/README.md"
    echo ""
    print_status "Happy coding! 🚀"
}

# Main execution
main() {
    check_system
    install_ollama
    start_ollama
    download_models
    setup_frontend
    setup_training
    setup_api
    test_integration
    print_instructions
}

# Run main function
main "$@"