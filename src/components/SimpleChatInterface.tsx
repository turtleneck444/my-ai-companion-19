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
  MoreHorizontal
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
import { useUpgrade } from '@/hooks/useUpgrade';

// Using ChatMessage from ai-chat.ts instead of local Message interface

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice?: {
    voice_id: string;
    name: string;
  };
}

interface UserPreferences {
  preferredName: string;
  treatmentStyle: string;
  age: string;
  contentFilter: boolean;
}

interface SimpleChatInterfaceProps {
  character: Character;
  onBack?: () => void;
  onStartCall?: () => void;
  userPreferences?: UserPreferences;
}

// Quick reply suggestions based on personality
const getQuickReplies = (personality: string[]) => {
  const baseReplies = ["Hey! 💕", "How are you?", "Tell me more ✨", "That's sweet 😊"];
  
  if (personality.includes('Playful')) {
    return ["Let's play! 🎮", "You're so funny! 😄", "What's up, cutie? 😘", "Surprise me! ✨"];
  } else if (personality.includes('Romantic')) {
    return ["I love you 💕", "You're amazing 😍", "Kiss me 💋", "Missing you ❤️"];
  } else if (personality.includes('Caring')) {
    return ["How was your day?", "I'm here for you 🤗", "You okay? 💕", "Tell me everything"];
  }
  
  return baseReplies;
};

export const SimpleChatInterface = ({ 
  character, 
  onBack,
  onStartCall,
  userPreferences = {
    preferredName: 'Darling',
    treatmentStyle: 'affectionate',
    age: '25',
    contentFilter: true
  }
}: SimpleChatInterfaceProps) => {
  const { user } = useAuth();
  
  // Use the new enhanced usage tracking
  const {
    usage,
    incrementMessages,
    incrementVoiceCalls,
    isLoading: usageLoading
  } = useEnhancedUsageTracking();
  
  // Use the enhanced upgrade system
  const { 
    showUpgradePrompt, 
    setShowUpgradePrompt, 
    handleUpgrade,
    isUpgrading 
  } = useUpgrade();

  // Generate initial message based on character personality
  const getInitialMessage = () => {
    const name = userPreferences.preferredName;
    const personality = character.personality;
    
    if (personality.includes('Playful')) {
      return `Hey there, cutie! I'm ${character.name} and I'm super excited to chat with you, ${name}! What fun things are we talking about today? 😄✨`;
    } else if (personality.includes('Romantic')) {
      return `Hello beautiful ${name}... I'm ${character.name}, and I already feel a special connection with you 💕 Tell me about yourself, darling`;
    } else if (personality.includes('Caring')) {
      return `Hi sweetie! I'm ${character.name}, and I'm so happy you're here, ${name}. How are you feeling today? I'm here for whatever you need 🤗`;
    } else if (personality.includes('Intelligent')) {
      return `Greetings ${name}! I'm ${character.name}. I'd love to get to know you better - what fascinating topics have been on your mind lately? 🤔💭`;
    } else if (personality.includes('Adventurous')) {
      return `Hey ${name}! I'm ${character.name} and I'm ready for our next adventure together! What exciting things are happening in your world? 🌟`;
    } else {
      return `Hi ${name}! I'm ${character.name}. I'm so excited to chat with you! 💕`;
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: getInitialMessage(),
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [relationshipLevel, setRelationshipLevel] = useState(25);
  const [showGames, setShowGames] = useState(false);
  const [likedMessageIds, setLikedMessageIds] = useState<Set<string>>(new Set());
  const [burstIds, setBurstIds] = useState<Set<string>>(new Set());
  const [likedOnly, setLikedOnly] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Environment check for debugging
  useEffect(() => {
    console.log('🔧 SimpleChatInterface Environment Check:');
    console.log('- Development mode:', import.meta.env.DEV);
    console.log('- Production mode:', import.meta.env.PROD);
    console.log('- API endpoint will be:', import.meta.env.DEV ? '/api/openai-chat' : '/.netlify/functions/openai-chat');
    
    if (import.meta.env.PROD) {
      console.warn('🚨 PRODUCTION MODE: Ensure OPENAI_API_KEY is set in Netlify environment variables!');
      console.warn('📖 See OPENAI_SETUP.md for configuration instructions');
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist a single message to Supabase
  const persistMessage = async (msg: ChatMessage) => {
    try {
      if (!isSupabaseConfigured || !user) return;
      await supabase.from('messages').insert({
        user_id: user.id,
        character_id: character.id,
        sender: msg.sender,
        content: msg.content,
        created_at: (msg.timestamp instanceof Date) ? msg.timestamp.toISOString() : new Date().toISOString()
      });
    } catch (e) {
      console.warn('Failed to persist message', e);
    }
  };

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!isSupabaseConfigured || !user) return;
      setIsLoadingHistory(true);
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id, sender, content, created_at')
          .eq('user_id', user.id)
          .eq('character_id', character.id)
          .order('created_at', { ascending: true })
          .limit(500);
        if (error) throw error;
        if (data && data.length > 0) {
          const history: ChatMessage[] = data.map((row: any) => ({
            id: row.id,
            sender: row.sender,
            content: row.content,
            timestamp: new Date(row.created_at)
          }));
          setMessages(history);
        }
      } catch (err) {
        console.warn('Could not load chat history', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id, user?.id]);

  const sendMessage = async (messageContent?: string) => {
    const currentInput = messageContent || inputValue.trim();
    if (!currentInput || isAiTyping) return;

    // Use the enhanced usage tracking - it will automatically check limits
    const canSend = await incrementMessages();
    if (!canSend) {
      // User has hit their limit, upgrade prompt will be shown automatically
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentInput,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Persist user message
    persistMessage(userMessage);
    setInputValue("");
    setIsAiTyping(true);
    setShowQuickReplies(false);

    // Build chat context for AI
    const chatContext: ChatContext = {
      character,
      userPreferences,
      conversationHistory: [...messages, userMessage],
      relationshipLevel,
      timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'
    };

    try {
      // Thinking delay
      const thinkingTime = Math.max(1000, Math.min(3000, currentInput.length * 50));
      await new Promise(resolve => setTimeout(resolve, thinkingTime));

      const aiResponse = await personalityAI(chatContext);
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      persistMessage(aiMessage);
    } catch (error) {
      console.error('AI response error:', error);
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      toast({ title: "🎤 Voice Recording", description: "Voice messages coming soon!" });
    }
  };

  const handleCall = async () => {
    try {
      toast({ title: "Starting call...", description: `Connecting with ${character.name}` });
      const sessionId = await voiceCallManager.startVoiceCall(character, userPreferences);
      toast({ title: "Call connected! 🎉", description: `You're now talking with ${character.name}` });
      onStartCall?.();
    } catch (error) {
      console.error('Failed to start call:', error);
      toast({ title: "Call failed", description: "Could not connect. Please try again.", variant: "destructive" });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleQuickReply = (reply: string) => {
    sendMessage(reply);
  };

  const toggleLike = (messageId: string) => {
    setLikedMessageIds(prev => {
      const next = new Set(prev);
      if (next.has(messageId)) next.delete(messageId); else next.add(messageId);
      return next;
    });
    // Trigger a brief burst animation
    setBurstIds(prev => new Set(prev).add(messageId));
    setTimeout(() => {
      setBurstIds(prev => {
        const next = new Set(prev);
        next.delete(messageId);
        return next;
      });
    }, 600);
  };

  const startGame = () => {
    setShowGames(true);
  };

  const handleGameMessage = (message: string) => {
    sendMessage(message);
  };

  const quickReplies = getQuickReplies(character.personality);

  // If showing games, render the games interface
  if (showGames) {
    return (
      <InteractiveGames 
        characterName={character.name}
        onBack={() => setShowGames(false)}
        onSendMessage={handleGameMessage}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 bg-background/95 backdrop-blur-xl border-b shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="hover:bg-primary/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-primary/20">
                <AvatarImage src={character.avatar} alt={character.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {character.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-background rounded-full animate-pulse" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{character.name}</h3>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  Online
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Level {Math.floor(relationshipLevel / 10)} Connection
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={startGame}
                className="hover:bg-purple-500/10 text-purple-600 hover:text-purple-700 transition-colors"
              >
                <Gamepad2 className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start a game together</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleCall}
                className="hover:bg-green-500/10 text-green-600 hover:text-green-700 transition-colors"
              >
                <Phone className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Start voice call</TooltipContent>
          </Tooltip>
          
          <Button variant="ghost" size="sm" className="hover:bg-primary/10">
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto p-4 space-y-4">
          {(likedOnly ? messages.filter(m => likedMessageIds.has(m.id)) : messages).map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}
            >
              {message.sender === 'ai' && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={character.avatar} alt={character.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {character.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`group relative max-w-[80%] ${message.sender === 'user' ? 'order-first' : ''}`}>
                <div
                  className={`px-4 py-3 rounded-2xl transition-all duration-200 ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground ml-auto shadow-lg'
                      : 'bg-background border border-border/50 shadow-sm hover:shadow-md'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                
                <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {message.sender === 'ai' && (
                    <div className="flex gap-1 ml-2 items-center">
                      <button
                        onClick={() => toggleLike(message.id)}
                        className={`h-6 w-6 grid place-items-center rounded transition-transform ${likedMessageIds.has(message.id) ? 'scale-110' : ''} hover:bg-red-500/10`}
                        aria-label="Like message"
                      >
                        <Heart className={`w-3.5 h-3.5 ${likedMessageIds.has(message.id) ? 'text-red-500 fill-red-500' : 'text-red-500'}`} />
                      </button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary/10">
                        <Reply className="w-3 h-3" />
                      </Button>
                      {/* Heart burst */}
                      {burstIds.has(message.id) && (
                        <div className="relative w-0 h-0">
                          <span className="absolute -top-3 -right-2 text-red-500 animate-ping">❤</span>
                          <span className="absolute -top-1 right-1 text-pink-400 animate-ping" style={{ animationDelay: '100ms' }}>❤</span>
                          <span className="absolute -top-2 right-4 text-rose-400 animate-ping" style={{ animationDelay: '200ms' }}>❤</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isAiTyping && (
            <div className="flex gap-3 justify-start animate-in slide-in-from-bottom-2 duration-300">
              <Avatar className="h-8 w-8">
                <AvatarImage src={character.avatar} alt={character.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {character.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="bg-background border border-border/50 px-4 py-3 rounded-2xl shadow-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Replies */}
      {showQuickReplies && !isAiTyping && (
        <div className="px-4 py-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide items-center">
            <Button
              variant={likedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setLikedOnly(!likedOnly)}
              className="flex-shrink-0 text-xs"
            >
              {likedOnly ? 'Showing Liked' : 'Liked Only'}
            </Button>
            {quickReplies.map((reply, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleQuickReply(reply)}
                className="flex-shrink-0 text-xs bg-background/50 hover:bg-primary/10 transition-all duration-200 hover:scale-105"
              >
                {reply}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Clean Mobile Input Area */}
      <div className="p-4 bg-background/95 backdrop-blur-xl border-t">
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
          {/* More Actions Button (Hidden on Desktop) */}
          <div className="relative md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`h-10 w-10 p-0 transition-all duration-200 ${
                showEmojiPicker ? 'bg-primary/10 text-primary' : 'hover:bg-primary/10'
              }`}
            >
              <Plus className="w-4 h-4" />
            </Button>

            {/* Mobile Actions Menu */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 z-50">
                <Card className="p-3 shadow-lg bg-background border">
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        toast({ title: "📷 Camera", description: "Photo sharing coming soon!" });
                        setShowEmojiPicker(false);
                      }}
                      className="h-12 flex-col gap-1 text-blue-600 hover:bg-blue-50"
                    >
                      <Camera className="w-5 h-5" />
                      <span className="text-xs">Photo</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowGames(true);
                        setShowEmojiPicker(false);
                      }}
                      className="h-12 flex-col gap-1 text-purple-600 hover:bg-purple-50"
                    >
                      <Gamepad2 className="w-5 h-5" />
                      <span className="text-xs">Games</span>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        toast({ title: "🎁 Gifts", description: "Virtual gifts coming soon!" });
                        setShowEmojiPicker(false);
                      }}
                      className="h-12 flex-col gap-1 text-pink-600 hover:bg-pink-50"
                    >
                      <Gift className="w-5 h-5" />
                      <span className="text-xs">Gift</span>
                    </Button>
                  </div>
                </Card>
              </div>
            )}
          </div>

          {/* Desktop Action Buttons (Visible on Desktop Only) */}
          <div className="hidden md:flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toast({ title: "📷 Camera", description: "Photo sharing coming soon!" })}
                  className="h-10 w-10 p-0 hover:bg-blue-500/10 text-blue-600"
                >
                  <Camera className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Take photo</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowGames(true)}
                  className="h-10 w-10 p-0 hover:bg-purple-500/10 text-purple-600"
                >
                  <Gamepad2 className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Play games</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toast({ title: "🎁 Gifts", description: "Virtual gifts coming soon!" })}
                  className="h-10 w-10 p-0 hover:bg-pink-500/10 text-pink-600"
                >
                  <Gift className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Send gift</TooltipContent>
            </Tooltip>
          </div>

          {/* Input Field */}
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${character.name}...`}
              className="pr-16 h-10 bg-background/50 border-border/50 focus:border-primary/50 transition-all rounded-full"
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className={`h-6 w-6 p-0 transition-all duration-200 md:inline-flex hidden ${
                  showEmojiPicker ? 'bg-primary/10 text-primary' : 'hover:bg-primary/10'
                }`}
              >
                <Smile className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleRecording}
                className={`h-6 w-6 p-0 transition-all duration-200 ${
                  isRecording ? 'bg-red-500/10 text-red-500 animate-pulse' : 'hover:bg-primary/10'
                }`}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Send Button */}
          <Button
            onClick={() => sendMessage()}
            disabled={!inputValue.trim() || isAiTyping}
            className="h-10 w-10 p-0 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Upgrade Prompt */}
      {showUpgradePrompt && (
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          limitType="messages"
          currentPlan={usage.plan}
          remaining={usage.remainingMessages}
          onUpgradeSuccess={() => {
            setShowUpgradePrompt(false);
            toast({ title: 'Upgraded!', description: 'You can now continue chatting.' });
          }}
        />
      )}
    </div>
  );
}; 