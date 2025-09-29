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

  // Enhanced voice data with custom voices and better characteristics
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
    // Premium ElevenLabs Public Library Voices  
    {
      voice_id: "AZnzlk1XvdvUeBnXmlld",
      name: "Bella",
      category: "female", 
      description: "Energetic, playful, and expressive - loves fun conversations",
      labels: { accent: "American", age: "Young Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/AZnzlk1XvdvUeBnXmlld/preview.mp3",
      suggestedPersonality: ["Playful", "Energetic", "Funny", "Adventurous"],
      characteristics: { warmth: 85, energy: 95, clarity: 85, depth: 70 },
      isPremium: true
    },
    {
      voice_id: "ErXwobaYiN019PkySvjV",
      name: "Elli",
      category: "female",
      description: "Soft, gentle, and nurturing - incredibly soothing and caring",
      labels: { accent: "American", age: "Young Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/ErXwobaYiN019PkySvjV/preview.mp3",
      suggestedPersonality: ["Gentle", "Caring", "Loving", "Nurturing"],
      characteristics: { warmth: 98, energy: 55, clarity: 85, depth: 85 },
      isPremium: true
    },
    {
      voice_id: "pNInz6obpgDQGcFmaJgB",
      name: "Olivia",
      category: "female",
      description: "Cheerful, bright, and optimistic - always uplifting",
      labels: { accent: "American", age: "Young Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/pNInz6obpgDQGcFmaJgB/preview.mp3",
      suggestedPersonality: ["Cheerful", "Optimistic", "Energetic", "Supportive"],
      characteristics: { warmth: 90, energy: 90, clarity: 88, depth: 75 },
      isPremium: true
    },
    {
      voice_id: "MF3mGyEYCl7XYWbV9V6O",
      name: "Cora",
      category: "female",
      description: "Mature, wise, and deeply comforting - like a best friend",
      labels: { accent: "American", age: "Mature", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/MF3mGyEYCl7XYWbV9V6O/preview.mp3",
      suggestedPersonality: ["Wise", "Mature", "Comforting", "Supportive"],
      characteristics: { warmth: 90, energy: 60, clarity: 90, depth: 95 },
      isPremium: true
    },
    {
      voice_id: "onwK4e9ZLuTAKqWW03F9",
      name: "Domi",
      category: "female",
      description: "Bold, confident, and assertive - strong personality",
      labels: { accent: "American", age: "Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/onwK4e9ZLuTAKqWW03F9/preview.mp3",
      suggestedPersonality: ["Bold", "Confident", "Assertive", "Independent"],
      characteristics: { warmth: 70, energy: 90, clarity: 88, depth: 85 },
      isPremium: true
    },
    // Additional premium voices from ElevenLabs public library
    {
      voice_id: "kdmDKE6EkgrWrrykO9Qt",
      name: "Emily",
      category: "female",
      description: "Super realistic young female voice that likes to chat",
      labels: { accent: "British", age: "Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/kdmDKE6EkgrWrrykO9Qt/preview.mp3",
      suggestedPersonality: ["Sophisticated", "Elegant", "Mysterious", "Cultured"],
      characteristics: { warmth: 80, energy: 70, clarity: 95, depth: 90 },
      isPremium: true
    },
    {
      voice_id: "XrExE9yKIg1WjnnlVkGX",
      name: "Matilda",
      category: "female",
      description: "Sweet and melodic - perfect for romantic conversations",
      labels: { accent: "American", age: "Young Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/XrExE9yKIg1WjnnlVkGX/preview.mp3",
      suggestedPersonality: ["Sweet", "Romantic", "Dreamy", "Affectionate"],
      characteristics: { warmth: 95, energy: 65, clarity: 90, depth: 85 },
      isPremium: true
    },
    {
      voice_id: "CYw3kZ02Hs0563khs1Fj",
      name: "Nova",
      category: "female",
      description: "Modern and dynamic - tech-savvy and intelligent",
      labels: { accent: "American", age: "Young Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/CYw3kZ02Hs0563khs1Fj/preview.mp3",
      suggestedPersonality: ["Intelligent", "Modern", "Tech-savvy", "Curious"],
      characteristics: { warmth: 75, energy: 85, clarity: 95, depth: 80 },
      isPremium: true
    },
    {
      voice_id: "XB0fDUnXU5powFXDhCwa",
      name: "Charlotte",
      category: "female",
      description: "Calm and professional - perfect for deep conversations",
      labels: { accent: "British", age: "Adult", gender: "Female" },
      preview_url: "https://storage.googleapis.com/eleven-public-prod/premade/voices/XB0fDUnXU5powFXDhCwa/preview.mp3",
      suggestedPersonality: ["Calm", "Professional", "Thoughtful", "Wise"],
      characteristics: { warmth: 85, energy: 60, clarity: 98, depth: 95 },
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
    
    let matchesCategory = selectedCategory === "all";
    if (!matchesCategory) {
      switch (selectedCategory) {
        case "custom":
          matchesCategory = voice.isCustom === true;
          break;
        case "romantic":
          matchesCategory = voice.suggestedPersonality.some(p => 
            ['Sweet', 'Romantic', 'Loving', 'Affectionate', 'Caring'].includes(p)
          );
          break;
        case "playful":
          matchesCategory = voice.suggestedPersonality.some(p => 
            ['Playful', 'Energetic', 'Funny', 'Cheerful', 'Adventurous'].includes(p)
          );
          break;
        case "sophisticated":
          matchesCategory = voice.suggestedPersonality.some(p => 
            ['Sophisticated', 'Elegant', 'Professional', 'Intelligent', 'Cultured'].includes(p)
          );
          break;
        case "gentle":
          matchesCategory = voice.suggestedPersonality.some(p => 
            ['Gentle', 'Calm', 'Nurturing', 'Wise', 'Thoughtful'].includes(p)
          );
          break;
        default:
          matchesCategory = voice.category === selectedCategory;
      }
    }
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", name: "All Voices", icon: "🎭" },
    { id: "custom", name: "Your Custom", icon: "⭐" },
    { id: "romantic", name: "Romantic", icon: "💕" },
    { id: "playful", name: "Playful", icon: "😊" },
    { id: "sophisticated", name: "Sophisticated", icon: "👑" },
    { id: "gentle", name: "Gentle", icon: "🌸" }
  ];

  // Enhanced voice preview function with audio fallback
  const handlePreviewVoice = async (voice: Voice) => {
    try {
      setIsPlaying(true);
      setCurrentPlayingVoice(voice.voice_id);
      
      // Call parent preview function if provided
      if (onPreviewVoice) {
        onPreviewVoice(voice);
        return;
      }

      console.log(`🎤 Attempting to play ${voice.name} (${voice.voice_id})`);
      
      // First try ElevenLabs API
      try {
        const sampleText = `Hello! I'm ${voice.name}. I'm so excited to meet you!`;
        
        // Use optimized settings for each specific voice
        let voiceSettings;
        if (voice.voice_id === "Qz1ptFvQEBIyY87QB6oV") {
          voiceSettings = { stability: 0.12, similarity_boost: 0.93, style: 0.85, use_speaker_boost: true };
        } else if (voice.voice_id === "NAW2WDhAioeiIYFXitBQ") {
          voiceSettings = { stability: 0.1, similarity_boost: 0.95, style: 0.8, use_speaker_boost: true };
        } else if (voice.isCustom) {
          voiceSettings = { stability: 0.10, similarity_boost: 0.99, style: 0.95, use_speaker_boost: true };
        } else {
          voiceSettings = { stability: 0.15, similarity_boost: 0.98, style: 0.85, use_speaker_boost: true };
        }

        console.log('🔧 Using ElevenLabs API with settings:', voiceSettings);
        
        await speakText(sampleText, voice.voice_id, {
          modelId: 'eleven_multilingual_v2',
          voiceSettings
        });

        toast({
          title: "🎤 Real Voice Preview",
          description: `Playing ${voice.name} with ElevenLabs quality`
        });
        
      } catch (apiError: any) {
        console.log('⚠️ ElevenLabs API failed, trying audio file fallback...');
        
        // Try ElevenLabs official preview API
        console.log('🔊 Using ElevenLabs preview API for voice:', voice.voice_id);
        
        const previewUrl = `https://api.elevenlabs.io/v1/voices/${voice.voice_id}/preview`;
        
        try {
          const response = await fetch(previewUrl, {
            headers: {
              'xi-api-key': import.meta.env.VITE_ELEVENLABS_API_KEY || ''
            }
          });
          
          if (response.ok) {
            const audioBlob = await response.blob();
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const audio = new Audio(audioUrl);
            audio.volume = 0.8;
            
            await new Promise((resolve, reject) => {
              audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                resolve(void 0);
              };
              audio.onerror = reject;
              audio.play().catch(reject);
            });

            toast({
              title: "🎵 Official Voice Sample",
              description: `Playing ${voice.name} ElevenLabs preview`
            });
          } else {
            throw new Error('Preview API failed');
          }
                 } catch (previewError) {
           console.log('Preview API failed, checking error type...');
           
           // Check if it's a voice access issue
           if (previewError?.message?.includes('voice_not_found') || 
               JSON.stringify(previewError).includes('voice_not_found')) {
             throw new Error('Voice not accessible. Please make your voice "Public" in ElevenLabs Voice Lab.');
           }
           
           // Last resort: shorter text with relaxed settings
           const shortText = `Hi, I'm ${voice.name}!`;
           await speakText(shortText, voice.voice_id, {
             modelId: 'eleven_turbo_v2', // Faster, uses fewer credits
             voiceSettings: {
               stability: 0.5,
               similarity_boost: 0.8,
               style: 0.3,
               use_speaker_boost: false
             }
           });

           toast({
             title: "🎤 Quick Preview",
             description: `Short ${voice.name} sample (limited by quota)`
           });
         }
      }
      
    } catch (error: any) {
      console.error('Voice preview completely failed:', error);
      
      toast({
        title: "Preview Failed",
        description: `Could not preview ${voice.name}. Please try again later.`,
        variant: "destructive"
      });
    } finally {
      setIsPlaying(false);
      setCurrentPlayingVoice(null);
    }
  };

  const handleVoiceSelect = (voice: Voice) => {
    onVoiceSelect(voice);
    if (onPersonalitySuggest) {
      onPersonalitySuggest(voice.suggestedPersonality);
    }
    toast({
      title: "Voice Selected",
      description: `${voice.name} has been selected`
    });
  };

  const getCharacteristicColor = (value: number) => {
    if (value >= 80) return "text-green-500";
    if (value >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getCharacteristicLabel = (value: number) => {
    if (value >= 80) return "High";
    if (value >= 60) return "Medium";
    return "Low";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading voices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search voices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="capitalize text-xs"
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredVoices.map((voice) => (
          <Card
            key={voice.voice_id}
            className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedVoice?.voice_id === voice.voice_id
                ? 'ring-2 ring-primary bg-primary/5'
                : 'hover:bg-muted/50'
            } ${voice.isCustom ? 'border-2 border-purple-300 bg-purple-50/50' : ''}`}
            onClick={() => handleVoiceSelect(voice)}
          >
            <div className="space-y-3">
              {/* Voice Header */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{voice.name}</h3>
                    {voice.isCustom && (
                      <Crown className="w-4 h-4 text-purple-500" />
                    )}
                    {voice.isPremium && (
                      <Star className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{voice.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {selectedVoice?.voice_id === voice.voice_id && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreviewVoice(voice);
                    }}
                    disabled={isPlaying && currentPlayingVoice === voice.voice_id}
                  >
                    {isPlaying && currentPlayingVoice === voice.voice_id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Voice Characteristics */}
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span>Warmth:</span>
                    <span className={getCharacteristicColor(voice.characteristics.warmth)}>
                      {getCharacteristicLabel(voice.characteristics.warmth)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Energy:</span>
                    <span className={getCharacteristicColor(voice.characteristics.energy)}>
                      {getCharacteristicLabel(voice.characteristics.energy)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clarity:</span>
                    <span className={getCharacteristicColor(voice.characteristics.clarity)}>
                      {getCharacteristicLabel(voice.characteristics.clarity)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Depth:</span>
                    <span className={getCharacteristicColor(voice.characteristics.depth)}>
                      {getCharacteristicLabel(voice.characteristics.depth)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Suggested Personality */}
              <div>
                <p className="text-xs text-muted-foreground mb-1">Suggested traits:</p>
                <div className="flex flex-wrap gap-1">
                  {voice.suggestedPersonality.map((trait) => (
                    <Badge key={trait} variant="secondary" className="text-xs">
                      {trait}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Voice Labels */}
              <div className="flex flex-wrap gap-1">
                {Object.entries(voice.labels).map(([key, value]) => (
                  <Badge key={key} variant="outline" className="text-xs">
                    {value}
                  </Badge>
                ))}
                {voice.isCustom && (
                  <Badge variant="default" className="text-xs bg-purple-500">
                    Custom Voice
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Preview Error Display */}
      {previewError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{previewError}</p>
        </div>
      )}

      {/* No Voices Found */}
      {filteredVoices.length === 0 && (
        <div className="text-center py-8">
          <Volume2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No voices found matching your search</p>
        </div>
      )}
    </div>
  );
};
