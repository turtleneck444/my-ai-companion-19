import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { speakText } from "@/lib/voice";
import { 
  Play, 
  Pause, 
  Volume2, 
  Search,
  Loader2,
  Check,
  Sparkles
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
}

interface VoiceSelectorProps {
  selectedVoice: Voice | null;
  onVoiceSelect: (voice: Voice) => void;
  onPersonalitySuggest: (traits: string[]) => void;
  className?: string;
}

export const VoiceSelector = ({ 
  selectedVoice, 
  onVoiceSelect, 
  onPersonalitySuggest,
  className 
}: VoiceSelectorProps) => {
  const { toast } = useToast();
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.5,
    similarity_boost: 0.5,
    style: 0.0,
    use_speaker_boost: true
  });

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    try {
      setLoading(true);
      
      // Try to fetch from ElevenLabs API
      const response = await fetch('/api/elevenlabs-voices', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      if (response.ok) {
        const data = await response.json();
        setVoices(data.voices || []);
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      console.warn('ElevenLabs API not available, using fallback voices:', error);
      
      // Use fallback voices when API is not available
      const fallbackVoices: Voice[] = [
        {
          voice_id: 'sarah',
          name: 'Sarah',
          category: 'Female',
          description: 'Warm and friendly female voice',
          preview_url: '',
          labels: { accent: 'american', gender: 'female', age: 'young_adult' },
          suggestedPersonality: ['Caring', 'Sweet', 'Empathetic'],
          characteristics: { warmth: 95, energy: 72, clarity: 88, depth: 85 }
        },
        {
          voice_id: 'emma',
          name: 'Emma',
          category: 'Female',
          description: 'Sweet and caring female voice',
          preview_url: '',
          labels: { accent: 'british', gender: 'female', age: 'young_adult' },
          suggestedPersonality: ['Sweet', 'Caring', 'Intelligent'],
          characteristics: { warmth: 92, energy: 68, clarity: 94, depth: 89 }
        },
        {
          voice_id: 'lily',
          name: 'Lily',
          category: 'Female',
          description: 'Playful and energetic female voice',
          preview_url: '',
          labels: { accent: 'american', gender: 'female', age: 'young_adult' },
          suggestedPersonality: ['Playful', 'Adventurous', 'Sweet'],
          characteristics: { warmth: 85, energy: 96, clarity: 91, depth: 78 }
        },
        {
          voice_id: 'sophia',
          name: 'Sophia',
          category: 'Female',
          description: 'Elegant and sophisticated female voice',
          preview_url: '',
          labels: { accent: 'american', gender: 'female', age: 'middle_aged' },
          suggestedPersonality: ['Intelligent', 'Confident', 'Romantic'],
          characteristics: { warmth: 82, energy: 74, clarity: 97, depth: 93 }
        },
        {
          voice_id: 'aria',
          name: 'Aria',
          category: 'Female',
          description: 'Mysterious and alluring female voice',
          preview_url: '',
          labels: { accent: 'american', gender: 'female', age: 'young_adult' },
          suggestedPersonality: ['Mysterious', 'Romantic', 'Confident'],
          characteristics: { warmth: 87, energy: 79, clarity: 90, depth: 95 }
        },
        {
          voice_id: 'maya',
          name: 'Maya',
          category: 'Female',
          description: 'Confident and charismatic female voice',
          preview_url: '',
          labels: { accent: 'american', gender: 'female', age: 'young_adult' },
          suggestedPersonality: ['Confident', 'Adventurous', 'Playful'],
          characteristics: { warmth: 88, energy: 91, clarity: 93, depth: 86 }
        }
      ];
      
      setVoices(fallbackVoices);
      
      // Show a less alarming message to users
      toast({ 
        title: "Voice Selection Available", 
        description: "Using built-in voice options. Premium voices will be available when connected to ElevenLabs.",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVoices = voices.filter(voice =>
    voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    voice.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    Object.values(voice.labels).some(label => 
      label.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const previewVoice = async (voice: Voice, text?: string) => {
    if (playingVoice === voice.voice_id) {
      // Stop current playback if same voice is clicked again
      speechSynthesis.cancel(); // Stop any browser TTS
      setPlayingVoice(null);
      return;
    }

    setPlayingVoice(voice.voice_id);
    try {
      const previewText = text || `Hi! I'm ${voice.name}. ${voice.description || 'I would love to be your voice!'}`;
      
      console.log('Voice preview starting:', { name: voice.name, voiceId: voice.voice_id });
      
      await speakText(previewText, voice.voice_id);
      
      toast({ 
        title: "🎉 Voice Preview Played!", 
        description: `You just heard ${voice.name}'s voice. ${text ? 'Custom message played!' : 'Like what you heard?'}`,
        duration: 3000
      });
    } catch (error) {
      console.error('Voice preview error:', error);
      toast({ 
        title: "Voice Preview", 
        description: `Playing ${voice.name} with browser voice. ElevenLabs premium voices available when connected.`,
        variant: "default"
      });
    } finally {
      setPlayingVoice(null);
    }
  };

  const handleVoiceSelect = (voice: Voice) => {
    onVoiceSelect(voice);
    onPersonalitySuggest(voice.suggestedPersonality);
    toast({
      title: "Voice selected",
      description: `${voice.name} selected with suggested personality traits.`
    });
  };

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading voices...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <input
          type="text"
          placeholder="Search voices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>

      {/* Voice Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {filteredVoices.map((voice) => (
          <Card 
            key={voice.voice_id}
            className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedVoice?.voice_id === voice.voice_id 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:bg-muted/50'
            }`}
            onClick={() => handleVoiceSelect(voice)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{voice.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {voice.description || 'No description available'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {selectedVoice?.voice_id === voice.voice_id && (
                  <Check className="w-4 h-4 text-primary" />
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    previewVoice(voice);
                  }}
                  disabled={false}
                  className={`p-2 transition-all duration-200 ${
                    playingVoice === voice.voice_id 
                      ? 'bg-primary text-primary-foreground animate-pulse' 
                      : 'hover:bg-primary/10'
                  }`}
                  title={playingVoice === voice.voice_id ? 'Stop Preview' : 'Play Voice Preview'}
                >
                  {playingVoice === voice.voice_id ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>

            {/* Voice Characteristics */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-xs">
                <span>Warmth</span>
                <span>{voice.characteristics.warmth}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-300"
                  style={{ width: `${voice.characteristics.warmth}%` }}
                />
              </div>
              
              <div className="flex justify-between text-xs">
                <span>Energy</span>
                <span>{voice.characteristics.energy}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-300"
                  style={{ width: `${voice.characteristics.energy}%` }}
                />
              </div>
            </div>

            {/* Suggested Personality */}
            <div className="flex flex-wrap gap-1">
              {voice.suggestedPersonality.map((trait) => (
                <Badge key={trait} variant="secondary" className="text-xs">
                  {trait}
                </Badge>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Voice Settings */}
      {selectedVoice && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="font-semibold">Voice Customization</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <Label>Stability</Label>
                <span>{Math.round(voiceSettings.stability * 100)}%</span>
              </div>
              <Slider
                value={[voiceSettings.stability]}
                onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, stability: value }))}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <Label>Similarity Boost</Label>
                <span>{Math.round(voiceSettings.similarity_boost * 100)}%</span>
              </div>
              <Slider
                value={[voiceSettings.similarity_boost]}
                onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, similarity_boost: value }))}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            <Button
              onClick={() => previewVoice(selectedVoice, "This is how I sound with your custom settings!")}
              disabled={playingVoice === selectedVoice.voice_id}
              className="w-full"
            >
              {playingVoice === selectedVoice.voice_id ? (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Playing...
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 mr-2" />
                  Preview Custom Voice
                </>
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};
