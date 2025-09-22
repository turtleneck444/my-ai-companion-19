import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Stepper } from "@/components/ui/stepper";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { speakText } from "@/lib/voice";
import { 
  Upload, 
  X, 
  Play, 
  Pause, 
  Volume2, 
  Heart, 
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Check
} from "lucide-react";

interface NewCharacter {
  name: string;
  bio: string;
  personality: string[];
  personalityTraits: Record<string, number>;
  voice: string;
  voiceId?: string;
  avatarFile?: File | null;
  avatarUrl?: string;
}

const steps = ["Basics", "Personality", "Avatar", "Voice", "Review"] as const;
type Step = typeof steps[number];

const personalityOptions = [
  "Affectionate", "Playful", "Witty", "Caring", "Adventurous", 
  "Romantic", "Funny", "Sweet", "Confident", "Mysterious",
  "Gentle", "Energetic", "Calm", "Bold", "Loving"
];

const personalityTraitSliders = [
  { key: "extroversion", label: "Extroversion", min: 0, max: 100 },
  { key: "warmth", label: "Warmth", min: 0, max: 100 },
  { key: "playfulness", label: "Playfulness", min: 0, max: 100 },
  { key: "romance", label: "Romance", min: 0, max: 100 },
  { key: "intelligence", label: "Intelligence", min: 0, max: 100 }
];

const Create = () => {
  const { toast } = useToast();
  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [character, setCharacter] = useState<NewCharacter>({
    name: "",
    bio: "",
    personality: [],
    personalityTraits: {
      extroversion: 50,
      warmth: 50,
      playfulness: 50,
      romance: 50,
      intelligence: 50
    },
    voice: "Smooth & Modern",
  });

  const next = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));

  const handleUpload = async (): Promise<string | undefined> => {
    if (!character.avatarFile) return character.avatarUrl;
    if (!isSupabaseConfigured) return undefined;
    const file = character.avatarFile;
    const path = `avatars/${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage
      .from("public")
      .upload(path, file, { upsert: false });
    if (error) {
      toast({ title: "Upload failed", description: error.message });
      return undefined;
    }
    const { data: pub } = supabase.storage.from("public").getPublicUrl(data.path);
    return pub?.publicUrl;
  };

  const save = async () => {
    try {
      setSaving(true);
      const uploaded = await handleUpload();
      const payload = { ...character, avatarUrl: uploaded || character.avatarUrl };
      if (isSupabaseConfigured) {
        await supabase.from("characters").insert({
          name: payload.name,
          bio: payload.bio,
          personality: payload.personality,
          voice: payload.voice,
          voice_id: payload.voiceId,
          avatar_url: payload.avatarUrl,
        });
      }
      toast({ title: "Created!", description: `${payload.name} is ready.` });
    } catch (e: any) {
      toast({ title: "Error", description: String(e?.message || e) });
    } finally {
      setSaving(false);
    }
  };

  const togglePersonality = (trait: string) => {
    setCharacter(prev => ({
      ...prev,
      personality: prev.personality.includes(trait)
        ? prev.personality.filter(p => p !== trait)
        : [...prev.personality, trait]
    }));
  };

  const updatePersonalityTrait = (key: string, value: number[]) => {
    setCharacter(prev => ({
      ...prev,
      personalityTraits: { ...prev.personalityTraits, [key]: value[0] }
    }));
  };

  const handleFileUpload = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setCharacter(prev => ({ ...prev, avatarFile: file }));
      const reader = new FileReader();
      reader.onload = (e) => {
        setCharacter(prev => ({ ...prev, avatarUrl: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const previewVoice = async () => {
    if (!character.voiceId) {
      toast({ title: "No voice ID", description: "Please enter an ElevenLabs voice ID to preview." });
      return;
    }
    
    setIsPlayingVoice(true);
    try {
      await speakText(`Hello! I'm ${character.name || 'your AI companion'}. ${character.bio || 'Nice to meet you!'}`, character.voiceId);
    } catch (error) {
      toast({ title: "Voice preview failed", description: "Could not play voice preview." });
    } finally {
      setIsPlayingVoice(false);
    }
  };

  const step = steps[stepIdx];
  const progress = ((stepIdx + 1) / steps.length) * 100;

  const LivePreviewCard = () => (
    <Card className="overflow-hidden shadow-romance transition-all duration-300 hover:shadow-glow border-0 bg-card/80 backdrop-blur-sm">
      <div className="relative">
        <div className="w-full h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
          {character.avatarUrl ? (
            <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/50 shadow-lg">
              <img
                src={character.avatarUrl}
                alt={character.name || "Preview"}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center">
              <Heart className="w-12 h-12 text-pink-400" />
            </div>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 rounded-full bg-green-400 shadow-sm" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg">
            {character.name || "Your AI Companion"}
          </h3>
          <p className="text-white/80 text-sm">
            {character.voice} voice
          </p>
        </div>
      </div>
      
      <div className="p-4 space-y-3">
        <p className="text-muted-foreground text-sm leading-relaxed">
          {character.bio || "Tell me about yourself..."}
        </p>
        
        <div className="flex flex-wrap gap-1">
          {character.personality.slice(0, 3).map((trait) => (
            <Badge key={trait} variant="secondary" className="text-xs">
              {trait}
            </Badge>
          ))}
          {character.personality.length === 0 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Add personality traits
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header with Stepper */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary" />
              Create Your AI Companion
            </h1>
            <div className="text-sm text-muted-foreground">
              Step {stepIdx + 1} of {steps.length}
            </div>
          </div>
          <Stepper steps={steps} currentStep={stepIdx} />
          <Progress value={progress} className="mt-4 h-2" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Step Content with Animations */}
            <div className="relative overflow-hidden">
              <div 
                className="transition-all duration-500 ease-in-out"
                style={{ transform: `translateX(-${stepIdx * 100}%)` }}
              >
                <div className="w-full flex">
                  {steps.map((stepName, index) => (
                    <div key={stepName} className="w-full flex-shrink-0 px-2">
                      {stepName === "Basics" && (
                        <Card className="p-6 space-y-4">
                          <div>
                            <Label htmlFor="name" className="text-base font-medium">Name</Label>
                            <Input 
                              id="name" 
                              value={character.name} 
                              onChange={(e) => setCharacter({ ...character, name: e.target.value })} 
                              placeholder="e.g., Luna, Aria, Sophie..." 
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="bio" className="text-base font-medium">Bio</Label>
                            <Textarea 
                              id="bio" 
                              value={character.bio} 
                              onChange={(e) => setCharacter({ ...character, bio: e.target.value })} 
                              placeholder="Tell me about her personality, interests, and what makes her special..." 
                              className="mt-2 min-h-[100px]"
                            />
                          </div>
                        </Card>
                      )}

                      {stepName === "Personality" && (
                        <Card className="p-6 space-y-6">
                          <div>
                            <Label className="text-base font-medium mb-4 block">Personality Traits</Label>
                            <div className="flex flex-wrap gap-2">
                              {personalityOptions.map((trait) => (
                                <Badge
                                  key={trait}
                                  variant={character.personality.includes(trait) ? "default" : "outline"}
                                  className="cursor-pointer transition-all duration-200 hover:scale-105"
                                  onClick={() => togglePersonality(trait)}
                                >
                                  {trait}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <Label className="text-base font-medium">Fine-tune Personality</Label>
                            {personalityTraitSliders.map((trait) => (
                              <div key={trait.key} className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>{trait.label}</span>
                                  <span>{character.personalityTraits[trait.key]}%</span>
                                </div>
                                <Slider
                                  value={[character.personalityTraits[trait.key]]}
                                  onValueChange={(value) => updatePersonalityTrait(trait.key, value)}
                                  min={trait.min}
                                  max={trait.max}
                                  step={1}
                                  className="w-full"
                                />
                              </div>
                            ))}
                          </div>
                        </Card>
                      )}

                      {stepName === "Avatar" && (
                        <Card className="p-6">
                          <Label className="text-base font-medium mb-4 block">Avatar Image</Label>
                          <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                              dragActive 
                                ? "border-primary bg-primary/5" 
                                : "border-muted-foreground/25 hover:border-primary/50"
                            }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                          >
                            {character.avatarUrl ? (
                              <div className="space-y-4">
                                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto ring-4 ring-primary/20">
                                  <img
                                    src={character.avatarUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <p className="text-sm font-medium">{character.avatarFile?.name}</p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Change Image
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                                <div>
                                  <p className="text-sm font-medium">Drop your image here</p>
                                  <p className="text-xs text-muted-foreground">or click to browse</p>
                                </div>
                                <Button
                                  variant="outline"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Choose File
                                </Button>
                              </div>
                            )}
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(file);
                              }}
                            />
                          </div>
                        </Card>
                      )}

                      {stepName === "Voice" && (
                        <Card className="p-6 space-y-4">
                          <div>
                            <Label htmlFor="voice" className="text-base font-medium">Voice Style</Label>
                            <Input 
                              id="voice" 
                              value={character.voice} 
                              onChange={(e) => setCharacter({ ...character, voice: e.target.value })} 
                              placeholder="e.g., Calm & Warm, Energetic & Playful..." 
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="voiceId" className="text-base font-medium">ElevenLabs Voice ID</Label>
                            <div className="flex gap-2 mt-2">
                              <Input 
                                id="voiceId" 
                                value={character.voiceId || ""} 
                                onChange={(e) => setCharacter({ ...character, voiceId: e.target.value })} 
                                placeholder="Enter ElevenLabs voice ID" 
                                className="flex-1"
                              />
                              <Button
                                variant="outline"
                                onClick={previewVoice}
                                disabled={isPlayingVoice || !character.voiceId}
                                className="px-4"
                              >
                                {isPlayingVoice ? (
                                  <Pause className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Get your voice ID from ElevenLabs to enable voice preview
                            </p>
                          </div>
                        </Card>
                      )}

                      {stepName === "Review" && (
                        <Card className="p-6 space-y-4">
                          <div className="text-center space-y-2">
                            <Check className="w-12 h-12 text-green-500 mx-auto" />
                            <h3 className="text-lg font-semibold">Ready to Create!</h3>
                            <p className="text-sm text-muted-foreground">
                              Review your AI companion and click Create when ready
                            </p>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Name:</span>
                              <span className="font-medium">{character.name || "Not set"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Personality:</span>
                              <span className="font-medium">{character.personality.length} traits</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Voice:</span>
                              <span className="font-medium">{character.voice}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Avatar:</span>
                              <span className="font-medium">{character.avatarUrl ? "Uploaded" : "Not set"}</span>
                            </div>
                          </div>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Preview Sidebar */}
          <div className="lg:sticky lg:top-24">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-primary" />
                Live Preview
              </h3>
              <LivePreviewCard />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="max-w-4xl mx-auto flex justify-between">
          <Button 
            variant="ghost" 
            onClick={prev} 
            disabled={stepIdx === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          
          {stepIdx < steps.length - 1 ? (
            <Button 
              onClick={next} 
              disabled={step === "Basics" && !character.name}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button 
              onClick={save} 
              disabled={saving || !character.name}
              className="flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Create Companion
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Create;
