import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Send, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Heart, 
  Smile, 
  Camera, 
  Gamepad2, 
  Gift, 
  MoreHorizontal,
  Lock,
  Loader2,
  X,
  Check,
  Star,
  Crown,
  Zap,
  ArrowLeft
} from 'lucide-react';
import { Character } from '@/types/character';
import { personalityAI } from '@/lib/ai-chat';
import { useEnhancedUsageTracking } from '@/hooks/useEnhancedUsageTracking';
import { useToast } from '@/hooks/use-toast';
import { EmojiPicker } from '@/components/EmojiPicker';
import { InteractiveGames } from '@/components/InteractiveGames';
import { VoiceCallInterface } from '@/components/VoiceCallInterface';
import { ChatStorageService } from '@/lib/chat-storage';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}

interface SimpleChatInterfaceProps {
  character: Character;
  onBack: () => void;
  onStartCall: () => void;
}

export const SimpleChatInterface = ({ 
  character, 
  onBack,
  onStartCall
}: SimpleChatInterfaceProps) => {
  const { toast } = useToast();
  const { 
    usageData, 
    planLimits, 
    isLoading: usageLoading,
    refreshUsage 
  } = useEnhancedUsageTracking();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check if user can send messages
  const canSendMessage = !usageLoading && usageData && 
    (usageData.plan === 'pro' || (planLimits && usageData.messages_today < planLimits.messages_per_day));
  
  // Check if user can make voice calls
  const canMakeVoiceCall = !usageLoading && usageData && 
    (usageData.plan === 'pro' || (planLimits && usageData.voice_calls_today < planLimits.voice_calls_per_day));

  // Load messages when component mounts
  useEffect(() => {
    loadMessages();
  }, [character.id]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return;
      }
      
      const conversation = await ChatStorageService.getOrCreateConversation(
        user.id, // Use actual user ID
        character.id
      );
      setConversationId(conversation);
      
      const loadedMessages = await ChatStorageService.loadMessages(conversation);
      setMessages(loadedMessages.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender as 'user' | 'ai',
        timestamp: new Date(msg.timestamp)
      })));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveMessage = async (content: string, sender: 'user' | 'ai') => {
    if (!conversationId) return;
    
    try {
      // Get the current user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found for saving message');
        return;
      }
      
      await ChatStorageService.saveMessage(
        conversationId,
        character.id,
        user.id, // Use actual user ID
        {
          id: Date.now().toString(),
          content,
          sender,
          timestamp: new Date(),
          metadata: {}
        }
      );
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || !canSendMessage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    await saveMessage(inputValue, 'user');
    
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await personalityAI.sendMessage(
        currentInput,
        character,
        messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      await saveMessage(response, 'ai');
      
      // Refresh usage data after sending message
      refreshUsage();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
    if (e.key === 'Escape') {
      setShowEmojiPicker(false);
      setShowGames(false);
    }
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support speech recognition.",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
      setIsTranscribing(false);
    };

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputValue(transcript);
      setIsTranscribing(false);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setIsTranscribing(false);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
      setIsTranscribing(false);
    };

    try {
      recognitionRef.current.start();
      setIsTranscribing(true);
    } catch (error) {
      console.error('Error starting speech recognition:', error);
      toast({
        title: "Error",
        description: "Failed to start voice input.",
        variant: "destructive"
      });
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleGameSelect = (gameType: string) => {
    setSelectedGame(gameType);
    setShowGames(false);
  };

  if (showVoiceCall) {
    return (
      <VoiceCallInterface
        character={character}
        userPreferences={{
          voice_preference: 'default',
          response_length: 'medium',
          emotional_tone: 'warm'
        }}
        onEndCall={() => setShowVoiceCall(false)}
        onMinimize={() => setShowVoiceCall(false)}
        className="h-full"
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-white">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-20 flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-pink-200/30 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <Avatar className="w-10 h-10">
              <AvatarImage src={character.avatar_url} alt={character.name} />
              <AvatarFallback className="bg-pink-400 text-white font-bold">
                {character.name[0]}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <h2 className="font-semibold text-lg">{character.name}</h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground">Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowGames(true)}
              className="p-2"
            >
              <Gamepad2 className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVoiceCall(true)}
              disabled={!canMakeVoiceCall}
              className="p-2"
            >
              <Phone className="w-5 h-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
            >
              <Heart className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages Area - Scrollable */}
      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center">
              <Heart className="w-10 h-10 text-pink-400" />
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-2">Start a conversation with {character.name}</h3>
              <p className="text-muted-foreground">
                {character.name} is excited to chat with you! Send a message to begin.
              </p>
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
                    <AvatarImage src={character.avatar_url} alt={character.name} />
                    <AvatarFallback className="bg-pink-400 text-white text-xs">
                      {character.name[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.sender === 'user'
                      ? 'bg-pink-400 text-white'
                      : 'bg-white border border-pink-100'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-pink-100' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex items-start gap-2">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={character.avatar_url} alt={character.name} />
              <AvatarFallback className="bg-pink-400 text-white text-xs">
                {character.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="bg-white border border-pink-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Sticky */}
      <div className="sticky bottom-0 z-20 flex-shrink-0 bg-white/80 backdrop-blur-md border-t border-pink-200/30 p-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Message ${character.name}...`}
              disabled={isLoading || !canSendMessage}
              className="pr-20"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="h-8 w-8 p-0"
              >
                <Smile className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleVoiceInput}
                disabled={!canMakeVoiceCall}
                className={`h-8 w-8 p-0 ${
                  isRecording ? 'text-red-500' : ''
                }`}
              >
                {isRecording ? (
                  <MicOff className="w-4 h-4" />
                ) : isTranscribing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading || !canSendMessage}
            className="bg-pink-400 hover:bg-pink-500 text-white"
          >
            {!canSendMessage ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Upgrade
              </>
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        
        {/* Usage warning */}
        {!canSendMessage && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              You've reached your daily message limit. Upgrade to continue chatting!
            </p>
          </div>
        )}
        
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-16 left-4 right-4 z-30">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          </div>
        )}
        
        {/* Games Modal */}
        {showGames && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-30">
            <Card className="w-full max-w-md mx-4">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Choose a Game</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowGames(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <InteractiveGames
                  character={character}
                  onGameSelect={handleGameSelect}
                  selectedGame={selectedGame}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
