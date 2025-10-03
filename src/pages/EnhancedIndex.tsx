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
  }
];

export const EnhancedIndex = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<View>('home');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [characters, setCharacters] = useState<Character[]>(CHARACTERS);
  const [dbCharacters, setDbCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  const { 
    messagesUsed, 
    voiceCallsUsed, 
    plan, 
    remainingMessages, 
    remainingVoiceCalls,
    canSendMessage,
    canMakeVoiceCall,
    loading: usageLoading 
  } = useSupabaseUsageTracking();

  // Load database characters
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        const { data, error } = await supabase
          .from('characters')
          .select('*')
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading characters:', error);
          return;
        }

        const formattedCharacters = data.map((char: any) => ({
          id: char.id,
          name: char.name,
          avatar: char.avatar_url || '/placeholder-avatar.jpg',
          bio: char.description || char.bio || 'A wonderful AI companion',
          personality: char.personality_traits || char.personality || ['Friendly', 'Caring'],
          voice: { voice_id: char.voice_id || 'default', name: 'Default Voice' },
          isOnline: true,
          mood: 'happy',
          lastMessage: 'Hello! How are you today?',
          unreadCount: 0,
          relationshipLevel: 4.0,
          voiceId: char.voice_id || 'EXAVITQu4vr4xnSDxMaL'
        }));

        console.log('Loaded database characters:', formattedCharacters);
        setDbCharacters(formattedCharacters);
      } catch (error) {
        console.error('Unexpected error loading characters:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCharacters();
  }, []);

  const allCharacters = useMemo(() => {
    return [...CHARACTERS, ...dbCharacters];
  }, [dbCharacters]);

  const filteredCharacters = useMemo(() => {
    if (!searchQuery.trim()) return allCharacters;
    
    return allCharacters.filter(character => 
      character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      character.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
      character.personality.some(trait => 
        trait.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [allCharacters, searchQuery]);

  const handleCharacterSelect = useCallback((character: Character) => {
    setSelectedCharacter(character);
    setView('chat');
  }, []);

  const handleStartCall = useCallback(() => {
    if (!selectedCharacter) return;
    setIsCallActive(true);
    setView('call');
  }, [selectedCharacter]);

  const handleEndCall = useCallback(() => {
    setIsCallActive(false);
    setView('chat');
  }, []);

  const handleBack = useCallback(() => {
    if (view === 'call') {
      setView('chat');
    } else if (view === 'chat') {
      setView('home');
      setSelectedCharacter(null);
    } else {
      setView('home');
    }
  }, [view]);

  const handleUpgrade = useCallback((planId: string) => {
    setSelectedPlan(planId);
    setShowPaymentModal(true);
  }, []);

  const handlePaymentSuccess = useCallback((plan: string) => {
    setShowPaymentModal(false);
    setSelectedPlan('');
    toast({
      title: "Upgrade Successful!",
      description: `Welcome to ${getPlanById(plan).name}!`,
    });
  }, [toast]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [signOut, navigate]);

  // Handle preselected plan from URL
  useEffect(() => {
    const plan = searchParams.get('plan');
    if (plan) {
      handleUpgrade(plan);
    }
  }, [searchParams, handleUpgrade]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Please Sign In</h2>
            <p className="text-muted-foreground mb-6">
              You need to be signed in to access the app.
            </p>
            <Button onClick={() => navigate('/auth')} className="w-full">
              Go to Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (view === 'profile') {
    return <UserProfile />;
  }

  if (view === 'chat' && selectedCharacter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <SimpleChatInterface
          character={selectedCharacter}
          onBack={handleBack}
          onStartCall={handleStartCall}
        />
      </div>
    );
  }

  if (view === 'call' && selectedCharacter) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
        <VoiceCallInterface
          character={selectedCharacter}
          onEndCall={handleEndCall}
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 relative overflow-hidden">
      {/* Cloud Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-200/30 to-cyan-200/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-gradient-to-br from-violet-200/30 to-pink-200/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-gradient-to-br from-indigo-200/20 to-blue-200/20 rounded-full blur-lg animate-pulse" style={{ animationDelay: '3s' }} />
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-to-br from-purple-200/25 to-pink-200/25 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 bg-white/80 backdrop-blur-md border-b border-pink-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => setView('home')}
                className="text-2xl font-bold font-display text-pink-600 hover:text-pink-700"
              >
                LoveAI
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => setView('profile')}
                className="text-gray-700 hover:text-pink-600"
              >
                <User className="w-5 h-5 mr-2" />
                Profile
              </Button>
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="text-gray-700 hover:text-red-600"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'home' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold font-display text-white mb-4 drop-shadow-lg">
                Welcome back! ✨
              </h1>
              <p className="text-xl text-white/90 mb-6 drop-shadow-md">
                Ready for some quality time together?
              </p>
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-white/90 font-medium">Online Now</span>
              </div>
            </div>

            {/* Stats Card */}
            <Card className="bg-gradient-to-br from-pink-600/90 via-purple-600/90 to-rose-600/90 backdrop-blur-xl border-pink-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-pink-600/25 via-rose-600/20 to-purple-600/15" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
              <CardContent className="relative p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Hey {user.user_metadata?.full_name || 'there'}! 👋
                    </h2>
                    <p className="text-white/80">Your companions missed you</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-white/80 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                      {getPlanById(plan).name}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">
                      {filteredCharacters.length}
                    </div>
                    <div className="text-white/80 text-sm">AVAILABLE</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">
                      {allCharacters.filter(c => c.relationshipLevel && c.relationshipLevel > 4).length}
                    </div>
                    <div className="text-white/80 text-sm">FAVORITES</div>
                  </div>
                  <div className="text-center">
                    <div className="text-white/80 text-sm mb-2">USAGE TODAY</div>
                    <div className="text-white text-sm">
                      Messages left: {remainingMessages === -1 ? '∞' : remainingMessages}
                    </div>
                    <div className="text-white text-sm">
                      Calls left: {remainingVoiceCalls === -1 ? '∞' : remainingVoiceCalls}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Search */}
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search companions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white/90 backdrop-blur-sm border-pink-200/50 focus:border-pink-400"
                />
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            {/* Characters Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCharacters.map((character, index) => (
                <Card
                  key={character.id}
                  onClick={() => handleCharacterSelect(character)}
                  className="group overflow-hidden bg-white/90 backdrop-blur-xl border-pink-200/50 hover:border-pink-400/50 transition-all duration-500 cursor-pointer shadow-lg hover:shadow-2xl animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-sm group-hover:blur-md transition-all duration-300" />
                        <Avatar className="relative w-16 h-16">
                          <AvatarImage src={character.avatar} alt={character.name} />
                          <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-semibold">
                            {character.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {character.isOnline && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white" />
                        )}
                        {character.unreadCount && character.unreadCount > 0 && (
                          <Badge className="absolute -bottom-2 -right-2 bg-gradient-to-r from-pink-500 to-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center animate-bounce">
                            {character.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-pink-600 transition-colors">
                          {character.name}
                        </h3>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs">
                            {character.mood}
                          </Badge>
                          {character.relationshipLevel && (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < Math.floor(character.relationshipLevel!)
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {character.lastMessage}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">
                        {character.personality.slice(0, 2).map((trait, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="text-xs bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 transition-all duration-300"
                          >
                            {trait}
                          </Button>
                        ))}
                      </div>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Create New Button */}
            <div className="text-center">
              <Button
                onClick={() => navigate('/create')}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Companion
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
          plan={selectedPlan}
        />
      )}
    </div>
  );
};
