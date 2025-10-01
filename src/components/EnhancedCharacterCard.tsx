import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Phone, 
  Heart, 
  Star, 
  Zap,
  MoreHorizontal,
  Volume2
} from "lucide-react";

interface Voice {
  voice_id: string;
  name: string;
}

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: Voice;
  isOnline: boolean;
  mood?: string;
  lastMessage?: string;
  unreadCount?: number;
}

interface EnhancedCharacterCardProps {
  character: Character;
  onSelect: (character: Character) => void;
  onStartCall: (character: Character) => void;
  onFavorite: (character: Character) => void;
  isFavorite?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  viewMode?: 'grid' | 'list';
}

export const EnhancedCharacterCard = ({ 
  character, 
  onSelect, 
  onStartCall, 
  onFavorite,
  isFavorite = false,
  variant = 'default'
}: EnhancedCharacterCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(isFavorite);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLiked(!isLiked);
    onFavorite(character);
  };

  if (variant === 'compact') {
    return (
      <Card 
        className="p-4 cursor-pointer transition-all duration-300 hover:shadow-glow border-0 bg-card/80 backdrop-blur-sm animate-fade-in"
        onClick={() => onSelect(character)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar className="w-12 h-12 ring-2 ring-primary/20">
              <AvatarImage src={character.avatar} alt={character.name} />
              <AvatarFallback>{character.name[0]}</AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-background ${
              character.isOnline ? 'bg-green-400' : 'bg-muted-foreground'
            }`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm truncate">{character.name}</h3>
              {character.unreadCount && (
                <Badge variant="destructive" className="text-xs px-1.5 py-0.5 h-5">
                  {character.unreadCount}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {character.lastMessage || character.bio}
            </p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStartCall(character);
            }}
            className="p-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Phone className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    );
  }

  if (variant === 'featured') {
    return (
      <Card 
        className="overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-glow border-0 bg-gradient-to-br from-primary/5 via-card/90 to-accent/5 backdrop-blur-sm group animate-bounce-in"
        onClick={() => onSelect(character)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative h-32 overflow-hidden">
          <img
            src={character.avatar}
            alt={character.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary/90 text-white border-0">
              <Star className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          </div>
          <div className="absolute top-3 right-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                isLiked 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-heart-beat' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
            </Button>
          </div>
          <div className="absolute bottom-3 left-3 text-white">
            <h3 className="font-display font-semibold text-lg">{character.name}</h3>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <Volume2 className="w-3 h-3" />
              <span>{character.voice.name}</span>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {character.bio}
          </p>
          
          <div className="flex flex-wrap gap-1">
            {character.personality.slice(0, 4).map((trait) => (
              <Badge 
                key={trait} 
                variant="secondary" 
                className="text-xs transition-transform hover:scale-105"
              >
                {trait}
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant="romance"
              className="flex-1 transition-all duration-300 hover:scale-105"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              Chat Now
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                onStartCall(character);
              }}
              variant="outline"
              className="px-4 border-primary/20 hover:bg-primary/10 transition-all duration-300 hover:scale-105"
            >
              <Phone className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Card 
      className="overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-glow border-0 bg-card/80 backdrop-blur-sm group animate-fade-up"
      onClick={() => onSelect(character)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        <div className="relative h-48 overflow-hidden">
          <img
            src={character.avatar}
            alt={character.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          
          {/* Online status with pulse */}
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <div className={`relative w-3 h-3 rounded-full ${
              character.isOnline ? 'bg-green-400' : 'bg-muted-foreground'
            }`}>
              {character.isOnline && (
                <div className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" />
              )}
            </div>
            {character.mood && (
              <Badge variant="secondary" className="text-xs bg-white/20 text-white border-0">
                {character.mood}
              </Badge>
            )}
          </div>

          {/* Favorite button */}
          <div className="absolute top-3 left-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleFavorite}
              className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                isLiked 
                  ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                  : 'bg-white/20 text-white hover:bg-white/30 opacity-0 group-hover:opacity-100'
              }`}
            >
              <Heart className={`w-4 h-4 transition-transform ${isLiked ? 'fill-current scale-110' : ''}`} />
            </Button>
          </div>
          
          {/* Character info overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <div className="flex items-end justify-between">
              <div>
                <h3 className="font-display font-semibold text-lg mb-1">{character.name}</h3>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <Volume2 className="w-3 h-3" />
                  <span>{character.voice.name}</span>
                </div>
              </div>
              
              {character.unreadCount && (
                <Badge className="bg-primary text-white animate-pulse-glow">
                  {character.unreadCount}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Quick actions overlay */}
        <div className={`absolute inset-0 bg-black/50 flex items-center justify-center gap-3 transition-all duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <Button 
            variant="romance"
            size="lg"
            className="animate-bounce-in"
            style={{ animationDelay: '0.1s' }}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Chat
          </Button>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onStartCall(character);
            }}
            variant="outline"
            size="lg"
            className="bg-white/10 border-white/30 text-white hover:bg-white/20 animate-bounce-in"
            style={{ animationDelay: '0.2s' }}
          >
            <Phone className="w-5 h-5" />
          </Button>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
          {character.bio}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {character.personality.slice(0, 3).map((trait, index) => (
            <Badge 
              key={trait} 
              variant="secondary" 
              className="text-xs transition-all hover:scale-105 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {trait}
            </Badge>
          ))}
          {character.personality.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{character.personality.length - 3}
            </Badge>
          )}
        </div>
        
        {character.lastMessage && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-xs text-muted-foreground italic">
              "{character.lastMessage}"
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};