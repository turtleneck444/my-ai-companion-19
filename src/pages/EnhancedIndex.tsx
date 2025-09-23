import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { SimpleChatInterface } from "@/components/SimpleChatInterface";
import { VoiceCallInterface } from "@/components/VoiceCallInterface";
import { UserProfile } from "@/components/UserProfile";
import { 
  MessageSquare, 
  Phone, 
  Heart, 
  User,
  ArrowLeft,
  Star,
  Plus
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

type View = 'home' | 'chats' | 'calls' | 'favorites' | 'profile' | 'chat' | 'call';

const EnhancedIndex = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [favorites, setFavorites] = useState<string[]>(['1']); // Simple favorites without localStorage

  // Character data - static to avoid re-render issues
  const characters: Character[] = [
    {
      id: '1',
      name: 'Luna',
      avatar: lunaAvatar,
      bio: 'A quiet, thoughtful person who enjoys reading and stargazing. Works as a graphic designer and loves indie music.',
      personality: ['Sweet', 'Caring', 'Romantic'],
      voice: 'Soft & Melodic',
      isOnline: true,
      mood: 'content',
      lastMessage: "Hey, how was your day? I just finished this new design project",
      unreadCount: 2,
      relationshipLevel: 4.2
    },
    {
      id: '2',
      name: 'Aria',
      avatar: ariaAvatar,
      bio: 'An upbeat marketing coordinator who loves trying new restaurants and going to concerts. Always has weekend plans.',
      personality: ['Playful', 'Energetic', 'Funny'],
      voice: 'Bright & Cheerful',
      isOnline: true,
      mood: 'excited',
      lastMessage: "omg you have to try this new coffee place I found",
      unreadCount: 1,
      relationshipLevel: 3.8
    },
    {
      id: '3',
      name: 'Sophie',
      avatar: sophieAvatar,
      bio: 'A museum curator with a PhD in art history. Enjoys wine tastings, classical music, and intellectual conversations.',
      personality: ['Intelligent', 'Elegant', 'Sophisticated'],
      voice: 'Warm & Confident',
      isOnline: false,
      mood: 'focused',
      lastMessage: "I saw the most interesting exhibit today, reminded me of our conversation about modern art",
      unreadCount: 0,
      relationshipLevel: 3.1
    }
  ];

  // Simple userPreferences without complex state
  const userPreferences = {
    preferredName: 'Darling',
    treatmentStyle: 'affectionate',
    age: '25',
    contentFilter: true
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

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedCharacter(null);
  };

  const handleFavorite = (character: Character) => {
    setFavorites(prev => 
      prev.includes(character.id) 
        ? prev.filter(id => id !== character.id)
        : [...prev, character.id]
    );
  };

  const handleUpdatePreferences = (newPreferences: any) => {
    toast({
      title: "Preferences updated! ✨",
      description: "Your AI companions will remember these settings.",
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
        onEndCall={handleBackToHome}
        onMinimize={() => setCurrentView('chat')}
        userPreferences={userPreferences}
      />
    );
  }

  if (currentView === 'chat' && selectedCharacter) {
    return (
      <SimpleChatInterface 
        character={selectedCharacter}
        onBack={handleBackToHome}
        onStartCall={() => handleStartCall()}
        userPreferences={userPreferences}
      />
    );
  }

  if (currentView === 'chats') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 z-10">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToHome}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">All Chats</h1>
          </div>
        </div>

        <div className="p-4 space-y-4 mb-20">
          {characters.map((character) => (
            <Card 
              key={character.id} 
              className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => handleCharacterSelect(character)}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={character.avatar} alt={character.name} />
                    <AvatarFallback>{character.name[0]}</AvatarFallback>
                  </Avatar>
                  {character.unreadCount && character.unreadCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-primary text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
                      {character.unreadCount}
                    </Badge>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{character.name}</h3>
                    {character.isOnline && (
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {character.lastMessage || 'No messages yet'}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartCall(character);
                    }}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavorite(character);
                    }}
                  >
                    <Heart className={`w-4 h-4 ${favorites.includes(character.id) ? 'text-red-400 fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (currentView === 'favorites') {
    const favoriteCharacters = characters.filter(char => favorites.includes(char.id));
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 z-10">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToHome}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-semibold">Favorites</h1>
          </div>
        </div>

        <div className="p-4 space-y-4 mb-20">
          {favoriteCharacters.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
              <p className="text-muted-foreground mb-6">
                Add companions to your favorites to see them here
              </p>
              <Button onClick={() => setCurrentView('chats')}>
                <Heart className="w-4 h-4 mr-2" />
                Browse Companions
              </Button>
            </div>
          ) : (
            favoriteCharacters.map((character) => (
              <Card 
                key={character.id} 
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleCharacterSelect(character)}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={character.avatar} alt={character.name} />
                    <AvatarFallback>{character.name[0]}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{character.name}</h3>
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {character.bio.slice(0, 60)}...
                    </p>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartCall(character);
                    }}
                  >
                    <Phone className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  }

  // Main home view
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Hero Section */}
      <div 
        className="relative min-h-[40vh] bg-cover bg-center"
        style={{ 
          backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2)), url(${heroBg})` 
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        
        <div className="relative p-6 pt-16 text-white">
          <h1 className="font-display text-3xl font-bold mb-2">
            Welcome back! 🌟
          </h1>
          <p className="text-white/90 text-lg mb-6">
            Ready for some quality time together?
          </p>
          
          {user && (
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <h2 className="text-lg font-semibold mb-2">Hello, {user.email || 'User'}!</h2>
                <p className="text-white/80">Your companions are waiting to chat with you</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Character Grid */}
      <div className="px-4 mt-8 mb-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Your Companions</h2>
          <Button variant="ghost" size="sm" className="text-primary">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>

        <div className="grid gap-4">
          {characters.map((character) => (
            <Card 
              key={character.id}
              className="p-4 hover:bg-muted/50 transition-all cursor-pointer group"
              onClick={() => handleCharacterSelect(character)}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={character.avatar} alt={character.name} />
                    <AvatarFallback>{character.name[0]}</AvatarFallback>
                  </Avatar>
                  {character.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-background" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg">{character.name}</h3>
                    {favorites.includes(character.id) && (
                      <Heart className="w-4 h-4 text-red-400 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{character.bio}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {character.personality.slice(0, 3).map((trait) => (
                      <Badge key={trait} variant="secondary" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                  {character.lastMessage && (
                    <p className="text-xs text-muted-foreground italic">
                      "{character.lastMessage}"
                    </p>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartCall(character);
                    }}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFavorite(character);
                    }}
                  >
                    <Heart className={`w-4 h-4 ${favorites.includes(character.id) ? 'text-red-400 fill-current' : ''}`} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t">
        <div className="grid grid-cols-4 max-w-md mx-auto">
          <Button
            variant={currentView === 'chats' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('chats')}
            className="flex flex-col items-center gap-1 p-4 h-auto rounded-none"
          >
            <MessageSquare className="w-6 h-6" />
            <span className="text-xs">Chats</span>
          </Button>

          <Button
            variant={currentView === 'calls' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('calls')}
            className="flex flex-col items-center gap-1 p-4 h-auto rounded-none"
          >
            <Phone className="w-6 h-6" />
            <span className="text-xs">Calls</span>
          </Button>

          <Button
            variant={currentView === 'favorites' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('favorites')}
            className="flex flex-col items-center gap-1 p-4 h-auto rounded-none"
          >
            <Heart className="w-6 h-6" />
            <span className="text-xs">Favorites</span>
          </Button>

          <Button
            variant={currentView === 'profile' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('profile')}
            className="flex flex-col items-center gap-1 p-4 h-auto rounded-none"
          >
            <User className="w-6 h-6" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EnhancedIndex;
