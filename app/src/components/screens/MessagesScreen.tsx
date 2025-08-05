import React, { useState } from 'react';
import styled from 'styled-components';
import { AndroidNavigationBar } from '../android';
import { Plus, Send } from 'lucide-react';

const MessagesContainer = styled.div`
  height: 100%;
  background: #ffffff;
  position: relative;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  background: #2196F3;
  color: white;
  padding: 16px;
  font-size: 20px;
  font-weight: 600;
`;

const ConversationsList = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConversationItem = styled.div`
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #f5f5f5;
  }
`;

const ContactName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
`;

const LastMessage = styled.div`
  font-size: 14px;
  color: #666;
`;

const NewMessageFab = styled.button`
  position: absolute;
  bottom: 90px;
  right: 16px;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #2196F3;
  border: none;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: #1976D2;
    transform: scale(1.1);
  }
`;

const ConversationView = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const MessagesArea = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #f8f9fa;
`;

const MessageBubble = styled.div<{ $isUser?: boolean }>`
  max-width: 80%;
  margin-bottom: 12px;
  margin-left: ${props => props.$isUser ? 'auto' : '0'};
  margin-right: ${props => props.$isUser ? '0' : 'auto'};
  padding: 12px 16px;
  border-radius: 18px;
  background: ${props => props.$isUser ? '#2196F3' : '#ffffff'};
  color: ${props => props.$isUser ? '#ffffff' : '#333333'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
`;

const InputArea = styled.div`
  padding: 16px;
  background: #ffffff;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 12px;
  align-items: center;
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 24px;
  font-size: 16px;
  outline: none;

  &:focus {
    border-color: #2196F3;
  }
`;

const SendButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #2196F3;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;

  &:hover {
    background: #1976D2;
  }

  &:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
`;

interface MessagesScreenProps {
  onBack: () => void;
  elderlyMode?: boolean;
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  messages: Message[];
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({
  onBack,
  elderlyMode = false
}) => {
  const [conversations] = useState<Conversation[]>([
    {
      id: '1',
      name: 'Sarah (Daughter)',
      lastMessage: 'How are you doing today?',
      messages: [
        { id: '1', text: 'Hi Mom! How are you doing today?', isUser: false, timestamp: new Date() },
        { id: '2', text: 'I\'m doing well, thank you for asking!', isUser: true, timestamp: new Date() }
      ]
    },
    {
      id: '2',
      name: 'Dr. Johnson',
      lastMessage: 'Your appointment is confirmed',
      messages: [
        { id: '1', text: 'Your appointment for next Tuesday at 2 PM is confirmed', isUser: false, timestamp: new Date() }
      ]
    },
    {
      id: '3',
      name: 'Mike (Son)',
      lastMessage: 'See you this weekend!',
      messages: [
        { id: '1', text: 'Looking forward to seeing you this weekend!', isUser: false, timestamp: new Date() },
        { id: '2', text: 'Me too! I\'ll make your favorite cookies.', isUser: true, timestamp: new Date() }
      ]
    }
  ]);

  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedConversation) {
      // In a real app, this would update the conversation
      console.log(`Sending message: ${newMessage} to conversation ${selectedConversation}`);
      setNewMessage('');
      
      // Show success feedback
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance("Message sent successfully!");
        utterance.rate = 0.8;
        speechSynthesis.speak(utterance);
      }
    }
  };

  const currentConversation = conversations.find(c => c.id === selectedConversation);

  if (selectedConversation && currentConversation) {
    return (
      <MessagesContainer>
        <Header>{currentConversation.name}</Header>
        
        <ConversationView>
          <MessagesArea>
            {currentConversation.messages.map((message) => (
              <MessageBubble key={message.id} $isUser={message.isUser}>
                {message.text}
              </MessageBubble>
            ))}
          </MessagesArea>

          <InputArea>
            <MessageInput
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              style={{ fontSize: elderlyMode ? '18px' : '16px' }}
            />
            <SendButton 
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send size={20} />
            </SendButton>
          </InputArea>
        </ConversationView>

        <div style={{ flexShrink: 0 }}>
          <AndroidNavigationBar
            showBack
            onBackPress={() => setSelectedConversation(null)}
            onHomePress={onBack}
          />
        </div>
      </MessagesContainer>
    );
  }

  return (
    <MessagesContainer>
      <Header>Messages</Header>
      
      <ConversationsList>
        {conversations.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            onClick={() => setSelectedConversation(conversation.id)}
          >
            <ContactName style={{ fontSize: elderlyMode ? '18px' : '16px' }}>
              {conversation.name}
            </ContactName>
            <LastMessage style={{ fontSize: elderlyMode ? '16px' : '14px' }}>
              {conversation.lastMessage}
            </LastMessage>
          </ConversationItem>
        ))}
      </ConversationsList>

      <NewMessageFab onClick={() => alert('New message - this would open a contact picker in a real app')}>
        <Plus size={24} />
      </NewMessageFab>

      <div style={{ flexShrink: 0 }}>
        <AndroidNavigationBar
          showBack
          onBackPress={onBack}
          onHomePress={onBack}
        />
      </div>
    </MessagesContainer>
  );
};