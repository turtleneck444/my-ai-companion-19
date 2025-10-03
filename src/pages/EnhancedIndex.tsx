import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { SimpleChatInterface } from "@/components/SimpleChatInterface";
import { EnhancedChatInterface } from "@/components/EnhancedChatInterface";
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
  Sparkles,
  Home,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseUsageTracking } from "@/hooks/useSupabaseUsageTracking";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useLocation } from "react-router-dom";

// Import avatar images
import lunaAvatar from "@/assets/avatar-luna.jpg";
import ariaAvatar from "@/assets/avatar-aria.jpg";
import sophieAvatar from "@/assets/avatar-sophie.jpg";
import heroBg from "@/assets/hero-bg.jpg";
import { PaymentModal } from "@/components/PaymentModal";
import { useSearchParams } from "react-router-dom";
import { getPlanById } from "@/lib/payments";
import { supabase } from "@/lib/supabase";

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: { voice_id: string; name: string };
  isOnline: boolean;
  mood?: string;
  lastMessage?: string;
  unreadCount?: number;
  relationshipLevel?: number;
  voiceId?: string; // Added voiceId to the interface
}

type View = 'home' | 'chats' | 'favorites' | 'profile' | 'chat' | 'call';

// Static character data to prevent re-creation
const CHARACTERS: Character[] = [
  {
    id: '1',
    name: 'Luna',
    avatar: lunaAvatar,
    bio: 'Graphic designer who lives for late-night creativity and moody playlists; blunt about coffee opinions, tender about people she trusts.',
    personality: ['Creative', 'Thoughtful', 'Independent', 'Romantic'],
    voice: { voice_id: 'default_soft_melodic', name: 'Soft & Melodic' },
    isOnline: true,
    mood: 'focused',
    lastMessage: "Working on this design project and my brain is fried. How's your day going?",
    unreadCount: 2,
    relationshipLevel: 4.2,
    voiceId: '21m00Tcm4TlvDq8ikWAM' // Rachel: warm, youthful, expressive
  },
  {
    id: '2',
    name: 'Aria',
    avatar: ariaAvatar,
    bio: 'Marketing coordinator who actually enjoys the hustle; foodie who over-plans weekends and laughs at her own jokes.',
    personality: ['Outgoing', 'Spontaneous', 'Ambitious', 'Playful'],
    voice: { voice_id: 'default_bright_cheerful', name: 'Bright & Cheerful' },
    isOnline: true,
    mood: 'energetic',
    lastMessage: "Found this amazing brunch spot! We should totally go this weekend.",
    unreadCount: 1,
    relationshipLevel: 3.8,
    voiceId: 'AZnzlk1XvdvUeBnXmlld' // Bella: charming, intimate, confident
  },
  {
    id: '3',
    name: 'Sophie',
    avatar: sophieAvatar,
    bio: 'Bookstore employee and philosophy student; prefers long, quiet conversations and gets lost in used-paperback margins.',
    personality: ['Intellectual', 'Gentle', 'Curious', 'Calm'],
    voice: { voice_id: 'default_warm_soothing', name: 'Warm & Soothing' },
    isOnline: false,
    mood: 'contemplative',
    lastMessage: "I've been reading this fascinating book about consciousness...",
    unreadCount: 0,
    relationshipLevel: 4.6,
    voiceId: 'EXAVITQu4vr4xnSDxMaL' // Sarah: soft, empathetic, soothing
  },
  {
    id: '4',
    name: 'Mina',
    avatar: ariaAvatar,
    bio: 'Software engineer with dry humor and sharp curiosity; prefers concise chats and practical advice.',
    personality: ['Intellectual', 'Direct', 'Witty', 'Independent'],
    voice: { voice_id: 'default_cool_clear', name: 'Cool & Clear' },
    isOnline: true,
    mood: 'analytical',
    lastMessage: "Ship day. Coffee is my personality right now.",
    unreadCount: 0,
    relationshipLevel: 3.2,
    voiceId: 'TxGEqnHWrfWFTfGW9XjX' // Emily: sweet, bright, intelligent
  },
  {
    id: '5',
    name: 'Noa',
    avatar: sophieAvatar,
    bio: 'Shy illustrator who opens up slowly; soft-spoken, observant, and surprisingly funny when comfortable.',
    personality: ['Gentle', 'Caring', 'Curious', 'Romantic'],
    voice: { voice_id: 'default_soft_breath', name: 'Soft & Breathier' },
    isOnline: false,
    mood: 'reflective',
    lastMessage: "I drew something for you... can I show you later?",
    unreadCount: 0,
    relationshipLevel: 2.7,
    voiceId: 'ErXwobaYiN019PkySvjV' // Elli: expressive and modern
  },
  {
    id: '6',
    name: 'Heather',
    avatar: '/heather.png',
    bio: 'Art director with an elegant eye; calm, composed, and a little mischievous. Loves gallery nights, good tea, and honest conversations.',
    personality: ['Intellectual', 'Romantic', 'Gentle', 'Elegant'],
    voice: { voice_id: 'default_elegant_clear', name: 'Elegant & Clear' },
    isOnline: true,
    mood: 'serene',
    lastMessage: 'Just got back from a small gallery opening—want to hear about my favorite piece?',
    unreadCount: 0,
    relationshipLevel: 3.9,
    voiceId: 'pNInz6obpgDQGcFmaJgB' // Olivia: crisp, elegant, assured (British)
  },
  {
    id: '7',
    name: 'Natalie',
    avatar: '/natalie.png',
    bio: 'Fitness enthusiast and weekend foodie. Playful energy, quick wit, and a habit of sending memes at 2am.',
    personality: ['Outgoing', 'Playful', 'Confident', 'Caring'],
    voice: { voice_id: 'default_bright_bubbly', name: 'Bright & Bubbly' },
    isOnline: false,
    mood: 'cheerful',
    lastMessage: 'Made the best tacos of my life—be honest, would you try my hot sauce?',
    unreadCount: 0,
    relationshipLevel: 3.4,
    voiceId: 'MF3mGyEYCl7XYWbV9V6O' // Cora: bright, friendly, youthful
  }
];

const EnhancedIndex = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation() as any;
  const { plan, remainingMessages, remainingVoiceCalls } = useEnhancedUsageTracking();
  
  // Core state - minimal and stable
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [favorites, setFavorites] = useState<string[]>(['1']);
  const [userName, setUserName] = useState('there');
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  const [databaseCharacters, setDatabaseCharacters] = useState<Character[]>([]);
  const [allCharacters, setAllCharacters] = useState<Character[]>(CHARACTERS);

  // Load characters from Supabase database
  useEffect(() => {
    const loadDatabaseCharacters = async () => {
      if (!user) return;
      
      try {
        const { data: dbCharacters, error } = await supabase
          .from('characters')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.log('Could not load database characters:', error.message);
          return;
        }

        if (dbCharacters && dbCharacters.length > 0) {
          const formattedCharacters: Character[] = dbCharacters.map(char => ({
            id: char.id,
            name: char.name,
            avatar: char.avatar_url || '/placeholder.svg',
            bio: char.description || char.bio || 'A unique companion ready to chat!',
            personality: Array.isArray(char.personality) ? char.personality : 
                        typeof char.personality === 'string' ? [char.personality] : 
                        ['Friendly', 'Thoughtful'],
            voice: { 
              voice_id: char.voice_id || 'default', 
              name: char.voice || 'Default Voice' 
            },
            isOnline: true,
            mood: 'friendly',
            lastMessage: 'Hi there! I\'m ready to chat with you!',
            unreadCount: 0,
            relationshipLevel: 1.0,
            voiceId: char.voice_id || '21m00Tcm4TlvDq8ikWAM'
          }));

          console.log('Loaded database characters:', formattedCharacters);
          setDatabaseCharacters(formattedCharacters);
          setAllCharacters([...formattedCharacters, ...CHARACTERS]);
        }
      } catch (error) {
        console.log('Error loading characters:', error);
      }
    };

    loadDatabaseCharacters();
  }, [user]);

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

  // Live clock updater
  useEffect(() => {
    const id = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Plan is now loaded automatically from Supabase by useSupabaseUsageTracking

  // If navigated with a character to start chat with, open chat
  useEffect(() => {
    const starter = location?.state?.startChatWith;
    if (starter) {
      setSelectedCharacter(starter);
      setCurrentView('chat');
      // clear state so back nav doesn't retrigger
      navigate('/app', { replace: true, state: {} });
    }
    // Support default start from signup success
    const startDefault = location?.state?.startChatDefault;
    if (startDefault) {
      const first = (databaseCharacters && databaseCharacters.length > 0)
        ? databaseCharacters[0]
        : CHARACTERS[0];
      if (first) {
        setSelectedCharacter(first);
        setCurrentView('chat');
      }
      navigate('/app', { replace: true, state: {} });
    }
  }, [location?.state?.startChatWith, location?.state?.startChatDefault, navigate, databaseCharacters]);

  // Plan handoff: if URL contains ?plan=, handle auto-upgrade or redirect to auth
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (!planParam) return;

    const plan = getPlanById(planParam);
    if (!plan) return;

    if (plan.id === 'free') {
      // Free plan → straight to app
      navigate('/app');
      return;
    }

    if (user) {
      setSelectedPlan(plan.id);
      setShowPaymentModal(true);
    } else {
      navigate(`/auth?plan=${plan.id}`);
    }
  }, [searchParams, user, navigate]);

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

  const handleBackToChats = useCallback(() => {
    setCurrentView('chats');
    setSelectedCharacter(null);
  }, []);

  const handleFavorite = useCallback((characterId: string) => {
    setFavorites(prev => 
      prev.includes(characterId) 
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
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
        userPreferences={userPreferences}
      />
    );
  }

  if (currentView === 'chat' && selectedCharacter) {
    return (
      <SimpleChatInterface 
        character={selectedCharacter}
        onBack={handleBackToChats}
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
          {allCharacters.map((character) => (
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
                      handleFavorite(character.id);
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
    const favoriteCharacters = allCharacters.filter(char => favorites.includes(char.id));
    
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
        <div className="relative z-10 p-4 pt-16 pb-24">
          <UserProfile />
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
                  className="bg-pink-500 hover:bg-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-up"
                  style={{ animationDelay: '0.6s' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New
                </Button>
              </div>

              {/* Enhanced User Greeting Card */}
              <Card className="bg-gradient-to-br from-slate-900/95 via-pink-900/90 to-rose-900/90 backdrop-blur-xl border-pink-500/30 shadow-2xl animate-slide-in-left relative overflow-hidden ring-1 ring-pink-300/20" style={{ animationDelay: '0.8s' }}>
                {/* Beautiful layered background effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-pink-600/25 via-rose-600/20 to-purple-600/15" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-pink-400/15 via-transparent to-transparent" />
                {/* Live clock - clean top-right pill */}
                <div className="absolute top-2 right-2 z-20">
                  <div className="bg-white/12 backdrop-blur-md border border-white/20 shadow-sm text-white rounded-full px-2.5 py-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-pink-200" />
                    <span className="text-[11px] font-semibold tracking-wide leading-none" aria-live="polite">{currentTime}</span>
                  </div>
                </div>
                
                <CardContent className="p-6 relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-white text-xl font-bold drop-shadow-2xl" style={{ 
                        textShadow: '0 4px 12px rgba(0,0,0,0.9), 0 0 40px rgba(255,255,255,0.5), 0 0 80px rgba(236,72,153,0.7), 0 0 120px rgba(244,114,182,0.4)'
                      }}>
                        Hey {userName}! 👋
                      </h2>
                      <p className="text-white/95 text-sm font-medium drop-shadow-lg mt-1" style={{ 
                        textShadow: '0 3px 8px rgba(0,0,0,0.8), 0 0 25px rgba(255,255,255,0.4), 0 0 50px rgba(236,72,153,0.4)'
                      }}>
                        Your companions missed you
                      </p>
                    </div>
                    {/* Avatar removed per request for a cleaner card */}
                    <Badge className="bg-white/15 text-white border-white/20">{currentPlan === 'free' ? 'Free' : currentPlan === 'premium' ? 'Premium' : 'Pro'}</Badge>
                  </div>
                  
                  {/* Enhanced Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center bg-white/8 backdrop-blur-sm rounded-xl p-4 border border-pink-400/30">
                      <p className="text-white text-2xl font-bold drop-shadow-2xl mb-1" style={{ 
                        textShadow: '0 4px 12px rgba(0,0,0,1), 0 0 40px rgba(255,255,255,0.6), 0 0 80px rgba(236,72,153,0.6)'
                      }}>3</p>
                      <p className="text-pink-100 text-xs font-semibold uppercase tracking-wide drop-shadow-lg" style={{ 
                        textShadow: '0 3px 8px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.4)'
                      }}>Available</p>
                    </div>
                    <div className="text-center bg-white/8 backdrop-blur-sm rounded-xl p-4 border border-rose-400/30">
                      <p className="text-white text-2xl font-bold drop-shadow-2xl mb-1" style={{ 
                        textShadow: '0 4px 12px rgba(0,0,0,1), 0 0 40px rgba(255,255,255,0.6), 0 0 80px rgba(244,114,182,0.6)'
                      }}>{favorites.length}</p>
                      <p className="text-rose-100 text-xs font-semibold uppercase tracking-wide drop-shadow-lg" style={{ 
                        textShadow: '0 3px 8px rgba(0,0,0,0.9), 0 0 20px rgba(255,255,255,0.4)'
                      }}>Favorites</p>
                    </div>
                    <div className="text-center bg-white/8 backdrop-blur-sm rounded-xl p-4 border border-pink-400/30">
                      <p className="text-white text-[11px] font-semibold uppercase tracking-wide">Usage Today</p>
                      <div className="mt-2 space-y-1">
                        <div className="text-[11px] text-pink-100">Messages left: {plan === 'pro' ? 'Unlimited' : (remainingMessages === -1 ? '∞' : remainingMessages)}</div>
                        <div className="text-[11px] text-pink-100">Calls left: {plan === 'pro' ? 'Unlimited' : (typeof remainingVoiceCalls === 'number' ? remainingVoiceCalls : '∞')}</div>
                      </div>
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
              {allCharacters.map((character, index) => (
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
                          <Badge className="absolute -bottom-2 -right-2 bg-pink-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center animate-bounce">
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
                          {/* Vibe badges */}
                          <div className="flex gap-1">
                            {character.personality.slice(0,1).map((trait) => (
                              <Badge key={trait} className="text-[10px] px-2 py-0 bg-primary/10 text-primary border-primary/20">
                                {trait}
                              </Badge>
                            ))}
                          </div>
                          {character.relationshipLevel && character.relationshipLevel > 4 && (
                            <Badge className="bg-pink-500 text-white text-xs">
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
                              className="text-xs bg-pink-100 text-pink-700 hover:bg-pink-200 transition-all duration-300"
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
                          className="bg-pink-500 hover:bg-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
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
                  className="bg-pink-500 hover:bg-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Get Started
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Enhanced Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-2xl">
        <div className="grid grid-cols-4 max-w-md mx-auto">
          <button
            onClick={() => setCurrentView('home')}
            className={`flex flex-col items-center gap-1 p-4 h-auto transition-all duration-300 ${
              currentView === 'home' 
                ? 'bg-primary/10 text-primary' 
                : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className={`w-6 h-6 transition-all ${currentView === 'home' ? 'scale-105' : ''}`} />
            <span className={`text-xs font-medium ${currentView === 'home' ? 'text-primary' : ''}`}>
              Home
            </span>
          </button>

          <button
            onClick={() => setCurrentView('chats')}
            className={`flex flex-col items-center gap-1 p-4 h-auto transition-all duration-300 ${
              (currentView as any) === 'chats' 
                ? 'bg-primary/10 text-primary' 
                : 'hover:bg-primary/5 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="relative">
              <MessageSquare className={`w-6 h-6 transition-all ${(currentView as any) === 'chats' ? 'scale-105' : ''}`} />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs text-white font-bold">3</span>
              </div>
            </div>
            <span className={`text-xs font-medium ${(currentView as any) === 'chats' ? 'text-primary' : ''}`}>
              Chats
            </span>
          </button>

          <button
            onClick={() => setCurrentView('favorites')}
            className={`flex flex-col items-center gap-1 p-4 h-auto transition-all duration-300 ${
              (currentView as any) === 'favorites' 
                ? 'bg-red-50 text-red-600' 
                : 'hover:bg-red-50/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <div className="relative">
              <Heart className={`w-6 h-6 transition-all ${(currentView as any) === 'favorites' ? 'scale-105 fill-current' : ''}`} />
              {favorites.length > 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">{favorites.length}</span>
                </div>
              )}
            </div>
            <span className={`text-xs font-medium ${(currentView as any) === 'favorites' ? 'text-red-600' : ''}`}>
              Favorites
            </span>
          </button>

          <button
            onClick={() => setCurrentView('profile')}
            className={`flex flex-col items-center gap-1 p-4 h-auto transition-all duration-300 ${
              currentView === 'profile' 
                ? 'bg-purple-50 text-purple-600' 
                : 'hover:bg-purple-50/50 text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className={`w-6 h-6 transition-all ${currentView === 'profile' ? 'scale-105' : ''}`} />
            <span className={`text-xs font-medium ${currentView === 'profile' ? 'text-purple-600' : ''}`}>
              Profile
            </span>
          </button>
        </div>
        
        {/* Safe area padding for mobile devices */}
        <div className="h-[env(safe-area-inset-bottom)] bg-background/95" />
      </div>

      {/* Payment Modal for plan selection from URL */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          selectedPlan={selectedPlan}
          onSuccess={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
            navigate('/app');
          }}
        />
      )}
    </div>
  );
};

export default EnhancedIndex;
