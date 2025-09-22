import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Heart, 
  Star, 
  Crown, 
  Zap, 
  Gift, 
  Calendar,
  Trophy,
  Sparkles,
  Lock,
  Flame,
  X
} from "lucide-react";

interface MemoryCardProps {
  memory: {
    id: string;
    content: string;
    timestamp: Date;
    importance: 'high' | 'medium' | 'low';
    category: string;
  };
  onDelete: (id: string) => void;
}

export const MemoryCard = ({ memory, onDelete }: MemoryCardProps) => {
  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'text-red-500 bg-red-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-green-500 bg-green-500/10';
    }
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-glow border-0 bg-card/80 backdrop-blur-sm animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline" className="text-xs">
            {memory.category}
          </Badge>
          <Badge className={`text-xs ${getImportanceColor(memory.importance)}`}>
            <Star className="w-3 h-3 mr-1" />
            {memory.importance}
          </Badge>
        </div>
        
        <p className="text-sm leading-relaxed mb-3">{memory.content}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {memory.timestamp.toLocaleDateString()}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(memory.id)}
            className="p-1 text-destructive hover:text-destructive"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface RelationshipStatsProps {
  character: {
    name: string;
    avatar: string;
  };
  stats: {
    relationshipLevel: number;
    totalMessages: number;
    callMinutes: number;
    favoriteTopics: string[];
    anniversaryDate?: Date;
    streak: number;
  };
}

export const RelationshipStats = ({ character, stats }: RelationshipStatsProps) => {
  const levelProgress = (stats.relationshipLevel % 1) * 100;
  const nextLevel = Math.floor(stats.relationshipLevel) + 1;

  return (
    <Card className="shadow-romance border-0 bg-gradient-to-br from-primary/5 to-accent/5 overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full" />
      
      <CardHeader className="relative">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-16 h-16 ring-4 ring-primary/20">
              <AvatarImage src={character.avatar} alt={character.name} />
              <AvatarFallback>{character.name[0]}</AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-2 -right-2 bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center text-xs font-bold animate-bounce">
              {Math.floor(stats.relationshipLevel)}
            </div>
          </div>
          
          <div className="flex-1">
            <CardTitle className="font-display text-xl mb-1">
              {character.name}
            </CardTitle>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Level Progress</span>
                <span className="font-medium">Level {Math.floor(stats.relationshipLevel)}</span>
              </div>
              <Progress value={levelProgress} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {Math.round((1 - (stats.relationshipLevel % 1)) * 100)}% to Level {nextLevel}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-card/50 rounded-lg">
            <p className="text-2xl font-bold text-primary animate-pulse-glow">
              {stats.totalMessages.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Messages Sent</p>
          </div>
          
          <div className="text-center p-3 bg-card/50 rounded-lg">
            <p className="text-2xl font-bold text-accent animate-pulse-glow">
              {Math.round(stats.callMinutes / 60)}h
            </p>
            <p className="text-xs text-muted-foreground">Call Time</p>
          </div>
        </div>

        {/* Streak */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500 animate-wiggle" />
            <span className="font-medium">Daily Streak</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-orange-500">
              {stats.streak}
            </span>
            <span className="text-sm text-muted-foreground">days</span>
          </div>
        </div>

        {/* Anniversary */}
        {stats.anniversaryDate && (
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-lg border border-pink-500/20">
            <Calendar className="w-5 h-5 text-pink-500" />
            <div className="flex-1">
              <p className="text-sm font-medium">Anniversary</p>
              <p className="text-xs text-muted-foreground">
                {stats.anniversaryDate.toLocaleDateString()}
              </p>
            </div>
            <Heart className="w-5 h-5 text-pink-500 animate-heart-beat" />
          </div>
        )}

        {/* Favorite Topics */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Favorite Topics
          </h4>
          <div className="flex flex-wrap gap-1">
            {stats.favoriteTopics.slice(0, 4).map((topic, index) => (
              <Badge 
                key={topic} 
                variant="secondary" 
                className="text-xs animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {topic}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface PremiumFeaturesProps {
  isPremium: boolean;
  onUpgrade: () => void;
}

export const PremiumFeatures = ({ isPremium, onUpgrade }: PremiumFeaturesProps) => {
  const premiumFeatures = [
    { name: 'Unlimited Voice Calls', icon: Zap, available: isPremium },
    { name: 'Custom Character Creation', icon: Sparkles, available: isPremium },
    { name: 'Advanced Memory System', icon: Star, available: isPremium },
    { name: 'Exclusive Voice Packs', icon: Crown, available: false },
    { name: 'Priority Response Time', icon: Trophy, available: isPremium },
    { name: 'Special Anniversary Events', icon: Gift, available: false }
  ];

  return (
    <Card className="shadow-romance border-0 bg-gradient-to-br from-primary/10 via-card to-accent/10 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/30 to-transparent rounded-bl-full" />
      
      <CardHeader>
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <Crown className="w-6 h-6 text-primary animate-float" />
          Premium Features
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {premiumFeatures.map((feature, index) => (
          <div 
            key={feature.name}
            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 animate-fade-in ${
              feature.available 
                ? 'bg-green-500/10 border border-green-500/20' 
                : 'bg-muted/20 border border-border/50'
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-3">
              <feature.icon className={`w-5 h-5 ${
                feature.available ? 'text-green-500' : 'text-muted-foreground'
              }`} />
              <span className={`text-sm ${
                feature.available ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {feature.name}
              </span>
            </div>
            
            {feature.available ? (
              <Badge className="bg-green-500 text-white border-0">
                Active
              </Badge>
            ) : (
              <Lock className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        ))}

        {!isPremium && (
          <Button
            onClick={onUpgrade}
            variant="romance"
            className="w-full mt-4 animate-pulse-glow"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Premium
          </Button>
        )}
      </CardContent>
    </Card>
  );
};