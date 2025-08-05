export interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  id: string;
}

export interface ConversationState {
  messages: Message[];
  context: string;
  lastScreenshotTimestamp?: Date;
  lastUpdated: Date;
  hasGreeted?: boolean; // Track if we've already greeted user in this context
  lastContextSwitchTime?: Date; // Track when user last switched to this context
}

export interface ConversationStore {
  [contextKey: string]: ConversationState;
}