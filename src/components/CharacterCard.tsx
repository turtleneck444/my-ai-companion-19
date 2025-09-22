import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Phone } from "lucide-react";

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: string;
  isOnline: boolean;
}

interface CharacterCardProps {
  character: Character;
  onSelect: (character: Character) => void;
  onStartCall: (character: Character) => void;
}

export const CharacterCard = ({ character, onSelect, onStartCall }: CharacterCardProps) => {
  return (
    <Card className="overflow-hidden shadow-romance transition-smooth hover:shadow-glow border-0 bg-card/80 backdrop-blur-sm">
      <div className="relative">
        <img
          src={character.avatar}
          alt={character.name}
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-3 right-3">
          <div className={`w-3 h-3 rounded-full ${character.isOnline ? 'bg-green-400' : 'bg-muted-foreground'} shadow-sm`} />
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
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={() => onSelect(character)}
            className="flex-1"
            variant="romance"
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
          <Button
            onClick={() => onStartCall(character)}
            variant="outline"
            className="px-3 border-primary/20 hover:bg-primary/10 transition-smooth"
          >
            <Phone className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};