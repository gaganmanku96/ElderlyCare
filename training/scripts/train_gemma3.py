#!/usr/bin/env python3
"""
Gemma 3 Fine-tuning Script for Elderly Care Assistant
Uses Unsloth for optimized training with reduced VRAM requirements

Compatible with:
- Gemma 3 4B (fits in 12GB VRAM)
- Gemma 3 27B (fits in 22GB VRAM)
- Free Google Colab T4 GPUs
"""

import os
import json
import torch
import pandas as pd
from datasets import Dataset
from transformers import TrainingArguments
from trl import SFTTrainer
from unsloth import FastLanguageModel, is_bfloat16_supported
import argparse

# Model configurations
MODEL_CONFIGS: dict[str, dict[str, any]] = {
    "gemma3-4b": {
        "model_name": "unsloth/gemma-3-4b-it-bnb-4bit",
        "max_seq_length": 2048,
        "load_in_4bit": True
    },
    "gemma3-27b": {
        "model_name": "unsloth/gemma-3-27b-it-bnb-4bit", 
        "max_seq_length": 2048,
        "load_in_4bit": True
    }
}

class ElderlyCareFinetuner:
    def __init__(self, model_size: str = "gemma3-4b", max_seq_length: int | None = None):
        self.model_size = model_size
        self.config = MODEL_CONFIGS[model_size]
        self.max_seq_length = max_seq_length or self.config["max_seq_length"]
        self.model = None
        self.tokenizer = None
        
    def load_model(self):
        """Load the Gemma 3 model with Unsloth optimizations"""
        print(f"Loading {self.model_size} model with Unsloth optimizations...")
        
        self.model, self.tokenizer = FastLanguageModel.from_pretrained(
            model_name=self.config["model_name"],
            max_seq_length=self.max_seq_length,
            dtype=None,  # Auto-detect best dtype
            load_in_4bit=self.config["load_in_4bit"],
        )
        
        # Apply LoRA adapters for memory-efficient fine-tuning
        self.model = FastLanguageModel.get_peft_model(
            self.model,
            r=16,  # LoRA rank
            target_modules=["q_proj", "k_proj", "v_proj", "o_proj",
                          "gate_proj", "up_proj", "down_proj"],
            lora_alpha=16,
            lora_dropout=0,
            bias="none",
            use_gradient_checkpointing="unsloth",  # Unsloth's optimized checkpointing
            random_state=3407,
            use_rslora=False,
            loftq_config=None,
        )
        
        print("Model loaded successfully!")
        return self.model, self.tokenizer
    
    def prepare_training_data(self, data_path: str) -> Dataset:
        """Prepare training dataset from elderly care conversations"""
        print(f"Loading training data from {data_path}")
        
        # Load conversation data
        with open(data_path, 'r', encoding='utf-8') as f:
            conversations = json.load(f)
        
        # Format conversations for training
        formatted_data = []
        for conv in conversations:
            # Format: instruction + input + response
            if 'conversations' in conv:
                for turn in conv['conversations']:
                    formatted_data.append({
                        'instruction': self._build_instruction(conv.get('context', 'general')),
                        'input': turn.get('user_query', ''),
                        'output': turn.get('assistant_response', '')
                    })
        
        # Convert to Hugging Face dataset
        df = pd.DataFrame(formatted_data)
        dataset = Dataset.from_pandas(df)
        
        print(f"Prepared {len(dataset)} training examples")
        return dataset
    
    def _build_instruction(self, context: str) -> str:
        """Build system instruction for elderly care context"""
        base_instruction = """You are a patient, helpful AI assistant designed to help elderly users learn smartphone technology.

Your characteristics:
- Use simple, clear language
- Break tasks into small steps
- Be encouraging and patient
- Avoid technical jargon
- Provide reassurance"""
        
        context_specific = {
            'whatsapp': "Focus on WhatsApp messaging, profile management, and calling features.",
            'phone': "Focus on making calls, managing contacts, and emergency features.",
            'settings': "Focus on accessibility settings, display options, and basic phone configuration.",
            'general': "Provide general smartphone guidance."
        }
        
        return f"{base_instruction}\n\nContext: {context_specific.get(context, context_specific['general'])}"
    
    def format_prompt(self, instruction: str, input_text: str, output: str = "") -> str:
        """Format prompt for Gemma 3 training"""
        if output:
            return f"""<bos><start_of_turn>user
{instruction}

{input_text}<end_of_turn>
<start_of_turn>model
{output}<end_of_turn><eos>"""
        else:
            return f"""<bos><start_of_turn>user
{instruction}

{input_text}<end_of_turn>
<start_of_turn>model
"""
    
    def train(self, 
              train_dataset: Dataset,
              output_dir: str,
              num_train_epochs: int = 3,
              learning_rate: float = 2e-4,
              batch_size: int = 2,
              gradient_accumulation_steps: int = 4):
        """Fine-tune the model on elderly care data"""
        
        # Training arguments optimized for Gemma 3
        training_args = TrainingArguments(
            per_device_train_batch_size=batch_size,
            gradient_accumulation_steps=gradient_accumulation_steps,
            warmup_steps=5,
            num_train_epochs=num_train_epochs,
            learning_rate=learning_rate,
            fp16=not is_bfloat16_supported(),
            bf16=is_bfloat16_supported(),
            logging_steps=1,
            optim="adamw_8bit",
            weight_decay=0.01,
            lr_scheduler_type="linear",
            seed=3407,
            output_dir=output_dir,
            save_strategy="epoch",
            save_total_limit=2,
            dataloader_num_workers=0,  # Prevents multiprocessing issues
            remove_unused_columns=False,
        )
        
        # Initialize trainer with Unsloth optimizations
        trainer = SFTTrainer(
            model=self.model,
            tokenizer=self.tokenizer,
            train_dataset=train_dataset,
            dataset_text_field="text",
            max_seq_length=self.max_seq_length,
            dataset_num_proc=2,
            packing=False,  # Can cause loss to be confused
            args=training_args,
        )
        
        # Format the dataset
        def formatting_prompts_func(examples):
            instructions = examples["instruction"]
            inputs = examples["input"]
            outputs = examples["output"]
            texts = []
            for instruction, input_text, output in zip(instructions, inputs, outputs):
                text = self.format_prompt(instruction, input_text, output)
                texts.append(text)
            return {"text": texts}
        
        train_dataset = train_dataset.map(formatting_prompts_func, batched=True)
        trainer.train_dataset = train_dataset
        
        # Start training
        print("Starting training...")
        trainer.train()
        
        # Save the final model
        print(f"Saving model to {output_dir}")
        trainer.save_model(output_dir)
        
        return trainer
    
    def save_model_formats(self, output_dir: str, model_name: str = "elderly-care-gemma3"):
        """Save model in multiple formats for deployment"""
        print("Saving model in multiple formats...")
        
        # Save to Hugging Face format
        hf_path = f"{output_dir}/{model_name}-hf"
        self.model.save_pretrained(hf_path)
        self.tokenizer.save_pretrained(hf_path)
        
        # Save to GGUF format for Ollama
        gguf_path = f"{output_dir}/{model_name}-gguf"
        self.model.save_pretrained_gguf(gguf_path, tokenizer=self.tokenizer)
        
        # Quantized versions
        self.model.save_pretrained_gguf(
            f"{gguf_path}/q4_0", 
            tokenizer=self.tokenizer, 
            quantization_method="q4_0"
        )
        
        self.model.save_pretrained_gguf(
            f"{gguf_path}/q8_0", 
            tokenizer=self.tokenizer, 
            quantization_method="q8_0"
        )
        
        print(f"Models saved to {output_dir}")

def main():
    parser = argparse.ArgumentParser(description="Fine-tune Gemma 3 for elderly care assistance")
    parser.add_argument("--model_size", choices=["gemma3-4b", "gemma3-27b"], 
                       default="gemma3-4b", help="Model size to use")
    parser.add_argument("--data_path", required=True, help="Path to training data JSON file")
    parser.add_argument("--output_dir", default="./outputs/elderly_care_model", 
                       help="Output directory for trained model")
    parser.add_argument("--epochs", type=int, default=3, help="Number of training epochs")
    parser.add_argument("--learning_rate", type=float, default=2e-4, help="Learning rate")
    parser.add_argument("--batch_size", type=int, default=2, help="Training batch size")
    
    args = parser.parse_args()
    
    # Initialize finetuner
    finetuner = ElderlyCareFinetuner(model_size=args.model_size)
    
    # Load model
    model, tokenizer = finetuner.load_model()
    
    # Prepare data
    train_dataset = finetuner.prepare_training_data(args.data_path)
    
    # Train
    trainer = finetuner.train(
        train_dataset=train_dataset,
        output_dir=args.output_dir,
        num_train_epochs=args.epochs,
        learning_rate=args.learning_rate,
        batch_size=args.batch_size
    )
    
    # Save in multiple formats
    finetuner.save_model_formats(args.output_dir)
    
    print("Training completed successfully!")

if __name__ == "__main__":
    main()