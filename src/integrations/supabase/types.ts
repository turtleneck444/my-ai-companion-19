export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          event_data: Json | null
          event_type: string
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          event_data?: Json | null
          event_type: string
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          event_data?: Json | null
          event_type?: string
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      characters: {
        Row: {
          id: string
          user_id: string | null
          name: string
          description: string | null
          personality: string | null
          personality_traits: string[] | null
          voice_id: string | null
          voice_settings: Json | null
          background_story: string | null
          relationship_type: string | null
          age_range: string | null
          interests: string[] | null
          communication_style: string | null
          emotional_tone: string | null
          avatar_url: string | null
          is_public: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          description?: string | null
          personality?: string | null
          personality_traits?: string[] | null
          voice_id?: string | null
          voice_settings?: Json | null
          background_story?: string | null
          relationship_type?: string | null
          age_range?: string | null
          interests?: string[] | null
          communication_style?: string | null
          emotional_tone?: string | null
          avatar_url?: string | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          description?: string | null
          personality?: string | null
          personality_traits?: string[] | null
          voice_id?: string | null
          voice_settings?: Json | null
          background_story?: string | null
          relationship_type?: string | null
          age_range?: string | null
          interests?: string[] | null
          communication_style?: string | null
          emotional_tone?: string | null
          avatar_url?: string | null
          is_public?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      companions: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          name: string
          personality: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          name: string
          personality?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          name?: string
          personality?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          character_id: string | null
          companion_id: string | null
          created_at: string | null
          id: string
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          character_id?: string | null
          companion_id?: string | null
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          character_id?: string | null
          companion_id?: string | null
          created_at?: string | null
          id?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_companion_id_fkey"
            columns: ["companion_id"]
            isOneToOne: false
            referencedRelation: "companions"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          character_id: string | null
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          role: string
          sender: string | null
          user_id: string | null
        }
        Insert: {
          character_id?: string | null
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          role: string
          sender?: string | null
          user_id?: string | null
        }
        Update: {
          character_id?: string | null
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          role?: string
          sender?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number | null
          created_at: string | null
          currency: string | null
          id: string
          payment_provider: string | null
          provider_payment_id: string | null
          status: string
          subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_provider?: string | null
          provider_payment_id?: string | null
          status: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_provider?: string | null
          provider_payment_id?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string | null
          currency: string | null
          description: string | null
          features: Json | null
          id: string
          interval: string | null
          is_active: boolean | null
          limits: Json | null
          name: string
          popular: boolean | null
          price: number | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id: string
          interval?: string | null
          is_active?: boolean | null
          limits?: Json | null
          name: string
          popular?: boolean | null
          price?: number | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          interval?: string | null
          is_active?: boolean | null
          limits?: Json | null
          name?: string
          popular?: boolean | null
          price?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          user_id: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          user_id?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          user_id?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id: string
          status: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      usage: {
        Row: {
          action: string
          count: number | null
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          count?: number | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          count?: number | null
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          count: number | null
          created_at: string | null
          date: string | null
          feature: string
          id: string
          user_id: string | null
        }
        Insert: {
          count?: number | null
          created_at?: string | null
          date?: string | null
          feature: string
          id?: string
          user_id?: string | null
        }
        Update: {
          count?: number | null
          created_at?: string | null
          date?: string | null
          feature?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          customer_id: string | null
          date_of_birth: string | null
          email: string | null
          id: string
          interests: string | null
          last_active_at: string | null
          last_payment_date: string | null
          location: string | null
          next_billing_date: string | null
          onboarding_completed: boolean | null
          payment_provider: string | null
          plan: string | null
          preferred_name: string | null
          profile_completed: boolean | null
          pronouns: string | null
          subscription_cancel_at_period_end: boolean | null
          subscription_canceled_at: string | null
          subscription_id: string | null
          subscription_period_end: string | null
          subscription_period_start: string | null
          subscription_plan_id: string | null
          subscription_status: string | null
          total_spent: number | null
          treatment_style: string | null
          updated_at: string | null
          usage_companions_created: number | null
          usage_messages_today: number | null
          usage_voice_calls_today: number | null
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          id: string
          interests?: string | null
          last_active_at?: string | null
          last_payment_date?: string | null
          location?: string | null
          next_billing_date?: string | null
          onboarding_completed?: boolean | null
          payment_provider?: string | null
          plan?: string | null
          preferred_name?: string | null
          profile_completed?: boolean | null
          pronouns?: string | null
          subscription_cancel_at_period_end?: boolean | null
          subscription_canceled_at?: string | null
          subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_period_start?: string | null
          subscription_plan_id?: string | null
          subscription_status?: string | null
          total_spent?: number | null
          treatment_style?: string | null
          updated_at?: string | null
          usage_companions_created?: number | null
          usage_messages_today?: number | null
          usage_voice_calls_today?: number | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          date_of_birth?: string | null
          email?: string | null
          id?: string
          interests?: string | null
          last_active_at?: string | null
          last_payment_date?: string | null
          location?: string | null
          next_billing_date?: string | null
          onboarding_completed?: boolean | null
          payment_provider?: string | null
          plan?: string | null
          preferred_name?: string | null
          profile_completed?: boolean | null
          pronouns?: string | null
          subscription_cancel_at_period_end?: boolean | null
          subscription_canceled_at?: string | null
          subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_period_start?: string | null
          subscription_plan_id?: string | null
          subscription_status?: string | null
          total_spent?: number | null
          treatment_style?: string | null
          updated_at?: string | null
          usage_companions_created?: number | null
          usage_messages_today?: number | null
          usage_voice_calls_today?: number | null
        }
        Relationships: []
      }
      game_memory: {
        Row: {
          id: string
          user_id: string | null
          memory_data: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          memory_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          memory_data?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_admin_view: {
        Row: {
          created_at: string | null
          email: string | null
          email_confirmed_at: string | null
          id: string | null
          last_active_at: string | null
          last_payment_date: string | null
          last_sign_in_at: string | null
          next_billing_date: string | null
          payment_provider: string | null
          preferred_name: string | null
          status_display: string | null
          subscription_period_end: string | null
          subscription_period_start: string | null
          subscription_plan_id: string | null
          subscription_status: string | null
          total_spent: number | null
          usage_companions_created: number | null
          usage_messages_today: number | null
          usage_voice_calls_today: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_user_plan_limits: {
        Args: { user_uuid: string }
        Returns: Json
      }
      increment_user_usage: {
        Args: { usage_type: string; user_uuid: string }
        Returns: boolean
      }
      reset_daily_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_activity: {
        Args: { user_uuid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
