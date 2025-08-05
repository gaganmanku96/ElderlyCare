import React from 'react';
import styled from 'styled-components';

const PhoneContainer = styled.div`
  width: 375px;
  height: 812px;
  background: #000;
  border-radius: 30px;
  padding: 8px;
  margin: 20px auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
`;

const PhoneScreen = styled.div`
  width: 100%;
  height: 100%;
  background: #ffffff;
  border-radius: 22px;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const StatusBar = styled.div`
  height: 44px;
  background: #000;
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 600;
`;

const ScreenContent = styled.div`
  flex: 1;
  background: #f5f5f5;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
`;

interface AndroidPhoneProps {
  children: React.ReactNode;
  assistantOverlay?: React.ReactNode;
}

export const AndroidPhone: React.FC<AndroidPhoneProps> = ({ children, assistantOverlay }) => {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return (
    <PhoneContainer>
      <PhoneScreen>
        <StatusBar>
          <span>{currentTime}</span>
          <div>
            <span style={{ marginRight: '8px' }}>📶</span>
            <span style={{ marginRight: '8px' }}>📶</span>
            <span>🔋</span>
          </div>
        </StatusBar>
        <ScreenContent data-phone-screen>
          {children}
          {assistantOverlay}
        </ScreenContent>
      </PhoneScreen>
    </PhoneContainer>
  );
};