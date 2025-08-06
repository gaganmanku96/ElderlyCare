import { useState } from 'react'
import styled from 'styled-components'
import { AndroidPhone } from './components/android'
import { HomeScreen } from './components/screens/HomeScreen'
import { MessagesScreen } from './components/screens/MessagesScreen'
import { WhatsAppScreen } from './components/screens/WhatsAppScreen'
import { PhoneScreen } from './components/screens/PhoneScreen'
import { SettingsScreen } from './components/screens/SettingsScreen'
import { FloatingAssistant } from './components/FloatingAssistant'
import { AssistantOverlay } from './components/AssistantOverlay'
import { ScreenStateProvider } from './contexts/ScreenStateContext'

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`

const ControlPanel = styled.div`
  position: fixed;
  top: 20px;
  right: 20px;
  background: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`

const ToggleButton = styled.button`
  background: #2196F3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 8px;
  
  &:hover {
    background: #1976D2;
  }
`

const InfoText = styled.p`
  margin: 0;
  font-size: 12px;
  color: #666;
`

type Screen = 'home' | 'messages' | 'phone' | 'settings' | 'whatsapp'

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home')
  const [elderlyMode, setElderlyMode] = useState(false)
  const [showAssistantOverlay, setShowAssistantOverlay] = useState(false)

  const handleAppOpen = (appName: string) => {
    console.log(`Opening app: ${appName}`)
    
    switch (appName) {
      case 'Messages':
        setCurrentScreen('messages')
        break
      case 'WhatsApp':
        setCurrentScreen('whatsapp')
        break
      case 'Phone':
        setCurrentScreen('phone')
        break
      case 'Settings':
        setCurrentScreen('settings')
        break
      default:
        // For other apps, show a simple alert for now
        alert(`Opening ${appName} app - This would show the ${appName} interface in a real implementation`)
    }
  }

  const handleAssistantOpen = () => {
    setShowAssistantOverlay(true)
  }

  const handleAssistantClose = () => {
    // Stop any ongoing speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel()
    }
    setShowAssistantOverlay(false)
  }

  const handleBackToHome = () => {
    setCurrentScreen('home')
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'messages':
        return (
          <MessagesScreen 
            onBack={handleBackToHome}
            elderlyMode={elderlyMode}
          />
        )
      case 'whatsapp':
        return (
          <WhatsAppScreen 
            onBack={handleBackToHome}
            elderlyMode={elderlyMode}
          />
        )
      case 'phone':
        return (
          <PhoneScreen 
            onBack={handleBackToHome}
            elderlyMode={elderlyMode}
          />
        )
      case 'settings':
        return (
          <SettingsScreen 
            onBack={handleBackToHome}
            elderlyMode={elderlyMode}
          />
        )
      case 'home':
      default:
        return (
          <HomeScreen 
            onAppOpen={handleAppOpen}
            elderlyMode={elderlyMode}
          />
        )
    }
  }

  return (
    <ScreenStateProvider>
      <AppContainer>
        <ControlPanel>
          <ToggleButton onClick={() => setElderlyMode(!elderlyMode)}>
            {elderlyMode ? 'Normal Mode' : 'Elderly Mode'}
          </ToggleButton>
          <InfoText>
            {elderlyMode ? 'Large buttons & text enabled' : 'Standard interface'}
          </InfoText>
        </ControlPanel>

        <AndroidPhone
          assistantOverlay={
            <>
              {/* Floating Assistant - appears on all screens */}
              <FloatingAssistant
                onOpenAssistant={handleAssistantOpen}
                elderlyMode={elderlyMode}
                disabled={showAssistantOverlay}
              />
              
              {/* Assistant Overlay - modal within phone container */}
              <AssistantOverlay
                show={showAssistantOverlay}
                onClose={handleAssistantClose}
                elderlyMode={elderlyMode}
                currentContext={currentScreen}
              />
            </>
          }
        >
          {renderScreen()}
        </AndroidPhone>
      </AppContainer>
    </ScreenStateProvider>
  )
}

export default App
