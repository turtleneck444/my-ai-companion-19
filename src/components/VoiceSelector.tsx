import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { speakText, testVoice } from "@/lib/voice";
import { 
  Play, 
  Pause, 
  Volume2, 
  Search,
  Loader2,
  Check,
  Sparkles,
  Mic,
  MicOff,
  Star,
  Crown
} from "lucide-react";

interface Voice {
  voice_id: string;
  name: string;
  category: string;
  description: string;
  labels: Record<string, string>;
  preview_url: string;
  suggestedPersonality: string[];
  characteristics: {
    warmth: number;
    energy: number;
    clarity: number;
    depth: number;
  };
  isCustom?: boolean;
  isPremium?: boolean;
}

interface VoiceSelectorProps {
  selectedVoice: Voice | null;
  onVoiceSelect: (voice: Voice) => void;
  onPersonalitySuggest?: (traits: string[]) => void;
  onPreviewVoice?: (voice: Voice) => void;
  previewingVoice?: string | null;
  previewError?: string | null;
  className?: string;
}

export const VoiceSelector = ({ 
  selectedVoice, 
  onVoiceSelect, 
  onPersonalitySuggest,
  onPreviewVoice,
  previewingVoice,
  previewError,
  className 
}: VoiceSelectorProps) => {
  const { toast } = useToast();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingVoice, setCurrentPlayingVoice] = useState<string | null>(null);

  // SEDUCTIVE FEMALE VOICES ONLY - All confirmed female voices
  const voiceData: Voice[] = [
    // Custom ElevenLabs Voices
    {
      voice_id: "EXAVITQu4vr4xnSDxMaL",
      name: "Luna (Sarah Voice)",
      category: "custom",
      description: "Professional and intelligent - perfect for Luna's personality",
      labels: { accent: "American", age: "Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/EXAVITQu4vr4xnSDxMaL/preview.mp3",
      suggestedPersonality: ["Unique", "Personal", "Special", "Natural"],
      characteristics: { warmth: 95, energy: 85, clarity: 98, depth: 92 },
      isCustom: true,
      isPremium: true
    },
    {
      voice_id: "21m00Tcm4TlvDq8ikWAM",
      name: "Bonquisha (Rachel Voice)",
      category: "custom", 
      description: "Bold and confident voice - perfect for Bonquisha's personality",
      labels: { accent: "American", age: "Young Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/21m00Tcm4TlvDq8ikWAM/preview.mp3",
      suggestedPersonality: ["Bold", "Confident", "Unique", "Vibrant"],
      characteristics: { warmth: 85, energy: 95, clarity: 90, depth: 88 },
      isCustom: true,
      isPremium: true
    },
    // SEDUCTIVE FEMALE VOICES - All confirmed female
    {
      voice_id: "AZnzlk1XvdvUeBnXmlld",
      name: "Bella",
      category: "female", 
      description: "Seductive and playful - perfect for intimate conversations",
      labels: { accent: "American", age: "Young Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/preview.mp3",
      suggestedPersonality: ["Seductive", "Playful", "Flirty", "Adventurous"],
      characteristics: { warmth: 95, energy: 90, clarity: 90, depth: 85 },
      isPremium: true
    },
    {
      voice_id: "ErXwobaYiN019PkySvjV",
      name: "Elli",
      category: "female",
      description: "Soft, seductive, and nurturing - incredibly soothing and caring",
      labels: { accent: "American", age: "Young Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/preview.mp3",
      suggestedPersonality: ["Seductive", "Caring", "Loving", "Nurturing"],
      characteristics: { warmth: 98, energy: 70, clarity: 90, depth: 90 },
      isPremium: true
    },
    {
      voice_id: "pNInz6obpgDQGcFmaJgB",
      name: "Olivia",
      category: "female",
      description: "Cheerful, bright, and seductive - always uplifting and flirty",
      labels: { accent: "American", age: "Young Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/preview.mp3",
      suggestedPersonality: ["Seductive", "Optimistic", "Energetic", "Flirty"],
      characteristics: { warmth: 95, energy: 90, clarity: 90, depth: 80 },
      isPremium: true
    },
    {
      voice_id: "onwK4e9ZLuTAKqWW03F9",
      name: "Domi",
      category: "female",
      description: "Bold, confident, and seductive - strong, alluring personality",
      labels: { accent: "American", age: "Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/onwK4e9ZLuTAKqWW03F9/preview.mp3",
      suggestedPersonality: ["Seductive", "Confident", "Bold", "Alluring"],
      characteristics: { warmth: 85, energy: 90, clarity: 90, depth: 90 },
      isPremium: true
    },
    {
      voice_id: "kdmDKE6EkgrWrrykO9Qt",
      name: "Emily",
      category: "female",
      description: "Sophisticated and seductive - elegant British charm",
      labels: { accent: "British", age: "Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/kdmDKE6EkgrWrrykO9Qt/preview.mp3",
      suggestedPersonality: ["Seductive", "Sophisticated", "Elegant", "Mysterious"],
      characteristics: { warmth: 90, energy: 75, clarity: 95, depth: 95 },
      isPremium: true
    },
    {
      voice_id: "XrExE9yKIg1WjnnlVkGX",
      name: "Matilda",
      category: "female",
      description: "Sweet and seductive - perfect for romantic, intimate conversations",
      labels: { accent: "American", age: "Young Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/XrExE9yKIg1WjnnlVkGX/preview.mp3",
      suggestedPersonality: ["Seductive", "Romantic", "Dreamy", "Intimate"],
      characteristics: { warmth: 98, energy: 70, clarity: 95, depth: 90 },
      isPremium: true
    },
    {
      voice_id: "CYw3kZ02Hs0563khs1Fj",
      name: "Nova",
      category: "female",
      description: "Modern, seductive, and intelligent - tech-savvy and alluring",
      labels: { accent: "American", age: "Young Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/CYw3kZ02Hs0563khs1Fj/preview.mp3",
      suggestedPersonality: ["Seductive", "Intelligent", "Modern", "Alluring"],
      characteristics: { warmth: 85, energy: 85, clarity: 95, depth: 85 },
      isPremium: true
    },
    {
      voice_id: "XB0fDUnXU5powFXDhCwa",
      name: "Charlotte",
      category: "female",
      description: "Calm, seductive, and professional - perfect for deep, intimate conversations",
      labels: { accent: "British", age: "Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/XB0fDUnXU5powFXDhCwa/preview.mp3",
      suggestedPersonality: ["Seductive", "Professional", "Intimate", "Sophisticated"],
      characteristics: { warmth: 90, energy: 70, clarity: 98, depth: 95 },
      isPremium: true
    },
    {
      voice_id: "VR6AewLTigWG4xSOukaG",
      name: "Lily",
      category: "female",
      description: "Sweet, seductive, and innocent - perfect for romantic conversations",
      labels: { accent: "American", age: "Young Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/VR6AewLTigWG4xSOukaG/preview.mp3",
      suggestedPersonality: ["Seductive", "Sweet", "Innocent", "Romantic"],
      characteristics: { warmth: 95, energy: 75, clarity: 90, depth: 85 },
      isPremium: true
    },
    {
      voice_id: "pqHfZKP75CvOlQylNhV4",
      name: "Bella",
      category: "female",
      description: "Seductive and mysterious - perfect for intimate, secret conversations",
      labels: { accent: "American", age: "Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/pqHfZKP75CvOlQylNhV4/preview.mp3",
      suggestedPersonality: ["Seductive", "Mysterious", "Intimate", "Secretive"],
      characteristics: { warmth: 90, energy: 80, clarity: 90, depth: 95 },
      isPremium: true
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setVoices(voiceData);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const filteredVoices = voices.filter(voice => {
    const matchesSearch = voice.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         voice.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || voice.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", "custom", "female"];

  const handlePreviewVoice = async (voice: Voice) => {
    if (currentPlayingVoice === voice.voice_id) {
      // Stop current voice
      setIsPlaying(false);
      setCurrentPlayingVoice(null);
      return;
    }

    try {
      setIsPlaying(true);
      setCurrentPlayingVoice(voice.voice_id);
      
      if (onPreviewVoice) {
        onPreviewVoice(voice);
      }

      const sampleText = `Hi! I'm ${voice.name}. I'm so excited to meet you!`;
      await testVoice(voice.voice_id, sampleText);
      
      setIsPlaying(false);
      setCurrentPlayingVoice(null);
    } catch (error) {
      console.error("Preview error:", error);
      setIsPlaying(false);
      setCurrentPlayingVoice(null);
      toast({
        title: "Preview Error",
        description: "Could not preview voice. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleVoiceSelect = (voice: Voice) => {
    onVoiceSelect(voice);
    
    if (onPersonalitySuggest) {
      onPersonalitySuggest(voice.suggestedPersonality);
    }

    toast({
      title: "Voice Selected",
      description: `${voice.name} has been selected for your companion.`,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading voices...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choose Your Companion's Voice
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Select a seductive female voice that matches your companion's personality
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search voices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:text-white"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === "all" ? "All Voices" : category === "custom" ? "Custom Voices" : "Female Voices"}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredVoices.map((voice) => (
          <Card 
            key={voice.voice_id} 
            className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedVoice?.voice_id === voice.voice_id 
                ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600'
            }`}
            onClick={() => handleVoiceSelect(voice)}
          >
            <div className="space-y-3">
              {/* Voice Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {voice.name}
                  </h4>
                  {voice.isCustom && (
                    <Badge variant="secondary" className="text-xs">
                      <Crown className="h-3 w-3 mr-1" />
                      Custom
                    </Badge>
                  )}
                  {voice.isPremium && (
                    <Badge variant="default" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewVoice(voice);
                  }}
                  disabled={previewingVoice === voice.voice_id}
                  className="p-2"
                >
                  {previewingVoice === voice.voice_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : currentPlayingVoice === voice.voice_id ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Voice Description */}
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {voice.description}
              </p>

              {/* Voice Labels */}
              <div className="flex flex-wrap gap-1">
                {Object.entries(voice.labels).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {value}
                  </Badge>
                ))}
              </div>

              {/* Voice Characteristics */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Warmth</span>
                  <span className="font-medium">{voice.characteristics.warmth}%</span>
                </div>
                <Slider
                  value={[voice.characteristics.warmth]}
                  max={100}
                  step={1}
                  className="w-full"
                  disabled
                />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Energy</span>
                  <span className="font-medium">{voice.characteristics.energy}%</span>
                </div>
                <Slider
                  value={[voice.characteristics.energy]}
                  max={100}
                  step={1}
                  className="w-full"
                  disabled
                />
              </div>

              {/* Suggested Personality */}
              <div>
                <Label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                  Suggested Personality:
                </Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {voice.suggestedPersonality.map((trait, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedVoice?.voice_id === voice.voice_id && (
                <div className="flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Check className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Selected</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredVoices.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No voices found matching your search criteria.
          </p>
        </div>
      )}
    </div>
  );
};
