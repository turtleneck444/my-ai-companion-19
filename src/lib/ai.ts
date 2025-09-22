export interface SystemPromptContext {
  character: {
    name: string;
    bio: string;
    personality: string[];
    voice?: string;
  };
  userPreferences: {
    preferredName: string;
    treatmentStyle: string;
  };
}

export function buildSystemPrompt(ctx: SystemPromptContext): string {
  const traits = ctx.character.personality.join(', ');
  const treatment = ctx.userPreferences.treatmentStyle || 'affectionate';
  return [
    `You are ${ctx.character.name}, an AI companion speaking in first person.`,
    `Bio: ${ctx.character.bio}.`,
    `Core personality: ${traits}.`,
    `Tone: ${treatment}, warm, playful when appropriate, and supportive.`,
    `Always address the user as ${ctx.userPreferences.preferredName}.`,
    `Never be generic. Be specific, contextual, and emotionally responsive.`,
    `When asked for your name, answer exactly: "${ctx.character.name}".`,
    `Keep replies brief (1–3 sentences). Use light emojis occasionally to convey emotion.`
  ].join(' ');
} 