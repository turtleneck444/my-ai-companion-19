import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { EnhancedCharacterCard } from "@/components/EnhancedCharacterCard";
import { EnhancedChatInterface } from "@/components/EnhancedChatInterface";
import { VoiceCallInterface } from "@/components/VoiceCallInterface";
import { 
  MessageSquare, 
  Phone, 
  Search,
  Filter,
  Plus,
  ArrowLeft,
  Heart,
  Clock,
  Star,
  Grid3X3,
  List,
  SortAsc,
  MoreVertical,
  Trash2,
  Edit,
  Copy
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: string;
  voice_id?: string;
  isOnline: boolean;
  mood?: string;
  lastMessage?: string;
  unreadCount?: number;
  relationshipLevel?: number;
  createdAt?: string;
  isFavorite?: boolean;
}

type View = 'library' | 'chat' | 'call';
type SortBy = 'name' | 'created' | 'relationship' | 'lastMessage';
type ViewMode = 'grid' | 'list';

const CompanionLibrary = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [currentView, setCurrentView] = useState<View>('library');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load characters from Supabase
  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    if (!isSupabaseConfigured) {
      // Fallback to demo data
      setCharacters(getDemoCharacters());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCharacters = data.map((char: any) => ({
        id: char.id,
        name: char.name,
        avatar: char.avatar_url || '/placeholder.svg',
        bio: char.bio,
        personality: char.personality || [],
        voice: char.voice,
        voice_id: char.voice_id,
        isOnline: true,
        mood: 'happy',
        lastMessage: "Ready to chat! 💕",
        unreadCount: 0,
        relationshipLevel: 1.0,
        createdAt: char.created_at,
        isFavorite: false
      }));

      setCharacters(formattedCharacters);
    } catch (error) {
      console.error('Error loading characters:', error);
      toast({ title: "Error", description: "Failed to load companions" });
      setCharacters(getDemoCharacters());
    } finally {
      setLoading(false);
    }
  };

  const getDemoCharacters = (): Character[] => [
    {
      id: 'demo-1',
      name: 'Luna',
      avatar: '/placeholder.svg',
      bio: 'Sweet and caring with a gentle soul. Luna loves deep conversations and stargazing together.',
      personality: ['Sweet', 'Caring', 'Romantic'],
      voice: 'Soft & Melodic',
      isOnline: true,
      mood: 'loving',
      lastMessage: "I've been thinking about you all day... 💕",
      unreadCount: 3,
      relationshipLevel: 4.2,
      createdAt: new Date().toISOString(),
      isFavorite: true
    }
  ];

  const filteredCharacters = characters.filter(character =>
    character.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    character.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
    character.personality.some(trait => 
      trait.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const sortedCharacters = [...filteredCharacters].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'created':
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      case 'relationship':
        return (b.relationshipLevel || 0) - (a.relationshipLevel || 0);
      case 'lastMessage':
        return b.lastMessage ? 1 : -1;
      default:
        return 0;
    }
  });

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

  const handleBackToLibrary = () => {
    setCurrentView('library');
    setSelectedCharacter(null);
  };

  const handleFavorite = (character: Character) => {
    const newFavorites = favorites.includes(character.id)
      ? favorites.filter(id => id !== character.id)
      : [...favorites, character.id];
    
    setFavorites(newFavorites);
    setCharacters(prev => prev.map(char => 
      char.id === character.id 
        ? { ...char, isFavorite: !char.isFavorite }
        : char
    ));
    
    toast({
      title: character.isFavorite ? "Removed from favorites" : "Added to favorites",
      description: `${character.name} ${character.isFavorite ? 'removed from' : 'added to'} your favorites.`,
    });
  };

  const handleDeleteCharacter = async (character: Character) => {
    if (!isSupabaseConfigured) {
      toast({ title: "Demo mode", description: "Cannot delete in demo mode" });
      return;
    }

    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', character.id);

      if (error) throw error;

      setCharacters(prev => prev.filter(char => char.id !== character.id));
      toast({
        title: "Companion deleted",
        description: `${character.name} has been removed from your library.`,
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete companion" });
    }
  };

  const handleDuplicateCharacter = (character: Character) => {
    const duplicatedCharacter = {
      ...character,
      id: `${character.id}-copy-${Date.now()}`,
      name: `${character.name} (Copy)`,
      createdAt: new Date().toISOString(),
      relationshipLevel: 1.0,
      lastMessage: "Ready to chat! 💕",
      unreadCount: 0
    };

    setCharacters(prev => [duplicatedCharacter, ...prev]);
    toast({
      title: "Companion duplicated",
      description: `${character.name} has been duplicated.`,
    });
  };

  // Render different views
  if (currentView === 'call' && selectedCharacter) {
    return (
      <VoiceCallInterface 
        character={selectedCharacter}
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

  if (currentView === 'chat' && selectedCharacter) {
    return (
      <EnhancedChatInterface 
        character={selectedCharacter}
        onBack={handleBackToLibrary}
        onStartCall={() => handleStartCall()}
        userPreferences={{
          preferredName: 'Darling',
          treatmentStyle: 'affectionate',
          age: '25',
          contentFilter: true
        }}
      />
    );
  }

  // Main library view
  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b p-4 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">My Companions</h1>
              <p className="text-sm text-muted-foreground">
                {characters.length} companion{characters.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button
              variant="romance"
              size="sm"
              onClick={() => navigate('/create')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
          </div>
        </div>

        {/* Search and Controls */}
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search companions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {showFilters && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <SortAsc className="w-4 h-4" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="bg-background border rounded px-2 py-1 text-sm"
                >
                  <option value="created">Recently Created</option>
                  <option value="name">Name A-Z</option>
                  <option value="relationship">Relationship Level</option>
                  <option value="lastMessage">Last Message</option>
                </select>
              </div>
              
              <div className="flex items-center gap-1 ml-auto">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="p-2"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="p-2"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading your companions...</p>
            </div>
          </div>
        ) : sortedCharacters.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? 'No companions found' : 'No companions yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery 
                ? 'Try adjusting your search terms'
                : 'Create your first AI companion to get started'
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Companion
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
            : 'space-y-4'
          }>
            {sortedCharacters.map((character) => (
              <div key={character.id} className="relative group">
                <EnhancedCharacterCard
                  character={character}
                  onSelect={handleCharacterSelect}
                  onStartCall={handleStartCall}
                  onFavorite={handleFavorite}
                  isFavorite={character.isFavorite || false}
                  variant={viewMode === 'grid' ? 'compact' : 'list'}
                />
                
                {/* Character Actions Menu */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicateCharacter(character)}
                      className="p-2 h-8 w-8 bg-background/80 hover:bg-background"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCharacter(character)}
                      className="p-2 h-8 w-8 bg-background/80 hover:bg-background text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanionLibrary;
