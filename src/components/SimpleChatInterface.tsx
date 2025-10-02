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
  voice: Voice;
}

interface UserPreferences {
  preferredName: string;
  treatmentStyle: string;
  age: string;
  contentFilter: boolean;
}

interface SimpleChatInterfaceProps {
  character: Character;
  onBack: () => void;
  onStartCall?: () => void;
  userPreferences?: UserPreferences;
}

type GameType = 'none' | 'chess' | '20questions' | 'wordchain' | 'truthordare' | 'riddles' | 'roleplay';

export const SimpleChatInterface = ({ character, onBack, onStartCall, userPreferences: propUserPreferences }: SimpleChatInterfaceProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isVoiceCallActive, setIsVoiceCallActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [selectedGame, setSelectedGame] = useState<'none' | 'chess' | '20questions' | 'wordchain' | 'truthordare' | 'riddles' | 'roleplay'>('none'); // FIXED: Use correct GameType
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<string | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [replies, setReplies] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(propUserPreferences || {
    preferredName: "",
    relationshipLevel: 1.0,
    communicationStyle: "friendly",
    interests: [],
    goals: [],
    boundaries: [],
    preferredTopics: [],
    avoidTopics: [],
    responseLength: "medium",
    formalityLevel: "casual",
    humorLevel: "moderate",
    emotionalSupport: true,
    challengeLevel: "balanced",
    feedbackFrequency: "occasional",
    learningStyle: "visual",
    motivationStyle: "encouraging",
    conflictResolution: "collaborative",
    celebrationStyle: "enthusiastic",
    comfortLevel: "open",
    trustLevel: "building",
    intimacyLevel: "appropriate",
    supportType: "emotional",
    challengeType: "gentle",
    feedbackType: "constructive",
    learningType: "experiential",
    motivationType: "intrinsic",
    conflictType: "resolution",
    celebrationType: "achievement",
    comfortType: "emotional",
    trustType: "mutual",
    intimacyType: "emotional"
  });
  const [isRecordingVoiceNote, setIsRecordingVoiceNote] = useState(false);
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [transcript, setTranscript] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    usage,
    incrementMessages,
    incrementVoiceCalls,
    isLoading: usageLoading,
    showUpgradePrompt: upgradePromptVisible,
    hideUpgrade,
    handleUpgrade,
    isUpgrading: upgradeInProgress
  } = useEnhancedUsageTracking();

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const speechRecognition = new (window as any).webkitSpeechRecognition();
      speechRecognition.continuous = false;
      speechRecognition.interimResults = false;
      speechRecognition.lang = 'en-US';

      speechRecognition.onstart = () => {
        console.log('🎤 Voice recognition started');
        setIsRecordingVoiceNote(true);
      };

      speechRecognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('🎤 Voice transcript:', transcript);
        setTranscript(transcript);
        setInput(transcript);
        setIsRecordingVoiceNote(false);
      };

      speechRecognition.onerror = (event: any) => {
        console.error('🎤 Voice recognition error:', event.error);
        setIsRecordingVoiceNote(false);
        toast({
          title: "Voice Recognition Error",
          description: "Could not process voice input. Please try again.",
          variant: "destructive"
        });
      };

      speechRecognition.onend = () => {
        setIsRecordingVoiceNote(false);
      };

      setRecognition(speechRecognition);
    }
  }, [toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!isSupabaseConfigured || !user) {
        setIsLoading(false);
        return;
      }

      try {
        let query = supabase
          .from('messages')
          .select('id, sender, content, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(500);

        // Only filter by character_id if it looks like a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(character.id)) {
          query = query.eq('character_id', character.id);
        }

        const { data, error } = await query;

        if (error) {
          console.warn('Could not load chat history', error);
        } else if (data) {
          const chatMessages: ChatMessage[] = data.map(msg => ({
            id: msg.id,
            content: msg.content,
            sender: msg.sender as 'user' | 'ai',
            timestamp: new Date(msg.created_at)
          }));
          setMessages(chatMessages);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadChatHistory();
  }, [user, character.id]);

  const handleEmojiSelect = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleVoiceNote = () => {
    if (!recognition) {
      toast({
        title: "Voice Not Supported",
        description: "Your browser doesn't support voice recognition.",
        variant: "destructive"
      });
      return;
    }

    if (isRecordingVoiceNote) {
      recognition.stop();
      setIsRecordingVoiceNote(false);
    } else {
      setTranscript("");
      recognition.start();
    }
  };

  const sendMessage = async (messageContent: string) => {
    if (!messageContent.trim() || isAiTyping) return;

    const currentInput = messageContent.trim();
    setInput("");
    setShowEmojiPicker(false);

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentInput,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsAiTyping(true);

    // Increment message count and check limits
    incrementMessages();

    try {
      // Save user message to database
      if (isSupabaseConfigured && user) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        await supabase.from('messages').insert({
          user_id: user.id,
          character_id: uuidRegex.test(character.id) ? character.id : null,
          sender: 'user',
          role: 'user',
          content: currentInput
        });
      }

      // Generate AI response
      const context: ChatContext = {
        character,
        conversationHistory: [...messages, userMessage],
        userPreferences,
        relationshipLevel: 1,
        timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'
      };

      // Temporarily bypass personalityAI for debugging
      console.log('🧪 Bypassing personalityAI, calling API directly');
      const simpleSystemPrompt = `You are ${character.name}. ${character.bio}. Be ${character.personality.join(', ')}.`;
      const apiResponse = await fetch('/.netlify/functions/openai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: simpleSystemPrompt },
            { role: 'user', content: currentInput }
          ],
          model: 'gpt-4o-mini',
          max_tokens: 250,
          temperature: 0.7
        }),
      });

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(`Direct API request failed: ${apiResponse.status} - ${errorText}`);
      }
      const apiData = await apiResponse.json();
      const aiResponse = apiData.message;
      console.log('✅ Direct API response:', aiResponse);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Save AI message to database
      if (isSupabaseConfigured && user) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        await supabase.from('messages').insert({
          user_id: user.id,
          character_id: uuidRegex.test(character.id) ? character.id : null,
          sender: 'ai',
          role: 'assistant',
          content: aiResponse
        });
      }

    } catch (error: any) {
      console.error('AI response error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble thinking right now. Could you try again?",
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleVoiceCall = async () => {
    // Use the proper onStartCall prop to navigate to VoiceCallInterface
    if (onStartCall) {
      onStartCall();
    }
  };

  const handleUpgradeClick = () => {
    setShowUpgradePrompt(true);
  };

  const handleUpgradeSuccess = (planId: string) => {
    setShowUpgradePrompt(false);
    toast({
      title: "Upgrade Successful!",
      description: "Welcome to your new plan! Enjoy unlimited access.",
    });
  };

  const handlePaymentSuccess = (planId: string) => {
    setShowPaymentForm(false);
    setSelectedPlanForPayment(null);
    handleUpgradeSuccess(planId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* FIXED: Header - Always visible and sticky with games button */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-xl flex-shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="h-8 w-8 p-0 hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          <Avatar className="h-8 w-8">
            <AvatarImage src={character.avatar} alt={character.name} />
            <AvatarFallback>{character.name[0]}</AvatarFallback>
          </Avatar>
          
          <div>
            <h2 className="font-semibold text-sm">{character.name}</h2>
            <p className="text-xs text-muted-foreground">Online</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {usage.plan || 'Free'}
          </Badge>
          
          {/* Games Button in Header */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGames(!showGames)}
                className={`h-8 w-8 p-0 transition-all duration-200 ${
                  showGames ? 'bg-purple-500/10 text-purple-600' : 'hover:bg-purple-500/10'
                }`}
              >
                <Gamepad2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Play Games</TooltipContent>
          </Tooltip>
          
          {/* Voice Call Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceCall}
                disabled={isUpgrading}
                className={`h-8 w-8 p-0 transition-all duration-200 ${
                  isVoiceCallActive 
                    ? 'bg-red-500/10 text-red-500 animate-pulse' 
                    : 'hover:bg-primary/10'
                }`}
              >
                <Phone className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start voice call</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* FIXED: Messages - Expanded to use more space */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          height: 'calc(100vh - 120px)'
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isAiTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reply Suggestions */}
      {replies.length > 0 && (
        <div className="p-4 border-t bg-muted/20 flex-shrink-0">
          <div className="flex flex-wrap gap-2">
            {replies.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => sendMessage(reply)}
                className="text-xs"
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* FIXED: Clean Input Area - Simplified without action buttons */}
      <div className="p-4 bg-background/95 backdrop-blur-xl border-t flex-shrink-0 sticky bottom-0 z-10">
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="mb-4">
            <EmojiPicker 
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          </div>
        )}
        
        <div className="flex items-center gap-2">
          {/* Emoji Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`h-10 w-10 p-0 transition-all duration-200 ${
              showEmojiPicker ? 'bg-primary/10 text-primary' : 'hover:bg-primary/10'
            }`}
          >
            <Smile className="w-4 h-4" />
          </Button>

          {/* Voice Note Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleVoiceNote}
            disabled={!recognition}
            className={`h-10 w-10 p-0 transition-all duration-200 ${
              isRecordingVoiceNote ? 'bg-red-500/10 text-red-500 animate-pulse' : 'hover:bg-primary/10'
            }`}
          >
            {isRecordingVoiceNote ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </Button>

          {/* Text Input */}
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder={`Message ${character.name}...`}
            className="flex-1"
            disabled={isAiTyping}
          />

          {/* Send Button */}
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isAiTyping}
            size="sm"
            className="h-10 px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Games Interface - Enhanced with Quick Game Selection */}
      {showGames && (
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50 max-h-[70vh] overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">🎮 Games & Activities with {character.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowGames(false);
                  setSelectedGame('none');
                }}
                className="h-8 w-8 p-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Quick Game Selection */}
            {selectedGame === 'none' && (
              <div className="grid grid-cols-2 gap-3 mb-6">
                <Button
                  onClick={() => setSelectedGame('chess')}
                  className="h-16 flex flex-col items-center gap-2 bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
                >
                  <div className="text-2xl">♔</div>
                  <span className="text-sm font-medium">Chess</span>
                </Button>
                
                <Button
                  onClick={() => setSelectedGame('20questions')}
                  className="h-16 flex flex-col items-center gap-2 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  <div className="text-2xl">❓</div>
                  <span className="text-sm font-medium">20 Questions</span>
                </Button>
                
                <Button
                  onClick={() => setSelectedGame('riddles')}
                  className="h-16 flex flex-col items-center gap-2 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                >
                  <div className="text-2xl">🧩</div>
                  <span className="text-sm font-medium">Riddles</span>
                </Button>
                
                <Button
                  onClick={() => setSelectedGame('wordchain')}
                  className="h-16 flex flex-col items-center gap-2 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                >
                  <div className="text-2xl">🔗</div>
                  <span className="text-sm font-medium">Word Chain</span>
                </Button>
                
                <Button
                  onClick={() => setSelectedGame('truthordare')}
                  className="h-16 flex flex-col items-center gap-2 bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white"
                >
                  <div className="text-2xl">💕</div>
                  <span className="text-sm font-medium">Truth or Dare</span>
                </Button>
                
                <Button
                  onClick={() => setSelectedGame('roleplay')}
                  className="h-16 flex flex-col items-center gap-2 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                >
                  <div className="text-2xl">🎭</div>
                  <span className="text-sm font-medium">Roleplay</span>
                </Button>
              </div>
            )}
            
            {/* Game Interface */}
            {selectedGame !== 'none' && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedGame('none')}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <h4 className="font-semibold capitalize">{selectedGame.replace(/([A-Z])/g, ' $1').trim()}</h4>
                </div>
                <InteractiveGames 
                  characterName={character.name}
                  onBack={() => {
                    setShowGames(false);
                    setSelectedGame('none');
                  }}
                  onSendMessage={(message: string) => {
                    sendMessage(message);
                    setShowGames(false);
                    setSelectedGame('none');
                  }}
                  selectedGame={selectedGame}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upgrade Prompt */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        limitType="message"
        currentPlan={usage.plan}
      />
    </div>
  );
};
