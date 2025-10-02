import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone, Star, User } from "lucide-react";

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: string;
  isOnline: boolean;
  is_custom?: boolean; // Add custom character flag
  user_id?: string; // Add user_id to identify custom characters
}

interface CharacterCardProps {
  character: Character;
  onSelect: (character: Character) => void;
  onStartCall: (character: Character) => void;
  currentUserId?: string; // Add current user ID to check if it's their custom character
}

export const CharacterCard = ({ character, onSelect, onStartCall, currentUserId }: CharacterCardProps) => {
  // Determine if this is a custom character
  const isCustomCharacter = character.is_custom || (character.user_id && character.user_id === currentUserId);
  
  return (
    <Card className="overflow-hidden shadow-romance transition-smooth hover:shadow-glow border-0 bg-card/80 backdrop-blur-sm">
      <div className="relative">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <div className={`w-3 h-3 rounded-full ${character.isOnline ? 'bg-green-400' : 'bg-muted-foreground'} shadow-sm`} />
          {isCustomCharacter && (
            <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm">
              <Star className="w-3 h-3 mr-1" />
              Custom
            </Badge>
          )}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg">{character.name}</h3>
          <p className="text-white/80 text-sm">{character.voice} voice</p>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <p className="text-muted-foreground text-sm leading-relaxed">{character.bio}</p>
        
        <div className="flex flex-wrap gap-1">
          {character.personality.slice(0, 3).map((trait) => (
            <Badge key={trait} variant="secondary" className="text-xs">
              {trait}
            </Badge>
          ))}
          {isCustomCharacter && (
            <Badge variant="outline" className="text-xs border-purple-300 text-purple-600">
              <User className="w-3 h-3 mr-1" />
              Your Creation
            </Badge>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => onSelect(character)}
            className="flex-1 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
          <Button
            variant="outline"
            onClick={() => onStartCall(character)}
            className="px-3"
          >
            <Phone className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};
