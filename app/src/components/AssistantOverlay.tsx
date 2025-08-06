import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { X, Mic, Volume2, Camera, Loader, Trash2 } from 'lucide-react';
import { AndroidButton } from './android';
import { captureScreenshot, analyzeWithScreenshotData } from '../services/aiService';
import { conversationService } from '../services/conversationService';
import { speakText, stopSpeaking } from '../utils/voiceUtils';
import { useScreenshotCapture } from '../hooks/useScreenshotCapture';
import { useScreenState } from '../contexts/ScreenStateContext';
import type { Message } from '../types/conversation';

const Overlay = styled.div<{ $show?: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  opacity: ${props => props.$show ? '1' : '0'};
  visibility: ${props => props.$show ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
  padding: 16px;

  /* Global animations */
  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Accessibility improvements */
  &:focus-within {
    outline: none; /* Remove default outline, we handle it on individual elements */
  }
`;

const OverlayContent = styled.div<{ $elderly?: boolean }>`
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  width: 95%;
  height: 85%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;

  ${props => props.$elderly && `
    border: 2px solid #2196F3;
  `}
`;

const CloseButton = styled.button<{ $elderly?: boolean }>`
  position: absolute;
  top: ${props => props.$elderly ? '16px' : '12px'};
  right: ${props => props.$elderly ? '16px' : '12px'};
  min-width: ${props => props.$elderly ? '100px' : '80px'};
  height: ${props => props.$elderly ? '56px' : '44px'};
  border-radius: ${props => props.$elderly ? '28px' : '22px'};
  background: #d32f2f;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.$elderly ? '8px' : '6px'};
  font-size: ${props => props.$elderly ? '18px' : '14px'};
  font-weight: 600;
  z-index: 1001;
  transition: all 0.2s ease;
  padding: 0 ${props => props.$elderly ? '16px' : '12px'};
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.3);

  &:hover {
    background: #b71c1c;
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(211, 47, 47, 0.4);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(211, 47, 47, 0.3);
  }

  &:focus {
    outline: 3px solid #ffeb3b;
    outline-offset: 2px;
  }
`;

const ScreenshotSection = styled.div<{ $elderly?: boolean; $ratio: number }>`
  flex-shrink: 0;
  flex-grow: 0;
  height: ${props => `${props.$ratio * 100}%`};
  min-height: ${props => props.$elderly ? '140px' : '120px'};
  max-height: ${props => props.$elderly ? '350px' : '300px'};
  background: linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%);
  padding: ${props => props.$elderly ? '20px 16px' : '16px 12px'};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  transition: height 0.1s ease-out;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #4285f4, #34a853, #fbbc04, #ea4335);
  }
`;

const ScreenshotContainer = styled.div<{ $elderly?: boolean }>`
  width: 100%;
  min-width: ${props => props.$elderly ? '80px' : '60px'};
  max-width: ${props => props.$elderly ? '200px' : '160px'};
  aspect-ratio: 9/16;
  background: #f5f5f5;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  margin: 0 auto ${props => props.$elderly ? '12px' : '10px'};
  position: relative;
  border: 2px solid #e8eaed;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: scale(1.02);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
    border-color: #4285f4;
  }
`;

const ScreenshotImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  background: #ffffff;
`;

const ScreenshotPlaceholder = styled.div<{ $elderly?: boolean }>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #616161;
  font-size: ${props => props.$elderly ? '16px' : '14px'};
  font-weight: 500;
  text-align: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f5f5 0%, #eeeeee 100%);
`;

const LoadingSpinner = styled.div`
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Make sure spinner icon has spinning animation too */
  &.spin {
    animation: spin 1s linear infinite;
  }
`;

const Resizer = styled.div<{ $elderly?: boolean }>`
  height: ${props => props.$elderly ? '8px' : '6px'};
  background: #e8eaed;
  cursor: ns-resize;
  position: relative;
  border-top: 1px solid #dadce0;
  border-bottom: 1px solid #dadce0;
  transition: background-color 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: #4285f4;
  }

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 2px;
    background: #5f6368;
    border-radius: 1px;
  }

  &:hover::before {
    background: white;
  }
`;

const ChatSection = styled.div<{ $elderly?: boolean; $ratio: number }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0; /* Allows flex item to shrink */
  padding: 16px;
  padding-bottom: 0; /* ButtonGrid will handle its own padding */
  background: #ffffff;
  position: relative;
  overflow: hidden; /* Important for ConversationArea's internal scrolling */
  height: ${props => `${(1 - props.$ratio) * 100}%`};

  /* Ensure voice buttons are always visible */
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #4caf50, #2196f3);
    opacity: 0.4;
  }
`;


const ConversationArea = styled.div<{ $elderly?: boolean }>`
  flex: 1;
  min-height: 0; /* Allows flex item to shrink below content size and enable scrolling */
  background: #f8f9fa;
  border-radius: 12px;
  padding: ${props => props.$elderly ? '16px' : '12px'};
  margin-bottom: 8px; /* Minimal margin for StatusText spacing */
  overflow-y: auto;
  border: 2px solid #e8eaed;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);

  /* Custom scrollbar for better UX */
  &::-webkit-scrollbar {
    width: ${props => props.$elderly ? '12px' : '8px'};
  }

  &::-webkit-scrollbar-track {
    background: #f1f3f4;
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb {
    background: #c1c8cd;
    border-radius: 6px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: #9aa0a6;
  }
`;

const Message = styled.div<{ $isUser?: boolean; $elderly?: boolean }>`
  margin-bottom: ${props => props.$elderly ? '16px' : '12px'};
  padding: ${props => props.$elderly ? '16px' : '12px'};
  border-radius: 16px;
  background: ${props => props.$isUser 
    ? 'linear-gradient(135deg, #e3f2fd 0%, #e1f5fe 100%)' 
    : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)'
  };
  border: 2px solid ${props => props.$isUser ? '#90caf9' : '#e8eaed'};
  font-size: ${props => props.$elderly ? '20px' : '18px'};
  line-height: 1.6;
  font-weight: 400;
  color: #1a1a1a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;
  word-wrap: break-word;

  ${props => props.$isUser && `
    margin-left: 20%;
    &::after {
      content: '👤';
      position: absolute;
      top: -8px;
      right: 8px;
      font-size: 14px;
      background: #ffffff;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  `}

  ${props => !props.$isUser && `
    margin-right: 20%;
    &::after {
      content: '🤖';
      position: absolute;
      top: -8px;
      left: 8px;
      font-size: 14px;
      background: #ffffff;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
  `}
`;

const ButtonGrid = styled.div<{ $elderly?: boolean }>`
  display: flex;
  flex-direction: ${props => props.$elderly ? 'column' : 'row'};
  gap: ${props => props.$elderly ? '12px' : '8px'};
  align-items: stretch;
  flex-shrink: 0; /* Prevent buttons from shrinking */
  flex-grow: 0; /* Prevent buttons from growing */
  padding: 16px;
  border-top: 2px solid #e8eaed;
  background: #ffffff;

  > * {
    flex: ${props => props.$elderly ? 'none' : '1'};
    height: ${props => props.$elderly ? '72px' : '60px'};
    font-size: ${props => props.$elderly ? '20px' : '18px'};
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.2s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    &:active {
      transform: translateY(0);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }
  }
`;

const StatusText = styled.div<{ $elderly?: boolean; $isVisible?: boolean }>`
  height: ${props => props.$isVisible ? '40px' : '0'};
  opacity: ${props => props.$isVisible ? 1 : 0};
  overflow: hidden;
  transition: height 0.3s ease-out, opacity 0.3s ease-out;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(33, 150, 243, 0.1);
  color: #1976d2;
  font-size: ${props => props.$elderly ? '16px' : '14px'};
  font-weight: 600;
  margin: 8px 0;
  border-radius: 8px;
  flex-shrink: 0;
  
  ${props => props.$isVisible && `
    animation: pulse 1.5s ease-in-out infinite;
  `}

  @keyframes pulse {
    0%, 100% { 
      opacity: 1; 
    }
    50% { 
      opacity: 0.7; 
    }
  }
`;

const ScreenshotLabel = styled.p<{ $elderly?: boolean }>`
  font-size: ${props => props.$elderly ? '16px' : '14px'};
  color: #5f6368;
  text-align: center;
  margin: ${props => props.$elderly ? '8px 0' : '6px 0'};
  font-weight: 600;
`;


const ClearChatButton = styled.button<{ $elderly?: boolean }>`
  position: absolute;
  top: ${props => props.$elderly ? '16px' : '12px'};
  left: ${props => props.$elderly ? '16px' : '12px'};
  min-width: ${props => props.$elderly ? '120px' : '100px'};
  height: ${props => props.$elderly ? '40px' : '32px'};
  border-radius: ${props => props.$elderly ? '20px' : '16px'};
  background: #ff9800;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${props => props.$elderly ? '6px' : '4px'};
  font-size: ${props => props.$elderly ? '14px' : '12px'};
  font-weight: 600;
  z-index: 1001;
  transition: all 0.2s ease;
  padding: 0 ${props => props.$elderly ? '12px' : '8px'};
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);

  &:hover {
    background: #f57c00;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 6px rgba(255, 152, 0, 0.3);
  }

  &:focus {
    outline: 3px solid #ffeb3b;
    outline-offset: 2px;
  }
`;

const ConfirmDialog = styled.div<{ $show?: boolean; $elderly?: boolean }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 16px;
  padding: ${props => props.$elderly ? '24px' : '20px'};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1002;
  min-width: ${props => props.$elderly ? '300px' : '260px'};
  opacity: ${props => props.$show ? '1' : '0'};
  visibility: ${props => props.$show ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
  border: 3px solid #ff9800;

  /* Accessibility focus management */
  &:focus-within {
    outline: 4px solid #ffeb3b;
    outline-offset: 2px;
  }

  h3 {
    font-size: ${props => props.$elderly ? '20px' : '18px'};
    color: #1a1a1a;
    margin: 0 0 ${props => props.$elderly ? '16px' : '12px'} 0;
    text-align: center;
    font-weight: 600;
  }

  p {
    font-size: ${props => props.$elderly ? '16px' : '14px'};
    color: #5f6368;
    margin: 0 0 ${props => props.$elderly ? '20px' : '16px'} 0;
    text-align: center;
    line-height: 1.5;
  }

  .button-row {
    display: flex;
    gap: ${props => props.$elderly ? '12px' : '8px'};
    
    button {
      flex: 1;
      height: ${props => props.$elderly ? '48px' : '40px'};
      border-radius: ${props => props.$elderly ? '24px' : '20px'};
      border: none;
      font-size: ${props => props.$elderly ? '16px' : '14px'};
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &.confirm {
        background: #d32f2f;
        color: white;
        &:hover {
          background: #b71c1c;
        }
      }

      &.cancel {
        background: #e0e0e0;
        color: #1a1a1a;
        &:hover {
          background: #bdbdbd;
        }
      }

      &:focus {
        outline: 3px solid #ffeb3b;
        outline-offset: 2px;
      }
    }
  }
`;

// Using Message from types/conversation.ts

interface AssistantOverlayProps {
  show: boolean;
  onClose: () => void;
  elderlyMode?: boolean;
  currentContext?: string;
}

export const AssistantOverlay: React.FC<AssistantOverlayProps> = ({
  show,
  onClose,
  elderlyMode = false,
  currentContext = 'general'
}) => {
  const [screenshotData, setScreenshotData] = useState<{
    image: string;
    metadata: {
      appName: string;
      timestamp: Date;
      resolution: { width: number; height: number };
    };
  } | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [lastContext, setLastContext] = useState<string>(currentContext);
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    // Load saved split ratio from localStorage
    const saved = localStorage.getItem('assistant-split-ratio');
    return saved ? parseFloat(saved) : 0.35; // Default 35% for screenshot
  });
  const conversationAreaRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const phoneScreenRef = useRef<HTMLElement>(null);
  
  // Use screen state from context for smart triggering
  const { screenState, updateScreenState } = useScreenState();

  // Enhanced helper function to check if a similar message was recently added
  const isDuplicateMessage = (newText: string, isUser: boolean): boolean => {
    if (messages.length === 0) return false;
    
    // Check last few messages (not just the last one) for duplicates
    const recentMessages = messages.slice(-5); // Check last 5 messages for better coverage
    const now = Date.now();
    
    for (const message of recentMessages) {
      const timeDiff = now - message.timestamp.getTime();
      
      // Skip if from different sender or too old (increased to 10 seconds for context switching)
      if (message.isUser !== isUser || timeDiff > 10000) continue;
      
      // Exact match
      if (message.text === newText) return true;
      
      // Enhanced assistant greeting patterns for context switching scenarios
      if (!isUser) {
        const patterns = [
          /I can see your.*screen.*now/i,
          /Hello.*ready to help.*screen/i,  
          /Hello.*I can see your.*screen/i,
          /What would you like.*help with/i,
          /What would you like to know/i,
          /Hello.*I'm ready to help.*screen/i, // New pattern
          /ready to help you with your.*screen/i, // New pattern
          /help you with your.*screen.*What would you like/i, // Combined pattern
          /phone.*screen.*What would you like/i, // Context-specific pattern
          /whatsapp.*screen.*What would you like/i, // Context-specific pattern
          /settings.*screen.*What would you like/i // Context-specific pattern
        ];
        
        const messageMatches = patterns.some(pattern => pattern.test(message.text));
        const newTextMatches = patterns.some(pattern => pattern.test(newText));
        
        if (messageMatches && newTextMatches) return true;

        // Additional check for very similar greeting structures
        const bothHaveGreeting = message.text.toLowerCase().includes('hello') && newText.toLowerCase().includes('hello');
        const bothHaveScreen = message.text.toLowerCase().includes('screen') && newText.toLowerCase().includes('screen');
        const bothHaveHelp = (message.text.toLowerCase().includes('help') || message.text.toLowerCase().includes('ready')) && 
                           (newText.toLowerCase().includes('help') || newText.toLowerCase().includes('ready'));
        
        if (bothHaveGreeting && bothHaveScreen && bothHaveHelp) return true;
      }
    }
    
    return false;
  };

  // Handle drag resize functionality
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startRatio = splitRatio;
    const modalHeight = 600; // Approximate modal height

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const ratioChange = deltaY / modalHeight;
      const newRatio = Math.max(0.2, Math.min(0.7, startRatio + ratioChange));
      setSplitRatio(newRatio);
    };

    const handleMouseUp = () => {
      // Save to localStorage
      localStorage.setItem('assistant-split-ratio', splitRatio.toString());
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Load conversation when overlay opens initially
  useEffect(() => {
    if (show) {
      // Load conversation for current context when overlay first opens
      // Subsequent context changes are handled in the consolidated screenshot effect
      const savedConversation = conversationService.getConversation(currentContext);
      if (savedConversation) {
        setMessages(savedConversation.messages);
      } else {
        setMessages([]);
      }
    }
  }, [show]); // Only depend on show to prevent racing with context switch effect

  // Cleanup speech synthesis on component unmount or when overlay closes
  useEffect(() => {
    if (!show) {
      // Stop any ongoing speech when modal closes
      stopSpeaking();
    }
    
    // Cleanup on component unmount
    return () => {
      stopSpeaking();
    };
  }, [show]);

  // Consolidated screenshot logic to prevent duplicate calls
  useEffect(() => {
    if (!show) return;

    // Handle context changes - FORCE fresh screenshot when switching apps
    if (currentContext !== lastContext) {
      setLastContext(currentContext);
      
      // IMMEDIATELY load the correct conversation for this context to prevent brief wrong message display
      const savedConversation = conversationService.getConversation(currentContext);
      if (savedConversation) {
        setMessages(savedConversation.messages);
      } else {
        setMessages([]);
      }
      
      // FORCE fresh screenshot on context switch - clear old screenshot and capture new one
      setScreenshotData(null); // Clear old screenshot to force refresh
      
      // Track context switch time for smart screenshot logic
      conversationService.updateContextSwitchTime(currentContext);
      
      // Longer delay to ensure UI is fully rendered after app switch (300ms instead of 100ms)
      const timer = setTimeout(() => {
        console.log('Forcing fresh screenshot capture after app context change:', currentContext);
        handleCaptureScreenshot();
      }, 300);
      return () => clearTimeout(timer);
    }

    // Handle initial screenshot capture when overlay opens
    if (!screenshotData) {
      const needsFresh = conversationService.needsFreshScreenshot(currentContext);
      if (needsFresh) {
        // Delay to ensure UI state is fully settled (300ms for consistency)
        const timer = setTimeout(() => {
          console.log('Capturing initial screenshot for context:', currentContext);
          handleCaptureScreenshot();
        }, 300);
        return () => clearTimeout(timer);
      }
    }
  }, [show, currentContext, lastContext, screenshotData]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (conversationAreaRef.current) {
      conversationAreaRef.current.scrollTop = conversationAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Initialize phone screen ref and smart state tracking
  useEffect(() => {
    const phoneScreenElement = document.querySelector('[data-phone-screen]') as HTMLElement;
    if (phoneScreenElement) {
      phoneScreenRef.current = phoneScreenElement;
    }
    
    // Update screen state when context changes
    if (show) {
      updateScreenState(`${currentContext}-initial-${Date.now()}`);
    }
  }, [currentContext, show, updateScreenState]);

  // Expert screenshot capture with state-based triggering
  const handleScreenshotUpdate = useCallback(async (imageData: string, metadata: any) => {
    const base64Data = imageData.split(',')[1]; // Remove data URL prefix
    setScreenshotData({
      image: base64Data,
      metadata: metadata
    });
    conversationService.updateScreenshotTimestamp(currentContext);
  }, [currentContext]);

  // Use expert hook for invisible, smart screenshot updates
  useScreenshotCapture(phoneScreenRef, screenState, handleScreenshotUpdate, 1500);

  const handleCaptureScreenshot = async () => {
    setIsCapturing(true);
    
    try {
      const newScreenshotData = await captureScreenshot(currentContext);
      if (newScreenshotData) {
        // SUCCESS: Update screenshot data and timestamp
        setScreenshotData(newScreenshotData);
        conversationService.updateScreenshotTimestamp(currentContext);
        
        // Smart message generation - avoid greeting duplicates
        const conversation = conversationService.getConversation(currentContext);
        const hasGreeted = conversation?.hasGreeted || false;
        const isFirstTime = messages.length === 0 && !hasGreeted;
        
        // Only add greeting message if we haven't greeted in this context before
        let messageText: string | null = null;
        
        if (isFirstTime) {
          // First time visiting this context - show welcome message
          messageText = `Hello! I'm ready to help you with your ${currentContext !== 'general' ? currentContext + ' ' : ''}screen. What would you like to know?`;
          conversationService.markAsGreeted(currentContext);
        } else if (!hasGreeted && messages.length > 0) {
          // Have messages but haven't greeted (edge case) - just mark as greeted
          conversationService.markAsGreeted(currentContext);
        }
        // If hasGreeted is true, don't add any automatic greeting message
        
        // Only add message if we have one and it's not a duplicate
        if (messageText && !isDuplicateMessage(messageText, false)) {
          const screenshotMessage = conversationService.addMessage(currentContext, {
            text: messageText,
            isUser: false,
            timestamp: new Date()
          });
          setMessages(prev => [...prev, screenshotMessage]);
        }
      } else {
        // FAILED: Screenshot capture returned null - but don't clear existing screenshot
        console.warn('Screenshot capture returned null for context:', currentContext);
        // Keep existing screenshot if we have one, or show error only if no screenshot exists
        if (!screenshotData) {
          console.log('No existing screenshot to preserve, will show placeholder');
        }
      }
    } catch (error) {
      console.error('Screenshot capture failed:', error);
      
      // ENHANCED ERROR HANDLING: Only show error message if no screenshot exists
      // This prevents error messages when switching contexts and screenshot capture fails
      if (!screenshotData) {
        const errorMessage = conversationService.addMessage(currentContext, {
          text: "I couldn't capture your screen, but I can still help! Just tell me what you're trying to do.",
          isUser: false,
          timestamp: new Date()
        });
        setMessages(prev => [...prev, errorMessage]);
      } else {
        // We have an existing screenshot, just log the error silently
        console.log('Screenshot capture failed but preserving existing screenshot');
      }
    } finally {
      setIsCapturing(false);
    }
  };

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
        const newUserMessage = conversationService.addMessage(currentContext, {
          text: transcript,
          isUser: true,
          timestamp: new Date()
        });

        setMessages(prev => [...prev, newUserMessage]);
        setIsAnalyzing(true);

        try {
          // Debug info for user
          if (screenshotData) {
            console.log(`📸 SCREENSHOT STATUS: Using screenshot (${Math.round(screenshotData.image.length / 1024)} KB) from ${screenshotData.metadata.appName}`);
          } else {
            console.log(`❌ SCREENSHOT STATUS: No screenshot available for analysis`);
          }

          // Use the captured screenshot data with the new enhanced analysis and conversation history
          const response = await analyzeWithScreenshotData(
            transcript, 
            currentContext, 
            screenshotData || undefined,
            messages // Pass current conversation history for progressive guidance
          );
          
          const aiMessage = conversationService.addMessage(currentContext, {
            text: response.guidance,
            isUser: false,
            timestamp: new Date()
          });

          setMessages(prev => [...prev, aiMessage]);
          
          // Text-to-speech for the response using enhanced female voice
          await speakText(response.guidance, elderlyMode);
        } catch (error) {
          console.error('Analysis error:', error);
          const errorMessage = conversationService.addMessage(currentContext, {
            text: "I'm sorry, I had trouble understanding that. Could you please try again?",
            isUser: false,
            timestamp: new Date()
          });
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

  const handleRepeatLastAnswer = async () => {
    const lastAiMessage = messages.filter(m => !m.isUser).pop();
    if (lastAiMessage) {
      await speakText(lastAiMessage.text, elderlyMode);
    }
  };

  const handleClearConversation = () => {
    setShowConfirmDialog(true);
  };

  const confirmClearConversation = () => {
    conversationService.clearConversation(currentContext);
    setMessages([]);
    setScreenshotData(null);
    setShowConfirmDialog(false);
    
    // Capture fresh screenshot - this will automatically add the welcome message
    handleCaptureScreenshot();
  };

  const cancelClearConversation = () => {
    setShowConfirmDialog(false);
  };

  if (!show) return null;

  return (
    <Overlay 
      $show={show} 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="assistant-overlay"
    >
      <OverlayContent $elderly={elderlyMode}>
        <CloseButton $elderly={elderlyMode} onClick={() => {
          // Stop speech and close modal
          stopSpeaking();
          onClose();
        }}>
          <X size={elderlyMode ? 24 : 20} />
          Close
        </CloseButton>

        <ClearChatButton 
          $elderly={elderlyMode} 
          onClick={handleClearConversation}
          title="Clear this conversation and start fresh"
        >
          <Trash2 size={elderlyMode ? 16 : 14} />
          Clear Chat
        </ClearChatButton>

        <ScreenshotSection $elderly={elderlyMode} $ratio={splitRatio}>
          <ScreenshotContainer $elderly={elderlyMode}>
            {isCapturing ? (
              <ScreenshotPlaceholder $elderly={elderlyMode}>
                <LoadingSpinner />
                Capturing your screen...
              </ScreenshotPlaceholder>
            ) : screenshotData ? (
              <ScreenshotImage src={`data:image/jpeg;base64,${screenshotData.image}`} alt="Your screen" />
            ) : (
              <ScreenshotPlaceholder $elderly={elderlyMode}>
                <Camera size={elderlyMode ? 48 : 40} />
                <br />
                No screenshot captured
              </ScreenshotPlaceholder>
            )}
          </ScreenshotContainer>
          
          <ScreenshotLabel $elderly={elderlyMode}>
            {screenshotData 
              ? `${screenshotData.metadata.appName === 'unknown' ? currentContext : screenshotData.metadata.appName} Screen${isAnalyzing ? ' (AI analyzing...)' : ' (Ready)'}`
              : 'Capturing your screen...'
            }
          </ScreenshotLabel>
        </ScreenshotSection>

        <Resizer 
          $elderly={elderlyMode}
          ref={resizerRef}
          onMouseDown={handleResizeStart}
        />

        <ChatSection $elderly={elderlyMode} $ratio={splitRatio}>
          <ConversationArea $elderly={elderlyMode} ref={conversationAreaRef}>
            {messages.map((message) => (
              <Message key={message.id} $isUser={message.isUser} $elderly={elderlyMode}>
                {message.text}
              </Message>
            ))}
          </ConversationArea>

          <StatusText $elderly={elderlyMode} $isVisible={isListening || isAnalyzing}>
            {isListening ? 'Listening...' : 'Thinking...'}
          </StatusText>

          <ButtonGrid $elderly={elderlyMode}>
            <AndroidButton
              elderly={elderlyMode}
              primary
              onClick={handleVoiceInput}
              disabled={isListening || isAnalyzing}
              icon={isListening ? <Loader size={elderlyMode ? 20 : 16} className="spin" /> : <Mic size={elderlyMode ? 20 : 16} />}
            >
              {isListening ? 'Listening...' : isAnalyzing ? 'Thinking...' : 'Ask Question'}
            </AndroidButton>

            <AndroidButton
              elderly={elderlyMode}
              onClick={handleRepeatLastAnswer}
              disabled={messages.filter(m => !m.isUser).length === 0}
              icon={<Volume2 size={elderlyMode ? 20 : 16} />}
            >
              Repeat Answer
            </AndroidButton>
          </ButtonGrid>
        </ChatSection>
        
        <ConfirmDialog $show={showConfirmDialog} $elderly={elderlyMode}>
          <h3>Clear Conversation?</h3>
          <p>
            This will delete all messages in this conversation and start fresh. 
            You won't be able to see this conversation again.
          </p>
          <div className="button-row">
            <button className="cancel" onClick={cancelClearConversation}>
              No, Keep
            </button>
            <button className="confirm" onClick={confirmClearConversation}>
              Yes, Clear
            </button>
          </div>
        </ConfirmDialog>
      </OverlayContent>
    </Overlay>
  );
};