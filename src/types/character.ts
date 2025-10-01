// Centralized type definitions for the application

export interface Voice {
  voice_id: string;
  name: string;
}

// Database character type (as stored in Supabase)
export interface DbCharacter {
  id: string;
  name: string;
  avatar_url: string;
  bio: string;
  personality: string; // JSON string in database
  voice: string; // Voice ID string in database
  user_id: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  description?: string;
}

// Application character type (with parsed fields)
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

// Helper to convert database character to app character
export function dbCharacterToCharacter(dbChar: DbCharacter): Character {
  return {
    ...dbChar,
    avatar: dbChar.avatar_url,
    personality: typeof dbChar.personality === 'string' 
      ? JSON.parse(dbChar.personality) 
      : Array.isArray(dbChar.personality) ? dbChar.personality : [],
    voice: {
      voice_id: dbChar.voice || 'EXAVITQu4vr4xnSDxMaL',
      name: 'Default Voice'
    }
  };
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
