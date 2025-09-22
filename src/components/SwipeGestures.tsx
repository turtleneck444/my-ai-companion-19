import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Star, MessageCircle } from "lucide-react";

interface SwipeableCardProps {
  character: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    personality: string[];
  };
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onSuperLike: (id: string) => void;
  children?: React.ReactNode;
}

export const SwipeableCard = ({ 
  character, 
  onLike, 
  onDislike, 
  onSuperLike,
  children 
}: SwipeableCardProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartPos({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.touches[0].clientX - startPos.x;
    const deltaY = e.touches[0].clientY - startPos.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const threshold = 100;
    const { x, y } = dragOffset;
    
    if (Math.abs(x) > threshold) {
      if (x > 0) {
        onLike(character.id);
      } else {
        onDislike(character.id);
      }
    } else if (y < -threshold) {
      onSuperLike(character.id);
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const getRotation = () => {
    return dragOffset.x * 0.1;
  };

  const getOpacity = () => {
    const distance = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2);
    return Math.max(0.7, 1 - distance / 200);
  };

  return (
    <div className="relative w-full h-[500px] perspective-1000">
      <Card
        ref={cardRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing transition-all duration-200 overflow-hidden border-0 shadow-xl"
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${getRotation()}deg)`,
          opacity: getOpacity(),
          zIndex: isDragging ? 10 : 1
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-full">
          <img
            src={character.avatar}
            alt={character.name}
            className="w-full h-full object-cover"
          />
          
          {/* Swipe indicators */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
            dragOffset.x > 50 ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="bg-green-500/90 text-white px-8 py-4 rounded-lg font-bold text-2xl transform rotate-12 animate-bounce">
              LIKE
            </div>
          </div>
          
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
            dragOffset.x < -50 ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="bg-red-500/90 text-white px-8 py-4 rounded-lg font-bold text-2xl transform -rotate-12 animate-bounce">
              PASS
            </div>
          </div>
          
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
            dragOffset.y < -50 ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="bg-blue-500/90 text-white px-6 py-3 rounded-lg font-bold text-xl animate-pulse-glow">
              <Star className="w-6 h-6 mx-auto mb-2 fill-current" />
              SUPER LIKE
            </div>
          </div>
          
          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
            <h3 className="font-display font-bold text-2xl mb-2">{character.name}</h3>
            <p className="text-sm opacity-90 mb-3 line-clamp-2">{character.bio}</p>
            
            <div className="flex flex-wrap gap-2">
              {character.personality.slice(0, 3).map((trait) => (
                <Badge key={trait} className="bg-white/20 text-white border-0 text-xs">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Action buttons */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-4 z-20">
        <Button
          variant="outline"
          size="lg"
          onClick={() => onDislike(character.id)}
          className="w-14 h-14 rounded-full border-2 border-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 hover:scale-110"
        >
          <X className="w-6 h-6" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => onSuperLike(character.id)}
          className="w-16 h-16 rounded-full border-2 border-blue-500 hover:bg-blue-500 hover:text-white transition-all duration-300 hover:scale-110"
        >
          <Star className="w-6 h-6" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => onLike(character.id)}
          className="w-14 h-14 rounded-full border-2 border-green-500 hover:bg-green-500 hover:text-white transition-all duration-300 hover:scale-110"
        >
          <Heart className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

interface SwipeDiscoveryProps {
  characters: Array<{
    id: string;
    name: string;
    avatar: string;
    bio: string;
    personality: string[];
  }>;
  onMatch: (characterId: string) => void;
}

export const SwipeDiscovery = ({ characters, onMatch }: SwipeDiscoveryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<string[]>([]);

  const handleLike = (id: string) => {
    setMatches(prev => [...prev, id]);
    onMatch(id);
    nextCharacter();
  };

  const handleDislike = (id: string) => {
    nextCharacter();
  };

  const handleSuperLike = (id: string) => {
    setMatches(prev => [...prev, id]);
    onMatch(id);
    nextCharacter();
  };

  const nextCharacter = () => {
    setCurrentIndex(prev => Math.min(prev + 1, characters.length - 1));
  };

  if (currentIndex >= characters.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-center animate-fade-in">
        <div className="mb-6">
          <Heart className="w-16 h-16 text-primary mx-auto mb-4 animate-heart-beat" />
          <h3 className="font-display text-2xl mb-2">No more profiles!</h3>
          <p className="text-muted-foreground">Check back later for new characters</p>
        </div>
        <Badge className="bg-primary text-white">
          {matches.length} matches found
        </Badge>
      </div>
    );
  }

  return (
    <div className="relative">
      <SwipeableCard
        character={characters[currentIndex]}
        onLike={handleLike}
        onDislike={handleDislike}
        onSuperLike={handleSuperLike}
      />
      
      {/* Next card preview */}
      {currentIndex + 1 < characters.length && (
        <Card className="absolute inset-0 -z-10 transform scale-95 opacity-50 border-0">
          <img
            src={characters[currentIndex + 1].avatar}
            alt={characters[currentIndex + 1].name}
            className="w-full h-full object-cover rounded-lg"
          />
        </Card>
      )}
    </div>
  );
};