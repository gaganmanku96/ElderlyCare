import React, { useState } from 'react';
import styled from 'styled-components';
import { AndroidNavigationBar } from '../android';
import { Phone, PhoneCall, User, Clock, Heart, Trash2 } from 'lucide-react';

const PhoneContainer = styled.div`
  height: 100%;
  background: #ffffff;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const TabBar = styled.div`
  background: #2196F3;
  display: flex;
  height: 48px;
`;

const Tab = styled.button<{ $active?: boolean; $elderly?: boolean }>`
  flex: 1;
  border: none;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  color: white;
  font-size: ${props => props.$elderly ? '16px' : '14px'};
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ContactsList = styled.div`
  padding: 8px 0;
`;

const ContactItem = styled.div<{ $emergency?: boolean }>`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background-color 0.2s ease;
  background: ${props => props.$emergency ? '#fff3e0' : 'transparent'};

  &:hover {
    background: ${props => props.$emergency ? '#ffe0b2' : '#f8f9fa'};
  }
`;

const ContactAvatar = styled.div<{ $emergency?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: ${props => props.$emergency ? '#ff5722' : '#2196F3'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const ContactInfo = styled.div`
  flex: 1;
`;

const ContactName = styled.div<{ $elderly?: boolean }>`
  font-size: ${props => props.$elderly ? '18px' : '16px'};
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const ContactNumber = styled.div<{ $elderly?: boolean }>`
  font-size: ${props => props.$elderly ? '16px' : '14px'};
  color: #666;
`;

const CallButton = styled.button<{ $emergency?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: ${props => props.$emergency ? '#ff5722' : '#4CAF50'};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
`;

const DialPad = styled.div`
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const NumberDisplay = styled.div<{ $elderly?: boolean }>`
  width: 100%;
  height: ${props => props.$elderly ? '80px' : '60px'};
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${props => props.$elderly ? '28px' : '24px'};
  font-weight: 500;
  margin-bottom: 24px;
  color: #333;
`;

const DialGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  width: 100%;
  max-width: 280px;
  margin-bottom: 24px;
`;

const DialButton = styled.button<{ $elderly?: boolean }>`
  width: ${props => props.$elderly ? '80px' : '70px'};
  height: ${props => props.$elderly ? '80px' : '70px'};
  border-radius: 50%;
  border: none;
  background: #f0f0f0;
  font-size: ${props => props.$elderly ? '24px' : '20px'};
  font-weight: 600;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  justify-self: center;

  &:hover {
    background: #e0e0e0;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 20px;
  align-items: center;
`;

const ActionButton = styled.button<{ $type?: 'call' | 'delete' }>`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: ${props => props.$type === 'call' ? '#4CAF50' : props.$type === 'delete' ? '#f44336' : '#e0e0e0'};
  color: ${props => props.$type ? 'white' : '#666'};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const CallHistoryItem = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CallInfo = styled.div`
  flex: 1;
`;

const CallTime = styled.div<{ $elderly?: boolean }>`
  font-size: ${props => props.$elderly ? '14px' : '12px'};
  color: #999;
`;

const EmergencyHeader = styled.div<{ $elderly?: boolean }>`
  background: #ff5722;
  color: white;
  padding: ${props => props.$elderly ? '20px' : '16px'};
  text-align: center;
  font-size: ${props => props.$elderly ? '18px' : '16px'};
  font-weight: 600;
`;

interface PhoneScreenProps {
  onBack: () => void;
  elderlyMode?: boolean;
}

interface Contact {
  id: string;
  name: string;
  number: string;
  isEmergency?: boolean;
}

interface CallHistory {
  id: string;
  name: string;
  number: string;
  time: string;
  type: 'incoming' | 'outgoing' | 'missed';
}

type TabType = 'contacts' | 'dial' | 'history';

export const PhoneScreen: React.FC<PhoneScreenProps> = ({
  onBack,
  elderlyMode = false
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('contacts');
  const [dialedNumber, setDialedNumber] = useState('');

  const contacts: Contact[] = [
    { id: '1', name: 'Emergency Services', number: '911', isEmergency: true },
    { id: '2', name: 'Dr. Johnson (Family Doctor)', number: '(555) 123-4567', isEmergency: true },
    { id: '3', name: 'Sarah (Daughter)', number: '(555) 234-5678' },
    { id: '4', name: 'Mike (Son)', number: '(555) 345-6789' },
    { id: '5', name: 'Pharmacy', number: '(555) 456-7890', isEmergency: true },
    { id: '6', name: 'Neighbor - Mary', number: '(555) 567-8901' },
    { id: '7', name: 'Home Care Service', number: '(555) 678-9012', isEmergency: true }
  ];

  const callHistory: CallHistory[] = [
    { id: '1', name: 'Sarah (Daughter)', number: '(555) 234-5678', time: '2 hours ago', type: 'incoming' },
    { id: '2', name: 'Dr. Johnson', number: '(555) 123-4567', time: 'Yesterday', type: 'outgoing' },
    { id: '3', name: 'Mike (Son)', number: '(555) 345-6789', time: '2 days ago', type: 'incoming' }
  ];

  const emergencyContacts = contacts.filter(contact => contact.isEmergency);
  const regularContacts = contacts.filter(contact => !contact.isEmergency);

  const handleDialPadPress = (digit: string) => {
    setDialedNumber(prev => prev + digit);
  };

  const handleCall = (number: string, name?: string) => {
    console.log(`Calling ${name || 'Unknown'}: ${number}`);
    
    if ('speechSynthesis' in window) {
      const message = name ? `Calling ${name}` : `Calling ${number}`;
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
    
    // Simulate call interface (in real app, this would open call screen)
    alert(`Calling ${name || number}...`);
  };

  const handleDeleteDigit = () => {
    setDialedNumber(prev => prev.slice(0, -1));
  };

  const renderContactsTab = () => (
    <Content>
      {emergencyContacts.length > 0 && (
        <>
          <EmergencyHeader $elderly={elderlyMode}>
            <Heart size={20} style={{ marginRight: '8px', display: 'inline' }} />
            Emergency Contacts
          </EmergencyHeader>
          <ContactsList>
            {emergencyContacts.map((contact) => (
              <ContactItem key={contact.id} $emergency={contact.isEmergency}>
                <ContactAvatar $emergency={contact.isEmergency}>
                  {contact.isEmergency ? <Heart size={20} /> : <User size={20} />}
                </ContactAvatar>
                <ContactInfo>
                  <ContactName $elderly={elderlyMode}>{contact.name}</ContactName>
                  <ContactNumber $elderly={elderlyMode}>{contact.number}</ContactNumber>
                </ContactInfo>
                <CallButton 
                  $emergency={contact.isEmergency}
                  onClick={() => handleCall(contact.number, contact.name)}
                >
                  <Phone size={20} />
                </CallButton>
              </ContactItem>
            ))}
          </ContactsList>
        </>
      )}
      
      <ContactsList>
        {regularContacts.map((contact) => (
          <ContactItem key={contact.id}>
            <ContactAvatar>
              <User size={20} />
            </ContactAvatar>
            <ContactInfo>
              <ContactName $elderly={elderlyMode}>{contact.name}</ContactName>
              <ContactNumber $elderly={elderlyMode}>{contact.number}</ContactNumber>
            </ContactInfo>
            <CallButton onClick={() => handleCall(contact.number, contact.name)}>
              <Phone size={20} />
            </CallButton>
          </ContactItem>
        ))}
      </ContactsList>
    </Content>
  );

  const renderDialTab = () => (
    <DialPad>
      <NumberDisplay $elderly={elderlyMode}>
        {dialedNumber || 'Enter number'}
      </NumberDisplay>
      
      <DialGrid>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((digit) => (
          <DialButton
            key={digit}
            $elderly={elderlyMode}
            onClick={() => handleDialPadPress(String(digit))}
          >
            {digit}
          </DialButton>
        ))}
      </DialGrid>
      
      <ActionButtons>
        <ActionButton 
          $type="delete"
          onClick={handleDeleteDigit}
          disabled={!dialedNumber}
        >
          <Trash2 size={24} />
        </ActionButton>
        
        <ActionButton 
          $type="call"
          onClick={() => handleCall(dialedNumber)}
          disabled={!dialedNumber}
        >
          <PhoneCall size={24} />
        </ActionButton>
      </ActionButtons>
    </DialPad>
  );

  const renderHistoryTab = () => (
    <Content>
      <ContactsList>
        {callHistory.map((call) => (
          <CallHistoryItem key={call.id}>
            <ContactAvatar>
              <Clock size={20} />
            </ContactAvatar>
            <CallInfo>
              <ContactName $elderly={elderlyMode}>{call.name}</ContactName>
              <ContactNumber $elderly={elderlyMode}>{call.number}</ContactNumber>
              <CallTime $elderly={elderlyMode}>{call.time}</CallTime>
            </CallInfo>
            <CallButton onClick={() => handleCall(call.number, call.name)}>
              <Phone size={20} />
            </CallButton>
          </CallHistoryItem>
        ))}
      </ContactsList>
    </Content>
  );

  return (
    <PhoneContainer>
      <TabBar>
        <Tab 
          $active={activeTab === 'contacts'} 
          $elderly={elderlyMode}
          onClick={() => setActiveTab('contacts')}
        >
          Contacts
        </Tab>
        <Tab 
          $active={activeTab === 'dial'} 
          $elderly={elderlyMode}
          onClick={() => setActiveTab('dial')}
        >
          Dial
        </Tab>
        <Tab 
          $active={activeTab === 'history'} 
          $elderly={elderlyMode}
          onClick={() => setActiveTab('history')}
        >
          History
        </Tab>
      </TabBar>

      {activeTab === 'contacts' && renderContactsTab()}
      {activeTab === 'dial' && renderDialTab()}
      {activeTab === 'history' && renderHistoryTab()}

      <div style={{ flexShrink: 0 }}>
        <AndroidNavigationBar
          showBack
          onBackPress={onBack}
          onHomePress={onBack}
        />
      </div>
    </PhoneContainer>
  );
};