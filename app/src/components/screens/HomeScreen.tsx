import React from 'react';
import styled from 'styled-components';
import { AndroidAppIcon, AndroidNavigationBar } from '../android';
import { MessageCircle, Phone, Settings, Camera, Mail } from 'lucide-react';

const HomeContainer = styled.div`
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const WallpaperOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.1);
`;

const AppsGrid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  justify-items: center;
  padding: 20px;
  align-content: start;
  z-index: 1;
  overflow-y: auto;
`;

interface HomeScreenProps {
  onAppOpen: (appName: string) => void;
  elderlyMode?: boolean;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onAppOpen,
  elderlyMode = false
}) => {
  const apps = [
    { name: 'WhatsApp', icon: <MessageCircle size={elderlyMode ? 32 : 24} />, color: '#25D366' },
    { name: 'Phone', icon: <Phone size={elderlyMode ? 32 : 24} />, color: '#2196F3' },
    { name: 'Messages', icon: <MessageCircle size={elderlyMode ? 32 : 24} />, color: '#4CAF50' },
    { name: 'Settings', icon: <Settings size={elderlyMode ? 32 : 24} />, color: '#9E9E9E' },
    { name: 'Camera', icon: <Camera size={elderlyMode ? 32 : 24} />, color: '#FF9800' },
    { name: 'Email', icon: <Mail size={elderlyMode ? 32 : 24} />, color: '#F44336' },
  ];

  return (
    <HomeContainer>
      <WallpaperOverlay />
      
      <AppsGrid>
        {apps.map((app) => (
          <AndroidAppIcon
            key={app.name}
            icon={app.icon}
            label={app.name}
            onClick={() => onAppOpen(app.name)}
            elderly={elderlyMode}
            color={app.color}
          />
        ))}
      </AppsGrid>

      <div style={{ flexShrink: 0 }}>
        <AndroidNavigationBar
          onHomePress={() => {/* Already on home */}}
          onMenuPress={() => onAppOpen('Menu')}
        />
      </div>
    </HomeContainer>
  );
};