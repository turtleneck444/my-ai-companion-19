import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { EnhancedChatInterface } from "@/components/EnhancedChatInterface";
import { VoiceCallInterface } from "@/components/VoiceCallInterface";
import { 
  MessageSquare, 
  Phone, 
  Heart, 
  Sparkles,
  ArrowLeft,
  Share2,
  Star,
  Volume2,
  CheckCircle,
  Play,
  Pause
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { speakText } from "@/lib/voice";
import { useNavigate, useLocation } from "react-router-dom";

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: string;
  voice_id?: string;
  isOnline: boolean;
  relationshipLevel?: number;
}

type View = 'success' | 'chat' | 'call';

const CreationSuccess = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [currentView, setCurrentView] = useState<View>('success');
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  
  // Get character data from location state or create default
  const character: Character = location.state?.character || {
    id: 'new-companion',
    name: 'Your New Companion',
    avatar: '/placeholder.svg',
    bio: 'Ready to start our journey together!',
    personality: ['Caring', 'Playful'],
    voice: 'Warm & Friendly',
    isOnline: true,
    relationshipLevel: 1.0
  };

  const handleStartChat = () => {
    setCurrentView('chat');
    toast({
      title: "Starting conversation! 💕",
      description: `Say hello to ${character.name}`,
    });
  };

  const handleStartCall = () => {
    setCurrentView('call');
    toast({
      title: "Starting voice call...",
      description: `Connecting to ${character.name} 💕`,
    });
  };

  const handleEndCall = () => {
    setCurrentView('chat');
    toast({
      title: "Call ended",
      description: "Thanks for the lovely conversation! 💕",
    });
  };

  const handleBackToLibrary = () => {
    navigate('/library');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const previewVoice = async () => {
    if (!character.voice_id) {
      toast({ title: "No voice preview", description: "Voice preview not available for this companion." });
      return;
    }
    
    setIsPlayingVoice(true);
    try {
      await speakText(`Hello! I'm ${character.name}. ${character.bio}`, character.voice_id);
    } catch (error) {
      toast({ title: "Voice preview failed", description: "Could not play voice preview." });
    } finally {
      setIsPlayingVoice(false);
    }
  };

  const shareCompanion = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Meet ${character.name}`,
          text: `I just created an AI companion named ${character.name}! ${character.bio}`,
          url: window.location.href
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`Meet ${character.name} - ${character.bio}`);
      toast({
        title: "Copied to clipboard!",
        description: "Share your companion with others!",
      });
    }
  };

  // Render different views
  if (currentView === 'call') {
    return (
      <VoiceCallInterface 
        character={character}
        onEndCall={handleEndCall}
        onMinimize={() => setCurrentView('chat')}
        userPreferences={{
          preferredName: 'Darling',
          treatmentStyle: 'affectionate',
          age: '25',
          contentFilter: true
        }}
      />
    );
  }

  if (currentView === 'chat') {
    return (
      <EnhancedChatInterface 
        character={character}
        onBack={() => setCurrentView('success')}
        onStartCall={handleStartCall}
        userPreferences={{
          preferredName: 'Darling',
          treatmentStyle: 'affectionate',
          age: '25',
          contentFilter: true
        }}
      />
    );
  }

  // Success view
  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 z-10">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleGoHome}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Companion Created!</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="relative mb-6">
            <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-2 text-green-600">
            Success! 🎉
          </h2>
          <p className="text-muted-foreground text-lg">
            Your AI companion has been created and is ready to meet you!
          </p>
        </div>

        {/* Character Preview Card */}
        <Card className="mb-8 shadow-romance border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Avatar className="w-20 h-20 ring-4 ring-primary/20">
                <AvatarImage src={character.avatar} alt={character.name} />
                <AvatarFallback className="text-2xl">
                  {character.name[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold">{character.name}</h3>
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                </div>
                <p className="text-muted-foreground mb-3">{character.bio}</p>
                
                <div className="flex flex-wrap gap-1 mb-4">
                  {character.personality.map((trait) => (
                    <Badge key={trait} variant="secondary" className="text-xs">
                      {trait}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Volume2 className="w-4 h-4" />
                  <span>{character.voice} voice</span>
                  {character.voice_id && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={previewVoice}
                      disabled={isPlayingVoice}
                      className="ml-2 p-1 h-6 w-6"
                    >
                      {isPlayingVoice ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button
                onClick={handleStartChat}
                className="flex items-center gap-2 h-12 text-base"
                size="lg"
              >
                <MessageSquare className="w-5 h-5" />
                Start Chatting
              </Button>
              
              <Button
                onClick={handleStartCall}
                variant="outline"
                className="flex items-center gap-2 h-12 text-base"
                size="lg"
              >
                <Phone className="w-5 h-5" />
                Voice Call
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Actions */}
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              What's Next?
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Start a conversation to build your relationship</p>
              <p>• Try voice calls for more intimate conversations</p>
              <p>• Visit your library to manage all companions</p>
              <p>• Create more companions with different personalities</p>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={handleBackToLibrary}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              View Library
            </Button>
            
            <Button
              onClick={shareCompanion}
              variant="outline"
              className="flex-1"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>

          <Button
            onClick={() => navigate('/create')}
            className="w-full"
            variant="romance"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Create Another Companion
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreationSuccess;
