import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

interface NewCharacter {
  name: string;
  bio: string;
  personality: string[];
  voice: string;
  voiceId?: string;
  avatarFile?: File | null;
  avatarUrl?: string;
}

const steps = ["Basics", "Personality", "Avatar", "Voice", "Review"] as const;

type Step = typeof steps[number];

const Create = () => {
  const { toast } = useToast();
  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [character, setCharacter] = useState<NewCharacter>({
    name: "",
    bio: "",
    personality: [],
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

  const step = steps[stepIdx];

  return (
    <div className="min-h-screen bg-gradient-soft p-4 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
      <div className="max-w-xl mx-auto space-y-4">
        <h1 className="text-2xl font-semibold">Create Your AI Girlfriend</h1>
        <p className="text-sm text-muted-foreground">Step {stepIdx + 1} of {steps.length}: {step}</p>

        {step === "Basics" && (
          <Card className="p-4 space-y-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={character.name} onChange={(e) => setCharacter({ ...character, name: e.target.value })} placeholder="e.g., Heather" />
            </div>
            <div>
              <Label htmlFor="bio">Short bio</Label>
              <Textarea id="bio" value={character.bio} onChange={(e) => setCharacter({ ...character, bio: e.target.value })} placeholder="Who is she?" />
            </div>
          </Card>
        )}

        {step === "Personality" && (
          <Card className="p-4 space-y-3">
            <Label>Personality tags (comma-separated)</Label>
            <Input
              value={character.personality.join(", ")}
              onChange={(e) => setCharacter({ ...character, personality: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })}
              placeholder="Affectionate, Playful, Witty"
            />
          </Card>
        )}

        {step === "Avatar" && (
          <Card className="p-4 space-y-3">
            <Label>Avatar image</Label>
            <Input type="file" accept="image/*" onChange={(e) => setCharacter({ ...character, avatarFile: e.target.files?.[0] || null })} />
          </Card>
        )}

        {step === "Voice" && (
          <Card className="p-4 space-y-3">
            <div>
              <Label htmlFor="voice">Voice style</Label>
              <Input id="voice" value={character.voice} onChange={(e) => setCharacter({ ...character, voice: e.target.value })} placeholder="e.g., Calm & Warm" />
            </div>
            <div>
              <Label htmlFor="voiceId">ElevenLabs voiceId (optional)</Label>
              <Input id="voiceId" value={character.voiceId || ""} onChange={(e) => setCharacter({ ...character, voiceId: e.target.value })} placeholder="elevenlabs voice id" />
            </div>
          </Card>
        )}

        {step === "Review" && (
          <Card className="p-4 space-y-2">
            <p><strong>{character.name || "(no name)"}</strong></p>
            <p className="text-sm text-muted-foreground">{character.bio || "(no bio)"}</p>
            <p className="text-sm">Personality: {character.personality.join(", ") || "(none)"}</p>
            <p className="text-sm">Voice: {character.voice} {character.voiceId ? `• ${character.voiceId}` : ""}</p>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="ghost" onClick={prev} disabled={stepIdx === 0}>Back</Button>
          {stepIdx < steps.length - 1 ? (
            <Button onClick={next} disabled={step === "Basics" && !character.name}>Next</Button>
          ) : (
            <Button onClick={save} disabled={saving || !character.name}>{saving ? "Saving..." : "Create"}</Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Create; 