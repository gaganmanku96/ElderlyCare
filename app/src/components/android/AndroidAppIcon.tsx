import React from 'react';
import styled from 'styled-components';

interface AppIconProps {
  $size?: number;
  $elderly?: boolean;
}

const AppIconContainer = styled.div<AppIconProps>`
  width: ${props => props.$elderly ? '80px' : props.$size ? `${props.$size}px` : '60px'};
  height: ${props => props.$elderly ? '80px' : props.$size ? `${props.$size}px` : '60px'};
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: ${props => props.$elderly ? '32px' : '24px'};
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const AppLabel = styled.div<{ $elderly?: boolean }>`
  margin-top: 4px;
  text-align: center;
  font-size: ${props => props.$elderly ? '16px' : '12px'};
  color: #212121;
  font-weight: 500;
  max-width: ${props => props.$elderly ? '80px' : '60px'};
  line-height: 1.2;
`;

const AppWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 8px;
`;

interface AndroidAppIconProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  size?: number;
  elderly?: boolean;
  color?: string;
}

export const AndroidAppIcon: React.FC<AndroidAppIconProps> = ({
  icon,
  label,
  onClick,
  size,
  elderly = false,
  color
}) => {
  return (
    <AppWrapper>
      <AppIconContainer
        $size={size}
        $elderly={elderly}
        onClick={onClick}
        style={color ? { background: color } : undefined}
      >
        {icon}
      </AppIconContainer>
      <AppLabel $elderly={elderly}>{label}</AppLabel>
    </AppWrapper>
  );
};