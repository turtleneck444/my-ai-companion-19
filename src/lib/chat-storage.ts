import { supabase } from './supabase';
import type { ChatMessage } from './ai-chat';

export interface Conversation {
  id: string;
  character_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  message_count: number;
}

export interface StoredMessage {
  id: string;
  conversation_id: string;
  character_id: string;
  user_id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: string;
  metadata?: any;
}

export class ChatStorageService {
  // Create or get existing conversation between user and character
  static async getOrCreateConversation(userId: string, characterId: string): Promise<string> {
    try {
      // First, try to find existing conversation
      const { data: existingConversation, error: findError } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .single();

      if (existingConversation && !findError) {
        console.log('📝 Found existing conversation:', existingConversation.id);
        return existingConversation.id;
      }

      // If there's a permission error, use fallback
      if (findError && (findError.code === 'PGRST301' || findError.code === '42501' || findError.message.includes('permission'))) {
        console.log('⚠️ Permission denied for conversations table, using fallback storage');
        return `fallback-${userId}-${characterId}`;
      }

      // Create new conversation if none exists
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert([{
          user_id: userId,
          character_id: characterId,
          last_message_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (createError) {
        console.error('❌ Error creating conversation:', createError);
        // If table doesn't exist or permission denied, return a fallback ID
        if (createError.code === 'PGRST116' || createError.code === 'PGRST301' || createError.code === '42501' || 
            createError.message.includes('relation "conversations" does not exist') ||
            createError.message.includes('permission')) {
          console.log('⚠️ Conversations table not accessible, using fallback storage');
          return `fallback-${userId}-${characterId}`;
        }
        throw createError;
      }

      console.log('📝 Created new conversation:', newConversation.id);
      return newConversation.id;
    } catch (error) {
      console.error('❌ Error in getOrCreateConversation:', error);
      // Return fallback ID for graceful degradation
      return `fallback-${userId}-${characterId}`;
    }
  }

  // Save a message to the database
  static async saveMessage(
    conversationId: string,
    characterId: string,
    userId: string,
    message: ChatMessage
  ): Promise<void> {
    try {
      // Use fallback storage if using fallback ID
      if (conversationId.startsWith('fallback-')) {
        const key = `chat_${conversationId}`;
        const existingMessages = JSON.parse(localStorage.getItem(key) || '[]');
        existingMessages.push({
          ...message,
          timestamp: message.timestamp.toISOString()
        });
        localStorage.setItem(key, JSON.stringify(existingMessages));
        console.log('💾 Message saved to fallback storage');
        return;
      }

      const { error } = await supabase
        .from('messages')
        .insert([{
          conversation_id: conversationId,
          character_id: characterId,
          user_id: userId,
          content: message.content,
          sender: message.sender,
          timestamp: message.timestamp.toISOString(),
          metadata: {
            message_id: message.id,
            relationship_context: 'romantic'
          }
        }]);

      if (error) {
        console.error('❌ Error saving message:', error);
        // Don't throw error, just log it for graceful degradation
        return;
      }

      // Update conversation's last_message_at and message_count
      await supabase
        .from('conversations')
        .update({
          last_message_at: message.timestamp.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversationId);

      console.log('💾 Message saved successfully');
    } catch (error) {
      console.error('❌ Error in saveMessage:', error);
      // Don't throw error, just log it for graceful degradation
    }
  }

  // Load messages for a conversation
  static async loadMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      // Load from fallback storage if using fallback ID
      if (conversationId.startsWith('fallback-')) {
        const key = `chat_${conversationId}`;
        const storedMessages = JSON.parse(localStorage.getItem(key) || '[]');
        console.log('📖 Loaded messages from fallback storage:', storedMessages.length);
        
        // Convert stored messages to ChatMessage format
        const chatMessages: ChatMessage[] = storedMessages.map((msg: any) => ({
          id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: msg.content,
          sender: msg.sender,
          timestamp: new Date(msg.timestamp),
          metadata: msg.metadata || {}
        }));
        
        return chatMessages;
      }

      const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('❌ Error loading messages:', error);
        return [];
      }

      // Convert stored messages to ChatMessage format
      const chatMessages: ChatMessage[] = (messages || []).map(msg => ({
        id: msg.metadata?.message_id || msg.id,
        content: msg.content,
        sender: msg.sender,
        timestamp: new Date(msg.timestamp)
      }));

      console.log('📖 Loaded', chatMessages.length, 'messages for conversation', conversationId);
      return chatMessages;
    } catch (error) {
      console.error('❌ Error in loadMessages:', error);
      return [];
    }
  }

  // Get all conversations for a user
  static async getUserConversations(userId: string): Promise<Conversation[]> {
    try {
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          *,
          characters (
            id,
            name,
            avatar_url,
            personality
          )
        `)
        .eq('user_id', userId)
        .order('last_message_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading conversations:', error);
        return [];
      }

      return conversations || [];
    } catch (error) {
      console.error('❌ Error in getUserConversations:', error);
      return [];
    }
  }

  // Get conversation with a specific character
  static async getConversationWithCharacter(userId: string, characterId: string): Promise<Conversation | null> {
    try {
      const { data: conversation, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('user_id', userId)
        .eq('character_id', characterId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading conversation:', error);
        return null;
      }

      return conversation;
    } catch (error) {
      console.error('❌ Error in getConversationWithCharacter:', error);
      return null;
    }
  }

  // Delete a conversation and all its messages
  static async deleteConversation(conversationId: string): Promise<void> {
    try {
      // Skip if using fallback ID
      if (conversationId.startsWith('fallback-')) {
        console.log('🗑️ Using fallback storage, skipping delete');
        return;
      }

      // Delete all messages first
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId);

      // Delete the conversation
      await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      console.log('🗑️ Conversation deleted:', conversationId);
    } catch (error) {
      console.error('❌ Error deleting conversation:', error);
      // Don't throw error, just log it
    }
  }
}
