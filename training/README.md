# Elderly Care Assistant - Training Pipeline

This directory contains the Unsloth-based training pipeline for fine-tuning Gemma 3 models on elderly smartphone assistance data.

## 🎯 Training Overview

### Supported Models
- **Gemma 3 4B**: Fits in 12GB VRAM (works on free Google Colab)
- **Gemma 3 27B**: Fits in 22GB VRAM (requires paid Colab Pro or local GPU)

### Memory Requirements
- **4B model**: ~12GB VRAM with Unsloth optimizations
- **27B model**: ~22GB VRAM with Unsloth optimizations
- **Training data**: Minimal RAM requirements due to streaming

## 🚀 Quick Start

### 1. Setup Environment

```bash
# Install requirements
pip install -r requirements.txt

# Or for Google Colab:
!pip install -q -U unsloth
!pip install -q -U torch transformers datasets trl
```

### 2. Prepare Training Data

```bash
# Generate sample elderly care conversations
python scripts/prepare_data.py --output data/training_conversations.json

# Or add your own CSV data:
python scripts/prepare_data.py --csv_input your_data.csv --output data/training_conversations.json
```

### 3. Start Training

```bash
# Train 4B model (recommended for most users)
python scripts/train_gemma3.py \
    --model_size gemma3-4b \
    --data_path data/training_conversations.json \
    --output_dir outputs/elderly_care_gemma3_4b \
    --epochs 3

# Train 27B model (requires more VRAM)
python scripts/train_gemma3.py \
    --model_size gemma3-27b \
    --data_path data/training_conversations.json \
    --output_dir outputs/elderly_care_gemma3_27b \
    --epochs 2
```

## 📁 Directory Structure

```
training/
├── scripts/
│   ├── train_gemma3.py          # Main training script
│   ├── prepare_data.py          # Data preparation utility
│   └── evaluate_model.py        # Model evaluation (coming soon)
├── data/
│   ├── training_conversations.json  # Prepared training data
│   ├── validation_set.json          # Validation data
│   └── custom_datasets/             # Your additional datasets
├── models/                      # Downloaded base models
├── outputs/                     # Training outputs
│   ├── elderly_care_gemma3_4b/     # 4B fine-tuned model
│   ├── elderly_care_gemma3_27b/    # 27B fine-tuned model
│   └── checkpoints/                # Training checkpoints
├── requirements.txt             # Python dependencies
└── README.md                   # This file
```

## 📊 Training Data Format

The training script expects JSON data in this format:

```json
[
  {
    "context": "whatsapp",
    "conversations": [
      {
        "user_query": "How do I change my WhatsApp profile picture?",
        "assistant_response": "I'll help you change your WhatsApp profile picture step by step...",
        "metadata": {}
      }
    ]
  }
]
```

### Context Types
- `"whatsapp"`: WhatsApp messaging and features
- `"phone"`: Calling, contacts, and phone functions  
- `"settings"`: System settings and accessibility
- `"general"`: General smartphone guidance

## 🔧 Training Configuration

### Default Hyperparameters
- **Learning Rate**: 2e-4 (optimized for Gemma 3)
- **Batch Size**: 2 (memory efficient)
- **Gradient Accumulation**: 4 steps
- **LoRA Rank**: 16
- **Max Sequence Length**: 2048 tokens
- **Epochs**: 3 for 4B, 2 for 27B

### Memory Optimizations
- **4-bit quantization** during training
- **LoRA adapters** instead of full fine-tuning
- **Gradient checkpointing** with Unsloth optimizations
- **Mixed precision** (bf16/fp16)

## 📤 Output Formats

After training, models are saved in multiple formats:

1. **Hugging Face format** (`-hf/`): For deployment with transformers
2. **GGUF format** (`-gguf/`): For Ollama deployment
   - `q4_0/`: 4-bit quantized (smallest size)
   - `q8_0/`: 8-bit quantized (better quality)

## 🔄 Deployment Integration

### To Ollama
```bash
# Copy GGUF model to Ollama
cp outputs/elderly_care_gemma3_4b-gguf/q4_0/* ~/.ollama/models/

# Create Ollama modelfile
echo "FROM ./elderly_care_gemma3_4b.gguf" > Modelfile
ollama create elderly-care-assistant -f Modelfile
```

### Update Frontend
Update `app/src/services/aiService.ts`:
```typescript
const GEMMA_MODEL = 'elderly-care-assistant'; // Your fine-tuned model
```

## 🎯 Training Tips

### For Google Colab
- Use **Colab Pro** for 27B models
- Enable **High-RAM** runtime
- Monitor GPU memory with `!nvidia-smi`
- Save checkpoints frequently

### For Local Training
- Monitor VRAM usage with `nvidia-smi`
- Reduce batch size if running out of memory
- Use `CUDA_VISIBLE_DEVICES` for multi-GPU setups

### Data Quality
- Focus on **clear, patient explanations**
- Use **simple language** appropriate for elderly users
- Include **step-by-step instructions**
- Cover **common smartphone tasks**

## 🔍 Model Evaluation

Evaluate your trained model:

```python
from scripts.train_gemma3 import ElderlyCareFinetuner

# Load trained model
finetuner = ElderlyCareFinetuner()
model, tokenizer = finetuner.load_model()

# Test with elderly-specific queries
test_queries = [
    "How do I answer my phone?",
    "I can't find my messages",
    "How do I make the text bigger?"
]
```

## 📈 Performance Expectations

### Training Time
- **4B model**: ~2-4 hours on T4 GPU
- **27B model**: ~6-12 hours on A100 GPU

### Model Quality
- **Fine-tuned models** should show improved:
  - Patient, elderly-appropriate language
  - Step-by-step instruction clarity
  - Context-aware smartphone guidance
  - Reduced technical jargon

## 🤝 Contributing Training Data

To improve the model, contribute more elderly care conversations:

1. Add conversations to `data/custom_datasets/`
2. Use the CSV format with columns: `context`, `user_query`, `assistant_response`
3. Follow the patient, step-by-step response style
4. Test with the data preparation script

## 🚨 Troubleshooting

### Memory Issues
- Reduce `batch_size` and increase `gradient_accumulation_steps`
- Use 4B model instead of 27B
- Enable gradient checkpointing

### Training Errors
- Check data format matches expected JSON structure
- Verify CUDA installation for GPU training
- Update transformers and unsloth to latest versions

### Slow Training
- Ensure GPU is being used (`torch.cuda.is_available()`)
- Check if using optimized data types (bf16/fp16)
- Monitor GPU utilization with `nvidia-smi`