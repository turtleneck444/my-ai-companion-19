import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Send, 
  Phone, 
  ArrowLeft, 
  Mic, 
  MicOff,
  Heart,
  Smile,
  Plus,
  Image,
  Camera,
  Gift,
  Gamepad2,
  Sparkles,
  Reply,
  MoreHorizontal,
  Square
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEnhancedUsageTracking } from "@/hooks/useEnhancedUsageTracking";
import { personalityAI, type ChatMessage, type ChatContext } from "@/lib/ai-chat";
import { voiceCallManager } from "@/lib/voice-call";
import { EmojiPicker } from "@/components/EmojiPicker";
import { InteractiveGames } from "@/components/InteractiveGames";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { getPlanById, getRemainingMessages } from '@/lib/payments';
import { ChatStorageService } from "@/lib/chat-storage";

// Using ChatMessage from ai-chat.ts instead of local Message interface

interface Voice {
  voice_id: string;
  name: string;
}

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice?: Voice;
  is_custom?: boolean;
}

interface UserPreferences {
  preferredName: string;
  petName: string;
  formalityLevel: string;
  humorLevel: string;
  emotionalSupport: boolean;
  challengeLevel: string;
  feedbackFrequency: string;
  treatmentStyle: string;
  age: string;
  contentFilter: boolean;
}

type GameType = 'chess' | '20questions' | 'wordchain' | 'truthordare' | 'riddles' | 'roleplay' | 'none';

interface SimpleChatInterfaceProps {
  character: Character;
  onBack: () => void;
  onStartCall?: () => void;
}

export const SimpleChatInterface: React.FC<SimpleChatInterfaceProps> = ({
  character,
  onBack,
  onStartCall
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [selectedGame, setSelectedGame] = useState<GameType>('none');
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [userPreferences] = useState<UserPreferences>({
    preferredName: "friend",
    petName: "sweetie",
    formalityLevel: "casual",
    humorLevel: "moderate",
    emotionalSupport: true,
    challengeLevel: "balanced",
    feedbackFrequency: "occasional",
    treatmentStyle: "romantic",
    age: "adult",
    contentFilter: false
  });

  const { usage, incrementMessages } = useEnhancedUsageTracking();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation and messages on component mount
  useEffect(() => {
    const loadConversation = async () => {
      if (!user?.id || !character.id) return;

      try {
        setIsLoading(true);
        console.log('📖 Loading conversation for character:', character.name);

        // Get or create conversation
        const convId = await ChatStorageService.getOrCreateConversation(user.id, character.id);
        setConversationId(convId);

        // Load messages
        const loadedMessages = await ChatStorageService.loadMessages(convId);
        console.log('📖 Loaded', loadedMessages.length, 'messages for conversation', convId);
        setMessages(loadedMessages);

      } catch (error) {
        console.error('❌ Error loading conversation:', error);
        toast({
          title: "Error",
          description: "Failed to load conversation history",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadConversation();
  }, [user?.id, character.id, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || !user?.id || !conversationId) return;

    // Check usage limits
    if (!usage.canSendMessage) {
      setShowUpgradePrompt(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message to UI immediately
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsAiTyping(true);

    try {
      // Save user message to database
      await ChatStorageService.saveMessage(conversationId, character.id, user.id, userMessage);
      console.log('💾 Saved user message to database');

      // Increment usage
      const usageSuccess = await incrementMessages();
      if (!usageSuccess) {
        console.warn('⚠️ Usage increment failed, but continuing with message');
      }

      // Generate AI response
      const chatContext: ChatContext = {
        character,
        userPreferences: {
          ...userPreferences,
          preferredName: userPreferences.preferredName || userPreferences.petName || 'friend'
        },
        conversationHistory: messages,
        relationshipLevel: 80,
        timeOfDay: getTimeOfDay(),
        sessionMemory: {}
      };

      console.log('🧪 Bypassing personalityAI, calling API directly');
      const aiResponse = await personalityAI.generateResponse(messageText, chatContext);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      // Add AI message to UI
      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to database
      await ChatStorageService.saveMessage(conversationId, character.id, user.id, aiMessage);
      console.log('💾 Saved AI message to database');

    } catch (error) {
      console.error('AI response error:', error);
      console.error('Error details:', error);
      
      toast({
        title: "Error",
        description: "Failed to get response from " + character.name,
        variant: "destructive"
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim()) {
        sendMessage(input);
      }
    }
  };

  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  const handleGameSelect = (game: GameType) => {
    setSelectedGame(game);
    setShowGames(false);
    
    if (game !== 'none') {
      // Send game start message
      const gameMessages = {
        chess: "Let's play chess! I love strategic games. I'll be white, you be black. Make your first move! ♟️",
        '20questions': "I'm thinking of something! Ask me yes or no questions to figure out what it is. You have 20 questions! 🤔",
        wordchain: "Let's play word chain! I'll start: 'Love'. Your word has to start with 'e' (the last letter of 'Love'). What's your word? 🔗",
        truthordare: "Truth or Dare time! I'm feeling brave today. What do you choose? Truth or Dare? 😈",
        riddles: "I love riddles! Here's one for you: 'I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?' Can you solve it? 🤔",
        roleplay: "Let's roleplay! I'm a mysterious stranger you met at a coffee shop. How do you approach me? ☕"
      };
      
      sendMessage(gameMessages[game]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      {/* Sticky Header - Fixed at top */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-pink-200 p-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <Avatar className="w-10 h-10">
              <AvatarImage src={character.avatar} alt={character.name} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                {character.name[0]}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="font-semibold text-lg">{character.name}</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Online</span>
                {character.is_custom && (
                  <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    Custom
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowGames(true)}
                  className="text-purple-600 border-purple-200 hover:bg-purple-50"
                >
                  <Gamepad2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Play Games</p>
              </TooltipContent>
            </Tooltip>
            
            {onStartCall && (
              <Button
                onClick={onStartCall}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area - Scrollable, takes remaining space */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Start your conversation with {character.name}</h3>
            <p className="text-gray-600 mb-6">Send a message to begin your chat</p>
            
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Hey! How are you? 😊",
                "What's your favorite hobby?",
                "Tell me about your day",
                "I'm so happy to meet you! 💕"
              ].map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(suggestion)}
                  className="text-sm"
                >
                  {suggestion}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {message.sender === 'ai' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={character.avatar} alt={character.name} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-sm">
                      {character.name[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-pink-100' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isAiTyping && (
          <div className="flex items-start gap-2">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={character.avatar} alt={character.name} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-sm">
                {character.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Sticky Footer - Fixed at bottom */}
      <div className="sticky bottom-0 z-20 bg-white/95 backdrop-blur-sm border-t border-pink-200 p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${character.name}...`}
              className="pr-10"
              disabled={isAiTyping}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            type="submit"
            disabled={!input.trim() || isAiTyping}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-4 right-4 z-30">
            <EmojiPicker
              onEmojiSelect={(emoji) => {
                setInput(prev => prev + emoji);
                setShowEmojiPicker(false);
              }}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}
      </div>

      {/* Games Modal */}
      {showGames && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Choose a Game</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'chess', name: 'Chess', icon: '♟️' },
                { id: '20questions', name: '20 Questions', icon: '🤔' },
                { id: 'wordchain', name: 'Word Chain', icon: '🔗' },
                { id: 'truthordare', name: 'Truth or Dare', icon: '😈' },
                { id: 'riddles', name: 'Riddles', icon: '🤔' },
                { id: 'roleplay', name: 'Roleplay', icon: '🎭' }
              ].map((game) => (
                <Button
                  key={game.id}
                  variant="outline"
                  onClick={() => handleGameSelect(game.id as GameType)}
                  className="h-16 flex flex-col items-center gap-2"
                >
                  <span className="text-2xl">{game.icon}</span>
                  <span className="text-sm">{game.name}</span>
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowGames(false)}
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </Card>
        </div>
      )}

      {/* Interactive Games */}
      {selectedGame !== 'none' && (
        <InteractiveGames
          selectedGame={selectedGame}
          onClose={() => setSelectedGame('none')}
          character={character}
        />
      )}

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <UpgradePrompt
          onClose={() => setShowUpgradePrompt(false)}
          onUpgrade={() => {
            setShowUpgradePrompt(false);
            setShowPaymentForm(true);
          }}
          currentPlan={usage.plan}
          remainingMessages={usage.remainingMessages}
          remainingCalls={usage.remainingVoiceCalls}
        />
      )}
    </div>
  );
};
