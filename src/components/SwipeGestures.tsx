import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Heart, X, Star, MessageCircle, Sparkles, Zap, Eye, Clock, MapPin } from "lucide-react";

interface SwipeableCardProps {
  character: {
    id: string;
    name: string;
    avatar: string;
    bio: string;
    personality: string[];
    age?: number;
    location?: string;
    interests?: string[];
    isOnline?: boolean;
    lastSeen?: string;
  };
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onSuperLike: (id: string) => void;
  children?: React.ReactNode;
}

// Floating particle animation component
const FloatingParticles = ({ type }: { type: 'like' | 'dislike' | 'super' }) => {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);

  useEffect(() => {
    const newParticles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 8 + 4
    }));
    setParticles(newParticles);
  }, [type]);

  const getParticleColor = () => {
    switch (type) {
      case 'like': return 'bg-emerald-400';
      case 'dislike': return 'bg-red-400';
      case 'super': return 'bg-blue-400';
      default: return 'bg-white';
    }
  };

  const getParticleIcon = () => {
    switch (type) {
      case 'like': return '💖';
      case 'dislike': return '💔';
      case 'super': return '⭐';
      default: return '✨';
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute animate-float-up opacity-0`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.id * 100}ms`,
            fontSize: `${particle.size}px`
          }}
        >
          {getParticleIcon()}
        </div>
      ))}
    </div>
  );
};

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
  const [showParticles, setShowParticles] = useState<'like' | 'dislike' | 'super' | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartPos({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartPos({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.touches[0].clientX - startPos.x;
    const deltaY = e.touches[0].clientY - startPos.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startPos.x;
    const deltaY = e.clientY - startPos.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleEnd = () => {
    if (!isDragging) return;
    
    const threshold = 120;
    const { x, y } = dragOffset;
    
    if (Math.abs(x) > threshold) {
      if (x > 0) {
        setShowParticles('like');
        setTimeout(() => onLike(character.id), 300);
      } else {
        setShowParticles('dislike');
        setTimeout(() => onDislike(character.id), 300);
      }
    } else if (y < -threshold) {
      setShowParticles('super');
      setTimeout(() => onSuperLike(character.id), 300);
    }
    
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  };

  const getRotation = () => {
    return dragOffset.x * 0.08;
  };

  const getOpacity = () => {
    const distance = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2);
    return Math.max(0.8, 1 - distance / 300);
  };

  const getScale = () => {
    const distance = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2);
    return Math.max(0.95, 1 - distance / 800);
  };

  const getSwipeProgress = () => {
    const maxDistance = 150;
    const distance = Math.abs(dragOffset.x);
    return Math.min(distance / maxDistance, 1) * 100;
  };

  const getSuperLikeProgress = () => {
    const maxDistance = 150;
    const distance = Math.abs(dragOffset.y);
    return Math.min(distance / maxDistance, 1) * 100;
  };

  return (
    <div className="relative w-full h-[600px] perspective-1000">
      <Card
        ref={cardRef}
        className="absolute inset-0 cursor-grab active:cursor-grabbing transition-all duration-300 overflow-hidden border-0 shadow-2xl backdrop-blur-sm bg-white/95"
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${getRotation()}deg) scale(${getScale()})`,
          opacity: getOpacity(),
          zIndex: isDragging ? 10 : 1,
          boxShadow: isDragging ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
      >
        <div className="relative h-full group">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0">
            <img
              src={character.avatar}
              alt={character.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          </div>

          {/* Online Status Indicator */}
          {character.isOnline && (
            <div className="absolute top-4 right-4 z-10">
              <div className="flex items-center gap-2 bg-emerald-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Online
              </div>
            </div>
          )}

          {/* Age Badge */}
          {character.age && (
            <div className="absolute top-4 left-4 z-10">
              <Badge className="bg-black/60 backdrop-blur-sm text-white border-0">
                {character.age}
              </Badge>
            </div>
          )}

          {/* Swipe Progress Indicators */}
          {isDragging && Math.abs(dragOffset.x) > 30 && (
            <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2 z-20">
              <div className={`text-center mb-2 font-bold text-lg ${dragOffset.x > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {dragOffset.x > 0 ? 'LIKE' : 'PASS'}
              </div>
              <Progress 
                value={getSwipeProgress()} 
                className={`h-2 bg-white/20 ${dragOffset.x > 0 ? '[&>div]:bg-emerald-400' : '[&>div]:bg-red-400'}`}
              />
            </div>
          )}

          {isDragging && dragOffset.y < -30 && (
            <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2 z-20">
              <div className="text-center mb-2 font-bold text-lg text-blue-400 flex items-center justify-center gap-2">
                <Star className="w-5 h-5 fill-current" />
                SUPER LIKE
              </div>
              <Progress 
                value={getSuperLikeProgress()} 
                className="h-2 bg-white/20 [&>div]:bg-blue-400"
              />
            </div>
          )}

          {/* Floating Particles */}
          {showParticles && <FloatingParticles type={showParticles} />}

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
            <div className="mb-4">
              <h3 className="font-display font-bold text-3xl mb-2 drop-shadow-lg">
                {character.name}
                {character.isOnline && (
                  <Sparkles className="inline-block w-6 h-6 ml-2 text-emerald-400 animate-pulse" />
                )}
              </h3>
              
              {character.location && (
                <div className="flex items-center gap-1 text-sm opacity-90 mb-2">
                  <MapPin className="w-4 h-4" />
                  {character.location}
                </div>
              )}

              <p className="text-sm opacity-90 mb-4 line-clamp-2 leading-relaxed">
                {character.bio}
              </p>
            </div>
            
            {/* Personality Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {character.personality.slice(0, 4).map((trait, index) => (
                <Badge 
                  key={trait} 
                  className="bg-white/20 backdrop-blur-sm text-white border-0 text-xs font-medium px-3 py-1 transition-all duration-300 hover:bg-white/30"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {trait}
                </Badge>
              ))}
            </div>

            {/* Quick Action Preview */}
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetailPanel(!showDetailPanel)}
                className="text-white/80 hover:text-white hover:bg-white/20 backdrop-blur-sm"
              >
                <Eye className="w-4 h-4 mr-2" />
                More Info
              </Button>
              
              <div className="flex items-center gap-2 text-sm text-white/80">
                <Clock className="w-4 h-4" />
                {character.lastSeen || 'Recently active'}
              </div>
            </div>
          </div>

          {/* Detail Panel Overlay */}
          {showDetailPanel && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-30 p-6 flex flex-col justify-center text-white animate-fade-in">
              <div className="space-y-4">
                <h4 className="font-bold text-xl mb-4">About {character.name}</h4>
                
                {character.interests && (
                  <div>
                    <h5 className="font-semibold mb-2">Interests</h5>
                    <div className="flex flex-wrap gap-2">
                      {character.interests.map((interest) => (
                        <Badge key={interest} className="bg-white/20 text-white border-0">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h5 className="font-semibold mb-2">Personality</h5>
                  <div className="flex flex-wrap gap-2">
                    {character.personality.map((trait) => (
                      <Badge key={trait} className="bg-primary/20 text-white border border-primary/30">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  onClick={() => setShowDetailPanel(false)}
                  className="text-white border border-white/20 hover:bg-white/10 mt-4"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
      
      {/* Enhanced Action Buttons */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-6 z-20">
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            setShowParticles('dislike');
            setTimeout(() => onDislike(character.id), 300);
          }}
          className="w-16 h-16 rounded-full border-2 border-red-400 bg-white/90 backdrop-blur-sm hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-300 hover:scale-110 shadow-lg group"
        >
          <X className="w-7 h-7 group-hover:animate-bounce" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            setShowParticles('super');
            setTimeout(() => onSuperLike(character.id), 300);
          }}
          className="w-20 h-20 rounded-full border-2 border-blue-400 bg-gradient-to-br from-blue-400 to-purple-500 text-white hover:from-blue-500 hover:to-purple-600 transition-all duration-300 hover:scale-110 shadow-xl group relative overflow-hidden"
        >
          <Star className="w-8 h-8 group-hover:animate-spin relative z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            setShowParticles('like');
            setTimeout(() => onLike(character.id), 300);
          }}
          className="w-16 h-16 rounded-full border-2 border-emerald-400 bg-white/90 backdrop-blur-sm hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all duration-300 hover:scale-110 shadow-lg group"
        >
          <Heart className="w-7 h-7 group-hover:animate-pulse" />
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
    age?: number;
    location?: string;
    interests?: string[];
    isOnline?: boolean;
    lastSeen?: string;
  }>;
  onMatch: (characterId: string) => void;
}

export const SwipeDiscovery = ({ characters, onMatch }: SwipeDiscoveryProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [matches, setMatches] = useState<string[]>([]);
  const [animatingOut, setAnimatingOut] = useState(false);

  const handleLike = (id: string) => {
    setAnimatingOut(true);
    setMatches(prev => [...prev, id]);
    onMatch(id);
    setTimeout(() => {
      nextCharacter();
      setAnimatingOut(false);
    }, 600);
  };

  const handleDislike = (id: string) => {
    setAnimatingOut(true);
    setTimeout(() => {
      nextCharacter();
      setAnimatingOut(false);
    }, 600);
  };

  const handleSuperLike = (id: string) => {
    setAnimatingOut(true);
    setMatches(prev => [...prev, id]);
    onMatch(id);
    setTimeout(() => {
      nextCharacter();
      setAnimatingOut(false);
    }, 600);
  };

  const nextCharacter = () => {
    setCurrentIndex(prev => Math.min(prev + 1, characters.length - 1));
  };

  if (currentIndex >= characters.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[600px] text-center animate-fade-in">
        <div className="mb-8 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-500 to-indigo-500 rounded-full blur-xl opacity-20 animate-pulse" />
          <Heart className="w-20 h-20 text-primary mx-auto mb-6 animate-heart-beat relative z-10" />
          <h3 className="font-display text-3xl mb-3 bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
            You've seen everyone!
          </h3>
          <p className="text-muted-foreground text-lg">
            Check back later for new connections
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white px-6 py-3 rounded-full shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">{matches.length} matches found</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Background Cards Stack */}
      {[2, 1].map((offset) => {
        const cardIndex = currentIndex + offset;
        if (cardIndex >= characters.length) return null;
        
        return (
          <Card 
            key={cardIndex}
            className={`absolute inset-0 border-0 shadow-lg transition-all duration-500`}
            style={{
              transform: `scale(${1 - offset * 0.05}) translateY(${offset * 8}px)`,
              opacity: 1 - offset * 0.3,
              zIndex: -offset
            }}
          >
            <img
              src={characters[cardIndex].avatar}
              alt={characters[cardIndex].name}
              className="w-full h-full object-cover rounded-lg"
            />
          </Card>
        );
      })}
      
      {/* Current Card */}
      <div className={`transition-all duration-600 ${animatingOut ? 'animate-fade-out-scale' : ''}`}>
        <SwipeableCard
          character={characters[currentIndex]}
          onLike={handleLike}
          onDislike={handleDislike}
          onSuperLike={handleSuperLike}
        />
      </div>
      
      {/* Progress Indicator */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
        <div className="bg-black/20 backdrop-blur-sm rounded-full px-4 py-2">
          <div className="text-white text-sm font-medium">
            {currentIndex + 1} / {characters.length}
          </div>
        </div>
      </div>
    </div>
  );
};