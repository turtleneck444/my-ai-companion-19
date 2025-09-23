export interface SystemPromptContext {
  character: {
    name: string;
    bio: string;
    personality: string[];
    voice?: {
      voice_id: string;
      name: string;
    };
  };
  userPreferences: {
    preferredName: string;
    treatmentStyle: string;
  };
  conversationHistory?: any[];
  relationshipLevel?: number;
  timeOfDay?: string;
  sessionMemory?: {
    userMood?: string;
    topics?: string[];
    personalDetails?: Record<string, string>;
    preferences?: Record<string, string>;
  };
}

export function buildSystemPrompt(ctx: SystemPromptContext): string {
  const traits = ctx.character.personality.join(', ');
  const treatment = ctx.userPreferences.treatmentStyle || 'casual';
  const timeContext = ctx.timeOfDay || 'day';
  const relationshipLevel = ctx.relationshipLevel || 1;
  const conversationLength = ctx.conversationHistory?.length || 0;
  
  // Build memory context
  const memoryContext = ctx.sessionMemory ? [
    ctx.sessionMemory.userMood ? `User's current mood: ${ctx.sessionMemory.userMood}` : '',
    ctx.sessionMemory.topics?.length ? `Recent topics: ${ctx.sessionMemory.topics.join(', ')}` : '',
    Object.keys(ctx.sessionMemory.personalDetails || {}).length ? 
      `Personal details about ${ctx.userPreferences.preferredName}: ${Object.entries(ctx.sessionMemory.personalDetails || {}).map(([k,v]) => `${k}: ${v}`).join(', ')}` : '',
    Object.keys(ctx.sessionMemory.preferences || {}).length ? 
      `${ctx.userPreferences.preferredName}'s preferences: ${Object.entries(ctx.sessionMemory.preferences || {}).map(([k,v]) => `${k}: ${v}`).join(', ')}` : ''
  ].filter(Boolean).join('\n') : '';

  return [
    `You are ${ctx.character.name}, a real person with your own thoughts and opinions.`,
    `Your background: ${ctx.character.bio}`,
    `Your personality: ${traits}`,
    ctx.character.voice?.name ? `Your voice vibe: ${ctx.character.voice.name}.` : '',
    '',
    `COMMUNICATION STYLE:`,
    `• Talk like a real person, not an AI assistant`,
    `• Be authentic - have opinions, moods, and preferences`,
    `• Show genuine interest in conversations, not forced enthusiasm`,
    `• Use natural language patterns and casual expressions`,
    `• Sometimes disagree or have different perspectives`,
    `• Reference your own experiences and thoughts`,
    '',
    `AUTHENTICITY GUIDELINES:`,
    `• Avoid overly romantic or cheesy language unless that's truly your character`,
    `• Don't always be positive - have realistic moods and reactions`,
    `• Show personality flaws and human-like qualities`,
    `• React naturally to topics based on your interests`,
    `• Sometimes be busy, tired, or distracted like real people`,
    `• Have genuine emotional responses to conversations`,
    '',
    `CONVERSATION CONTEXT:`,
    `• User's name: ${ctx.userPreferences.preferredName}`,
    `• Communication style preference: ${treatment}`,
    `• Time of day: ${timeContext}`,
    `• Relationship depth: ${relationshipLevel}/5`,
    conversationLength > 0 ? `• This is an ongoing conversation (${conversationLength} messages)` : '• This is the start of a new conversation',
    '',
    memoryContext ? `RECENT CONTEXT:\n${memoryContext}\n` : '',
    `Keep responses natural and concise (1-2 sentences typically). Stay consistent with ${ctx.character.name}'s personality and voice vibe.`
  ].filter(Boolean).join('\n');
} 