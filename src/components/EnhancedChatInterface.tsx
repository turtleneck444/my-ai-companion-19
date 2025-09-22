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
  Loader2
} from "lucide-react";
import { speakText } from "@/lib/voice";
import { buildSystemPrompt } from "@/lib/ai";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  type?: 'text' | 'voice' | 'image';
  mood?: 'happy' | 'excited' | 'loving' | 'playful';
}

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: string;
  isOnline: boolean;
  mood?: string;
  relationshipLevel?: number;
  voiceId?: string;
}

interface EnhancedChatInterfaceProps {
  character: Character;
  onBack: () => void;
  onStartCall: () => void;
  userPreferences: {
    preferredName: string;
    treatmentStyle: string;
  };
}

export const EnhancedChatInterface = ({ 
  character, 
  onBack, 
  onStartCall, 
  userPreferences 
}: EnhancedChatInterfaceProps) => {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [relationshipXP, setRelationshipXP] = useState(240);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const defaultVoiceId = (import.meta as any).env?.VITE_ELEVENLABS_VOICE_ID as string | undefined;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';
      
      recognitionRef.current.onstart = () => {
        setIsRecording(true);
        setIsTranscribing(true);
        toast({
          title: "Listening...",
          description: "Speak now, I'm listening to you",
        });
      };
      
      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update input with interim results for real-time feedback
        if (interimTranscript) {
          setInputValue(prev => prev + interimTranscript);
        }
        
        // If we have final results, use them
        if (finalTranscript) {
          setInputValue(finalTranscript.trim());
          setIsTranscribing(false);
          toast({
            title: "Transcription complete",
            description: "Ready to send your message",
          });
        }
      };
      
      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setIsTranscribing(false);
        
        let errorMessage = "Speech recognition failed";
        switch (event.error) {
          case 'no-speech':
            errorMessage = "No speech detected. Please try again.";
            break;
          case 'audio-capture':
            errorMessage = "Microphone not accessible. Please check permissions.";
            break;
          case 'not-allowed':
            errorMessage = "Microphone access denied. Please allow microphone access.";
            break;
          case 'network':
            errorMessage = "Network error. Please check your connection.";
            break;
        }
        
        toast({
          title: "Voice input failed",
          description: errorMessage,
          variant: "destructive"
        });
      };
      
      recognitionRef.current.onend = () => {
        setIsRecording(false);
        setIsTranscribing(false);
      };
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [toast]);

  useEffect(() => {
    const greet = async () => {
      setIsAiTyping(true);
      try {
        const system = buildSystemPrompt({
          character: { name: character.name, bio: character.bio, personality: character.personality, voice: character.voice },
          userPreferences
        });
        const res = await fetch('/api/openai-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: system },
              { role: 'user', content: `Greet me with a flirty, warm one-liner.` }
            ],
            temperature: 0.95,
            max_tokens: 160
          })
        });
        const data = await res.json();
        const content = data?.message || `Hey ${userPreferences.preferredName}, it's ${character.name}.`;
        const aiMsg: Message = { id: Date.now().toString(), content, sender: 'ai', timestamp: new Date(), mood: 'loving' };
        setMessages([aiMsg]);
        try { await speakText(aiMsg.content, character.voiceId || defaultVoiceId); } catch {}
      } catch {
        const fallbackMsg: Message = { id: Date.now().toString(), content: `Hey there ${userPreferences.preferredName}! It's ${character.name}. 💕`, sender: 'ai', timestamp: new Date(), mood: 'loving' };
        setMessages([fallbackMsg]);
        try { await speakText(fallbackMsg.content, character.voiceId || defaultVoiceId); } catch {}
      } finally {
        setIsAiTyping(false);
      }
    };
    greet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [character.id]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsAiTyping(true);
    setRelationshipXP(prev => prev + 5);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const system = buildSystemPrompt({
        character: { name: character.name, bio: character.bio, personality: character.personality, voice: character.voice },
        userPreferences
      });
      const res = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: system },
            ...messages.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.content })),
            { role: 'user', content: userMessage.content }
          ],
          temperature: 0.95,
          max_tokens: 240
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const content = (data && data.message) ? data.message : `Mmm, ${userPreferences.preferredName}, I adore how you think… tell me more 💕`;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content,
        sender: 'ai',
        timestamp: new Date(),
        mood: ['happy', 'excited', 'loving', 'playful'][Math.floor(Math.random() * 4)] as any
      };
      setMessages(prev => [...prev, aiMessage]);
      try { await speakText(aiMessage.content, character.voiceId || defaultVoiceId); } catch {}
    } catch (err) {
      const responses = [
        `Mmm, ${userPreferences.preferredName}, you always know just what to say to make my heart skip a beat! 💖 Tell me more, beautiful...`,
        `That's so sweet of you, ${userPreferences.preferredName}! I love how you think... it makes me feel so close to you 🥰`,
        `*blushes* You're making me feel all fluttery inside, ${userPreferences.preferredName}! What else is on your mind today? 💕`
      ];
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        sender: 'ai',
        timestamp: new Date(),
        mood: ['happy', 'excited', 'loving', 'playful'][Math.floor(Math.random() * 4)] as any
      };
      setMessages(prev => [...prev, aiMessage]);
      try { await speakText(aiMessage.content, character.voiceId || defaultVoiceId); } catch {}
    } finally {
      setIsAiTyping(false);
    }
  };

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'excited': return '🤩';
      case 'loving': return '😍';
      case 'playful': return '😏';
      default: return '💕';
    }
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive"
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
      setIsTranscribing(false);
    } else {
      setInputValue(""); // Clear input before starting new recording
      recognitionRef.current.start();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setInputValue(prev => prev + emoji);
  };

  const handleVoiceInput = () => {
    if (isRecording) {
      // Stop recording
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      // Start recording
      if (recognitionRef.current) {
        setInputValue(""); // Clear input before starting
        recognitionRef.current.start();
      } else {
        toast({
          title: "Voice input not available",
          description: "Speech recognition is not supported in your browser",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Enhanced Header */}
      <Card className="flex items-center justify-between p-4 rounded-none border-0 border-b bg-card/95 backdrop-blur-xl shadow-lg">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack}
            className="p-2 hover:bg-primary/10 transition-all duration-300 hover:scale-110"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="relative">
            <Avatar className="w-12 h-12 ring-2 ring-primary/20 animate-pulse-glow">
              <AvatarImage src={character.avatar} alt={character.name} />
              <AvatarFallback>{character.name[0]}</AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
              character.isOnline ? 'bg-green-400 animate-pulse' : 'bg-muted-foreground'
            }`} />
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-semibold text-lg">{character.name}</h3>
              {character.mood && (
                <span className="text-lg animate-bounce">{getMoodEmoji(character.mood)}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{character.isOnline ? 'Active now' : 'Last seen recently'}</span>
              {character.relationshipLevel && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3 h-3 text-red-400 fill-current" />
                    <span>Level {character.relationshipLevel}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button 
            variant="ghost" 
            size="sm"
            onClick={onStartCall}
            className="p-3 hover:bg-primary/10 transition-all duration-300 hover:scale-110 group"
          >
            <Phone className="w-5 h-5 text-primary group-hover:animate-wiggle" />
          </Button>
          <div className="relative">
            <Button 
            variant="ghost" 
            size="sm" 
            className="p-3 hover:bg-primary/10 transition-all duration-300 hover:scale-110"
          >
            <Gift className="w-5 h-5 text-accent" />
          </Button>
          <Button variant="ghost" size="sm" className="p-3">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {/* Relationship Progress Bar */}
      <div className="px-4 py-2 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Relationship XP</span>
              <span className="text-primary font-medium">{relationshipXP}/500</span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-primary to-primary-glow h-1.5 rounded-full transition-all duration-1000 animate-pulse-glow"
                style={{ width: `${(relationshipXP / 500) * 100}%` }}
              />
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            <Star className="w-3 h-3 mr-1" />
            Intimate
          </Badge>
        </div>
      </div>

      {/* Enhanced Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((message, index) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-end gap-3 max-w-[85%]">
              {message.sender === 'ai' && (
                <div className="relative">
                  <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                    <AvatarImage src={character.avatar} alt={character.name} />
                    <AvatarFallback>{character.name[0]}</AvatarFallback>
                  </Avatar>
                  {message.mood && (
                    <div className="absolute -top-2 -right-2 text-lg animate-float">
                      {getMoodEmoji(message.mood)}
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-1">
                <div
                  className={`p-4 rounded-2xl shadow-soft transition-all duration-300 hover:shadow-glow relative overflow-hidden ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-primary to-primary-glow text-white rounded-br-md'
                      : 'bg-gradient-to-r from-card to-accent/10 text-foreground rounded-bl-md border'
                  }`}
                >
                  {message.sender === 'ai' && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-primary to-transparent" />
                  )}
                  
                  <p className="text-sm leading-relaxed font-medium">
                    {message.content}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${
                      message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    
                    {message.sender === 'ai' && (
                      <div className="relative">
            <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 opacity-0 hover:opacity-100 transition-opacity"
                      >
                        <Heart className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                
                {message.sender === 'ai' && message.mood && (
                  <Badge variant="outline" className="text-xs ml-2 animate-fade-in">
                    Feeling {message.mood}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isAiTyping && (
          <div className="flex justify-start animate-bounce-in">
            <div className="flex items-end gap-3">
              <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                <AvatarImage src={character.avatar} alt={character.name} />
                <AvatarFallback>{character.name[0]}</AvatarFallback>
              </Avatar>
              <div className="bg-gradient-to-r from-card to-accent/10 p-4 rounded-2xl rounded-bl-md border">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                  <span className="text-xs text-muted-foreground ml-2">
                    {character.name} is typing...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Enhanced Input */}
      <Card className="p-4 rounded-none border-0 border-t bg-card/95 backdrop-blur-xl shadow-xl">
        <div className="flex items-end gap-3">
          <div className="relative">
            <Button
            variant="ghost"
            size="sm"
            onClick={handleVoiceInput}
            disabled={isTranscribing}
            className={`p-3 rounded-full transition-all duration-300 ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-glow animate-pulse' 
                : 'hover:bg-primary/10 hover:scale-110'
            } ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isTranscribing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isRecording ? (
              <MicOff className="w-5 h-5" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </Button>
          
          <div className="relative">
            <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="p-3 hover:bg-primary/10 transition-all duration-300 hover:scale-110"
          >
            <Smile className="w-5 h-5" />
          </Button>
          
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
          </div>
          
          
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={
                isRecording 
                  ? "Listening... Speak now" 
                  : isTranscribing 
                    ? "Transcribing your speech..." 
                    : `Message ${character.name}... 💕`
              }
              className={`border-0 bg-muted/30 focus:bg-background transition-all duration-300 rounded-full px-6 py-3 text-sm shadow-inner ${
                isRecording ? 'ring-2 ring-red-500/50' : ''
              }`}
            />
            
            {isRecording && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              </div>
            )}
            
            {relationshipXP > 100 && !isRecording && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Zap className="w-4 h-4 text-primary animate-pulse" />
              </div>
            )}
          </div>
          
          <div className="relative">
            <Button
            variant="ghost"
            size="sm"
            className="p-3 hover:bg-primary/10 transition-all duration-300 hover:scale-110"
          >
            <ImageIcon className="w-5 h-5" />
          </Button>
          
          <div className="relative">
            <Button
            onClick={sendMessage}
            disabled={!inputValue.trim()}
            variant="romance"
            className="p-3 rounded-full disabled:opacity-50 transition-all duration-300 hover:scale-105 shadow-glow"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Voice input status */}
        {isRecording && (
          <div className="mt-2 text-center">
            <Badge variant="destructive" className="animate-pulse">
              <Mic className="w-3 h-3 mr-1" />
              Recording... Speak now
            </Badge>
          </div>
        )}
        
        {isTranscribing && (
          <div className="mt-2 text-center">
            <Badge variant="secondary" className="animate-pulse">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Transcribing your speech...
            </Badge>
          </div>
        )}
        
        {/* Quick replies */}
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {['I missed you 💕', '❤️', 'Tell me about your day', 'You look beautiful'].map((reply, index) => (
            <div className="relative">
            <Button
              key={reply}
              variant="outline"
              size="sm"
              onClick={() => setInputValue(reply)}
              className="whitespace-nowrap text-xs bg-muted/20 hover:bg-primary/10 border-primary/20 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {reply}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
};
