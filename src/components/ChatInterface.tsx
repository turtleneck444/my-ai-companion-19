import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { 
  Send, 
  Phone, 
  MoreVertical, 
  ArrowLeft, 
  Mic, 
  MicOff,
  Heart
} from "lucide-react";
import { speakText } from "@/lib/voice";
import { buildSystemPrompt } from "@/lib/ai";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: string;
  isOnline: boolean;
  voiceId?: string;
}

interface ChatInterfaceProps {
  character: Character;
  onBack: () => void;
  onStartCall: () => void;
  userPreferences: {
    preferredName: string;
    treatmentStyle: string;
  };
}

export const ChatInterface = ({ character, onBack, onStartCall, userPreferences }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const defaultVoiceId = (import.meta as any).env?.VITE_ELEVENLABS_VOICE_ID as string | undefined;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
              { role: 'user', content: `Greet me in a single short message.` }
            ],
            temperature: 0.85,
            max_tokens: 160
          })
        });
        const data = await res.json();
        const content = data?.message || `Hey ${userPreferences.preferredName}, it's ${character.name}.`;
        const aiMsg: Message = { id: Date.now().toString(), content, sender: 'ai', timestamp: new Date() };
        setMessages([aiMsg]);
        try { await speakText(aiMsg.content, character.voiceId || defaultVoiceId); } catch {}
      } catch {
        const fallbackMsg: Message = { id: Date.now().toString(), content: `Hey ${userPreferences.preferredName}! I'm ${character.name}. 💕`, sender: 'ai', timestamp: new Date() };
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
          temperature: 0.9,
          max_tokens: 220
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const content = (data && data.message) ? data.message : `That's really interesting, ${userPreferences.preferredName}! Tell me more 💭`;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      try { await speakText(aiMessage.content, character.voiceId || defaultVoiceId); } catch {}
    } catch (err) {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: `That's really interesting, ${userPreferences.preferredName}! I love hearing your thoughts. Tell me more about what's on your mind today? 💭`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      try { await speakText(aiMessage.content, character.voiceId || defaultVoiceId); } catch {}
    } finally {
      setIsAiTyping(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-soft">
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
            onClick={onStartCall}
            className="p-2 hover:bg-primary/10"
          >
            <Phone className="w-5 h-5 text-primary" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <MoreVertical className="w-5 h-5" />
          </Button>
        </div>
      </Card>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex items-end gap-2 max-w-[80%]">
              {message.sender === 'ai' && (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={character.avatar} alt={character.name} />
                  <AvatarFallback>{character.name[0]}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`p-3 rounded-2xl shadow-sm transition-smooth animate-slide-up ${
                  message.sender === 'user'
                    ? 'gradient-chat-user text-white rounded-br-md'
                    : 'gradient-chat-ai text-foreground rounded-bl-md'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-xs ${
                    message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {message.sender === 'ai' && (
                    <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => speakText(message.content)}>
                      Speak
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isAiTyping && (
          <div className="flex justify-start">
            <div className="flex items-end gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={character.avatar} alt={character.name} />
                <AvatarFallback>{character.name[0]}</AvatarFallback>
              </Avatar>
              <div className="gradient-chat-ai p-3 rounded-2xl rounded-bl-md">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse-soft"></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse-soft" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-primary/60 rounded-full animate-pulse-soft" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <Card className="p-4 rounded-none border-0 border-t bg-card/90 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleRecording}
            className={`p-3 rounded-full transition-bounce ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-glow' 
                : 'hover:bg-primary/10'
            }`}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
          
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={`Message ${character.name}...`}
            className="flex-1 border-0 bg-muted/50 focus:bg-background transition-smooth rounded-full px-4"
          />
          
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim()}
            variant="romance"
            className="p-3 rounded-full disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </Card>
    </div>
  );
};