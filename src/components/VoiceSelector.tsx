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
    stability: 0.35,
    similarity_boost: 0.9,
    style: 0.45,
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
        // Prefer curated female/high-quality voices if present
        const curated = (data.voices || []).filter((v: any) => {
          const labelGender = (v.labels?.gender || '').toLowerCase();
          return labelGender === 'female' || labelGender === 'woman' || v.category?.toLowerCase() === 'premade';
        });
        setVoices(curated.length ? curated : (data.voices || []));
      } else {
        throw new Error('API not available');
      }
    } catch (error) {
      console.warn('ElevenLabs API not available, using fallback voices:', error);
      
      // Curated fallback voices with attractive profiles
      const fallbackVoices: Voice[] = [
        { voice_id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel', category: 'Female', description: 'Warm, youthful, and expressive', preview_url: '', labels: { gender: 'female', accent: 'american' }, suggestedPersonality: ['Caring','Sweet','Playful'], characteristics: { warmth: 94, energy: 78, clarity: 92, depth: 86 } },
        { voice_id: 'AZnzlk1XvdvUeBnXmlld', name: 'Bella', category: 'Female', description: 'Charming, intimate and confident', preview_url: '', labels: { gender: 'female', accent: 'american' }, suggestedPersonality: ['Romantic','Confident','Alluring'], characteristics: { warmth: 91, energy: 74, clarity: 95, depth: 90 } },
        { voice_id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah', category: 'Female', description: 'Soft, empathetic and soothing', preview_url: '', labels: { gender: 'female', accent: 'american' }, suggestedPersonality: ['Empathetic','Kind','Supportive'], characteristics: { warmth: 96, energy: 66, clarity: 93, depth: 88 } },
        { voice_id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Emily', category: 'Female', description: 'Sweet, bright and intelligent', preview_url: '', labels: { gender: 'female', accent: 'british' }, suggestedPersonality: ['Sweet','Intelligent','Cheerful'], characteristics: { warmth: 90, energy: 80, clarity: 94, depth: 84 } },
        { voice_id: 'ErXwobaYiN019PkySvjV', name: 'Elli', category: 'Female', description: 'Expressive and modern', preview_url: '', labels: { gender: 'female', accent: 'american' }, suggestedPersonality: ['Modern','Witty','Confident'], characteristics: { warmth: 88, energy: 82, clarity: 96, depth: 83 } },
      ];
      
      setVoices(fallbackVoices);
      
      toast({ 
        title: "Voice Selection Available", 
        description: "Using curated voices. Premium voices will expand when connected to ElevenLabs.",
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
      speechSynthesis.cancel();
      setPlayingVoice(null);
      return;
    }

    setPlayingVoice(voice.voice_id);
    try {
      const previewText = text || `Hi! I'm ${voice.name}. ${voice.description || 'I would love to be your voice!'}`;
      await speakText(previewText, voice.voice_id, {
        modelId: 'eleven_multilingual_v2',
        voiceSettings: voiceSettings
      });
      toast({ 
        title: "🎉 Voice Preview Played!", 
        description: `You just heard ${voice.name}.`,
        duration: 2500
      });
    } catch (error) {
      console.error('Voice preview error:', error);
      toast({ 
        title: "Voice Preview",
        description: `Playing ${voice.name} with browser voice.`,
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
                step={0.05}
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
                step={0.05}
                className="w-full"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <Label>Style</Label>
                <span>{Math.round(voiceSettings.style * 100)}%</span>
              </div>
              <Slider
                value={[voiceSettings.style]}
                onValueChange={([value]) => setVoiceSettings(prev => ({ ...prev, style: value }))}
                min={0}
                max={1}
                step={0.05}
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
