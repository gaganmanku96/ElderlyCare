import React, { useState } from 'react';
import styled from 'styled-components';
import { AndroidButton, AndroidNavigationBar } from '../android';
import { Mic, Camera, Volume2, Monitor } from 'lucide-react';
import { analyzeScreenshotAndQuery, captureScreenshot } from '../../services/aiService';

const AssistantContainer = styled.div`
  height: 100%;
  background: #ffffff;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px;
  padding-bottom: 76px;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  color: #333;
  margin-bottom: 8px;
`;

const Subtitle = styled.p`
  font-size: 16px;
  color: #666;
  line-height: 1.5;
`;

const ActionSection = styled.div`
  margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  color: #333;
  margin-bottom: 12px;
`;

const ButtonGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const ConversationArea = styled.div`
  flex: 1;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  max-height: 300px;
  overflow-y: auto;
`;

const Message = styled.div<{ $isUser?: boolean }>`
  margin-bottom: 12px;
  padding: 12px;
  border-radius: 12px;
  background: ${props => props.$isUser ? '#e3f2fd' : '#ffffff'};
  border: 1px solid ${props => props.$isUser ? '#bbdefb' : '#e0e0e0'};
`;

const MessageText = styled.p`
  margin: 0;
  color: #333;
  line-height: 1.4;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface AssistantScreenProps {
  onBack: () => void;
  elderlyMode?: boolean;
  currentContext?: string; // Current app context for better responses
}

export const AssistantScreen: React.FC<AssistantScreenProps> = ({
  onBack,
  elderlyMode = false,
  currentContext
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      text: "Hello! I'm here to help you with your phone. You can ask me questions by voice, or show me a photo of your screen if you're having trouble with something.",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        const newUserMessage: Message = {
          text: transcript,
          isUser: true,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setIsAnalyzing(true);

        try {
          // Use the AI service to analyze the query with context
          const response = await analyzeScreenshotAndQuery(transcript, currentContext, false);
          
          const aiMessage: Message = {
            text: response.guidance,
            isUser: false,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, aiMessage]);
          
          // Text-to-speech for the response
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(response.guidance);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
          }
        } catch (error) {
          console.error('Analysis error:', error);
          const errorMessage: Message = {
            text: "I'm sorry, I had trouble understanding that. Could you please try again?",
            isUser: false,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsAnalyzing(false);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition is not supported in your browser.');
    }
  };

  const handleRealScreenshot = async () => {
    setIsAnalyzing(true);
    
    const userMessage: Message = {
      text: "I need help with what I'm currently seeing on my screen.",
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);

    try {
      const screenshot = await captureScreenshot();
      
      if (screenshot) {
        // Analyze the real screenshot
        const response = await analyzeScreenshotAndQuery(
          "What am I looking at on this screen? Please explain what I can do here.",
          currentContext,
          false // Don't capture again, we already have the screenshot
        );
        
        const aiMessage: Message = {
          text: `I can see your screen! ${response.guidance}`,
          isUser: false,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        
        // Text-to-speech for the response
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(aiMessage.text);
          utterance.rate = 0.8;
          speechSynthesis.speak(utterance);
        }
      } else {
        throw new Error('Screenshot capture failed');
      }
    } catch (error) {
      console.error('Screenshot analysis error:', error);
      
      const errorMessage: Message = {
        text: "I wasn't able to capture your screen. You can try uploading a photo instead, or just tell me what you're looking at and I'll try to help!",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsAnalyzing(true);
      
      const reader = new FileReader();
      reader.onload = async () => {
        // Image upload processing would happen here in a real implementation
        
        const userMessage: Message = {
          text: "I uploaded a photo of my screen. Can you help me understand what I'm looking at?",
          isUser: true,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);

        try {
          // Analyze the uploaded image
          const response = await analyzeScreenshotAndQuery(
            "What am I looking at in this screenshot? Please explain what I can do here.",
            currentContext,
            false
          );
          
          const aiMessage: Message = {
            text: `I can see your screen photo! ${response.guidance}`,
            isUser: false,
            timestamp: new Date()
          };

          setMessages(prev => [...prev, aiMessage]);
          
          // Text-to-speech for the response
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(aiMessage.text);
            utterance.rate = 0.8;
            speechSynthesis.speak(utterance);
          }
        } catch (error) {
          console.error('Image analysis error:', error);
          
          const errorMessage: Message = {
            text: "I can see your photo, but I'm having trouble analyzing it right now. Can you tell me what you're trying to do and I'll try to help?",
            isUser: false,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };


  return (
    <AssistantContainer>
      <Header>
        <Title>Phone Assistant</Title>
        <Subtitle>I'm here to help you use your phone easily and safely</Subtitle>
      </Header>

      <ConversationArea>
        {messages.map((message, index) => (
          <Message key={index} $isUser={message.isUser}>
            <MessageText>{message.text}</MessageText>
          </Message>
        ))}
      </ConversationArea>

      <ActionSection>
        <SectionTitle>How can I help you?</SectionTitle>
        <ButtonGrid>
          <AndroidButton
            elderly={elderlyMode}
            primary
            onClick={handleVoiceInput}
            disabled={isListening || isAnalyzing}
            icon={<Mic size={elderlyMode ? 24 : 20} />}
          >
            {isListening ? 'Listening...' : isAnalyzing ? 'Thinking...' : 'Ask me a question'}
          </AndroidButton>

          <AndroidButton
            elderly={elderlyMode}
            onClick={handleRealScreenshot}
            disabled={isAnalyzing}
            icon={<Monitor size={elderlyMode ? 24 : 20} />}
          >
            {isAnalyzing ? 'Analyzing...' : 'Capture my screen'}
          </AndroidButton>

          <AndroidButton
            elderly={elderlyMode}
            onClick={() => document.getElementById('photo-upload')?.click()}
            disabled={isAnalyzing}
            icon={<Camera size={elderlyMode ? 24 : 20} />}
          >
            Upload a photo
          </AndroidButton>

          <HiddenFileInput
            id="photo-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
          />

          <AndroidButton
            elderly={elderlyMode}
            onClick={() => {
              const lastAiMessage = messages.filter(m => !m.isUser).pop();
              if (lastAiMessage && 'speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(lastAiMessage.text);
                utterance.rate = 0.8;
                speechSynthesis.speak(utterance);
              }
            }}
            icon={<Volume2 size={elderlyMode ? 24 : 20} />}
          >
            Repeat last answer
          </AndroidButton>
        </ButtonGrid>
      </ActionSection>

      <AndroidNavigationBar
        showBack
        onBackPress={onBack}
        onHomePress={onBack}
      />
    </AssistantContainer>
  );
};