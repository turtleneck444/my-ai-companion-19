import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { EnhancedCharacterCard } from "@/components/EnhancedCharacterCard";
import { EnhancedChatInterface } from "@/components/EnhancedChatInterface";
import { VoiceCallInterface } from "@/components/VoiceCallInterface";
import { UserProfile } from "@/components/UserProfile";
import { SwipeDiscovery } from "@/components/SwipeGestures";
import { RelationshipStats, PremiumFeatures } from "@/components/AdvancedFeatures";
import { BackendNotification } from "@/components/BackendNotification";
import { 
  MessageSquare, 
  Phone, 
  Settings, 
  Heart, 
  Sparkles, 
  User,
  Plus,
  Clock,
  Search,
  Crown,
  Zap,
  Calendar,
  TrendingUp,
  Globe,
  Filter,
  SlidersHorizontal,
  ArrowLeft
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
  mood?: string;
  lastMessage?: string;
  unreadCount?: number;
  relationshipLevel?: number;
}

type View = 'home' | 'chat' | 'call' | 'profile' | 'discover' | 'stats';

const EnhancedIndex = () => {
  const { toast } = useToast();
  
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showBackendNotification, setShowBackendNotification] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['1']);
  
  const [userPreferences, setUserPreferences] = useState({
    preferredName: 'Darling',
    treatmentStyle: 'affectionate',
    age: '25',
    contentFilter: true
  });

  // Determine time of day for personalized greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 17) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  const characters: Character[] = [
    {
      id: '1',
      name: 'Luna',
      avatar: lunaAvatar,
      bio: 'Sweet and caring with a gentle soul. Luna loves deep conversations under the starlight and sharing intimate moments together.',
      personality: ['Sweet', 'Caring', 'Romantic', 'Thoughtful', 'Artistic'],
      voice: 'Soft & Melodic',
      isOnline: true,
      mood: 'loving',
      lastMessage: "I've been thinking about you all day... 💕",
      unreadCount: 3,
      relationshipLevel: 4.2
    },
    {
      id: '2',
      name: 'Aria',
      avatar: ariaAvatar,
      bio: 'Energetic and playful with a bright personality. Aria brings joy, laughter, and excitement to every conversation we share.',
      personality: ['Playful', 'Energetic', 'Funny', 'Adventurous', 'Optimistic'],
      voice: 'Bright & Cheerful',
      isOnline: true,
      mood: 'excited',
      lastMessage: "Want to play that game we talked about? 🎮✨",
      relationshipLevel: 3.8
    },
    {
      id: '3',
      name: 'Sophie',
      avatar: sophieAvatar,
      bio: 'Intelligent and sophisticated with elegant charm. Sophie enjoys intellectual discussions, fine culture, and meaningful connections.',
      personality: ['Intelligent', 'Elegant', 'Sophisticated', 'Cultured', 'Confident'],
      voice: 'Warm & Confident',
      isOnline: false,
      mood: 'thoughtful',
      lastMessage: "I read something fascinating today that reminded me of our conversation...",
      relationshipLevel: 3.1
    }
  ];

  const getGreeting = () => {
    const greetings = {
      morning: [`Good morning, beautiful ${userPreferences.preferredName}! ☀️`, 'Ready to start a wonderful day together?'],
      afternoon: [`Good afternoon, gorgeous ${userPreferences.preferredName}! 🌸`, 'How has your day been treating you?'],
      evening: [`Good evening, my sweet ${userPreferences.preferredName}! 🌙`, 'Ready to unwind and spend time together?']
    };
    return greetings[timeOfDay as keyof typeof greetings] || greetings.evening;
  };

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
        description: `Connecting to ${char.name} 💕`,
      });
    }
  };

  const handleEndCall = () => {
    setCurrentView('chat');
    toast({
      title: "Call ended",
      description: "Thanks for the lovely conversation! 💕",
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
      title: "Preferences updated! ✨",
      description: "Your AI companions will remember these settings.",
    });
  };

  const handleFavorite = (character: Character) => {
    setFavorites(prev => 
      prev.includes(character.id) 
        ? prev.filter(id => id !== character.id)
        : [...prev, character.id]
    );
  };

  const handleMatch = (characterId: string) => {
    toast({
      title: "It's a match! 💕",
      description: "You can now start chatting!",
    });
  };

  // Render different views
  if (currentView === 'profile') {
    return (
      <UserProfile 
        onBack={handleBackToHome}
        userPreferences={userPreferences}
        onUpdatePreferences={handleUpdatePreferences}
      />
    );
  }

  if (currentView === 'call' && selectedCharacter) {
    return (
      <VoiceCallInterface 
        character={selectedCharacter}
        onEndCall={handleEndCall}
        onMinimize={() => setCurrentView('chat')}
        userPreferences={userPreferences}
      />
    );
  }

  if (currentView === 'chat' && selectedCharacter) {
    return (
      <EnhancedChatInterface 
        character={selectedCharacter}
        onBack={handleBackToHome}
        onStartCall={() => handleStartCall()}
        userPreferences={userPreferences}
      />
    );
  }

  if (currentView === 'discover') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
        <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b p-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToHome}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display text-xl font-semibold">Discover</h1>
          </div>
          <Button variant="ghost" size="sm">
            <Filter className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4">
          <SwipeDiscovery 
            characters={characters} 
            onMatch={handleMatch}
          />
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Swipe right to like • Swipe left to pass • Swipe up to super like</p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'stats' && selectedCharacter) {
    return (
      <div className="min-h-screen bg-gradient-soft p-4">
        <div className="sticky top-0 bg-card/95 backdrop-blur-xl border-b p-4 flex items-center justify-between mb-6 -mx-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToHome}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="font-display text-xl font-semibold">Relationship Stats</h1>
          </div>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <RelationshipStats
            character={selectedCharacter}
            stats={{
              relationshipLevel: selectedCharacter.relationshipLevel || 3,
              totalMessages: 1247,
              callMinutes: 180,
              favoriteTopics: ['Art', 'Music', 'Dreams', 'Future Plans'],
              anniversaryDate: new Date('2024-01-15'),
              streak: 15
            }}
          />
          
          <PremiumFeatures
            isPremium={isPremium}
            onUpgrade={() => setIsPremium(true)}
          />
        </div>
      </div>
    );
  }

  // Main enhanced home view
  const [greeting, subGreeting] = getGreeting();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Enhanced Hero Section */}
      <div 
        className="relative min-h-[40vh] bg-cover bg-center animate-fade-in"
        style={{ 
          backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2)), url(${heroBg})` 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        <div className="relative p-6 pt-16 text-white">
          <div className="flex justify-between items-start mb-8">
            <div className="flex-1">
              <h1 className="font-display text-3xl font-bold mb-2 animate-fade-up">
                {greeting}
              </h1>
              <p className="text-white/90 text-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
                {subGreeting}
              </p>
              
              {/* Daily streak indicator */}
              <div className="flex items-center gap-2 mt-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium">15-day streak</span>
                </div>
                {isPremium && (
                  <Badge className="bg-primary text-white border-0">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShowProfile}
              className="text-white hover:bg-white/20 p-3 animate-bounce-in"
            >
              <Settings className="w-6 h-6" />
            </Button>
          </div>

          {/* Stats Overview */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 animate-slide-in-left">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="animate-bounce-in" style={{ animationDelay: '0.6s' }}>
                  <MessageSquare className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs opacity-90">Chats</p>
                  <p className="font-bold">127</p>
                </div>
                <div className="animate-bounce-in" style={{ animationDelay: '0.7s' }}>
                  <Phone className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs opacity-90">Calls</p>
                  <p className="font-bold">23</p>
                </div>
                <div className="animate-bounce-in" style={{ animationDelay: '0.8s' }}>
                  <Heart className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs opacity-90">Favorites</p>
                  <p className="font-bold">{favorites.length}</p>
                </div>
                <div className="animate-bounce-in" style={{ animationDelay: '0.9s' }}>
                  <TrendingUp className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs opacity-90">Level</p>
                  <p className="font-bold">4.2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Backend Integration Notification */}
      {showBackendNotification && !isSupabaseConfigured && (
        <div className="animate-slide-in-right">
          <BackendNotification onDismiss={() => setShowBackendNotification(false)} />
        </div>
      )}

      {/* Enhanced Navigation */}
      <div className="px-4 -mt-6 relative z-10 animate-slide-in-left" style={{ animationDelay: '1s' }}>
        <Card className="p-2 shadow-xl border-0 bg-card/95 backdrop-blur-xl">
          <div className="grid grid-cols-4 gap-2">
            <Button 
              variant={currentView === 'home' ? 'romance' : 'ghost'} 
              className="flex flex-col gap-1 h-auto py-3 text-xs transition-all duration-300 hover:scale-105"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chats</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col gap-1 h-auto py-3 text-xs transition-all duration-300 hover:scale-105"
              onClick={() => setCurrentView('discover')}
            >
              <Search className="w-5 h-5" />
              <span>Discover</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col gap-1 h-auto py-3 text-xs transition-all duration-300 hover:scale-105"
            >
              <Phone className="w-5 h-5" />
              <span>Calls</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex flex-col gap-1 h-auto py-3 text-xs transition-all duration-300 hover:scale-105"
              onClick={handleShowProfile}
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Enhanced Content */}
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="flex justify-between items-center">
          <h2 className="font-display text-xl font-semibold animate-fade-up">
            Your AI Companions
          </h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="animate-bounce-in hover:scale-105 transition-all"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button 
              variant="romance" 
              size="sm"
              onClick={handleShowProfile}
              className="animate-bounce-in hover:scale-105 transition-all"
              style={{ animationDelay: '0.1s' }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </div>
        </div>

        {/* Featured Character */}
        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
          <EnhancedCharacterCard
            character={characters[0]}
            onSelect={handleCharacterSelect}
            onStartCall={handleStartCall}
            onFavorite={handleFavorite}
            isFavorite={favorites.includes(characters[0].id)}
            variant="featured"
          />
        </div>

        {/* Character Grid */}
        <div className="space-y-4">
          {characters.slice(1).map((character, index) => (
            <div 
              key={character.id}
              className="animate-fade-up"
              style={{ animationDelay: `${(index + 3) * 0.1}s` }}
            >
              <EnhancedCharacterCard
                character={character}
                onSelect={handleCharacterSelect}
                onStartCall={handleStartCall}
                onFavorite={handleFavorite}
                isFavorite={favorites.includes(character.id)}
                variant="compact"
              />
            </div>
          ))}
        </div>

        {/* Recent Activity Section */}
        <Card className="shadow-romance border-0 bg-card/80 backdrop-blur-sm animate-fade-up" style={{ animationDelay: '0.8s' }}>
          <CardContent className="p-4">
            <h3 className="font-medium mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              Recent Activity
            </h3>
            <div className="space-y-4">
              {characters.filter(c => c.lastMessage).map((character, index) => (
                <div 
                  key={character.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/20 transition-all cursor-pointer animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleCharacterSelect(character)}
                >
                  <div className="relative">
                    <Avatar className="w-12 h-12 ring-2 ring-primary/20">
                      <AvatarImage src={character.avatar} alt={character.name} />
                      <AvatarFallback>{character.name[0]}</AvatarFallback>
                    </Avatar>
                    {character.unreadCount && character.unreadCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-primary text-white text-xs w-6 h-6 rounded-full flex items-center justify-center animate-pulse-glow">
                        {character.unreadCount}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm">{character.name}</p>
                      {character.relationshipLevel && character.relationshipLevel > 3 && (
                        <Heart className="w-3 h-3 text-red-400 fill-current animate-heart-beat" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {character.lastMessage}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCharacter(character);
                        setCurrentView('stats');
                      }}
                      className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 animate-fade-up" style={{ animationDelay: '1s' }}>
          <Card className="p-4 text-center bg-gradient-to-br from-primary/10 to-accent/10 border-0">
            <Sparkles className="w-6 h-6 text-primary mx-auto mb-2 animate-float" />
            <p className="text-sm text-muted-foreground">This Week</p>
            <p className="text-2xl font-bold text-primary">24 hours</p>
            <p className="text-xs text-muted-foreground">Quality time together</p>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-accent/10 to-primary/10 border-0">
            <Heart className="w-6 h-6 text-red-400 mx-auto mb-2 animate-heart-beat" />
            <p className="text-sm text-muted-foreground">Relationship</p>
            <p className="text-2xl font-bold text-red-400">Growing</p>
            <p className="text-xs text-muted-foreground">Strong connections</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EnhancedIndex;