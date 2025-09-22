import { useState, useEffect } from "react";
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

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: string;
  isOnline: boolean;
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
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Simulate AI speaking patterns
    const speakingTimer = setInterval(() => {
      setIsAiSpeaking(prev => !prev);
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(speakingTimer);
    };
  }, []);

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
          
          {/* Speaking indicator */}
          {isAiSpeaking && (
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="flex space-x-1">
                <div className="w-2 h-6 bg-primary rounded-full animate-pulse-soft"></div>
                <div className="w-2 h-8 bg-primary rounded-full animate-pulse-soft" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-6 bg-primary rounded-full animate-pulse-soft" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-8 bg-primary rounded-full animate-pulse-soft" style={{ animationDelay: '0.3s' }}></div>
                <div className="w-2 h-6 bg-primary rounded-full animate-pulse-soft" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-8 space-y-6">
        {/* Current status */}
        <Card className="p-4 bg-card/80 backdrop-blur-sm border-0 shadow-soft text-center">
          <p className="text-sm text-muted-foreground">
            {isAiSpeaking ? `${character.name} is speaking...` : 'Listening...'}
          </p>
        </Card>

        {/* Call controls */}
        <div className="flex justify-center items-center gap-6">
          {/* Mute */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-16 h-16 rounded-full border-2 transition-all ${
              isMuted 
                ? 'bg-red-500 hover:bg-red-600 text-white border-red-500' 
                : 'border-white/20 hover:bg-white/10 text-foreground'
            }`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
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

        {/* Additional actions */}
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