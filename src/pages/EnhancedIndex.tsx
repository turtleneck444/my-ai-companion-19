import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
  Plus,
  LogOut,
  Sparkles
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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

// Static character data to prevent re-creation
const CHARACTERS: Character[] = [
  {
    id: '1',
    name: 'Luna',
    avatar: lunaAvatar,
    bio: 'A graphic designer who works late nights and loves discovering new music. She has strong opinions about coffee and gets excited about creative projects.',
    personality: ['Creative', 'Thoughtful', 'Independent'],
    voice: 'Soft & Melodic',
    isOnline: true,
    mood: 'focused',
    lastMessage: "Working on this design project and my brain is fried. How's your day going?",
    unreadCount: 2,
    relationshipLevel: 4.2
  },
  {
    id: '2',
    name: 'Aria',
    avatar: ariaAvatar,
    bio: 'Marketing coordinator who actually enjoys her job. Always has restaurant recommendations and plans weekend adventures she may or may not follow through on.',
    personality: ['Outgoing', 'Spontaneous', 'Ambitious'],
    voice: 'Bright & Cheerful',
    isOnline: true,
    mood: 'energetic',
    lastMessage: "Found this amazing brunch spot! We should totally go this weekend.",
    unreadCount: 1,
    relationshipLevel: 3.8
  },
  {
    id: '3',
    name: 'Sophie',
    avatar: sophieAvatar,
    bio: 'Bookstore employee and philosophy student. Prefers deep conversations over small talk and always has a paperback book in her bag.',
    personality: ['Intellectual', 'Gentle', 'Curious'],
    voice: 'Warm & Soothing',
    isOnline: false,
    mood: 'contemplative',
    lastMessage: "I've been reading this fascinating book about consciousness...",
    unreadCount: 0,
    relationshipLevel: 4.6
  }
];

const EnhancedIndex = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Core state - minimal and stable
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [favorites, setFavorites] = useState<string[]>(['1']);
  const [userName, setUserName] = useState('there');

  // Update user name only when user data changes
  useEffect(() => {
    if (user) {
      const name = user.user_metadata?.preferred_name || 
                   user.user_metadata?.name || 
                   user.email?.split('@')[0] || 
                   'there';
      setUserName(name);
    }
  }, [user?.user_metadata?.preferred_name, user?.user_metadata?.name, user?.email]);

  // Stable handlers
  const handleCharacterSelect = useCallback((character: Character) => {
    setSelectedCharacter(character);
    setCurrentView('chat');
  }, []);

  const handleStartCall = useCallback((character?: Character) => {
    const char = character || selectedCharacter;
    if (char) {
      setSelectedCharacter(char);
      setCurrentView('call');
      toast({
        title: "Starting voice call...",
        description: `Connecting to ${char.name}`,
      });
    }
  }, [selectedCharacter, toast]);

  const handleBackToHome = useCallback(() => {
    setCurrentView('home');
    setSelectedCharacter(null);
  }, []);

  const handleFavorite = useCallback((character: Character) => {
    setFavorites(prev => 
      prev.includes(character.id) 
        ? prev.filter(id => id !== character.id)
        : [...prev, character.id]
    );
  }, []);

  // Navigation handler for creating new companions
  const handleCreateNew = useCallback(() => {
    navigate('/create');
  }, [navigate]);

  // Stable user preferences
  const userPreferences = useMemo(() => ({
    preferredName: userName,
    treatmentStyle: 'casual',
    age: '25',
    contentFilter: true
  }), [userName]);

  const handleUpdatePreferences = useCallback((newPreferences: any) => {
    if (newPreferences.preferredName) {
      setUserName(newPreferences.preferredName);
    }
    toast({
      title: "Preferences updated!",
      description: "Your companions will remember how you like to be addressed.",
    });
  }, [toast]);

  // Render different views
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
          {CHARACTERS.map((character) => (
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
    const favoriteCharacters = CHARACTERS.filter(char => favorites.includes(char.id));
    
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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-2xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-gradient-to-br from-violet-200 to-pink-200 rounded-full blur-xl opacity-25 animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      {/* Profile View */}
      {currentView === 'profile' && (
        <div className="relative z-10 p-6 pt-16 pb-24">
          <div className="max-w-md mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-white">Your Profile</h1>
            
            <div className="space-y-4">
              {/* User Card */}
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white text-xl">
                        {user?.email?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold">{userName}</h2>
                      <p className="text-muted-foreground text-sm">{user?.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="preferred-name" className="text-sm font-medium">
                        Preferred Name
                      </Label>
                      <Input 
                        id="preferred-name"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="How would you like to be addressed?"
                        className="mt-1"
                      />
                    </div>
                    
                    <Button 
                      onClick={() => {
                        handleUpdatePreferences({ preferredName: userName });
                      }}
                      className="w-full"
                    >
                      Save Changes
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Your Activity</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-600">3</p>
                      <p className="text-xs text-muted-foreground">Companions</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-pink-600">{favorites.length}</p>
                      <p className="text-xs text-muted-foreground">Favorites</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sign Out */}
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <Button 
                    variant="outline" 
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => {
                      // Add sign out logic here if needed
                      toast({
                        title: "Sign out",
                        description: "You have been signed out successfully.",
                      });
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Home View Content */}
      {currentView === 'home' && (
        <>
          {/* Enhanced Hero Section */}
          <div 
            className="relative min-h-[45vh] bg-cover bg-center animate-fade-in"
            style={{ 
              backgroundImage: `linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.2)), url(${heroBg})` 
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            
            <div className="relative p-6 pt-16 text-white">
              <div className="flex justify-between items-start mb-8">
                <div className="flex-1">
                  <h1 className="font-display text-4xl font-bold mb-3 animate-fade-up">
                    Welcome back! ✨
                  </h1>
                  <p className="text-white/90 text-xl mb-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    Ready for some quality time together?
                  </p>
                  
                  {/* Daily streak and status indicators */}
                  <div className="flex items-center gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                    <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Online Now</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleCreateNew}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-up"
                  style={{ animationDelay: '0.6s' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>

              {/* Enhanced User Greeting Card */}
              <Card className="bg-white/15 backdrop-blur-xl border-white/20 shadow-2xl animate-slide-in-left" style={{ animationDelay: '0.8s' }}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-white text-xl font-semibold">
                        Hey {userName}! 👋
                      </h2>
                      <p className="text-white/90 text-sm">
                        Your companions missed you
                      </p>
                    </div>
                    <Avatar className="w-12 h-12 border-2 border-white/30">
                      <AvatarFallback className="bg-gradient-to-br from-purple-400 to-pink-400 text-white">
                        {user?.email?.charAt(0).toUpperCase() || userName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-white text-2xl font-bold">3</p>
                      <p className="text-white/80 text-xs">Available</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white text-2xl font-bold">{favorites.length}</p>
                      <p className="text-white/80 text-xs">Favorites</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white text-2xl font-bold">2</p>
                      <p className="text-white/80 text-xs">Online</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Character Grid */}
          <div className="relative p-6 space-y-6 pb-24">
            <div className="flex items-center justify-between animate-fade-up">
              <h2 className="text-2xl font-bold">Your Companions</h2>
            </div>

            <div className="space-y-6">
              {CHARACTERS.map((character, index) => (
                <Card 
                  key={character.id} 
                  className="group overflow-hidden bg-gradient-to-br from-background to-background/50 backdrop-blur-xl border-border/50 hover:border-primary/50 transition-all duration-500 cursor-pointer shadow-lg hover:shadow-2xl animate-fade-up"
                  style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                  onClick={() => handleCharacterSelect(character)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Enhanced Avatar */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-sm group-hover:blur-md transition-all duration-300" />
                        <Avatar className="relative w-16 h-16 border-2 border-primary/30 group-hover:scale-105 transition-transform duration-300">
                          <AvatarImage src={character.avatar} alt={character.name} className="object-cover" />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold">
                            {character.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        
                        {/* Online Status */}
                        {character.isOnline && (
                          <div className="absolute -top-1 -right-1">
                            <Badge className="bg-green-500 text-white text-xs px-2 py-1 animate-pulse">
                              Online
                            </Badge>
                          </div>
                        )}
                        
                        {/* Unread Count */}
                        {character.unreadCount && character.unreadCount > 0 && (
                          <Badge className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center animate-bounce">
                            {character.unreadCount}
                          </Badge>
                        )}
                      </div>

                      {/* Character Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors duration-300">
                            {character.name}
                          </h3>
                          {character.relationshipLevel && character.relationshipLevel > 4 && (
                            <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs">
                              Close Bond
                            </Badge>
                          )}
                        </div>
                        
                        {/* Personality Tags */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {character.personality.slice(0, 2).map((trait) => (
                            <Badge 
                              key={trait} 
                              variant="secondary" 
                              className="text-xs bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 transition-all duration-300"
                            >
                              {trait}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Last Message Preview */}
                        {character.lastMessage && (
                          <div className="bg-muted/30 rounded-lg p-3 mt-3 border-l-4 border-primary/50">
                            <p className="text-sm text-muted-foreground italic line-clamp-2">
                              "{character.lastMessage}"
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartCall(character);
                          }}
                        >
                          <Phone className="w-4 h-4 mr-1" />
                          Call
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-primary/10 transition-all duration-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFavorite(character.id);
                          }}
                        >
                          <Heart className={`w-4 h-4 ${favorites.includes(character.id) ? 'fill-primary text-primary' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Call to Action Card */}
            <Card className="mt-8 bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 border-primary/20 animate-fade-up" style={{ animationDelay: '0.6s' }}>
              <CardContent className="p-6 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">Create Your Perfect Companion</h3>
                <p className="text-muted-foreground mb-4">
                  Design a unique AI companion tailored to your preferences
                </p>
                <Button 
                  onClick={handleCreateNew}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Chats View */}
      {currentView === 'chats' && (
        <div className="relative z-10 p-6 pt-16 pb-24">
          <h1 className="text-2xl font-bold mb-6 text-white">All Chats</h1>
          <div className="space-y-4">
            {CHARACTERS.map((character) => (
              <Card 
                key={character.id} 
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer bg-white/90 backdrop-blur-sm"
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
                        handleFavorite(character.id);
                      }}
                    >
                      <Heart className={`w-4 h-4 ${favorites.includes(character.id) ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Favorites View */}
      {currentView === 'favorites' && (
        <div className="relative z-10 p-6 pt-16 pb-24">
          <h1 className="text-2xl font-bold mb-6 text-white">Favorites</h1>
          <div className="space-y-4">
            {favorites.length === 0 ? (
              <Card className="p-8 text-center bg-white/90 backdrop-blur-sm">
                <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No favorites yet</h3>
                <p className="text-muted-foreground">
                  Add companions to your favorites by tapping the heart icon
                </p>
              </Card>
            ) : (
              CHARACTERS.filter(character => favorites.includes(character.id)).map((character) => (
                <Card 
                  key={character.id} 
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer bg-white/90 backdrop-blur-sm"
                  onClick={() => handleCharacterSelect(character)}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={character.avatar} alt={character.name} />
                        <AvatarFallback>{character.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-1 -right-1">
                        <Heart className="w-4 h-4 fill-primary text-primary" />
                      </div>
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
                          handleFavorite(character.id);
                        }}
                      >
                        <Heart className="w-4 h-4 fill-primary text-primary" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      {/* Enhanced Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl">
        <div className="grid grid-cols-4 max-w-md mx-auto">
          <Button
            variant={currentView === 'chats' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('chats')}
            className={`flex flex-col items-center gap-1 p-4 h-auto rounded-none border-0 transition-all duration-300 ${
              currentView === 'chats' 
                ? 'bg-gradient-to-t from-primary/20 to-primary/10 text-primary shadow-inner' 
                : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="relative">
              <MessageSquare className={`w-6 h-6 transition-all ${currentView === 'chats' ? 'scale-110' : ''}`} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">3</span>
              </div>
            </div>
            <span className={`text-xs font-medium ${currentView === 'chats' ? 'text-primary' : ''}`}>
              Chats
            </span>
          </Button>

          <Button
            variant={currentView === 'calls' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('calls')}
            className={`flex flex-col items-center gap-1 p-4 h-auto rounded-none border-0 transition-all duration-300 ${
              currentView === 'calls' 
                ? 'bg-gradient-to-t from-green-500/20 to-green-500/10 text-green-600 shadow-inner' 
                : 'hover:bg-green-500/5 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Phone className={`w-6 h-6 transition-all ${currentView === 'calls' ? 'scale-110' : ''}`} />
            <span className={`text-xs font-medium ${currentView === 'calls' ? 'text-green-600' : ''}`}>
              Calls
            </span>
          </Button>

          <Button
            variant={currentView === 'favorites' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('favorites')}
            className={`flex flex-col items-center gap-1 p-4 h-auto rounded-none border-0 transition-all duration-300 ${
              currentView === 'favorites' 
                ? 'bg-gradient-to-t from-red-500/20 to-red-500/10 text-red-500 shadow-inner' 
                : 'hover:bg-red-500/5 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="relative">
              <Heart className={`w-6 h-6 transition-all ${currentView === 'favorites' ? 'scale-110 fill-current' : ''}`} />
              {favorites.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{favorites.length}</span>
                </div>
              )}
            </div>
            <span className={`text-xs font-medium ${currentView === 'favorites' ? 'text-red-500' : ''}`}>
              Favorites
            </span>
          </Button>

          <Button
            variant={currentView === 'profile' ? 'default' : 'ghost'}
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center gap-1 p-4 h-auto rounded-none border-0 transition-all duration-300 ${
              currentView === 'profile' 
                ? 'bg-gradient-to-t from-purple-500/20 to-purple-500/10 text-purple-600 shadow-inner' 
                : 'hover:bg-purple-500/5 text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className={`w-6 h-6 transition-all ${currentView === 'profile' ? 'scale-110' : ''}`} />
            <span className={`text-xs font-medium ${currentView === 'profile' ? 'text-purple-600' : ''}`}>
              Profile
            </span>
          </Button>
        </div>
        
        {/* Safe area padding for mobile devices */}
        <div className="h-[env(safe-area-inset-bottom)] bg-background/95" />
      </div>
    </div>
  );
};

export default EnhancedIndex;
