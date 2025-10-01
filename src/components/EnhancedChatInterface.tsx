import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Phone, 
  MoreVertical, 
  ArrowLeft, 
  Mic, 
  MicOff,
  Heart,
  Smile,
  Image as ImageIcon,
  Gift,
  Star,
  Zap,
  Loader2,
  Lock,
  Crown,
  MessageSquare
} from "lucide-react";
import { speakText } from "@/lib/voice";
import { buildSystemPrompt } from "@/lib/ai";
import { useToast } from "@/hooks/use-toast";
import { EmojiPicker } from "@/components/EmojiPicker";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { UpgradePrompt } from "@/components/UpgradePrompt";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  type?: 'text' | 'voice' | 'image';
  mood?: 'happy' | 'excited' | 'loving' | 'playful';
}

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
  isOnline: boolean;
  mood?: string;
  relationshipLevel?: number;
}

interface EnhancedChatInterfaceProps {
  character: Character;
  onBack: () => void;
  onStartCall?: () => void;
  userPreferences?: {
    preferredName: string;
    treatmentStyle: string;
    age: string;
    contentFilter: boolean;
  };
}

export const EnhancedChatInterface = ({ 
  character, 
  onBack,
  onStartCall,
  userPreferences 
}: EnhancedChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: `Hey there! I'm ${character.name}. ${character.bio} I'm so excited to chat with you! What's on your mind? 💕`,
      sender: 'ai',
      timestamp: new Date(),
      mood: 'happy'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [upgradePromptType, setUpgradePromptType] = useState<'messages' | 'voiceCalls'>('messages');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  
  const { toast } = useToast();
  const { 
    currentPlan, 
    incrementMessages, 
    incrementVoiceCalls, 
    canSendMessage, 
    canMakeVoiceCall, 
    remainingMessages, 
    remainingVoiceCalls 
  } = useUsageTracking();

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsTranscribing(false);
        setIsRecording(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsTranscribing(false);
        setIsRecording(false);
        toast({
          title: "Voice input failed",
          description: "Could not process your voice. Please try again.",
          variant: "destructive"
        });
      };
    }
  }, [toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleVoiceInput = () => {
    if (!canMakeVoiceCall) {
      setUpgradePromptType('voiceCalls');
      setShowUpgradePrompt(true);
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setIsTranscribing(true);
    } else {
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // Check message limit
    if (!canSendMessage) {
      setUpgradePromptType('messages');
      setShowUpgradePrompt(true);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Increment message usage
    incrementMessages();

    try {
      const systemPrompt = buildSystemPrompt({ character, userPreferences: userPreferences || { preferredName: 'friend', treatmentStyle: 'casual', age: '25', contentFilter: true } });
      
      const response = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(msg => ({
              role: msg.sender === 'user' ? 'user' : 'assistant',
              content: msg.content
            })),
            { role: 'user', content: userMessage.content }
          ],
          character: character.name
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.message,
        sender: 'ai',
        timestamp: new Date(),
        mood: 'happy'
      };

      setMessages(prev => [...prev, aiMessage]);
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
  };

  const handleCall = () => {
    if (!canMakeVoiceCall) {
      setUpgradePromptType('voiceCalls');
      setShowUpgradePrompt(true);
      return;
    }

    incrementVoiceCalls();
                onStartCall?.();
  };

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'excited': return '🤩';
      case 'loving': return '🥰';
      case 'playful': return '😜';
      default: return '😊';
    }
  };

  const getMoodColor = (mood?: string) => {
    switch (mood) {
      case 'happy': return 'text-green-500';
      case 'excited': return 'text-yellow-500';
      case 'loving': return 'text-pink-500';
      case 'playful': return 'text-blue-500';
      default: return 'text-green-500';
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarImage src={character.avatar} alt={character.name} />
            <AvatarFallback>{character.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold">{character.name}</h2>
              <div className={`text-lg ${getMoodColor(character.mood)}`}>
                {getMoodEmoji(character.mood)}
              </div>
              {character.isOnline && (
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{character.bio}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Usage indicators */}
          {currentPlan !== 'pro' && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {remainingMessages !== -1 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{remainingMessages} left</span>
                </div>
              )}
              {remainingVoiceCalls !== -1 && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  <span>{remainingVoiceCalls} left</span>
                </div>
              )}
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCall}
            disabled={!canMakeVoiceCall}
            className="flex items-center gap-2"
          >
            {!canMakeVoiceCall ? (
              <>
                <Lock className="w-4 h-4" />
                <Phone className="w-4 h-4" />
              </>
            ) : (
              <Phone className="w-4 h-4" />
            )}
          </Button>
          
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <div className="flex items-start gap-2">
                {message.sender === 'ai' && (
                  <div className={`text-lg ${getMoodColor(message.mood)}`}>
                    {getMoodEmoji(message.mood)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    {message.type === 'voice' && (
                      <Badge variant="secondary" className="text-xs">
                        Voice
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className={`text-lg ${getMoodColor(character.mood)}`}>
                  {getMoodEmoji(character.mood)}
                </div>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  {character.name} is typing...
                </span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
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
            className="bg-gradient-to-r from-primary to-primary-glow"
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
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
            <Crown className="w-4 h-4" />
            <span>You've reached your daily message limit. Upgrade to continue chatting!</span>
          </div>
        )}
        
        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-20 left-4 z-10">
            <EmojiPicker onEmojiSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} />
          </div>
        )}
      </div>

      {/* Upgrade Prompt */}
      <UpgradePrompt
        isOpen={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        limitType={upgradePromptType === 'messages' ? 'message' : 'voice_call'}
        currentPlan={currentPlan}
      />
    </div>
  );
};
