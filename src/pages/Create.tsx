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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VoiceSelector } from "@/components/VoiceSelector";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { speakText } from "@/lib/voice";
import { generateAvatarImage, validateImagePrompt, examplePrompts } from "@/lib/image-generation";
import { useNavigate } from "react-router-dom";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { useAuth } from "@/contexts/AuthContext";
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
  Check,
  Mic,
  Wand2,
  Loader2,
  RefreshCw,
  ImageIcon
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

interface NewCharacter {
  name: string;
  bio: string;
  personality: string[];
  personalityTraits: Record<string, number>;
  voice: Voice | null;
  avatarFile?: File | null;
  avatarUrl?: string;
}

const steps: string[] = ["Basics", "Personality", "Voice", "Avatar", "Review"]; 
type Step = string;

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
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentPlan, setCurrentPlan } = useUsageTracking();
  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [imageStyle, setImageStyle] = useState('realistic');
  const [avatarMethod, setAvatarMethod] = useState('upload'); // 'upload' or 'generate'
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const plan = (user as any)?.user_metadata?.plan || 'free';
    setCurrentPlan(plan);
  }, [user, setCurrentPlan]);

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
    voice: null,
  });

  const next = () => setStepIdx((i) => Math.min(i + 1, steps.length - 1));
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));

  // AI Image generation handler
  const generateAvatar = async () => {
    if (currentPlan === 'free') {
      toast({ title: 'Upgrade required', description: 'AI avatar generation is included with Premium and Pro plans.', variant: 'destructive' });
      navigate('/pricing?plan=premium');
      return;
    }
    const validation = validateImagePrompt(imagePrompt);
    if (!validation.isValid) {
      toast({
        title: "Invalid prompt",
        description: validation.message,
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingImage(true);
    
    try {
      toast({
        title: "Generating avatar...",
        description: "Creating your AI companion's image. This may take 30-60 seconds.",
      });

      const result = await generateAvatarImage({
        prompt: imagePrompt,
        style: imageStyle as any,
        quality: 'standard',
        size: '1024x1024'
      });

      if (result) {
        setCharacter(prev => ({
          ...prev,
          avatarUrl: result.url,
          avatarFile: null // Clear file since we're using generated image
        }));

        toast({
          title: "Avatar generated!",
          description: `Created by ${result.provider}. You can regenerate if you want to try again.`,
        });
      } else {
        toast({
          title: "Generation failed",
          description: "Could not generate avatar. Please try a different description or upload an image instead.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Avatar generation error:', error);
      toast({
        title: "Generation error",
        description: "Something went wrong. Please try again or upload an image instead.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Get a random example prompt
  const useExamplePrompt = () => {
    const randomPrompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    setImagePrompt(randomPrompt);
  };

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
      const payload = { 
        ...character, 
        avatarUrl: uploaded || character.avatarUrl,
        voice: character.voice?.name || "Default",
        voiceId: character.voice?.voice_id
      };
      
      let savedCharacter = null;
      
      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from("characters").insert({
          name: payload.name,
          bio: payload.bio,
          personality: payload.personality,
          voice: payload.voice,
          voice_id: payload.voiceId,
          avatar_url: payload.avatarUrl,
        }).select().single();

        if (error) throw error;
        savedCharacter = data;
      }

      // Create character object for success page
      const characterForSuccess = {
        id: savedCharacter?.id || `temp-${Date.now()}`,
        name: payload.name,
        avatar: payload.avatarUrl || '/placeholder.svg',
        bio: payload.bio,
        personality: payload.personality,
        voice: payload.voice,
        voice_id: payload.voiceId,
        isOnline: true,
        relationshipLevel: 1.0
      };

      toast({ 
        title: "Created!", 
        description: `${payload.name} is ready to meet you!` 
      });

      // Navigate to success page with character data
      navigate('/success', { 
        state: { character: characterForSuccess } 
      });
    } catch (e: any) {
      toast({ title: "Error", description: String(e?.message || e) });
    } finally {
      setSaving(false);
    }
  };

  const togglePersonality = (trait: string) => {
    setCharacter(prev => {
      const has = prev.personality.includes(trait);
      if (!has && currentPlan === 'free' && prev.personality.length >= 3) {
        toast({ title: 'Upgrade for more traits', description: 'Free plan allows up to 3 personality traits. Upgrade to add more.', variant: 'destructive' });
        return prev;
      }
      return ({
        ...prev,
        personality: has
          ? prev.personality.filter(p => p !== trait)
          : [...prev.personality, trait]
      });
    });
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

  const handleVoiceSelect = (voice: Voice) => {
    setCharacter(prev => ({ ...prev, voice }));
  };

  const handlePersonalitySuggest = (traits: string[]) => {
    setCharacter(prev => ({
      ...prev,
      personality: [...new Set([...prev.personality, ...traits])]
    }));
  };

  const previewSelectedVoice = async () => {
    if (!character.voice) {
      toast({ title: "No voice selected", description: "Please select a voice first." });
      return;
    }
    
    setIsPlayingVoice(true);
    try {
      // Create a personalized preview message
      const previewText = character.name 
        ? `Hi! I'm ${character.name}. ${character.bio ? character.bio.slice(0, 100) : "I'm excited to be your AI companion!"}`
        : "Hello! I'm your AI companion. I can't wait to chat with you!";
      
      console.log('Playing voice preview:', { voiceId: character.voice.voice_id, text: previewText });
      
      await speakText(previewText, character.voice.voice_id);
      
      toast({ 
        title: "Voice preview played! 🎉", 
        description: `You just heard ${character.voice.name}'s voice`,
        duration: 3000
      });
    } catch (error) {
      console.error('Voice preview error:', error);
      toast({ 
        title: "Voice preview", 
        description: "Using browser voice. Premium ElevenLabs voices available when connected.",
        variant: "default"
      });
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
            {character.voice?.name || "Select a voice"} voice
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

        {character.voice && (
          <div className="pt-2 border-t">
            <Button
              onClick={previewSelectedVoice}
              disabled={isPlayingVoice}
              size="sm"
              variant="outline"
              className="w-full"
            >
              {isPlayingVoice ? (
                <>
                  <Pause className="w-3 h-3 mr-2" />
                  Playing...
                </>
              ) : (
                <>
                  <Mic className="w-3 h-3 mr-2" />
                  Preview Voice
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header with Stepper */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-6xl mx-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  if (window.history.length > 1) {
                    navigate(-1);
                  } else {
                    navigate('/app');
                  }
                }}
                className="p-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-primary" />
                Create Your AI Companion
              </h1>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {stepIdx + 1} of {steps.length}
            </div>
          </div>
          <Stepper steps={steps} currentStep={stepIdx} />
          <Progress value={progress} className="mt-4 h-2" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mobile Live Preview - Shows at top on mobile */}
          <div className="lg:hidden order-first">
            <div className="mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                <Volume2 className="w-5 h-5 text-primary" />
                Live Preview
              </h3>
              <LivePreviewCard />
            </div>
          </div>

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
                        <Card className="p-6 space-y-6 relative">
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
                            {currentPlan === 'free' ? (
                              <div className="text-sm text-muted-foreground p-3 border rounded-md">
                                Personality fine-tuning is available on Premium and Pro plans.
                                <div className="mt-2">
                                  <Button size="sm" onClick={() => navigate('/pricing?plan=premium')}>Upgrade to Unlock</Button>
                                </div>
                              </div>
                            ) : (
                              personalityTraitSliders.map((trait) => (
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
                              ))
                            )}
                          </div>
                        </Card>
                      )}

                      {stepName === "Voice" && (
                        currentPlan === 'free' ? (
                          <Card className="p-6 text-center">
                            <h3 className="font-semibold mb-2">Premium Feature</h3>
                            <p className="text-sm text-muted-foreground mb-4">Select from premium voices with a Premium or Pro plan.</p>
                            <Button onClick={() => navigate('/pricing?plan=premium')}>Upgrade to Unlock</Button>
                          </Card>
                        ) : (
                          <VoiceSelector
                            selectedVoice={character.voice}
                            onVoiceSelect={handleVoiceSelect}
                            onPersonalitySuggest={handlePersonalitySuggest}
                          />
                        )
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
                            {currentPlan === 'free' ? (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">Custom avatar upload is a Premium feature.</p>
                                <Button onClick={() => navigate('/pricing?plan=premium')}>Upgrade to Unlock</Button>
                              </div>
                            ) : character.avatarUrl ? (
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
                              <span className="font-medium">{character.voice?.name || "Not selected"}</span>
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

          {/* Live Preview Sidebar - Desktop only */}
          <div className="hidden lg:block lg:sticky lg:top-24">
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
        <div className="max-w-6xl mx-auto flex justify-between">
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
              disabled={saving || !character.name || !character.voice}
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
