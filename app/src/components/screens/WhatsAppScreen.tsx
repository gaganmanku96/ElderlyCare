import React, { useState } from 'react';
import styled from 'styled-components';
import { AndroidNavigationBar } from '../android';
import { speakText } from '../../utils/voiceUtils';
import { useScreenNavigation } from '../../contexts/ScreenStateContext';
import { ArrowLeft, Search, MoreVertical, Camera, Send, User, Settings, LogOut } from 'lucide-react';

const WhatsAppContainer = styled.div`
  height: 100%;
  background: #ffffff;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  background: #075e54;
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderTitle = styled.h1`
  font-size: 20px;
  font-weight: 600;
  margin: 0;
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const ActionButton = styled.button`
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

const ChatsList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ChatItem = styled.div`
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f8f9fa;
  }
`;

const Avatar = styled.div<{ $src?: string }>`
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: ${props => props.$src ? `url(${props.$src})` : '#ddd'};
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
`;

const ChatInfo = styled.div`
  flex: 1;
`;

const ContactName = styled.div<{ $elderly?: boolean }>`
  font-size: ${props => props.$elderly ? '18px' : '16px'};
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const LastMessage = styled.div<{ $elderly?: boolean }>`
  font-size: ${props => props.$elderly ? '16px' : '14px'};
  color: #666;
`;

const MessageTime = styled.div<{ $elderly?: boolean }>`
  font-size: ${props => props.$elderly ? '14px' : '12px'};
  color: #999;
`;

// const ConversationView = styled.div`
//   height: 100%;
//   display: flex;
//   flex-direction: column;
// `;

const ConversationHeader = styled.div`
  background: #075e54;
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MessagesArea = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #e5ddd5;
  background-image: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="%23ffffff" opacity="0.1"/></svg>');
`;

const MessageBubble = styled.div<{ $isUser?: boolean; $elderly?: boolean }>`
  max-width: 80%;
  margin-bottom: 12px;
  margin-left: ${props => props.$isUser ? 'auto' : '0'};
  margin-right: ${props => props.$isUser ? '0' : 'auto'};
  padding: ${props => props.$elderly ? '16px' : '12px'};
  border-radius: 8px;
  background: ${props => props.$isUser ? '#dcf8c6' : '#ffffff'};
  color: #333;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  font-size: ${props => props.$elderly ? '16px' : '14px'};
`;

const InputArea = styled.div`
  padding: 16px;
  background: #f0f0f0;
  display: flex;
  gap: 12px;
  align-items: center;
`;

const MessageInput = styled.input<{ $elderly?: boolean }>`
  flex: 1;
  padding: ${props => props.$elderly ? '16px' : '12px'};
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  font-size: ${props => props.$elderly ? '18px' : '16px'};
  outline: none;
  background: white;

  &:focus {
    border-color: #075e54;
  }
`;

// const ProfileView = styled.div`
//   height: 100%;
//   background: white;
// `;

const ProfileHeader = styled.div`
  background: #075e54;
  color: white;
  padding: 16px;
  text-align: center;
`;

const ProfileContent = styled.div`
  padding: 24px 16px;
`;

const ProfileAvatar = styled.div<{ $src?: string }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${props => props.$src ? `url(${props.$src})` : '#ddd'};
  background-size: cover;
  background-position: center;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  position: relative;
  
  &:hover::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
  }
`;

const CameraOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.2s;
  
  ${ProfileAvatar}:hover & {
    opacity: 1;
  }
`;

const ProfileName = styled.h2<{ $elderly?: boolean }>`
  font-size: ${props => props.$elderly ? '24px' : '20px'};
  text-align: center;
  margin-bottom: 24px;
  color: #333;
`;

const ProfileOption = styled.div<{ $elderly?: boolean }>`
  padding: ${props => props.$elderly ? '20px' : '16px'} 0;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  font-size: ${props => props.$elderly ? '18px' : '16px'};
  
  &:hover {
    background: #f8f9fa;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

interface WhatsAppScreenProps {
  onBack: () => void;
  elderlyMode?: boolean;
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  avatar?: string;
  messages: Array<{
    id: string;
    text: string;
    isUser: boolean;
    timestamp: Date;
  }>;
}

type View = 'chats' | 'conversation' | 'profile';

export const WhatsAppScreen: React.FC<WhatsAppScreenProps> = ({
  onBack,
  elderlyMode = false
}) => {
  const [currentView, setCurrentView] = useState<View>('chats');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  // Smart screenshot navigation tracking
  const navigateToScreen = useScreenNavigation('whatsapp');

  const [chats] = useState<Chat[]>([
    {
      id: '1',
      name: 'Sarah (Daughter)',
      lastMessage: 'How are you doing today, Mom?',
      time: '10:32 AM',
      messages: [
        { id: '1', text: 'Good morning Mom! How are you feeling today?', isUser: false, timestamp: new Date() },
        { id: '2', text: 'Good morning dear! I\'m doing well, thank you for asking 😊', isUser: true, timestamp: new Date() },
        { id: '3', text: 'That\'s wonderful to hear! Do you need help with anything?', isUser: false, timestamp: new Date() }
      ]
    },
    {
      id: '2',
      name: 'Mike (Son)',
      lastMessage: 'Can\'t wait to see you this weekend!',
      time: '9:15 AM',
      messages: [
        { id: '1', text: 'Hi Mom! Looking forward to our dinner this weekend', isUser: false, timestamp: new Date() },
        { id: '2', text: 'Me too! I\'ll make your favorite lasagna', isUser: true, timestamp: new Date() },
        { id: '3', text: 'Can\'t wait to see you this weekend!', isUser: false, timestamp: new Date() }
      ]
    },
    {
      id: '3',
      name: 'Family Group',
      lastMessage: 'Don\'t forget about Sunday lunch!',
      time: 'Yesterday',
      messages: [
        { id: '1', text: 'Hey everyone! Sunday lunch at 1 PM, don\'t forget!', isUser: false, timestamp: new Date() },
        { id: '2', text: 'I\'ll be there! Should I bring dessert?', isUser: true, timestamp: new Date() }
      ]
    }
  ]);

  const currentChat = chats.find(chat => chat.id === selectedChat);

  const handleSendMessage = async () => {
    if (newMessage.trim() && selectedChat) {
      console.log(`Sending WhatsApp message: ${newMessage} to chat ${selectedChat}`);
      setNewMessage('');
      
      await speakText("Message sent successfully!");
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        setProfilePicture(e.target?.result as string);
        
        await speakText("Profile picture updated successfully!");
      };
      reader.readAsDataURL(file);
    }
  };

  const renderChatsView = () => (
    <>
      <Header>
        <HeaderLeft>
          <HeaderTitle>WhatsApp</HeaderTitle>
        </HeaderLeft>
        <HeaderActions>
          <ActionButton>
            <Search size={20} />
          </ActionButton>
          <ActionButton onClick={() => {
            setCurrentView('profile');
            navigateToScreen('profile');
          }}>
            <MoreVertical size={20} />
          </ActionButton>
        </HeaderActions>
      </Header>
      
      <ChatsList>
        {chats.map((chat) => (
          <ChatItem
            key={chat.id}
            onClick={() => {
              setSelectedChat(chat.id);
              setCurrentView('conversation');
              navigateToScreen(`conversation-${chat.name}`);
            }}
          >
            <Avatar>
              <User size={24} />
            </Avatar>
            <ChatInfo>
              <ContactName $elderly={elderlyMode}>{chat.name}</ContactName>
              <LastMessage $elderly={elderlyMode}>{chat.lastMessage}</LastMessage>
            </ChatInfo>
            <MessageTime $elderly={elderlyMode}>{chat.time}</MessageTime>
          </ChatItem>
        ))}
      </ChatsList>
    </>
  );

  const renderConversationView = () => (
    <>
      <ConversationHeader>
        <ActionButton onClick={() => {
          setCurrentView('chats');
          navigateToScreen('chats');
        }}>
          <ArrowLeft size={20} />
        </ActionButton>
        <Avatar>
          <User size={20} />
        </Avatar>
        <HeaderTitle style={{ flex: 1 }}>{currentChat?.name}</HeaderTitle>
      </ConversationHeader>
      
      <MessagesArea>
        {currentChat?.messages.map((message) => (
          <MessageBubble key={message.id} $isUser={message.isUser} $elderly={elderlyMode}>
            {message.text}
          </MessageBubble>
        ))}
      </MessagesArea>

      <InputArea>
        <MessageInput
          $elderly={elderlyMode}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <ActionButton onClick={handleSendMessage} disabled={!newMessage.trim()}>
          <Send size={20} color={newMessage.trim() ? '#075e54' : '#ccc'} />
        </ActionButton>
      </InputArea>
    </>
  );

  const renderProfileView = () => (
    <>
      <ProfileHeader>
        <ActionButton onClick={() => {
          setCurrentView('chats');
          navigateToScreen('chats');
        }}>
          <ArrowLeft size={20} />
        </ActionButton>
        <HeaderTitle>Profile</HeaderTitle>
      </ProfileHeader>
      
      <ProfileContent>
        <ProfileAvatar 
          $src={profilePicture || undefined}
          onClick={() => document.getElementById('profile-picture-upload')?.click()}
        >
          {!profilePicture && <User size={48} />}
          <CameraOverlay>
            <Camera size={24} />
          </CameraOverlay>
        </ProfileAvatar>
        
        <HiddenFileInput
          id="profile-picture-upload"
          type="file"
          accept="image/*"
          onChange={handleProfilePictureChange}
        />
        
        <ProfileName $elderly={elderlyMode}>Your Name</ProfileName>
        
        <ProfileOption $elderly={elderlyMode}>
          <User size={20} />
          <span>Account</span>
        </ProfileOption>
        
        <ProfileOption $elderly={elderlyMode}>
          <Settings size={20} />
          <span>Settings</span>
        </ProfileOption>
        
        <ProfileOption $elderly={elderlyMode}>
          <LogOut size={20} />
          <span>Log out</span>
        </ProfileOption>
      </ProfileContent>
    </>
  );

  return (
    <WhatsAppContainer>
      {currentView === 'chats' && renderChatsView()}
      {currentView === 'conversation' && renderConversationView()}
      {currentView === 'profile' && renderProfileView()}

      <div style={{ flexShrink: 0 }}>
        <AndroidNavigationBar
          showBack
          onBackPress={onBack}
          onHomePress={onBack}
        />
      </div>
    </WhatsAppContainer>
  );
};