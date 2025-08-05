import React from 'react';
import styled from 'styled-components';
import { HelpCircle } from 'lucide-react';

const FloatingButton = styled.button<{ $elderly?: boolean }>`
  position: absolute;
  bottom: ${props => props.$elderly ? '100px' : '90px'};
  right: ${props => props.$elderly ? '20px' : '16px'};
  width: ${props => props.$elderly ? '72px' : '56px'};
  height: ${props => props.$elderly ? '72px' : '56px'};
  border-radius: 50%;
  background: #d32f2f;
  border: none;
  box-shadow: 0 4px 16px rgba(211, 47, 47, 0.4);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 999;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 20px rgba(211, 47, 47, 0.6);
    background: #b71c1c;
  }

  &:active {
    transform: scale(0.95);
  }

  /* Pulse animation to attract attention for elderly users */
  ${props => props.$elderly && `
    animation: gentlePulse 3s infinite;
    
    @keyframes gentlePulse {
      0%, 100% { 
        box-shadow: 0 4px 16px rgba(211, 47, 47, 0.4);
      }
      50% { 
        box-shadow: 0 6px 24px rgba(211, 47, 47, 0.7);
      }
    }
  `}
`;

const AssistantIcon = styled(HelpCircle)<{ $elderly?: boolean }>`
  color: white;
  size: ${props => props.$elderly ? '32px' : '24px'};
`;

const HelpText = styled.div<{ $elderly?: boolean; $show?: boolean }>`
  position: absolute;
  right: ${props => props.$elderly ? '80px' : '64px'};
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: ${props => props.$elderly ? '12px 16px' : '8px 12px'};
  border-radius: 8px;
  font-size: ${props => props.$elderly ? '16px' : '14px'};
  font-weight: 500;
  white-space: nowrap;
  opacity: ${props => props.$show ? '1' : '0'};
  visibility: ${props => props.$show ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
  z-index: 999;

  &::after {
    content: '';
    position: absolute;
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 0;
    height: 0;
    border-left: 8px solid rgba(0, 0, 0, 0.8);
    border-top: 8px solid transparent;
    border-bottom: 8px solid transparent;
  }
`;

interface FloatingAssistantProps {
  onOpenAssistant: () => void;
  elderlyMode?: boolean;
  disabled?: boolean;
}

export const FloatingAssistant: React.FC<FloatingAssistantProps> = ({
  onOpenAssistant,
  elderlyMode = false,
  disabled = false
}) => {
  const [showHelpText, setShowHelpText] = React.useState(false);

  // Show help text automatically for elderly users after a delay
  React.useEffect(() => {
    if (elderlyMode && !disabled) {
      const timer = setTimeout(() => {
        setShowHelpText(true);
        // Hide it after 3 seconds
        setTimeout(() => setShowHelpText(false), 3000);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [elderlyMode, disabled]);

  if (disabled) return null;

  return (
    <>
      <HelpText 
        $elderly={elderlyMode} 
        $show={showHelpText}
      >
        Need help? Tap me!
      </HelpText>
      
      <FloatingButton
        $elderly={elderlyMode}
        onClick={onOpenAssistant}
        onMouseEnter={() => setShowHelpText(true)}
        onMouseLeave={() => setShowHelpText(false)}
        aria-label="Get help with this screen"
        className="floating-assistant"
      >
        <AssistantIcon 
          $elderly={elderlyMode}
          size={elderlyMode ? 32 : 24}
        />
      </FloatingButton>
    </>
  );
};