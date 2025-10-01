import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CharacterCard } from "@/components/CharacterCard";
import { ChatInterface } from "@/components/ChatInterface";
import { VoiceCallInterface } from "@/components/VoiceCallInterface";
import { UserProfile } from "@/components/UserProfile";
import { BackendNotification } from "@/components/BackendNotification";
import { 
  MessageSquare, 
  Phone, 
  Settings, 
  Heart, 
  Sparkles, 
  User,
  Plus,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/lib/supabase";

// Import avatar images
import lunaAvatar from "@/assets/avatar-luna.jpg";
import ariaAvatar from "@/assets/avatar-aria.jpg";
import sophieAvatar from "@/assets/avatar-sophie.jpg";
import heroBg from "@/assets/hero-bg.jpg";

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: string;
  isOnline: boolean;
}

type View = 'home' | 'chat' | 'call' | 'profile';

const Index = () => {
  const { toast } = useToast();
  
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showBackendNotification, setShowBackendNotification] = useState(true);
  const [userPreferences, setUserPreferences] = useState({
    preferredName: 'Darling',
    treatmentStyle: 'affectionate',
    age: '25',
    contentFilter: true
  });

  const characters: Character[] = [
    {
      id: '1',
      name: 'Luna',
      avatar: lunaAvatar,
      bio: 'Sweet and caring with a gentle soul. Luna loves deep conversations and stargazing together.',
      personality: ['Sweet', 'Caring', 'Romantic', 'Thoughtful', 'Artistic'],
      voice: 'Soft & Melodic',
      isOnline: true
    },
    {
      id: '2',
      name: 'Aria',
      avatar: ariaAvatar,
      bio: 'Energetic and playful with a bright personality. Aria brings joy and laughter to every moment.',
      personality: ['Playful', 'Energetic', 'Funny', 'Adventurous', 'Optimistic'],
      voice: 'Bright & Cheerful',
      isOnline: true
    },
    {
      id: '3',
      name: 'Sophie',
      avatar: sophieAvatar,
      bio: 'Intelligent and sophisticated with elegant charm. Sophie enjoys intellectual discussions and fine culture.',
      personality: ['Intelligent', 'Elegant', 'Sophisticated', 'Cultured', 'Confident'],
      voice: 'Warm & Confident',
      isOnline: false
    },
    {
      id: '4',
      name: 'Natalie',
      avatar: '/natalie.png',
      bio: 'Confident and caring with a modern vibe. Natalie loves morning coffee chats, music, and real connection.',
      personality: ['Confident', 'Affectionate', 'Witty', 'Supportive', 'Playful'],
      voice: 'Smooth & Modern',
      isOnline: true
    },
    {
      id: '5',
      name: 'Heather',
      avatar: '/heather.png',
      bio: 'Grounded and adventurous. Heather loves sunrise hikes, matcha, and thoughtful conversations that go from silly to deep quickly.',
      personality: ['Adventurous', 'Warm', 'Down‑to‑earth', 'Playful', 'Empathetic'],
      voice: 'Calm & Warm',
      isOnline: true
    }
  ];

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    setCurrentView('chat');
  };

  const handleStartCall = (character?: Character) => {
    const char = character || selectedCharacter;
    if (char) {
      setSelectedCharacter(char);
      setCurrentView('call');
      toast({
        title: "Starting voice call...",
        description: `Connecting to ${char.name}`,
      });
    }
  };

  const handleEndCall = () => {
    setCurrentView('chat');
    toast({
      title: "Call ended",
      description: "Thanks for the lovely conversation!",
    });
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedCharacter(null);
  };

  const handleShowProfile = () => {
    setCurrentView('profile');
  };

  const handleUpdatePreferences = (newPreferences: any) => {
    setUserPreferences(newPreferences);
    toast({
      title: "Preferences updated!",
      description: "Your AI companions will remember these settings.",
    });
  };

  // Convert character voice to Voice object if needed
  const convertedCharacter = selectedCharacter ? {
    ...selectedCharacter,
    voice: typeof selectedCharacter.voice === 'string' 
      ? { voice_id: selectedCharacter.voice, name: 'Default Voice' }
      : selectedCharacter.voice
  } : null;

  // Render different views
  if (currentView === 'profile') {
    return <UserProfile />;
  }

  if (currentView === 'call' && convertedCharacter) {
    return (
      <VoiceCallInterface 
        character={convertedCharacter}
        onEndCall={handleEndCall}
        userPreferences={userPreferences}
      />
    );
  }

  if (currentView === 'chat' && convertedCharacter) {
    return (
      <ChatInterface 
        character={convertedCharacter}
        onBack={handleBackToHome}
        onStartCall={() => handleStartCall()}
        userPreferences={userPreferences}
      />
    );
  }

  // Main home view
  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Hero Section */}
      <div 
        className="relative h-64 bg-cover bg-center bg-gradient-to-br from-primary/20 via-background to-accent/10"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        <div className="relative p-6 pt-12 text-center text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {userPreferences.preferredName}! 💕
              </h1>
              <p className="text-white/80">Your AI companions are waiting for you</p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowProfile}
              className="text-white hover:bg-white/20"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-center p-4">
            <div className="flex justify-center items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <span>127 Chats</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                <span>23 Favorites</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Premium</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Backend Integration Notification */}
      {showBackendNotification && !isSupabaseConfigured && (
        <BackendNotification onDismiss={() => setShowBackendNotification(false)} />
      )}

      {/* Navigation Pills */}
      <div className="px-4 -mt-6 relative z-10">
        <Card className="p-1 shadow-romance border-0 bg-card/90 backdrop-blur-sm">
          <div className="flex gap-1">
            <Button variant="romance" className="flex-1 text-xs">
              <MessageSquare className="w-4 h-4 mr-1" />
              Chats
            </Button>
            <Button variant="ghost" className="flex-1 text-xs">
              <Phone className="w-4 h-4 mr-1" />
              Calls
            </Button>
            <Button variant="ghost" className="flex-1 text-xs">
              <Heart className="w-4 h-4 mr-1" />
              Favorites
            </Button>
            <Button variant="ghost" className="flex-1 text-xs">
              <User className="w-4 h-4 mr-1" />
              Profile
            </Button>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Your AI Girlfriends</h2>
        <Button variant="romance" onClick={handleShowProfile}>
          <Plus className="w-4 h-4 mr-2" />
          Create New
        </Button>
        </div>

        {/* Character Grid */}
        <div className="grid gap-4">
          {characters.map((character) => (
            <CharacterCard
              key={character.id}
              character={character}
              onSelect={handleCharacterSelect}
              onStartCall={handleStartCall}
            />
          ))}
        </div>

        {/* Recent Activity */}
        <Card className="p-4 shadow-romance border-0 bg-card/80 backdrop-blur-sm">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={lunaAvatar} alt="Luna" />
                <AvatarFallback>L</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Luna</p>
                <p className="text-xs text-muted-foreground truncate">
                  "I've been thinking about our conversation earlier..."
                </p>
              </div>
              <span className="text-xs text-muted-foreground">2h</span>
            </div>
            
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={ariaAvatar} alt="Aria" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Aria</p>
                <p className="text-xs text-muted-foreground truncate">
                  "Want to play that game we talked about? 🎮"
                </p>
              </div>
              <span className="text-xs text-muted-foreground">5h</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Index;