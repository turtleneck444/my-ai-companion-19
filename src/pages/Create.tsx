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
import { speakText, testVoice } from "@/lib/voice";
import { generateAvatarImage, validateImagePrompt, examplePrompts } from "@/lib/image-generation";
import { useNavigate } from "react-router-dom";
import { useEnhancedUsageTracking } from "@/hooks/useEnhancedUsageTracking";
import { useUpgrade } from "@/hooks/useUpgrade";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { getPlanById, getRemainingCompanions, checkCompanionLimit } from "@/lib/payments";
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
  ImageIcon,
  Camera,
  Palette,
  Zap
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
  
  // Use the new enhanced usage tracking
  const { usage, isLoading: usageLoading } = useEnhancedUsageTracking();
  
  // Use the enhanced upgrade system
  const { 
    showUpgradePrompt, 
    showUpgrade,
    hideUpgrade,
    handleUpgrade,
    isUpgrading 
  } = useUpgrade();
  
  const [upgradePlan, setUpgradePlan] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<Step>("Basics");
  const [saving, setSaving] = useState(false);
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
    avatarFile: null,
    avatarUrl: ""
  });

  // Voice preview state
  const [previewingVoice, setPreviewingVoice] = useState<string | null>(null);
  const [voicePreviewError, setVoicePreviewError] = useState<string | null>(null);

  // AI Image generation state
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [imageGenerationError, setImageGenerationError] = useState<string | null>(null);
  const [showImagePrompt, setShowImagePrompt] = useState(false);

  // Check companion limit
  useEffect(() => {
    const checkLimit = async () => {
      if (user && !usageLoading && usage && isSupabaseConfigured) {
        try {
          // Query database for actual companion count
          const { count, error } = await supabase
            .from('characters')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          
          if (error) {
            console.error('Error checking companion count:', error);
            return;
          }
          
          const companionsCreated = count || 0;
          const canCreate = checkCompanionLimit(usage.plan || 'free', companionsCreated);
          
          if (!canCreate) {
            showUpgrade('message');
            setUpgradePlan('premium');
          }
        } catch (error) {
          console.error('Error in companion limit check:', error);
        }
      }
    };
    checkLimit();
  }, [user, usage, usageLoading, showUpgrade]);

  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const nextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const prevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case "Basics":
        return character.name.trim() !== "" && character.bio.trim() !== "";
      case "Personality":
        return character.personality.length > 0;
      case "Voice":
        return character.voice !== null;
      case "Avatar":
        return character.avatarUrl !== "" || character.avatarFile !== null;
      case "Review":
        return true;
      default:
        return false;
    }
  };

  // Enhanced voice preview function
  const previewVoice = async (voice: Voice) => {
    try {
      setPreviewingVoice(voice.voice_id);
      setVoicePreviewError(null);
      
      // Test the voice with a sample text
      const sampleText = `Hello! I'm ${character.name || 'your AI companion'}. I'm so excited to meet you!`;
      
      await testVoice(voice.voice_id, sampleText);
      await speakText(sampleText, voice.voice_id, {
        stability: 0.35,
        similarity_boost: 0.9,
        style: 0.4,
        use_speaker_boost: true
      });
      
      toast({
        title: "Voice Preview",
        description: `Playing ${voice.name} voice preview`
      });
    } catch (error) {
      console.error('Voice preview error:', error);
      setVoicePreviewError('Failed to preview voice. Please try again.');
      toast({
        title: "Preview Error",
        description: "Could not preview voice. Please try again.",
        variant: "destructive"
      });
    } finally {
      setPreviewingVoice(null);
    }
  };

  // AI Image generation function
  const generateAIImage = async () => {
    if (!imagePrompt.trim()) {
      toast({
        title: "Prompt Required",
        description: "Please enter a description for your AI companion's image",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGeneratingImage(true);
      setImageGenerationError(null);
      
      const validation = validateImagePrompt(imagePrompt);
      if (!validation.isValid) {
        throw new Error(validation.message || 'Invalid prompt');
      }
      
      const result = await generateAvatarImage({ prompt: imagePrompt });
      if (!result) {
        throw new Error('Failed to generate image');
      }
      
      setGeneratedImageUrl(result.url);
      setCharacter(prev => ({ ...prev, avatarUrl: result.url }));
      
      toast({
        title: "Image Generated!",
        description: "Your AI companion's avatar has been created"
      });
    } catch (error) {
      console.error('Image generation error:', error);
      setImageGenerationError('Failed to generate image. Please try again.');
      toast({
        title: "Generation Failed",
        description: "Could not generate image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Enhanced character creation with proper user_id
  const createCharacter = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a character",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      // Upload avatar if file exists
      let uploaded = null;
      if (character.avatarFile) {
        try {
          const formData = new FormData();
          formData.append('file', character.avatarFile);
          
          const { data, error } = await supabase.storage
            .from('avatars')
            .upload(`${user.id}/${Date.now()}-${character.avatarFile.name}`, character.avatarFile);
          
          if (error) {
            console.warn('Storage upload failed, using local URL:', error);
            // Fallback to local URL if storage fails
            uploaded = character.avatarUrl;
          } else {
            const { data: { publicUrl } } = supabase.storage
              .from('avatars')
              .getPublicUrl(data.path);
            
            uploaded = publicUrl;
          }
        } catch (storageError) {
          console.warn('Storage error, using local URL:', storageError);
          // Fallback to local URL if storage fails
          uploaded = character.avatarUrl;
        }
      }

      // Update the character creation to use correct column names
      const payload = {
        name: character.name,
        description: character.bio, // Use 'description' instead of 'bio'
        personality: character.personality,
        personality_traits: character.personalityTraits ? Object.keys(character.personalityTraits) : [],
        avatar_url: uploaded || character.avatarUrl, // Use 'avatar_url' instead of 'avatarUrl'
        voice_id: character.voice?.voice_id, // Use 'voice_id' instead of 'voice'
        voice_settings: character.voice ? { name: character.voice.name } : null
      };
      
      let savedCharacter = null;

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('characters')
          .insert([{
            name: payload.name,
            description: payload.description, // Use 'description'
            personality: JSON.stringify(payload.personality),
            personality_traits: payload.personality_traits,
            avatar_url: payload.avatar_url, // Use 'avatar_url'
            voice_id: payload.voice_id, // Use 'voice_id'
            voice_settings: payload.voice_settings,
            user_id: user.id,
            is_public: false
          }])
          .select()
          .single();

        if (error) throw new Error(`Failed to create character: ${error.message}`);
        savedCharacter = data;
      } else {
        // Fallback for when Supabase is not configured
        savedCharacter = {
          id: `local-${Date.now()}`,
          name: payload.name,
          description: payload.description,
          personality: payload.personality,
          personality_traits: payload.personalityTraits,
          avatar_url: payload.avatar_url,
          voice_id: payload.voice_id,
          voice_settings: payload.voice_settings,
          user_id: user.id,
          is_public: false
        };
      }

      // Create character object for success page
      const characterForSuccess = {
        id: savedCharacter?.id || `temp-${Date.now()}`,
        name: payload.name,
        avatar: payload.avatar_url || '/placeholder.svg',
        bio: payload.description,
        personality: payload.personality,
        personalityTraits: payload.personalityTraits,
        voice: { 
          voice_id: payload.voice_id, 
          name: payload.voice_settings?.name || "Default" 
        },
        isOnline: true,
        relationshipLevel: 1.0
      };

      toast({ 
        title: "Created!", 
        description: `${payload.name} is ready to meet you!` 
      });

      // Navigate to success page with character data
      navigate('/app', { 
        state: { startChatWith: characterForSuccess } 
      });
    } catch (e: any) {
      console.error('Character creation error:', e);
      toast({ 
        title: "Error", 
        description: String(e?.message || e),
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePersonality = (trait: string) => {
    setCharacter(prev => ({
      ...prev,
      personality: prev.personality.includes(trait)
        ? prev.personality.filter(t => t !== trait)
        : [...prev.personality, trait]
    }));
  };

  const updatePersonalityTrait = (key: string, value: number[]) => {
    setCharacter(prev => ({
      ...prev,
      personalityTraits: {
        ...prev.personalityTraits,
        [key]: value[0]
      }
    }));
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please choose an image smaller than 5MB",
          variant: "destructive"
        });
        return;
      }
      
      const url = URL.createObjectURL(file);
      setCharacter(prev => ({
        ...prev,
        avatarFile: file,
        avatarUrl: url
      }));
    }
  };

  const removeAvatar = () => {
    setCharacter(prev => ({
      ...prev,
      avatarFile: null,
      avatarUrl: ""
    }));
  };

  const renderStep = () => {
    switch (currentStep) {
      case "Basics":
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="name">Character Name</Label>
              <Input
                id="name"
                value={character.name}
                onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter your AI companion's name"
                className="mt-2"
              />
            </div>
            
            <div>
              <Label htmlFor="bio">Character Description</Label>
              <Textarea
                id="bio"
                value={character.bio}
                onChange={(e) => setCharacter(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Describe your AI companion's background, interests, and what makes them special..."
                className="mt-2"
                rows={4}
              />
            </div>
          </div>
        );

      case "Personality":
        return (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Personality Traits</h3>
              <div className="flex flex-wrap gap-2">
                {personalityOptions.map((trait) => (
                  <Badge
                    key={trait}
                    variant={character.personality.includes(trait) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/10 transition-colors"
                    onClick={() => togglePersonality(trait)}
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Fine-tune Personality</h3>
              <div className="space-y-6">
                {personalityTraitSliders.map((trait) => (
                  <div key={trait.key}>
                    <div className="flex justify-between items-center mb-2">
                      <Label>{trait.label}</Label>
                      <span className="text-sm text-muted-foreground">
                        {character.personalityTraits[trait.key]}%
                      </span>
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
            </div>
          </div>
        );

      case "Voice":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Choose a Voice</h3>
              <p className="text-muted-foreground">
                Select the perfect voice for your AI companion
              </p>
            </div>
            
            <VoiceSelector
              selectedVoice={character.voice}
              onVoiceSelect={(voice) => setCharacter(prev => ({ ...prev, voice }))}
              onPreviewVoice={previewVoice}
              previewingVoice={previewingVoice}
              previewError={voicePreviewError}
            />
            
            {character.voice && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Selected Voice: {character.voice.name}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {character.voice.description}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => previewVoice(character.voice!)}
                    disabled={previewingVoice === character.voice.voice_id}
                  >
                    {previewingVoice === character.voice.voice_id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    Preview Voice
                  </Button>
                </div>
              </div>
            )}
          </div>
        );

      case "Avatar":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Choose an Avatar</h3>
              <p className="text-muted-foreground">
                Upload an image or generate one with AI
              </p>
            </div>

            {/* AI Image Generation */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-500" />
                  <h4 className="font-semibold">Generate with AI</h4>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="imagePrompt">Describe your AI companion</Label>
                    <Textarea
                      id="imagePrompt"
                      value={imagePrompt}
                      onChange={(e) => setImagePrompt(e.target.value)}
                      placeholder="e.g., A beautiful young woman with long brown hair, warm smile, wearing a cozy sweater, professional headshot style"
                      className="mt-2"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={generateAIImage}
                      disabled={isGeneratingImage || !imagePrompt.trim()}
                      className="flex-1"
                    >
                      {isGeneratingImage ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4 mr-2" />
                      )}
                      {isGeneratingImage ? 'Generating...' : 'Generate Image'}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => setShowImagePrompt(!showImagePrompt)}
                    >
                      <Palette className="w-4 h-4 mr-2" />
                      Examples
                    </Button>
                  </div>
                  
                  {showImagePrompt && (
                    <div className="mt-4 p-4 bg-muted rounded-lg">
                      <h5 className="font-medium mb-2">Example prompts:</h5>
                      <div className="space-y-2">
                        {examplePrompts.map((prompt, index) => (
                          <button
                            key={index}
                            onClick={() => setImagePrompt(prompt)}
                            className="block w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {prompt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {imageGenerationError && (
                    <div className="text-sm text-red-500">
                      {imageGenerationError}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Upload Image */}
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-blue-500" />
                  <h4 className="font-semibold">Upload Your Own</h4>
                </div>
                
                <div className="space-y-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                      <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload an image
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PNG, JPG up to 5MB
                      </p>
                    </div>
                  </Label>
                </div>
              </div>
            </Card>

            {/* Current Avatar Preview */}
            {(character.avatarUrl || generatedImageUrl) && (
              <Card className="p-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Current Avatar</h4>
                  <div className="flex items-center gap-4">
                    <img
                      src={character.avatarUrl || generatedImageUrl}
                      alt="Character avatar"
                      className="w-20 h-20 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        {character.avatarFile ? 'Uploaded image' : 'Generated image'}
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={removeAvatar}
                        className="mt-2"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        );

      case "Review":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Review Your Character</h3>
              <p className="text-muted-foreground">
                Make sure everything looks perfect before creating
              </p>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  {character.avatarUrl && (
                    <img
                      src={character.avatarUrl}
                      alt={character.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <h4 className="font-semibold text-lg">{character.name}</h4>
                    <p className="text-muted-foreground">{character.bio}</p>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Personality Traits</h5>
                  <div className="flex flex-wrap gap-1">
                    {character.personality.map((trait) => (
                      <Badge key={trait} variant="secondary">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-medium mb-2">Personality Settings</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(character.personalityTraits).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="capitalize">{key}:</span>
                        <span>{value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {character.voice && (
                  <div>
                    <h5 className="font-medium mb-2">Voice</h5>
                    <p className="text-sm text-muted-foreground">
                      {character.voice.name} - {character.voice.description}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  if (usageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Your AI Companion</h1>
            <p className="text-muted-foreground">
              Design the perfect AI companion just for you
            </p>
          </div>

          <Card className="p-6">
            <div className="mb-6">
              <Stepper
                steps={steps}
                currentStep={currentStepIndex}
              />
              <Progress value={progress} className="mt-4" />
            </div>

            <div className="mb-8">
              {renderStep()}
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStepIndex === 0}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep === "Review" ? (
                <Button
                  onClick={createCharacter}
                  disabled={saving || !canProceed()}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Heart className="w-4 h-4 mr-2" />
                  )}
                  {saving ? 'Creating...' : 'Create Companion'}
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>

      {showUpgradePrompt && (
        <UpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => hideUpgrade()}
          onUpgrade={() => handleUpgrade({ planId: upgradePlan || 'premium' })}
          isUpgrading={isUpgrading}
          currentPlan={usage?.plan || 'free'}
        />
      )}
    </div>
  );
};

export default Create;
