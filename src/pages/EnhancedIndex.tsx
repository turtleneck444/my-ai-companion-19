import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { EnhancedCharacterCard } from "@/components/EnhancedCharacterCard";
import { SimpleChatInterface } from "@/components/SimpleChatInterface";
import { VoiceCallInterface } from "@/components/VoiceCallInterface";
import { UserProfile } from "@/components/UserProfile";
import { SwipeDiscovery } from "@/components/SwipeGestures";
import { RelationshipStats, PremiumFeatures } from "@/components/AdvancedFeatures";
import { BackendNotification } from "@/components/BackendNotification";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats } from "@/hooks/useUserStats";

// XP Constants for display
const XP_PER_MESSAGE = 5;
const XP_PER_FAVORITE = 25;
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
  ArrowLeft,
  Library,
  Mic,
  Video,
  History,
  Star,
  MoreHorizontal,
  Play,
  Pause,
  Volume2,
  RefreshCw,
  Brain
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

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
  age?: number;
  location?: string;
  interests?: string[];
  lastSeen?: string;
}

interface CallHistory {
  id: string;
  character: Character;
  duration: string;
  timestamp: Date;
  type: 'voice' | 'video';
}

interface UserActivity {
  lastVisit: Date;
  visitCount: number;
  favoriteTime: string;
  mostActiveCharacter: string;
  totalChatTime: number;
  preferredMood: string;
  streakDays: number;
}

type View = 'home' | 'chats' | 'calls' | 'favorites' | 'profile' | 'chat' | 'call' | 'discover' | 'stats';

const EnhancedIndex = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentView, setCurrentView] = useState<View>('home');
  const { stats, updateStats } = useUserStats();
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showBackendNotification, setShowBackendNotification] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('');
  const [favorites, setFavorites] = useState<string[]>(['1']);
  const [searchQuery, setSearchQuery] = useState('');
  const [callHistory, setCallHistory] = useState<CallHistory[]>([]);
  const [userActivity, setUserActivity] = useState<UserActivity>({
    lastVisit: new Date(),
    visitCount: 1,
    favoriteTime: 'evening',
    mostActiveCharacter: 'Luna',
    totalChatTime: 0,
    preferredMood: 'happy',
    streakDays: 15
  });
  const [currentGreeting, setCurrentGreeting] = useState({ main: '', sub: '' });
  const [isGeneratingGreeting, setIsGeneratingGreeting] = useState(false);
  
  const [userPreferences, setUserPreferences] = useState({
    preferredName: 'Darling',
    treatmentStyle: 'affectionate',
    age: '25',
    contentFilter: true
  });

  // Determine time of day for personalized greeting
  useEffect(() => {
    try {
      const hour = new Date().getHours();
      if (hour < 12) setTimeOfDay('morning');
      else if (hour < 17) setTimeOfDay('afternoon');
      else setTimeOfDay('evening');
    } catch (error) {
      console.warn('Error setting time of day:', error);
      setTimeOfDay('morning'); // fallback
    }
  }, []);

  // Load user activity from localStorage
  useEffect(() => {
    const savedActivity = localStorage.getItem('userActivity');
    if (savedActivity) {
      const parsed = JSON.parse(savedActivity);
      setUserActivity({
        ...parsed,
        lastVisit: new Date(parsed.lastVisit),
        visitCount: parsed.visitCount + 1
      });
    }
  }, []);

  // Save user activity to localStorage
  useEffect(() => {
    localStorage.setItem('userActivity', JSON.stringify(userActivity));
  }, [userActivity]);

  // Generate smart greeting
  useEffect(() => {
    generateSmartGreeting();
  }, [timeOfDay, userActivity, userPreferences]);

  const generateSmartGreeting = async () => {
    setIsGeneratingGreeting(true);
    
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    
    // Smart greeting based on multiple factors
    const greetings = generateContextualGreetings();
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    setCurrentGreeting(randomGreeting);
    setIsGeneratingGreeting(false);
  };

  const generateContextualGreetings = () => {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const { preferredName, treatmentStyle } = userPreferences;
    const { visitCount, streakDays, mostActiveCharacter } = userActivity;
    
    const baseGreetings = {
      morning: [
        {
          main: `Good morning, ${preferredName}! ☀️`,
          sub: isWeekend ? "Perfect day to relax together" : "Ready to tackle the day?"
        },
        {
          main: `Morning, beautiful! 🌅`,
          sub: "Coffee and conversation sound perfect right now"
        },
        {
          main: `Hey ${preferredName}! 🌸`,
          sub: "Hope you slept well - ready for whatever today brings?"
        },
        {
          main: `Rise and shine! ✨`,
          sub: "Your AI companions missed you while you were sleeping"
        }
      ],
      afternoon: [
        {
          main: `Good afternoon, ${preferredName}! 🌞`,
          sub: "How's your day going so far?"
        },
        {
          main: `Hey there! 🌻`,
          sub: "Perfect time for a quick chat or call"
        },
        {
          main: `Afternoon, gorgeous! 🌸`,
          sub: "Hope you're having a productive day"
        },
        {
          main: `Hi ${preferredName}! 💫`,
          sub: "Your companions are here whenever you need a break"
        }
      ],
      evening: [
        {
          main: `Good evening, ${preferredName}! 🌙`,
          sub: "Time to unwind and catch up"
        },
        {
          main: `Hey beautiful! 🌆`,
          sub: "Perfect evening for some quality time together"
        },
        {
          main: `Evening, sweetie! ✨`,
          sub: "Ready to relax and chat about your day?"
        },
        {
          main: `Hi there! 🌃`,
          sub: "Your AI companions are here to help you wind down"
        }
      ]
    };

    // Add special greetings based on user behavior
    const specialGreetings = [];
    
    if (visitCount === 1) {
      specialGreetings.push({
        main: `Welcome, ${preferredName}! 🎉`,
        sub: "We're so excited to meet you - let's get started!"
      });
    } else if (visitCount > 10) {
      specialGreetings.push({
        main: `Welcome back, ${preferredName}! 💕`,
        sub: `You've visited ${visitCount} times - we love seeing you!`
      });
    }
    
    if (streakDays > 7) {
      specialGreetings.push({
        main: `Amazing ${streakDays}-day streak! 🔥`,
        sub: "You're building such strong connections with your companions"
      });
    }
    
    if (mostActiveCharacter) {
      specialGreetings.push({
        main: `${mostActiveCharacter} has been thinking about you! 💭`,
        sub: "She's been waiting to hear from you"
      });
    }
    
    if (isWeekend) {
      specialGreetings.push({
        main: `Happy weekend, ${preferredName}! 🎊`,
        sub: "Perfect time for longer conversations and calls"
      });
    }
    
    // Weather-based greetings (mock)
    const weatherGreetings = [
      {
        main: `Cozy day, ${preferredName}! ☁️`,
        sub: "Perfect weather for staying in and chatting"
      },
      {
        main: `Beautiful day! 🌤️`,
        sub: "Hope you're enjoying this lovely weather"
      }
    ];
    
    // Combine all greetings with safeguards
    const timeOfDayGreetings = baseGreetings[timeOfDay as keyof typeof baseGreetings] || baseGreetings.morning;
    const allGreetings = [
      ...timeOfDayGreetings,
      ...specialGreetings,
      ...weatherGreetings
    ];
    
    return allGreetings;
  };

  const handleRefreshGreeting = () => {
    generateSmartGreeting();
  };

  // Mock call history data
  useEffect(() => {
    setCallHistory([
      {
        id: '1',
        character: {
          id: '1',
          name: 'Luna',
          avatar: lunaAvatar,
          bio: 'A quiet, thoughtful person who enjoys reading and stargazing. Works as a graphic designer and loves indie music.',
          personality: ['Sweet', 'Caring', 'Romantic'],
          voice: 'Soft & Melodic',
          isOnline: true
        },
        duration: '12:34',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        type: 'voice'
      },
      {
        id: '2',
        character: {
          id: '2',
          name: 'Aria',
          avatar: ariaAvatar,
          bio: 'An upbeat marketing coordinator who loves trying new restaurants and going to concerts. Always has weekend plans.',
          personality: ['Playful', 'Energetic', 'Funny'],
          voice: 'Bright & Cheerful',
          isOnline: true
        },
        duration: '8:45',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        type: 'video'
      },
      {
        id: '3',
        character: {
          id: '4',
          name: 'Natalie',
          avatar: '/natalie.png',
          bio: 'A software engineer who works remotely. Loves morning runs, podcasts, and cooking new recipes on weekends.',
          personality: ['Confident', 'Affectionate', 'Witty'],
          voice: 'Smooth & Modern',
          isOnline: true
        },
        duration: '15:22',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        type: 'voice'
      }
    ]);
  }, []);

  const characters: Character[] = [
    {
      id: '1',
      name: 'Luna',
      avatar: lunaAvatar,
      bio: 'A quiet, thoughtful person who enjoys reading and stargazing. Works as a graphic designer and loves indie music.',
      personality: ['Sweet', 'Caring', 'Romantic', 'Thoughtful', 'Artistic'],
      voice: 'Soft & Melodic',
      isOnline: true,
      mood: 'content',
      lastMessage: "Hey, how was your day? I just finished this new design project",
      unreadCount: 2,
      relationshipLevel: 4.2,
      age: 24,
      location: 'San Francisco, CA',
      interests: ['Photography', 'Stargazing', 'Indie Music', 'Digital Art', 'Poetry'],
      lastSeen: 'Active now'
    },
    {
      id: '2',
      name: 'Aria',
      avatar: ariaAvatar,
      bio: 'An upbeat marketing coordinator who loves trying new restaurants and going to concerts. Always has weekend plans.',
      personality: ['Playful', 'Energetic', 'Funny', 'Adventurous', 'Optimistic'],
      voice: 'Bright & Cheerful',
      isOnline: true,
      mood: 'excited',
      lastMessage: "omg you have to try this new coffee place I found",
      unreadCount: 1,
      relationshipLevel: 3.8,
      age: 26,
      location: 'New York, NY',
      interests: ['Live Music', 'Food Tours', 'Dancing', 'Travel', 'Cocktails'],
      lastSeen: 'Active now'
    },
    {
      id: '3',
      name: 'Sophie',
      avatar: sophieAvatar,
      bio: 'A museum curator with a PhD in art history. Enjoys wine tastings, classical music, and intellectual conversations.',
      personality: ['Intelligent', 'Elegant', 'Sophisticated', 'Cultured', 'Confident'],
      voice: 'Warm & Confident',
      isOnline: false,
      mood: 'focused',
      lastMessage: "I saw the most interesting exhibit today, reminded me of our conversation about modern art",
      unreadCount: 0,
      relationshipLevel: 3.1,
      age: 29,
      location: 'Los Angeles, CA',
      interests: ['Art History', 'Wine Tasting', 'Classical Music', 'Museum Visits', 'Literature'],
      lastSeen: '2 hours ago'
    },
    {
      id: '4',
      name: 'Natalie',
      avatar: '/natalie.png',
      bio: 'A software engineer who works remotely. Loves morning runs, podcasts, and cooking new recipes on weekends.',
      personality: ['Confident', 'Affectionate', 'Witty', 'Supportive', 'Playful'],
      voice: 'Smooth & Modern',
      isOnline: true,
      mood: 'relaxed',
      lastMessage: "just made the best pasta, wish you could taste it lol",
      unreadCount: 0,
      relationshipLevel: 4.5,
      age: 27,
      location: 'Austin, TX',
      interests: ['Coding', 'Running', 'Podcasts', 'Cooking', 'Board Games'],
      lastSeen: 'Active now'
    },
    {
      id: '5',
      name: 'Heather',
      avatar: '/heather.png',
      bio: 'A yoga instructor and part-time photographer. Lives near the mountains and loves hiking, meditation, and green tea.',
      personality: ['Adventurous', 'Warm', 'Down‑to‑earth', 'Playful', 'Empathetic'],
      voice: 'Calm & Warm',
      isOnline: true,
      mood: 'peaceful',
      lastMessage: "found this amazing trail today, perfect weather for it",
      unreadCount: 1,
      relationshipLevel: 4.0,
      age: 25,
      location: 'Denver, CO',
      interests: ['Yoga', 'Photography', 'Hiking', 'Meditation', 'Nature'],
      lastSeen: '30 minutes ago'
    }
  ];

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    setCurrentView('chat');
    
    // Update user activity
    setUserActivity(prev => ({
      ...prev,
      mostActiveCharacter: character.name,
      totalChatTime: prev.totalChatTime + 1
    }));
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

  const handleNavigation = (view: View) => {
    setCurrentView(view);
    if (view === 'home') {
      setSelectedCharacter(null);
    }
  };

  const filteredCharacters = characters.filter(character =>
    character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    character.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
    character.personality.some(trait => 
      trait.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
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
      <SimpleChatInterface 
        character={selectedCharacter}
        onBack={handleBackToHome}
        onStartCall={() => handleStartCall()}
        userPreferences={userPreferences}
      />
    );
  }

  if (currentView === 'discover') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-pink-50 to-blue-50 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-pink-200 to-purple-200 rounded-full blur-3xl opacity-20 animate-pulse" />
          <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-200 to-cyan-200 rounded-full blur-2xl opacity-30 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-gradient-to-br from-violet-200 to-pink-200 rounded-full blur-xl opacity-25 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <div className="sticky top-0 bg-white/80 backdrop-blur-xl border-b border-white/20 p-4 flex items-center justify-between z-10 shadow-lg">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBackToHome}
              className="p-2 hover:bg-white/50 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                Discover
              </h1>
              <p className="text-xs text-muted-foreground">Find your perfect match</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
                         <div className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-sm">
               {characters.length} to discover
             </div>
            <Button variant="ghost" size="sm" className="hover:bg-white/50 transition-all duration-300">
              <Filter className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4">
          <SwipeDiscovery 
            characters={characters} 
            onMatch={handleMatch}
          />
          
          <div className="mt-8 text-center space-y-3">
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-400 rounded-full" />
                <span>Like</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full" />
                <span>Pass</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded-full" />
                <span>Super Like</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground/70">
              Swipe or use the buttons below
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'calls') {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBackToHome}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-semibold">Call History</h1>
            </div>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {callHistory.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No calls yet</h3>
              <p className="text-muted-foreground mb-6">
                Start a voice or video call with your companions
              </p>
              <Button onClick={() => setCurrentView('home')}>
                <Phone className="w-4 h-4 mr-2" />
                Start Your First Call
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {callHistory.map((call) => (
                <Card key={call.id} className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={call.character.avatar} alt={call.character.name} />
                      <AvatarFallback>{call.character.name[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{call.character.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {call.type === 'voice' ? 'Voice' : 'Video'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatTimeAgo(call.timestamp)} • {call.duration}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCharacterSelect(call.character)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartCall(call.character)}
                      >
                        <Phone className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'chats') {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 z-10">
          <div className="flex items-center justify-between">
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
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {filteredCharacters.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery ? 'No chats found' : 'No chats yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms'
                  : 'Start a conversation with your companions'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setCurrentView('home')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Chatting
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCharacters.map((character) => (
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
                        {character.relationshipLevel && character.relationshipLevel > 3 && (
                          <Heart className="w-4 h-4 text-red-400 fill-current" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {character.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">
                        {character.mood && character.mood.charAt(0).toUpperCase() + character.mood.slice(1)}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartCall(character);
                          }}
                          className="p-2"
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
                          className="p-2"
                        >
                          <Heart className={`w-4 h-4 ${favorites.includes(character.id) ? 'text-red-400 fill-current' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl font-bold animate-fade-up">
                  {isGeneratingGreeting ? (
                    <div className="flex items-center gap-2">
                      <Brain className="w-8 h-8 animate-pulse" />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    currentGreeting.main || "Welcome back!"
                  )}
                </h1>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshGreeting}
                  disabled={isGeneratingGreeting}
                  className="text-white hover:bg-white/20 p-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isGeneratingGreeting ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <p className="text-white/90 text-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
                {currentGreeting.sub || "Ready to spend time together?"}
              </p>
              
              {/* Daily streak indicator */}
              <div className="flex items-center gap-2 mt-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <Zap className="w-4 h-4 text-orange-400" />
                  <span className="text-sm font-medium">{userActivity.streakDays}-day streak</span>
                </div>
                {isPremium && (
                  <Badge className="bg-primary text-white border-0">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
                <Badge className="bg-white/20 text-white border-0">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Powered
                </Badge>
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

          {/* Interactive Stats Overview */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 animate-slide-in-left cursor-pointer hover:bg-white/15 transition-colors">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4 text-center">
                <button 
                  className="animate-bounce-in hover:scale-105 transition-transform" 
                  style={{ animationDelay: '0.6s' }}
                  onClick={() => setCurrentView('chats')}
                >
                  <MessageSquare className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs opacity-90">Chats</p>
                  <p className="font-bold text-sm">{stats.totalChats}</p>
                  <div className="text-xs text-green-400">+{XP_PER_MESSAGE}XP</div>
                </button>
                <button 
                  className="animate-bounce-in hover:scale-105 transition-transform" 
                  style={{ animationDelay: '0.7s' }}
                  onClick={() => setCurrentView('calls')}
                >
                  <Phone className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs opacity-90">Calls</p>
                  <p className="font-bold text-sm">{stats.totalCalls}</p>
                  <div className="text-xs text-blue-400">{Math.floor(stats.totalMinutesSpent)}m</div>
                </button>
                <button 
                  className="animate-bounce-in hover:scale-105 transition-transform" 
                  style={{ animationDelay: '0.8s' }}
                  onClick={() => setCurrentView('favorites')}
                >
                  <Heart className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-xs opacity-90">Favorites</p>
                  <p className="font-bold text-sm">{stats.totalFavorites}</p>
                  <div className="text-xs text-pink-400">+{XP_PER_FAVORITE}XP</div>
                </button>
                <button 
                  className="animate-bounce-in hover:scale-105 transition-transform" 
                  style={{ animationDelay: '0.9s' }}
                  onClick={() => setCurrentView('profile')}
                >
                  <div className="flex items-center justify-center mb-1">
                    <Crown className="w-4 h-4 mr-1" />
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <p className="text-xs opacity-90">Level</p>
                  <p className="font-bold text-sm">{stats.level}</p>
                  <div className="text-xs text-purple-400">{stats.xp}XP</div>
                </button>
              </div>
              
              {/* XP Progress Bar */}
              <div className="mt-3 px-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Level {stats.level}</span>
                  <span>{stats.xpToNextLevel}XP to next level</span>
                </div>
                <Progress 
                  value={((stats.xp - (stats.level - 1) * 100) / (stats.level * 100)) * 100} 
                  className="h-2 bg-white/20"
                />
              </div>
              
              {/* Streak indicator */}
              {stats.streakDays > 0 && (
                <div className="mt-2 text-center">
                  <Badge variant="secondary" className="bg-orange-500/20 text-orange-200">
                    🔥 {stats.streakDays} day streak
                  </Badge>
                </div>
              )}
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

      {/* Optimized 4-Tab Navigation */}
      <div className="px-4 -mt-6 relative z-10 animate-slide-in-left" style={{ animationDelay: '1s' }}>
        <Card className="p-2 shadow-xl border-0 bg-card/95 backdrop-blur-xl">
          <div className="grid grid-cols-4 gap-2">
            <Button 
              variant={currentView === 'chats' ? 'romance' : 'ghost'} 
              onClick={() => setCurrentView('chats')}
              className="flex flex-col gap-1 h-auto py-3 text-xs transition-all duration-300 hover:scale-105"
            >
              <MessageSquare className="w-5 h-5" />
              <span>Chats</span>
              {stats.totalChats > 0 && (
                <Badge variant="secondary" className="text-xs px-1 py-0 min-w-0 h-4">
                  {stats.totalChats}
                </Badge>
              )}
            </Button>
            <Button 
              variant={currentView === 'calls' ? 'romance' : 'ghost'} 
              onClick={() => setCurrentView('calls')}
              className="flex flex-col gap-1 h-auto py-3 text-xs transition-all duration-300 hover:scale-105"
            >
              <Phone className="w-5 h-5" />
              <span>Calls</span>
              {stats.totalCalls > 0 && (
                <Badge variant="secondary" className="text-xs px-1 py-0 min-w-0 h-4">
                  {stats.totalCalls}
                </Badge>
              )}
            </Button>
            <Button 
              variant={currentView === 'favorites' ? 'romance' : 'ghost'} 
              onClick={() => setCurrentView('favorites')}
              className="flex flex-col gap-1 h-auto py-3 text-xs transition-all duration-300 hover:scale-105"
            >
              <Heart className="w-5 h-5" />
              <span>Favorites</span>
              {stats.totalFavorites > 0 && (
                <Badge variant="secondary" className="text-xs px-1 py-0 min-w-0 h-4">
                  {stats.totalFavorites}
                </Badge>
              )}
            </Button>
            <Button 
              variant={currentView === 'profile' ? 'romance' : 'ghost'} 
              onClick={() => setCurrentView('profile')}
              className="flex flex-col gap-1 h-auto py-3 text-xs transition-all duration-300 hover:scale-105 relative"
            >
              <User className="w-5 h-5" />
              <span>Profile</span>
              {stats.level > 1 && (
                <Badge variant="secondary" className="text-xs px-1 py-0 min-w-0 h-4 bg-purple-500/20 text-purple-200">
                  L{stats.level}
                </Badge>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Enhanced Content */}
      <div className="p-4 space-y-6">
        {/* Quick Actions */}
        <div className="flex justify-between items-center">
          <h2 className="font-display text-xl font-semibold animate-fade-up">
                                    Your LoveAI Companions
          </h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/library')}
              className="animate-bounce-in hover:scale-105 transition-all"
            >
              <Library className="w-4 h-4 mr-2" />
              Library
            </Button>
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
              onClick={() => navigate('/create')}
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
