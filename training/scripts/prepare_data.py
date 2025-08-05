#!/usr/bin/env python3
"""
Data preparation script for Gemma 3 elderly care assistant training
Converts various data sources into the format expected by the training script
"""

import json
import argparse
from pathlib import Path

# Optional pandas import for CSV functionality
try:
    import pandas as pd
    HAS_PANDAS = True
except ImportError:
    HAS_PANDAS = False

class ElderlyDataProcessor:
    def __init__(self):
        self.conversations = []
        
    def add_conversation(self, 
                        context: str,
                        user_query: str, 
                        assistant_response: str,
                        metadata: dict[str, any] | None = None):
        """Add a single conversation turn"""
        conversation = {
            'context': context,
            'conversations': [{
                'user_query': user_query,
                'assistant_response': assistant_response,
                'metadata': metadata or {}
            }]
        }
        self.conversations.append(conversation)
    
    def add_multi_turn_conversation(self, 
                                  context: str,
                                  turns: list[dict[str, str]],
                                  metadata: dict[str, any] | None = None):
        """Add a multi-turn conversation"""
        conversation = {
            'context': context,
            'conversations': turns,
            'metadata': metadata or {}
        }
        self.conversations.append(conversation)
    
    def load_sample_elderly_data(self):
        """Load sample training data for elderly smartphone assistance"""
        
        # WhatsApp guidance samples
        whatsapp_samples = [
            {
                'context': 'whatsapp',
                'user_query': 'How do I change my WhatsApp profile picture?',
                'assistant_response': '''I'll help you change your WhatsApp profile picture step by step:

1. Open WhatsApp on your phone
2. Look for three dots in the top-right corner and tap them
3. Tap "Settings" from the menu
4. Tap on your name at the top of the settings page
5. Tap on your current profile picture
6. Choose "Camera" to take a new photo or "Gallery" to pick an existing one
7. If you chose Gallery, find the photo you want and tap it
8. Adjust the crop by moving the square around your face
9. Tap "Done" or the checkmark to save

Don't worry if it takes a few tries - this is normal! The most important thing is to tap your profile picture in settings to start the process.'''
            },
            {
                'context': 'whatsapp',
                'user_query': 'I want to send a message to my daughter but I can\'t find her name',
                'assistant_response': '''I understand - let me help you find your daughter's chat:

1. Open WhatsApp (the green app with a white phone icon)
2. You'll see a list of your recent conversations
3. If you don't see her name, look for a magnifying glass icon at the top - tap it
4. Type your daughter's name slowly and carefully
5. Her name should appear below as you type
6. Tap on her name when you see it
7. Now you can type your message in the box at the bottom
8. Tap the green arrow button to send

If you still can't find her, she might be further down in your chat list. You can scroll down slowly to look for her name. Remember, the most recent conversations appear at the top.'''
            }
        ]
        
        # Phone/calling guidance samples
        phone_samples = [
            {
                'context': 'phone',
                'user_query': 'How do I call my doctor in an emergency?',
                'assistant_response': '''For emergency calls to your doctor, here's the safest way:

1. Find the Phone app on your home screen (usually has a green phone icon)
2. Tap to open it
3. Look for "Contacts" at the bottom and tap it
4. You should see "Emergency Contacts" at the top with red heart symbols
5. Find your doctor's name in this emergency section
6. Tap the red phone button next to their name

IMPORTANT: If this is a life-threatening emergency, call 911 first by:
- Opening the Phone app
- Tapping "Dial" 
- Typing 9-1-1
- Tapping the green call button

Your doctor's emergency contact should only be used for urgent medical questions, not life-threatening situations. When in doubt, always call 911 first.'''
            },
            {
                'context': 'phone',
                'user_query': 'The phone is ringing but I don\'t know how to answer it',
                'assistant_response': '''Don't panic! Here's how to answer your phone:

1. When you see the incoming call screen, look for a green phone icon
2. If you see a green button, tap it once
3. If you see a green circle, swipe it to the right
4. Put the phone up to your ear to talk

To end the call when you're done:
1. Look for a red phone icon or red circle
2. Tap it once to hang up

TIPS:
- Answer within the first few rings if possible
- If you miss the call, don't worry - they can call back
- Speak clearly and hold the phone close to your ear
- If you accidentally hang up, you can call them back using the recent calls list

Practice makes perfect - don't worry if it feels awkward at first!'''
            }
        ]
        
        # Settings/accessibility samples
        settings_samples = [
            {
                'context': 'settings',
                'user_query': 'The text on my phone is too small, how do I make it bigger?',
                'assistant_response': '''I'll help you make the text larger so it's easier to read:

1. Find the "Settings" app on your phone (looks like a gear or cog)
2. Tap to open Settings
3. Look for "Display" or "Display & Brightness" and tap it
4. Find "Text Size" or "Font Size" and tap it
5. You'll see a slider with "A" letters - the bigger A makes text larger
6. Move the slider to the right to make text bigger
7. You'll see a preview showing how the text will look
8. When you're happy with the size, you can go back

ALTERNATIVE PATH:
1. Go to Settings
2. Look for "Accessibility" and tap it
3. Find "Display & Text Size"
4. Choose "Larger Text"
5. Turn on "Larger Accessibility Sizes" for even bigger text

The text will now be larger in most of your apps, making everything easier to read!'''
            }
        ]
        
        # Add all samples
        for sample in whatsapp_samples + phone_samples + settings_samples:
            self.add_conversation(
                context=sample['context'],
                user_query=sample['user_query'],
                assistant_response=sample['assistant_response']
            )
        
        # Add some multi-turn conversations
        multi_turn_sample = {
            'context': 'whatsapp',
            'turns': [
                {
                    'user_query': 'I opened WhatsApp but I don\'t see any messages',
                    'assistant_response': 'That\'s okay! If you don\'t see messages, it might mean you haven\'t received any recently, or they might be in a different tab. Do you see any tabs at the bottom like "Chats", "Status", or "Calls"?'
                },
                {
                    'user_query': 'I see "Chats" at the bottom',
                    'assistant_response': 'Perfect! Tap on "Chats" and that should show you all your message conversations. If you still don\'t see any messages, that just means no one has sent you messages recently. Would you like me to help you send a message to someone?'
                },
                {
                    'user_query': 'Yes, I want to message my son',
                    'assistant_response': 'Great! To message your son: 1) Look for a green circular button with a message icon (usually in the bottom-right corner), 2) Tap it, 3) Look for your son\'s name in the contact list, 4) Tap his name, 5) Type your message in the box at the bottom, 6) Tap the green send arrow. Let me know if you get stuck on any step!'
                }
            ]
        }
        
        self.add_multi_turn_conversation(
            context=multi_turn_sample['context'],
            turns=multi_turn_sample['turns']
        )
    
    def save_to_json(self, filepath: str):
        """Save conversations to JSON file"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(self.conversations, f, indent=2, ensure_ascii=False)
        
        print(f"Saved {len(self.conversations)} conversations to {filepath}")
    
    def load_from_csv(self, filepath: str, 
                     context_col: str = 'context',
                     query_col: str = 'user_query', 
                     response_col: str = 'assistant_response'):
        """Load conversations from CSV file"""
        if not HAS_PANDAS:
            print("Warning: pandas not installed, CSV loading not available")
            return
        
        df = pd.read_csv(filepath)
        
        for _, row in df.iterrows():
            self.add_conversation(
                context=row[context_col],
                user_query=row[query_col],
                assistant_response=row[response_col]
            )
        
        print(f"Loaded {len(df)} conversations from CSV")
    
    def get_statistics(self):
        """Get statistics about the loaded data"""
        if not self.conversations:
            return "No conversations loaded"
        
        contexts = {}
        total_turns = 0
        
        for conv in self.conversations:
            context = conv['context']
            contexts[context] = contexts.get(context, 0) + 1
            total_turns += len(conv['conversations'])
        
        stats = f"""Training Data Statistics:
        Total conversations: {len(self.conversations)}
        Total turns: {total_turns}
        Average turns per conversation: {total_turns / len(self.conversations):.1f}
        
        Contexts:"""
        
        for context, count in contexts.items():
            stats += f"\n        - {context}: {count} conversations"
        
        return stats

def main():
    parser = argparse.ArgumentParser(description="Prepare training data for elderly care assistant")
    parser.add_argument("--output", "-o", default="./data/training_conversations.json",
                       help="Output JSON file path")
    parser.add_argument("--csv_input", help="Optional: Load additional data from CSV file")
    parser.add_argument("--sample_data", action="store_true", default=True,
                       help="Include sample elderly care conversations")
    
    args = parser.parse_args()
    
    # Initialize processor
    processor = ElderlyDataProcessor()
    
    # Load sample data
    if args.sample_data:
        print("Loading sample elderly care conversations...")
        processor.load_sample_elderly_data()
    
    # Load additional CSV data if provided
    if args.csv_input:
        print(f"Loading additional data from {args.csv_input}")
        processor.load_from_csv(args.csv_input)
    
    # Print statistics
    print(processor.get_statistics())
    
    # Save to JSON
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    processor.save_to_json(args.output)
    
    print(f"\nTraining data prepared successfully!")
    print(f"Use this file with: python train_gemma3.py --data_path {args.output}")

if __name__ == "__main__":
    main()