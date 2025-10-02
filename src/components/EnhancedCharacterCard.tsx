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
  Volume2,
  User
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
  is_custom?: boolean;
  user_id?: string;
}

interface EnhancedCharacterCardProps {
  character: Character;
  onSelect: (character: Character) => void;
  onStartCall: (character: Character) => void;
  onFavorite: (character: Character) => void;
  isFavorite?: boolean;
  variant?: 'default' | 'compact' | 'featured';
  viewMode?: 'grid' | 'list';
  currentUserId?: string; // Add current user ID
}

export const EnhancedCharacterCard = ({ 
  character, 
  onSelect, 
  onStartCall, 
  onFavorite,
  isFavorite = false,
  variant = 'default',
  viewMode = 'grid',
  currentUserId
}: EnhancedCharacterCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine if this is a custom character
  const isCustomCharacter = character.is_custom || (character.user_id && character.user_id === currentUserId);

  if (viewMode === 'list') {
    return (
      <Card 
        className="p-4 hover:shadow-lg transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onSelect(character)}
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-12 h-12">
              <AvatarImage src={character.avatar} alt={character.name} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                {character.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              character.isOnline ? 'bg-green-400' : 'bg-gray-400'
            }`} />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg truncate">{character.name}</h3>
              {isCustomCharacter && (
                <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  <Star className="w-3 h-3 mr-1" />
                  Custom
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 truncate">{character.bio}</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {character.voice.name}
              </Badge>
              {character.mood && (
                <Badge variant="outline" className="text-xs">
                  {character.mood}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onStartCall(character);
              }}
              className="text-pink-600 hover:text-pink-700"
            >
              <Phone className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(character);
              }}
              className={isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-500"}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={`overflow-hidden transition-all duration-300 cursor-pointer border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl ${
        variant === 'featured' ? 'ring-2 ring-pink-500' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(character)}
    >
      <div className="relative">
        <div className="aspect-square overflow-hidden">
          <img
            src={character.avatar}
            alt={character.name}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          />
        </div>
        
        {/* Online Status */}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <div className={`w-3 h-3 rounded-full border-2 border-white ${
            character.isOnline ? 'bg-green-400' : 'bg-gray-400'
          }`} />
          {isCustomCharacter && (
            <Badge variant="secondary" className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 shadow-sm">
              <Star className="w-3 h-3 mr-1" />
              Custom
            </Badge>
          )}
        </div>
        
        {/* Mood Badge */}
        {character.mood && (
          <div className="absolute top-3 left-3">
            <Badge variant="secondary" className="text-xs bg-white/90 text-gray-700">
              {character.mood}
            </Badge>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
        
        {/* Action Buttons */}
        <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
          <Button
            size="sm"
            className="flex-1 bg-white/90 text-gray-900 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(character);
            }}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            Chat
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="bg-white/90 text-gray-900 hover:bg-white"
            onClick={(e) => {
              e.stopPropagation();
              onStartCall(character);
            }}
          >
            <Phone className="w-4 h-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">{character.name}</h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onFavorite(character);
              }}
              className={isFavorite ? "text-red-500" : "text-gray-400 hover:text-red-500"}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 line-clamp-2">{character.bio}</p>
        
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
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            <span>{character.voice.name}</span>
          </div>
          {character.lastMessage && (
            <span className="truncate max-w-32">{character.lastMessage}</span>
          )}
        </div>
        
        {character.unreadCount && character.unreadCount > 0 && (
          <div className="flex items-center justify-center">
            <Badge variant="destructive" className="text-xs">
              {character.unreadCount} unread
            </Badge>
          </div>
        )}
      </div>
    </Card>
  );
};
