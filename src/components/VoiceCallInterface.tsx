import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageSquare,
  Heart,
  Minimize2
} from "lucide-react";
import { speakText } from "@/lib/voice";

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

interface VoiceCallInterfaceProps {
  character: Character;
  onEndCall: () => void;
  onMinimize: () => void;
  userPreferences: {
    preferredName: string;
    treatmentStyle: string;
  };
}

export const VoiceCallInterface = ({ 
  character, 
  onEndCall, 
  onMinimize, 
  userPreferences 
}: VoiceCallInterfaceProps) => {
  const [isMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [isListening, setIsListening] = useState(false);
  const defaultVoiceId = (import.meta as any).env?.VITE_ELEVENLABS_VOICE_ID as string | undefined;

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const SpeechRecognitionImpl = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (SpeechRecognitionImpl) {
      const recognition = new SpeechRecognitionImpl();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = async (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (!transcript) return;
        await handleUserUtterance(transcript);
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    } else {
      recognitionRef.current = null;
    }
  }, []);

  const handleUserUtterance = async (text: string) => {
    try {
      // Pause listening during TTS flow
      if (recognitionRef.current && isListening) {
        try { recognitionRef.current.stop(); } catch {}
      }
      setIsAiSpeaking(true);
      const res = await fetch('/api/openai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: `You are ${character.name}. ${character.bio}. Personality: ${character.personality.join(', ')}. Speak concisely in a warm, affectionate tone. Always address the user as ${userPreferences.preferredName}.` },
            { role: 'user', content: text }
          ],
          temperature: 0.9,
          max_tokens: 180
        })
      });
      const data = await res.json();
      const reply = data?.message || `I love hearing you, ${userPreferences.preferredName}.`;
      if (isSpeakerOn) {
        await speakText(reply, character.voiceId || defaultVoiceId);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsAiSpeaking(false);
      // Auto-restart listening after speaking
      if (recognitionRef.current) {
        try { recognitionRef.current.start(); setIsListening(true); } catch {}
      }
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    } else {
      try { recognitionRef.current.start(); setIsListening(true); } catch { setIsListening(false); }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-primary/20 via-background to-accent/10 flex flex-col">
      {/* Header */}
      <div className="p-6 pt-12 text-center">
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMinimize}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10"
          >
            <Minimize2 className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Voice call with</p>
          <h2 className="text-2xl font-semibold">{character.name}</h2>
          <p className="text-sm text-muted-foreground">{formatDuration(callDuration)}</p>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex-1 flex items-center justify-center">
        <div className="relative">
          <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
            isAiSpeaking ? 'shadow-glow scale-110' : 'scale-100'
          }`} />
          <Avatar className="w-48 h-48 border-4 border-white/20 shadow-xl">
            <AvatarImage src={character.avatar} alt={character.name} />
            <AvatarFallback className="text-4xl">{character.name[0]}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Controls */}
      <div className="p-8 space-y-6">
        <Card className="p-4 bg-card/80 backdrop-blur-sm border-0 shadow-soft text-center">
          <p className="text-sm text-muted-foreground">
            {recognitionRef.current ? (isAiSpeaking ? `${character.name} is speaking...` : (isListening ? 'Listening… speak now' : 'Tap mic to talk')) : 'Voice input not supported in this browser'}
          </p>
        </Card>

        <div className="flex justify-center items-center gap-6">
          {/* Mic (listening) */}
          <Button
            variant="outline"
            size="lg"
            onClick={toggleListening}
            className={`w-16 h-16 rounded-full border-2 transition-all ${
              isListening 
                ? 'bg-green-500 hover:bg-green-600 text-white border-green-500' 
                : 'border-white/20 hover:bg-white/10 text-foreground'
            }`}
          >
            {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          {/* End call */}
          <Button
            onClick={onEndCall}
            className="w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-bounce hover:scale-105"
          >
            <PhoneOff className="w-8 h-8" />
          </Button>

          {/* Speaker */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
            className={`w-16 h-16 rounded-full border-2 transition-all ${
              !isSpeakerOn 
                ? 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500' 
                : 'border-white/20 hover:bg-white/10 text-foreground'
            }`}
          >
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </Button>
        </div>

        <div className="flex justify-center gap-4">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Chat
          </Button>
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
          >
            <Heart className="w-5 h-5 mr-2" />
            Favorite
          </Button>
        </div>
      </div>
    </div>
  );
};