import React from 'react';
import styled from 'styled-components';

interface ButtonProps {
  $primary?: boolean;
  $large?: boolean;
  $elderly?: boolean;
}

const StyledButton = styled.button<ButtonProps>`
  background: ${props => props.$primary ? '#2196F3' : '#ffffff'};
  color: ${props => props.$primary ? '#ffffff' : '#212121'};
  border: ${props => props.$primary ? 'none' : '1px solid #e0e0e0'};
  border-radius: 8px;
  padding: ${props => props.$large ? '16px 24px' : '12px 16px'};
  font-size: ${props => props.$elderly ? '20px' : props.$large ? '18px' : '16px'};
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  min-height: ${props => props.$elderly ? '60px' : props.$large ? '48px' : '40px'};
  width: ${props => props.$elderly ? '100%' : 'auto'};

  &:hover {
    background: ${props => props.$primary ? '#1976D2' : '#f5f5f5'};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

interface AndroidButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  large?: boolean;
  elderly?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export const AndroidButton: React.FC<AndroidButtonProps> = ({
  children,
  onClick,
  primary = false,
  large = false,
  elderly = false,
  disabled = false,
  icon
}) => {
  return (
    <StyledButton
      $primary={primary}
      $large={large}
      $elderly={elderly}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span>{icon}</span>}
      {children}
    </StyledButton>
  );
};