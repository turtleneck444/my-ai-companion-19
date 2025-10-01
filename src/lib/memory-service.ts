import { supabase } from "@/integrations/supabase/client";
import type { Character, ChatMessage } from "@/types/character";

export interface ChatMemory {
  id: string;
  character_id: string;
  user_id: string;
  messages: ChatMessage[];
  last_updated: string;
  total_messages: number;
  user_preferences: any;
  character_insights: any;
}

export class MemoryService {
  private static instance: MemoryService;
  
  public static getInstance(): MemoryService {
    if (!MemoryService.instance) {
      MemoryService.instance = new MemoryService();
    }
    return MemoryService.instance;
  }

  // Save chat message to memory
  async saveMessage(characterId: string, userId: string, message: ChatMessage): Promise<void> {
    try {
      console.log("💾 Saving message for character:", characterId, "user:", userId);
      
      // Get existing chat memory
      const { data: existingMemory, error: fetchError } = await supabase
        .from("chat_memories")
        .select("*")
        .eq("character_id", characterId)
        .eq("user_id", userId)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching chat memory:", fetchError);
        return;
      }

      let messages: ChatMessage[] = [];
      let memoryId: string;

      if (existingMemory) {
        messages = existingMemory.messages || [];
        memoryId = existingMemory.id;
      } else {
        // Create new memory record
        const { data: newMemory, error: createError } = await supabase
          .from("chat_memories")
          .insert({
            character_id: characterId,
            user_id: userId,
            messages: [],
            total_messages: 0,
            user_preferences: {},
            character_insights: {}
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating chat memory:", createError);
          return;
        }
        memoryId = newMemory.id;
      }

      // Add new message
      messages.push(message);

      // Update memory
      const { error: updateError } = await supabase
        .from("chat_memories")
        .update({
          messages: messages,
          total_messages: messages.length,
          last_updated: new Date().toISOString()
        })
        .eq("id", memoryId);

      if (updateError) {
        console.error("Error updating chat memory:", updateError);
      } else {
        console.log("💾 Message saved to memory for character", characterId, ":", message.content.substring(0, 50) + "...");
      }
    } catch (error) {
      console.error("Error saving message to memory:", error);
    }
  }

  // Get chat history for a character
  async getChatHistory(characterId: string, userId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from("chat_memories")
        .select("messages")
        .eq("character_id", characterId)
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching chat history:", error);
        return [];
      }

      return data?.messages || [];
    } catch (error) {
      console.error("Error getting chat history:", error);
      return [];
    }
  }

  // Get character insights about the user
  async getCharacterInsights(characterId: string, userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("chat_memories")
        .select("character_insights")
        .eq("character_id", characterId)
        .eq("user_id", userId)
        .single();

      if (error) {
        console.error("Error fetching character insights:", error);
        return {};
      }

      return data?.character_insights || {};
    } catch (error) {
      console.error("Error getting character insights:", error);
      return {};
    }
  }

  // Update character insights
  async updateCharacterInsights(characterId: string, userId: string, insights: any): Promise<void> {
    try {
      const { error } = await supabase
        .from("chat_memories")
        .update({
          character_insights: insights,
          last_updated: new Date().toISOString()
        })
        .eq("character_id", characterId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error updating character insights:", error);
      } else {
        console.log("🧠 Character insights updated");
      }
    } catch (error) {
      console.error("Error updating character insights:", error);
    }
  }

  // Clear chat history for a character
  async clearChatHistory(characterId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("chat_memories")
        .update({
          messages: [],
          total_messages: 0,
          character_insights: {}
        })
        .eq("character_id", characterId)
        .eq("user_id", userId);

      if (error) {
        console.error("Error clearing chat history:", error);
      } else {
        console.log("🗑️ Chat history cleared");
      }
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  }
}

export const memoryService = MemoryService.getInstance();
