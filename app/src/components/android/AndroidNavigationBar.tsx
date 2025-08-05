import React from 'react';
import styled from 'styled-components';
import { Home, ArrowLeft, Menu } from 'lucide-react';

const NavBar = styled.div`
  height: 56px;
  background: #ffffff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
`;

const NavButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }

  &:active {
    background: rgba(0, 0, 0, 0.2);
  }
`;

interface AndroidNavigationBarProps {
  onBackPress?: () => void;
  onHomePress?: () => void;
  onMenuPress?: () => void;
  showBack?: boolean;
}

export const AndroidNavigationBar: React.FC<AndroidNavigationBarProps> = ({
  onBackPress,
  onHomePress,
  onMenuPress,
  showBack = false
}) => {
  return (
    <NavBar>
      <NavButton onClick={showBack ? onBackPress : undefined}>
        {showBack ? <ArrowLeft size={24} color="#212121" /> : <div style={{ width: 24, height: 24 }} />}
      </NavButton>
      
      <NavButton onClick={onHomePress}>
        <Home size={24} color="#212121" />
      </NavButton>
      
      <NavButton onClick={onMenuPress}>
        <Menu size={24} color="#212121" />
      </NavButton>
    </NavBar>
  );
};