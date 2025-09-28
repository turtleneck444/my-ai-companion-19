import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { EnhancedCharacterCard } from "@/components/EnhancedCharacterCard";
import { SimpleChatInterface } from "@/components/SimpleChatInterface";
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
  MoreVertical,
  Trash2,
  Edit,
  Settings
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

const CompanionLibrary = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showVoiceCall, setShowVoiceCall] = useState(false);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading characters:', error);
        toast({ title: "Error", description: "Failed to load companions" });
        return;
      }

      const formattedCharacters = data.map(char => ({
        id: char.id,
        name: char.name,
        avatar: char.avatar_url || '/placeholder.svg',
        bio: char.description || '',
        personality: char.personality ? char.personality.split(',') : [],
        voice: char.voice || 'default',
        voice_id: char.voice_id,
        isOnline: true,
        mood: 'happy',
        lastMessage: 'Ready to chat!',
        unreadCount: 0,
        relationshipLevel: 1.0,
        createdAt: char.created_at,
        isFavorite: false
      }));

      setCharacters(formattedCharacters);
    } catch (error) {
      console.error('Error loading characters:', error);
      toast({ title: "Error", description: "Failed to load companions" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId);

      if (error) {
        console.error('Error deleting character:', error);
        toast({ title: "Error", description: "Failed to delete character" });
        return;
      }

      setCharacters(prev => prev.filter(char => char.id !== characterId));
      toast({ title: "Success", description: "Character deleted successfully" });
    } catch (error) {
      console.error('Error deleting character:', error);
      toast({ title: "Error", description: "Failed to delete character" });
    }
  };

  useEffect(() => {
    loadCharacters();
  }, []);

  const filteredCharacters = characters.filter(character =>
    character.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    character.bio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (showChat && selectedCharacter) {
    return (
      <SimpleChatInterface
        character={selectedCharacter}
        onBack={() => {
          setShowChat(false);
          setSelectedCharacter(null);
        }}
        onStartCall={() => {
          setShowVoiceCall(true);
        }}
      />
    );
  }

  if (showVoiceCall && selectedCharacter) {
    return (
      <VoiceCallInterface
        character={selectedCharacter}
        onEndCall={() => {
          setShowVoiceCall(false);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Companions</h1>
            <p className="text-gray-600">Manage your AI companions and create new ones</p>
          </div>
          <Button onClick={() => navigate("/create")} className="bg-pink-600 hover:bg-pink-700">
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </Button>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search companions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          </div>
        ) : filteredCharacters.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No companions found' : 'No companions yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ? 'Try adjusting your search terms' : 'Create your first AI companion to get started'}
            </p>
            {!searchTerm && (
              <Button onClick={() => navigate("/create")} className="bg-pink-600 hover:bg-pink-700">
                Create Your First Companion
              </Button>
            )}
          </div>
        ) : (
          <div className={viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
            : "space-y-4"
          }>
            {filteredCharacters.map((character) => (
              <EnhancedCharacterCard
                key={character.id}
                character={character}
                onSelect={() => {
                  setSelectedCharacter(character);
                  setShowChat(true);
                }}
                onDelete={() => handleDeleteCharacter(character.id)}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default CompanionLibrary;
