import type { Message, ConversationState, ConversationStore } from '../types/conversation';

const STORAGE_KEY = 'elderly-care-conversations';
const MAX_CONVERSATIONS = 10; // Limit to prevent localStorage bloat
const CONVERSATION_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

class ConversationService {
  private conversations: ConversationStore = {};

  constructor() {
    this.loadFromStorage();
    this.cleanupExpiredConversations();
  }

  /**
   * Load conversations from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        this.conversations = Object.keys(parsed).reduce((acc, key) => {
          const conv = parsed[key];
          acc[key] = {
            ...conv,
            lastUpdated: new Date(conv.lastUpdated),
            lastScreenshotTimestamp: conv.lastScreenshotTimestamp 
              ? new Date(conv.lastScreenshotTimestamp) 
              : undefined,
            lastContextSwitchTime: conv.lastContextSwitchTime
              ? new Date(conv.lastContextSwitchTime)
              : undefined,
            hasGreeted: conv.hasGreeted || false,
            messages: conv.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          };
          return acc;
        }, {} as ConversationStore);
      }
    } catch (error) {
      console.error('Error loading conversations from storage:', error);
      this.conversations = {};
    }
  }

  /**
   * Save conversations to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.conversations));
    } catch (error) {
      console.error('Error saving conversations to storage:', error);
    }
  }

  /**
   * Clean up expired conversations
   */
  private cleanupExpiredConversations(): void {
    const now = Date.now();
    const keys = Object.keys(this.conversations);
    
    // Remove expired conversations
    keys.forEach(key => {
      const conversation = this.conversations[key];
      if (now - conversation.lastUpdated.getTime() > CONVERSATION_EXPIRY) {
        delete this.conversations[key];
      }
    });

    // If we still have too many, remove the oldest ones
    const remainingKeys = Object.keys(this.conversations);
    if (remainingKeys.length > MAX_CONVERSATIONS) {
      const sortedKeys = remainingKeys.sort((a, b) => 
        this.conversations[a].lastUpdated.getTime() - this.conversations[b].lastUpdated.getTime()
      );
      
      const keysToRemove = sortedKeys.slice(0, remainingKeys.length - MAX_CONVERSATIONS);
      keysToRemove.forEach(key => {
        delete this.conversations[key];
      });
    }

    this.saveToStorage();
  }

  /**
   * Get conversation for a specific context
   */
  getConversation(context: string): ConversationState | null {
    return this.conversations[context] || null;
  }

  /**
   * Add a message to a conversation
   */
  addMessage(context: string, message: Omit<Message, 'id'>): Message {
    const fullMessage: Message = {
      ...message,
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `msg_${Date.now()}_${performance.now().toString().replace('.', '')}_${Math.random().toString(36).substr(2, 9)}`
    };

    if (!this.conversations[context]) {
      this.conversations[context] = {
        messages: [],
        context,
        lastUpdated: new Date()
      };
    }

    this.conversations[context].messages.push(fullMessage);
    this.conversations[context].lastUpdated = new Date();
    
    this.saveToStorage();
    return fullMessage;
  }

  /**
   * Update screenshot timestamp for a conversation
   */
  updateScreenshotTimestamp(context: string): void {
    if (!this.conversations[context]) {
      this.conversations[context] = {
        messages: [],
        context,
        lastUpdated: new Date(),
        hasGreeted: false
      };
    }

    this.conversations[context].lastScreenshotTimestamp = new Date();
    this.conversations[context].lastUpdated = new Date();
    
    this.saveToStorage();
  }

  /**
   * Mark conversation as greeted and update context switch time
   */
  markAsGreeted(context: string): void {
    if (!this.conversations[context]) {
      this.conversations[context] = {
        messages: [],
        context,
        lastUpdated: new Date(),
        hasGreeted: false
      };
    }

    this.conversations[context].hasGreeted = true;
    this.conversations[context].lastContextSwitchTime = new Date();
    this.conversations[context].lastUpdated = new Date();
    
    this.saveToStorage();
  }

  /**
   * Update context switch time (when user switches to this context)
   */
  updateContextSwitchTime(context: string): void {
    if (!this.conversations[context]) {
      this.conversations[context] = {
        messages: [],
        context,
        lastUpdated: new Date(),
        hasGreeted: false
      };
    }

    this.conversations[context].lastContextSwitchTime = new Date();
    this.conversations[context].lastUpdated = new Date();
    
    this.saveToStorage();
  }

  /**
   * Clear conversation for a specific context
   */
  clearConversation(context: string): void {
    delete this.conversations[context];
    this.saveToStorage();
  }

  /**
   * Clear all conversations
   */
  clearAllConversations(): void {
    this.conversations = {};
    this.saveToStorage();
  }

  /**
   * Get all conversation contexts (for debugging/admin)
   */
  getAllContexts(): string[] {
    return Object.keys(this.conversations);
  }

  /**
   * Check if a conversation needs a fresh screenshot
   * Uses intelligent logic to avoid unnecessary captures during context switching
   */
  needsFreshScreenshot(context: string, contextChangedAt?: Date): boolean {
    const conversation = this.conversations[context];
    
    // Always need screenshot if no conversation exists
    if (!conversation) {
      return true;
    }

    // Always need screenshot if never taken one
    if (!conversation.lastScreenshotTimestamp) {
      return true;
    }

    // If context explicitly changed after last screenshot, need fresh one
    if (contextChangedAt && contextChangedAt > conversation.lastScreenshotTimestamp) {
      return true;
    }

    // Smart staleness check - consider context switching patterns
    const now = Date.now();
    const lastScreenshotTime = conversation.lastScreenshotTimestamp.getTime();
    const lastContextSwitchTime = conversation.lastContextSwitchTime?.getTime() || 0;
    
    // If we just switched to this context (within 5 seconds), don't force new screenshot
    const justSwitched = lastContextSwitchTime && (now - lastContextSwitchTime) < 5000;
    if (justSwitched) {
      // Only refresh if screenshot is really old (5 minutes instead of 30 seconds)
      const fiveMinutesAgo = now - (5 * 60 * 1000);
      return lastScreenshotTime < fiveMinutesAgo;
    }

    // Normal staleness check - 2 minutes instead of 30 seconds for better UX
    const twoMinutesAgo = now - (2 * 60 * 1000);
    return lastScreenshotTime < twoMinutesAgo;
  }
}

// Create and export a singleton instance
export const conversationService = new ConversationService();