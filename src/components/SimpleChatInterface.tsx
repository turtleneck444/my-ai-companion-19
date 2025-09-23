import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { 
  Send, 
  Phone, 
  ArrowLeft, 
  Mic, 
  MicOff,
  Heart
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { personalityAI, type ChatMessage, type ChatContext } from "@/lib/ai-chat";
import { voiceCallManager } from "@/lib/voice-call";

// Using ChatMessage from ai-chat.ts instead of local Message interface

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: string;
  isOnline: boolean;
}

interface SimpleChatInterfaceProps {
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
  const [relationshipLevel, setRelationshipLevel] = useState(10);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsAiTyping(true);

    try {
      // Get current time of day
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';

      // Build chat context for AI
      const chatContext: ChatContext = {
        character,
        userPreferences,
        conversationHistory: messages,
        relationshipLevel,
        timeOfDay
      };

      // Add realistic "thinking" delay based on message complexity
      const thinkingTime = Math.max(
        2000, // Minimum 2 seconds
        Math.min(8000, currentInput.length * 100 + Math.random() * 3000) // Max 8 seconds
      );

      // Show typing indicator for realistic duration
      await new Promise(resolve => setTimeout(resolve, thinkingTime));

      // Generate AI response using personality system
      const aiResponse = await personalityAI.generateResponse(currentInput, chatContext);

      // Add typing simulation - show characters appearing gradually
      setIsAiTyping(false);
      
      // Create message with typing effect
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: '',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Simulate typing effect
      let currentText = '';
      const typingSpeed = 50 + Math.random() * 50; // 50-100ms per character
      
      for (let i = 0; i < aiResponse.length; i++) {
        currentText += aiResponse[i];
        
        setMessages(prev => prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, content: currentText }
            : msg
        ));
        
        // Add small delay between characters
        if (i < aiResponse.length - 1) {
          await new Promise(resolve => setTimeout(resolve, typingSpeed));
        }
      }
      
      // Increase relationship level slightly with each interaction
      setRelationshipLevel(prev => Math.min(prev + 1, 100));
      
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Add realistic delay even for error
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fallback response
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: `I'm having trouble thinking right now, ${userPreferences.preferredName}. Can you say that again? 💕`,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
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
    toast({
      title: isRecording ? "Recording stopped" : "Recording started",
      description: "Voice features coming soon!",
    });
  };

  const handleCall = async () => {
    try {
      toast({
        title: "Starting call...",
        description: `Connecting with ${character.name}`,
      });

      const sessionId = await voiceCallManager.startVoiceCall(character, userPreferences);
      
      toast({
        title: "Call connected! 🎉",
        description: `You're now talking with ${character.name}`,
      });

      onStartCall?.();
    } catch (error) {
      console.error('Failed to start call:', error);
      toast({
        title: "Call failed",
        description: "Could not connect. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background via-primary/5 to-accent/10 max-w-full overflow-hidden">
      {/* Header */}
      <Card className="flex items-center justify-between p-4 rounded-none border-0 border-b bg-card/90 backdrop-blur-sm shadow-sm">
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
            <AvatarImage src={character.avatar} alt={character.name} />
            <AvatarFallback>{character.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">{character.name}</h3>
            <p className="text-xs text-muted-foreground">
              {character.isOnline ? 'Online now' : 'Last seen recently'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleCall}
            className="p-2 hover:bg-primary/10"
          >
            <Phone className="w-5 h-5 text-primary" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2"
          >
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[80%] p-2 sm:p-3 rounded-2xl text-sm sm:text-base ${
                message.sender === 'user'
                  ? 'bg-primary text-primary-foreground ml-auto'
                  : 'bg-card border shadow-sm'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        
        {isAiTyping && (
          <div className="flex justify-start">
            <div className="bg-card border shadow-sm p-3 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <Card className="p-3 sm:p-4 rounded-none border-0 border-t bg-card/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleRecording}
            className={`p-2 ${isRecording ? 'text-red-500' : ''}`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${character.name}...`}
            className="flex-1"
            disabled={isAiTyping}
          />
          
          <Button 
            onClick={sendMessage}
            disabled={!inputValue.trim() || isAiTyping}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}; 