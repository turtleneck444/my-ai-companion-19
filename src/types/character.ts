// Centralized type definitions for the application

export interface Voice {
  voice_id: string;
  name: string;
}

export interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  personalityTraits?: Record<string, number>;
  voice: Voice;
  isOnline?: boolean;
  mood?: string;
  relationshipLevel?: number;
  avatar_url?: string;
  description?: string;
  user_id?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserPreferences {
  preferredName: string;
  petName?: string;
  treatmentStyle: string;
  age: string;
  contentFilter: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  emotion?: string;
  topics?: string[];
}

export interface ChatContext {
  character: Character;
  userPreferences: UserPreferences;
  conversationHistory: ChatMessage[];
  relationshipLevel: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  sessionMemory?: {
    userMood?: string;
    topics?: string[];
    personalDetails?: Record<string, string>;
    preferences?: Record<string, string>;
    keyMoments?: string[];
    lastUserMessage?: string;
    conversationFlow?: string[];
    userProfile?: {
      name: string;
      petName?: string;
      age?: string;
      interests?: string[];
      goals?: string[];
      challenges?: string[];
    };
  };
}

export interface SystemPromptContext {
  character: Character;
  userPreferences: UserPreferences;
}

export interface UpgradeData {
  planId: string;
  features?: string[];
  price?: number;
}
