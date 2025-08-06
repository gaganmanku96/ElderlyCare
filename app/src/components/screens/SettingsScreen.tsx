import React, { useState } from 'react';
import styled from 'styled-components';
import { AndroidNavigationBar } from '../android';
import { speakText } from '../../utils/voiceUtils';
import { 
  Wifi, 
  Bluetooth, 
  Volume2, 
  Sun, 
  Type, 
  Bell, 
  Shield, 
  User, 
  Eye,
  Moon,
  VolumeX,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';

const SettingsContainer = styled.div`
  height: 100%;
  background: #ffffff;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  background: #9E9E9E;
  color: white;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const SettingsSection = styled.div`
  margin-bottom: 8px;
`;

const SectionHeader = styled.div<{ $elderly?: boolean }>`
  background: #f5f5f5;
  padding: ${props => props.$elderly ? '16px' : '12px'};
  font-size: ${props => props.$elderly ? '16px' : '14px'};
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const SettingItem = styled.div<{ $disabled?: boolean }>`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: ${props => props.$disabled ? 'not-allowed' : 'pointer'};
  display: flex;
  align-items: center;
  gap: 16px;
  transition: background-color 0.2s ease;
  opacity: ${props => props.$disabled ? 0.5 : 1};

  &:hover {
    background: ${props => props.$disabled ? 'transparent' : '#f8f9fa'};
  }
`;

const SettingIcon = styled.div<{ $color?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.$color || '#e0e0e0'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const SettingContent = styled.div`
  flex: 1;
`;

const SettingTitle = styled.div<{ $elderly?: boolean }>`
  font-size: ${props => props.$elderly ? '18px' : '16px'};
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
`;

const SettingDescription = styled.div<{ $elderly?: boolean }>`
  font-size: ${props => props.$elderly ? '16px' : '14px'};
  color: #666;
`;

// const SettingControl = styled.div`
//   display: flex;
//   align-items: center;
//   gap: 8px;
// `;

const Toggle = styled.button<{ $active?: boolean }>`
  width: 50px;
  height: 30px;
  border-radius: 15px;
  border: none;
  background: ${props => props.$active ? '#4CAF50' : '#ccc'};
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;

  &::after {
    content: '';
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: white;
    position: absolute;
    top: 2px;
    left: ${props => props.$active ? '22px' : '2px'};
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const Slider = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 120px;
`;

const SliderTrack = styled.input`
  flex: 1;
  -webkit-appearance: none;
  height: 6px;
  border-radius: 3px;
  background: #ddd;
  outline: none;

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #2196F3;
    cursor: pointer;
  }
`;

const AccessibilityPanel = styled.div`
  padding: 20px;
`;

const AccessibilityTitle = styled.h2<{ $elderly?: boolean }>`
  font-size: ${props => props.$elderly ? '24px' : '20px'};
  color: #333;
  margin-bottom: 20px;
  text-align: center;
`;

const AccessibilityOption = styled.div<{ $elderly?: boolean }>`
  padding: ${props => props.$elderly ? '20px' : '16px'};
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #2196F3;
    background: #f8f9fa;
  }
`;

const PreviewText = styled.div<{ $fontSize?: number; $highContrast?: boolean }>`
  font-size: ${props => props.$fontSize || 16}px;
  color: ${props => props.$highContrast ? '#000' : '#333'};
  background: ${props => props.$highContrast ? '#fff' : 'transparent'};
  padding: 8px;
  border-radius: 4px;
  margin-top: 8px;
`;

interface SettingsScreenProps {
  onBack: () => void;
  elderlyMode?: boolean;
}

type View = 'main' | 'accessibility' | 'display' | 'sound';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBack,
  elderlyMode = false
}) => {
  const [currentView, setCurrentView] = useState<View>('main');
  const [settings, setSettings] = useState({
    wifi: true,
    bluetooth: false,
    volume: 75,
    brightness: 60,
    fontSize: elderlyMode ? 20 : 16,
    highContrast: false,
    notifications: true,
    darkMode: false
  });

  const updateSetting = async (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    await speakText(`${key} updated successfully`);
  };

  const renderMainSettings = () => (
    <>
      <SettingsSection>
        <SectionHeader $elderly={elderlyMode}>Connectivity</SectionHeader>
        
        <SettingItem onClick={() => updateSetting('wifi', !settings.wifi)}>
          <SettingIcon $color="#2196F3">
            <Wifi size={20} />
          </SettingIcon>
          <SettingContent>
            <SettingTitle $elderly={elderlyMode}>Wi-Fi</SettingTitle>
            <SettingDescription $elderly={elderlyMode}>
              {settings.wifi ? 'Connected to Home Network' : 'Not connected'}
            </SettingDescription>
          </SettingContent>
          <Toggle $active={settings.wifi} />
        </SettingItem>

        <SettingItem onClick={() => updateSetting('bluetooth', !settings.bluetooth)}>
          <SettingIcon $color="#2196F3">
            <Bluetooth size={20} />
          </SettingIcon>
          <SettingContent>
            <SettingTitle $elderly={elderlyMode}>Bluetooth</SettingTitle>
            <SettingDescription $elderly={elderlyMode}>
              {settings.bluetooth ? 'On' : 'Off'}
            </SettingDescription>
          </SettingContent>
          <Toggle $active={settings.bluetooth} />
        </SettingItem>
      </SettingsSection>

      <SettingsSection>
        <SectionHeader $elderly={elderlyMode}>Display & Sound</SectionHeader>
        
        <SettingItem onClick={() => setCurrentView('sound')}>
          <SettingIcon $color="#FF9800">
            <Volume2 size={20} />
          </SettingIcon>
          <SettingContent>
            <SettingTitle $elderly={elderlyMode}>Sound</SettingTitle>
            <SettingDescription $elderly={elderlyMode}>
              Volume, ringtones, notifications
            </SettingDescription>
          </SettingContent>
          <ChevronRight size={20} color="#ccc" />
        </SettingItem>

        <SettingItem onClick={() => setCurrentView('display')}>
          <SettingIcon $color="#FF9800">
            <Sun size={20} />
          </SettingIcon>
          <SettingContent>
            <SettingTitle $elderly={elderlyMode}>Display</SettingTitle>
            <SettingDescription $elderly={elderlyMode}>
              Brightness, font size, theme
            </SettingDescription>
          </SettingContent>
          <ChevronRight size={20} color="#ccc" />
        </SettingItem>
      </SettingsSection>

      <SettingsSection>
        <SectionHeader $elderly={elderlyMode}>Accessibility</SectionHeader>
        
        <SettingItem onClick={() => setCurrentView('accessibility')}>
          <SettingIcon $color="#9C27B0">
            <Eye size={20} />
          </SettingIcon>
          <SettingContent>
            <SettingTitle $elderly={elderlyMode}>Accessibility</SettingTitle>
            <SettingDescription $elderly={elderlyMode}>
              Large text, high contrast, voice settings
            </SettingDescription>
          </SettingContent>
          <ChevronRight size={20} color="#ccc" />
        </SettingItem>
      </SettingsSection>

      <SettingsSection>
        <SectionHeader $elderly={elderlyMode}>Personal</SectionHeader>
        
        <SettingItem $disabled>
          <SettingIcon $color="#4CAF50">
            <User size={20} />
          </SettingIcon>
          <SettingContent>
            <SettingTitle $elderly={elderlyMode}>Accounts</SettingTitle>
            <SettingDescription $elderly={elderlyMode}>
              Google, email, sync settings
            </SettingDescription>
          </SettingContent>
          <ChevronRight size={20} color="#ccc" />
        </SettingItem>

        <SettingItem $disabled>
          <SettingIcon $color="#F44336">
            <Shield size={20} />
          </SettingIcon>
          <SettingContent>
            <SettingTitle $elderly={elderlyMode}>Privacy & Security</SettingTitle>
            <SettingDescription $elderly={elderlyMode}>
              App permissions, security settings
            </SettingDescription>
          </SettingContent>
          <ChevronRight size={20} color="#ccc" />
        </SettingItem>
      </SettingsSection>
    </>
  );

  const renderAccessibilitySettings = () => (
    <AccessibilityPanel>
      <AccessibilityTitle $elderly={elderlyMode}>
        Accessibility Settings
      </AccessibilityTitle>

      <AccessibilityOption $elderly={elderlyMode}>
        <SettingContent>
          <SettingTitle $elderly={elderlyMode}>Font Size</SettingTitle>
          <Slider>
            <Type size={16} />
            <SliderTrack
              type="range"
              min="14"
              max="24"
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
            />
            <Type size={24} />
          </Slider>
          <PreviewText $fontSize={settings.fontSize}>
            Sample text at current size
          </PreviewText>
        </SettingContent>
      </AccessibilityOption>

      <AccessibilityOption 
        $elderly={elderlyMode}
        onClick={() => updateSetting('highContrast', !settings.highContrast)}
      >
        <SettingContent>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <SettingTitle $elderly={elderlyMode}>High Contrast</SettingTitle>
              <SettingDescription $elderly={elderlyMode}>
                Easier to read text and buttons
              </SettingDescription>
            </div>
            <Toggle $active={settings.highContrast} />
          </div>
          <PreviewText $fontSize={settings.fontSize} $highContrast={settings.highContrast}>
            Sample text with current contrast
          </PreviewText>
        </SettingContent>
      </AccessibilityOption>
    </AccessibilityPanel>
  );

  const renderDisplaySettings = () => (
    <Content>
      <SettingsSection>
        <SettingItem>
          <SettingIcon $color="#FF9800">
            <Sun size={20} />
          </SettingIcon>
          <SettingContent>
            <SettingTitle $elderly={elderlyMode}>Brightness</SettingTitle>
            <Slider>
              <Sun size={16} />
              <SliderTrack
                type="range"
                min="10"
                max="100"
                value={settings.brightness}
                onChange={(e) => updateSetting('brightness', parseInt(e.target.value))}
              />
              <Sun size={20} />
            </Slider>
          </SettingContent>
        </SettingItem>

        <SettingItem onClick={() => updateSetting('darkMode', !settings.darkMode)}>
          <SettingIcon $color="#424242">
            <Moon size={20} />
          </SettingIcon>
          <SettingContent>
            <SettingTitle $elderly={elderlyMode}>Dark Mode</SettingTitle>
            <SettingDescription $elderly={elderlyMode}>
              {settings.darkMode ? 'On' : 'Off'}
            </SettingDescription>
          </SettingContent>
          <Toggle $active={settings.darkMode} />
        </SettingItem>
      </SettingsSection>
    </Content>
  );

  const renderSoundSettings = () => (
    <Content>
      <SettingsSection>
        <SettingItem>
          <SettingIcon $color="#FF9800">
            <Volume2 size={20} />
          </SettingIcon>
          <SettingContent>
            <SettingTitle $elderly={elderlyMode}>Volume</SettingTitle>
            <Slider>
              <VolumeX size={16} />
              <SliderTrack
                type="range"
                min="0"
                max="100"
                value={settings.volume}
                onChange={(e) => updateSetting('volume', parseInt(e.target.value))}
              />
              <Volume2 size={20} />
            </Slider>
          </SettingContent>
        </SettingItem>

        <SettingItem onClick={() => updateSetting('notifications', !settings.notifications)}>
          <SettingIcon $color="#4CAF50">
            <Bell size={20} />
          </SettingIcon>
          <SettingContent>
            <SettingTitle $elderly={elderlyMode}>Notifications</SettingTitle>
            <SettingDescription $elderly={elderlyMode}>
              {settings.notifications ? 'Enabled' : 'Disabled'}
            </SettingDescription>
          </SettingContent>
          <Toggle $active={settings.notifications} />
        </SettingItem>
      </SettingsSection>
    </Content>
  );

  const getHeaderTitle = () => {
    switch (currentView) {
      case 'accessibility': return 'Accessibility';
      case 'display': return 'Display';
      case 'sound': return 'Sound';
      default: return 'Settings';
    }
  };

  return (
    <SettingsContainer>
      <Header>
        {currentView !== 'main' && (
          <BackButton onClick={() => setCurrentView('main')}>
            <ArrowLeft size={20} />
          </BackButton>
        )}
        <HeaderTitle>{getHeaderTitle()}</HeaderTitle>
      </Header>
      
      <Content>
        {currentView === 'main' && renderMainSettings()}
        {currentView === 'accessibility' && renderAccessibilitySettings()}
        {currentView === 'display' && renderDisplaySettings()}
        {currentView === 'sound' && renderSoundSettings()}
      </Content>

      <div style={{ flexShrink: 0 }}>
        <AndroidNavigationBar
          showBack
          onBackPress={onBack}
          onHomePress={onBack}
        />
      </div>
    </SettingsContainer>
  );
};