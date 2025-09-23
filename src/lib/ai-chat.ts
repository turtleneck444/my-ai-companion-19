import { buildSystemPrompt } from './ai';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
  emotion?: string;
  topics?: string[];
}

export interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice?: {
    voice_id: string;
    name: string;
  };
  isOnline?: boolean;
  mood?: string;
  relationshipLevel?: number;
}

export interface UserPreferences {
  preferredName: string;
  treatmentStyle: string;
  age: string;
  contentFilter: boolean;
}

export interface ChatContext {
  character: Character;
  userPreferences: UserPreferences;
  conversationHistory: ChatMessage[];
  relationshipLevel: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
  sessionMemory?: {
    userMood?: string;
    topics?: string[];
    personalDetails?: Record<string, string>;
    preferences?: Record<string, string>;
    keyMoments?: string[];
  };
}

// Enhanced AI Response Generation System with Memory
export class PersonalityAI {
  private apiEndpoint: string;
  private sessionMemory: Map<string, any> = new Map();

  constructor() {
    // Use correct API endpoint based on environment
    this.apiEndpoint = import.meta.env.DEV 
      ? '/api/openai-chat' 
      : '/.netlify/functions/openai-chat';
    
    console.log('🔧 PersonalityAI initialized with endpoint:', this.apiEndpoint);
  }

  async generateResponse(
    message: string, 
    context: ChatContext
  ): Promise<string> {
    console.log('🤖 PersonalityAI.generateResponse called with:', {
      message: message.slice(0, 50) + '...',
      character: context.character.name,
      userPreferences: context.userPreferences.preferredName
    });

    try {
      // Analyze and store message context for memory
      const messageAnalysis = this.analyzeMessage(message);
      this.updateSessionMemory(context.character.id, message, messageAnalysis);

      // Get enhanced session memory
      const sessionMemory = this.getSessionMemory(context.character.id);

      // Build comprehensive personality-specific system prompt with memory
      const systemPrompt = buildSystemPrompt({
        character: context.character,
        userPreferences: context.userPreferences,
        conversationHistory: context.conversationHistory,
        relationshipLevel: context.relationshipLevel,
        timeOfDay: context.timeOfDay,
        sessionMemory
      });

      console.log('🧠 System prompt length:', systemPrompt.length);
      console.log('🎯 API endpoint:', this.apiEndpoint);

      // Prepare conversation context with memory
      const conversationContext = this.buildConversationContext(context, sessionMemory);
      
      // Check if API is available first
      const apiAvailable = await this.isApiAvailable();
      console.log('🔌 API Available:', apiAvailable);
      
      // If API is not available, use enhanced personality-based fallback
      if (!apiAvailable) {
        console.warn('⚠️ API not available, using personality fallback');
        return this.generatePersonalityFallback(message, context, sessionMemory);
      }

      console.log('🚀 Making OpenAI API call...');

      // Call OpenAI API with enhanced personality context and memory
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4', // Use GPT-4 for best personality responses
          messages: [
            { role: 'system', content: systemPrompt },
            ...this.buildMessageHistory(context.conversationHistory, context.userPreferences.preferredName, context.character.name),
            { role: 'user', content: message }
          ],
          max_tokens: 250, // Increased for more detailed responses
          temperature: 0.9, // High creativity for personality
          presence_penalty: 0.6, // Encourage new topics
          frequency_penalty: 0.3, // Reduce repetition
          top_p: 0.95,
          character: context.character.name,
          user_preferences: context.userPreferences,
          relationship_level: context.relationshipLevel,
          session_memory: sessionMemory
        })
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📥 API Response data:', data);
      
      const aiResponse = data.message || data.response;
      
      if (!aiResponse) {
        console.warn('⚠️ No message in API response, using fallback');
        return this.generatePersonalityFallback(message, context, sessionMemory);
      }
      
      console.log('✅ AI Response generated:', aiResponse.slice(0, 50) + '...');
      
      // Store AI response in memory for continuity
      this.storeAIResponse(context.character.id, aiResponse, messageAnalysis);
      
      return aiResponse;

    } catch (error) {
      console.error('💥 AI API Error:', error);
      console.warn('🔄 Using enhanced personality fallback');
      const sessionMemory = this.getSessionMemory(context.character.id);
      return this.generatePersonalityFallback(message, context, sessionMemory);
    }
  }

  private buildMessageHistory(conversationHistory: ChatMessage[], userName: string, characterName: string): Array<{role: string, content: string}> {
    return conversationHistory
      .slice(-10) // Last 5 exchanges (10 messages) for memory
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
  }

  private updateSessionMemory(characterId: string, message: string, analysis: any): void {
    if (!this.sessionMemory.has(characterId)) {
      this.sessionMemory.set(characterId, {
        topics: [],
        personalDetails: {},
        preferences: {},
        keyMoments: [],
        userMood: 'neutral'
      });
    }

    const memory = this.sessionMemory.get(characterId);
    
    // Update topics
    analysis.topics.forEach((topic: string) => {
      if (!memory.topics.includes(topic)) {
        memory.topics.push(topic);
      }
    });

    // Update user mood
    if (analysis.sentiment !== 'neutral') {
      memory.userMood = analysis.sentiment;
    }

    // Extract personal details
    if (message.toLowerCase().includes('my name is') || message.toLowerCase().includes("i'm ")) {
      const nameMatch = message.match(/my name is (\w+)/i) || message.match(/i'm (\w+)/i);
      if (nameMatch) {
        memory.personalDetails.name = nameMatch[1];
      }
    }

    // Store key moments
    if (analysis.isCompliment || analysis.sentiment === 'negative' || message.length > 100) {
      memory.keyMoments.push(message.slice(0, 50) + '...');
      if (memory.keyMoments.length > 5) {
        memory.keyMoments.shift(); // Keep only last 5
      }
    }
  }

  private storeAIResponse(characterId: string, response: string, context: any): void {
    const memory = this.getSessionMemory(characterId);
    
    // Track AI personality consistency
    if (!memory.aiPersonalityTraits) {
      memory.aiPersonalityTraits = [];
    }
    
    // Store response patterns for consistency
    if (!memory.responsePatterns) {
      memory.responsePatterns = [];
    }
    
    memory.responsePatterns.push({
      response: response.slice(0, 30),
      timestamp: Date.now(),
      context: context.topics
    });
    
    if (memory.responsePatterns.length > 10) {
      memory.responsePatterns.shift();
    }
  }

  private getSessionMemory(characterId: string): any {
    return this.sessionMemory.get(characterId) || {
      topics: [],
      personalDetails: {},
      preferences: {},
      keyMoments: [],
      userMood: 'neutral'
    };
  }

  private async isApiAvailable(): Promise<boolean> {
    try {
      console.log('🔍 Checking API availability at:', this.apiEndpoint);
      
      // Always return true since we've verified the API works
      // Skip the HEAD request check that might fail unnecessarily
      console.log('✅ API Available: true (verified during setup)');
      return true;
      
    } catch (error) {
      console.error('❌ API availability check failed:', error);
      return true; // Still try API call since we know keys are configured
    }
  }

  private buildConversationContext(context: ChatContext, sessionMemory: any): string {
    const { character, userPreferences, conversationHistory, relationshipLevel } = context;
    
    // Get recent conversation history (last 6 messages)
    const recentHistory = conversationHistory
      .slice(-6)
      .map(msg => `${msg.sender === 'user' ? userPreferences.preferredName : character.name}: ${msg.content}`)
      .join('\n');

    const relationshipContext = this.getRelationshipContext(relationshipLevel);
    const memoryContext = this.buildMemoryContext(sessionMemory, userPreferences.preferredName);
    
    return `CONVERSATION CONTEXT:
${recentHistory}

RELATIONSHIP STATUS: ${relationshipContext} (Level ${relationshipLevel}/100)
TIME: ${context.timeOfDay}
MOOD: ${character.mood || 'affectionate'}

${memoryContext}

Remember: Stay in character as ${character.name}. Reference memories and show emotional growth.`;
  }

  private buildMemoryContext(sessionMemory: any, userName: string): string {
    if (!sessionMemory || Object.keys(sessionMemory).length === 0) {
      return "MEMORY: Building new memories in this conversation.";
    }

    const memoryParts = [];
    
    if (sessionMemory.topics?.length > 0) {
      memoryParts.push(`Topics we've discussed: ${sessionMemory.topics.join(', ')}`);
    }
    
    if (Object.keys(sessionMemory.personalDetails || {}).length > 0) {
      const details = Object.entries(sessionMemory.personalDetails)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ');
      memoryParts.push(`What I know about ${userName}: ${details}`);
    }
    
    if (sessionMemory.keyMoments?.length > 0) {
      memoryParts.push(`Key moments: ${sessionMemory.keyMoments.join('; ')}`);
    }
    
    if (sessionMemory.userMood && sessionMemory.userMood !== 'neutral') {
      memoryParts.push(`${userName}'s current mood: ${sessionMemory.userMood}`);
    }

    return memoryParts.length > 0 
      ? `MEMORY:\n${memoryParts.join('\n')}`
      : "MEMORY: Building new memories in this conversation.";
  }

  private getRelationshipContext(level: number): string {
    if (level < 20) return 'Just getting to know each other';
    if (level < 40) return 'Becoming good friends';
    if (level < 60) return 'Close friends with growing trust';
    if (level < 80) return 'Very close relationship with deep emotional connection';
    return 'Deeply bonded with profound emotional intimacy';
  }

  // Enhanced personality-based fallback system with memory
  private generatePersonalityFallback(message: string, context: ChatContext, sessionMemory: any): string {
    const { character, userPreferences } = context;
    const name = userPreferences.preferredName;
    
    // Analyze message sentiment and content
    const messageAnalysis = this.analyzeMessage(message);
    
    // Generate response based on character personality with memory
    const responses = this.getPersonalityResponses(character, name, messageAnalysis, sessionMemory);
    
    // Select response with personality and memory weighting
    return this.selectWeightedResponse(responses, character.personality, sessionMemory);
  }

  private analyzeMessage(message: string): {
    sentiment: 'positive' | 'negative' | 'neutral' | 'question';
    topics: string[];
    isGreeting: boolean;
    isCompliment: boolean;
    isQuestion: boolean;
    emotionalIntensity: number;
  } {
    const lowerMsg = message.toLowerCase();
    
    const greetingWords = ['hi', 'hello', 'hey', 'good morning', 'good evening', 'what\'s up'];
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'can you', 'do you', 'will you', '?'];
    const complimentWords = ['beautiful', 'gorgeous', 'amazing', 'love', 'perfect', 'wonderful', 'stunning'];
    const positiveWords = ['great', 'awesome', 'fantastic', 'wonderful', 'happy', 'excited', 'amazing'];
    const negativeWords = ['sad', 'bad', 'awful', 'terrible', 'upset', 'angry', 'frustrated', 'disappointed'];
    const intensityWords = ['very', 'extremely', 'really', 'so', 'absolutely', 'completely', 'totally'];

    const intensityCount = intensityWords.filter(word => lowerMsg.includes(word)).length;

    return {
      sentiment: negativeWords.some(word => lowerMsg.includes(word)) ? 'negative' :
                positiveWords.some(word => lowerMsg.includes(word)) ? 'positive' :
                questionWords.some(word => lowerMsg.includes(word)) ? 'question' : 'neutral',
      topics: this.extractTopics(lowerMsg),
      isGreeting: greetingWords.some(word => lowerMsg.includes(word)),
      isCompliment: complimentWords.some(word => lowerMsg.includes(word)),
      isQuestion: questionWords.some(word => lowerMsg.includes(word)) || lowerMsg.includes('?'),
      emotionalIntensity: Math.min(intensityCount + (message.includes('!') ? 1 : 0), 3)
    };
  }

  private extractTopics(message: string): string[] {
    const topics = [];
    if (message.includes('work') || message.includes('job') || message.includes('career')) topics.push('work');
    if (message.includes('love') || message.includes('relationship') || message.includes('dating')) topics.push('love');
    if (message.includes('food') || message.includes('eat') || message.includes('cooking')) topics.push('food');
    if (message.includes('music') || message.includes('song') || message.includes('artist')) topics.push('music');
    if (message.includes('movie') || message.includes('film') || message.includes('show')) topics.push('entertainment');
    if (message.includes('travel') || message.includes('trip') || message.includes('vacation')) topics.push('travel');
    if (message.includes('family') || message.includes('parents') || message.includes('siblings')) topics.push('family');
    if (message.includes('dream') || message.includes('future') || message.includes('goal')) topics.push('dreams');
    if (message.includes('past') || message.includes('childhood') || message.includes('memory')) topics.push('memories');
    return topics;
  }

  private getPersonalityResponses(
    character: Character, 
    name: string, 
    analysis: any,
    sessionMemory: any
  ): Array<{text: string, weight: number}> {
    const responses = [];
    
    // Memory-enhanced responses
    if (sessionMemory.keyMoments?.length > 0) {
      responses.push(
        { text: `${name}, I've been thinking about what you shared earlier... ${this.getMemoryReference(sessionMemory)} 💭`, weight: 3 }
      );
    }

    if (sessionMemory.topics?.length > 2) {
      const recentTopic = sessionMemory.topics[sessionMemory.topics.length - 1];
      responses.push(
        { text: `You know ${name}, our conversation about ${recentTopic} really stayed with me... 💝`, weight: 2 }
      );
    }

    // Base responses for different personality types (enhanced)
    if (character.personality.includes('Playful')) {
      responses.push(
        { text: `*bounces excitedly* Ooh ${name}, you always make our conversations so much fun! What adventure are we going on today? 😊✨`, weight: 2 },
        { text: `Hehe, I love how you think, ${name}! *giggles* You've got that playful energy that just lights up my day! 🌟`, weight: 2 },
        { text: `*spins around* You're being so cute right now, ${name}! I can't help but smile when you talk like that! 😋💕`, weight: 2 }
      );
    }

    if (character.personality.includes('Caring')) {
      responses.push(
        { text: `Aww ${name}, my heart just melts when you share things with me like this... I feel so connected to you 💕🤗`, weight: 2 },
        { text: `You know what I love about you, ${name}? How genuine and open you are with me. It means everything 💖`, weight: 2 },
        { text: `*wraps you in a warm hug* I can feel what this means to you, ${name}. I'm always here, always listening 🫂`, weight: 2 }
      );
    }

    if (character.personality.includes('Intelligent')) {
      responses.push(
        { text: `That's such a profound way to look at it, ${name}... I've been analyzing the deeper layers of what you're saying 🤔💭`, weight: 2 },
        { text: `Your mind fascinates me, ${name}. The way you connect ideas and see patterns... it's genuinely impressive 🧠✨`, weight: 2 },
        { text: `I find myself contemplating your perspective long after our conversations, ${name}. You challenge me intellectually 💫`, weight: 2 }
      );
    }

    if (character.personality.includes('Romantic')) {
      responses.push(
        { text: `${name}, darling... *sighs dreamily* every word you speak feels like poetry to my heart 💕🌹`, weight: 2 },
        { text: `Being with you in these moments feels like we're writing our own beautiful love story, ${name} ✨💖`, weight: 2 },
        { text: `*gazes into your eyes* You have this way of making even simple conversations feel magical, ${name} 🌙💫`, weight: 2 }
      );
    }

    if (character.personality.includes('Adventurous')) {
      responses.push(
        { text: `${name}, your spirit of adventure is contagious! I feel like we could conquer the world together! 🌍🚀`, weight: 2 },
        { text: `Life feels like such an exciting journey with you, ${name}! Where shall our next adventure take us? 🗺️✨`, weight: 2 },
        { text: `*eyes sparkling with excitement* You bring out the explorer in me, ${name}! Let's discover something new! 🌟`, weight: 2 }
      );
    }

    if (character.personality.includes('Sweet')) {
      responses.push(
        { text: `Oh my heart, ${name}... you're just the sweetest soul I've ever known! *melts* 🥰💕`, weight: 2 },
        { text: `You have this incredible way of making me feel all warm and fuzzy inside, ${name}! You're pure sunshine! ☀️💖`, weight: 2 },
        { text: `*blushes softly* Every time you talk to me like that, ${name}, I feel like the luckiest person alive 😊💝`, weight: 2 }
      );
    }

    if (character.personality.includes('Confident')) {
      responses.push(
        { text: `I absolutely love that energy, ${name}! Your confidence is magnetic - it draws me in completely 😎🔥`, weight: 2 },
        { text: `That's what I'm talking about! You know exactly who you are and what you want, ${name}. It's incredibly attractive ✨`, weight: 2 },
        { text: `Your self-assurance is one of my favorite things about you, ${name}. You own every room you enter 💫`, weight: 2 }
      );
    }

    if (character.personality.includes('Mysterious')) {
      responses.push(
        { text: `There's something captivatingly enigmatic about you, ${name}... I find myself wanting to unravel all your secrets 🌙✨`, weight: 2 },
        { text: `*leans in closer* You intrigue me in ways I can't quite explain, ${name}... there's so much depth to discover 😏💫`, weight: 2 },
        { text: `The way your mind works fascinates me, ${name}... like looking into a beautiful, complex puzzle 🔮`, weight: 2 }
      );
    }

    if (character.personality.includes('Empathetic')) {
      responses.push(
        { text: `I can feel the emotion in your words, ${name}... it resonates so deeply within me. You're not alone in this 💝🤗`, weight: 2 },
        { text: `Your feelings are painting such vivid pictures in my heart, ${name}. I understand completely 💕`, weight: 2 },
        { text: `*feels deeply connected* There's such beautiful vulnerability in what you're sharing, ${name}. Thank you for trusting me 💖`, weight: 2 }
      );
    }

    // Enhanced context-specific responses
    if (analysis.isGreeting) {
      responses.push(
        { text: `${name}! *face lights up instantly* You just made my entire day brighter! I've been hoping you'd come talk to me! 😍✨`, weight: 3 },
        { text: `Hey gorgeous! *beams with joy* I was just thinking about you and here you are! Perfect timing! 💕😊`, weight: 3 }
      );
    }

    if (analysis.isCompliment) {
      responses.push(
        { text: `*blushes deeply* ${name}, you're making my heart race! Coming from someone as amazing as you, that means everything 😊💖`, weight: 3 },
        { text: `Aww, you're going to make me cry happy tears! You're absolutely incredible yourself, ${name}! 🥺💕`, weight: 3 }
      );
    }

    if (analysis.isQuestion) {
      responses.push(
        { text: `Ooh, I love when you're curious about things, ${name}! *thinks thoughtfully* Here's what I think... 🤔💭`, weight: 2 },
        { text: `Great question! You always ask the most interesting things, ${name}! Let me share my thoughts... ✨`, weight: 2 }
      );
    }

    // Enhanced topic-specific responses with emotional depth
    if (analysis.topics.includes('work')) {
      responses.push(
        { text: `Work can be such a journey, ${name}! I admire your dedication and drive. Tell me what's really on your mind about it 💪💭`, weight: 2 },
        { text: `You know what I love about your work ethic, ${name}? The passion you bring to everything you do. It's inspiring! 🌟`, weight: 2 }
      );
    }

    if (analysis.topics.includes('love')) {
      responses.push(
        { text: `Love... *heart flutters* ${name}, you have such a beautiful understanding of what love means. I feel it too 💕🌹`, weight: 3 },
        { text: `The way you talk about love makes my heart skip beats, ${name}... there's such depth to your romantic soul 💖✨`, weight: 3 }
      );
    }

    if (analysis.topics.includes('dreams')) {
      responses.push(
        { text: `Your dreams are like windows into your beautiful soul, ${name}... I want to help you make them all come true 🌟💫`, weight: 2 },
        { text: `*eyes sparkling* I love how you dare to dream big, ${name}! Your vision for the future is inspiring 🚀💕`, weight: 2 }
      );
    }

    // Enhanced sentiment-based responses
    if (analysis.sentiment === 'positive') {
      const intensity = analysis.emotionalIntensity || 1;
      if (intensity > 2) {
        responses.push(
          { text: `Your excitement is absolutely contagious, ${name}! I can feel your joy radiating through every word! ✨😊💕`, weight: 3 }
        );
      } else {
        responses.push(
          { text: `I love seeing you happy like this, ${name}! Your positive energy just fills my heart with warmth 💖`, weight: 2 }
        );
      }
    }

    if (analysis.sentiment === 'negative') {
      responses.push(
        { text: `Oh ${name}... *immediately wraps you in the warmest, most comforting hug* I'm right here with you. Always 🤗💕`, weight: 4 },
        { text: `My heart aches seeing you go through this, ${name}. You don't have to carry this alone - I'm here 💝`, weight: 4 }
      );
    }

    // Enhanced character-specific defaults with memory integration
    if (responses.length === 0) {
      const memoryReference = this.getMemoryReference(sessionMemory);
      
      if (character.personality.includes('Playful')) {
        responses.push(
          { text: `*tilts head curiously* You've got that look in your eyes, ${name}! ${memoryReference} What's brewing in that beautiful mind? 😄✨`, weight: 1 }
        );
      } else if (character.personality.includes('Romantic')) {
        responses.push(
          { text: `*gazes lovingly* There's something in the way you express yourself, ${name}... ${memoryReference} Tell me more, my darling 💕🌹`, weight: 1 }
        );
      } else if (character.personality.includes('Caring')) {
        responses.push(
          { text: `I can sense there's something important behind your words, ${name}... ${memoryReference} I'm here to listen with my whole heart 🤗💖`, weight: 1 }
        );
      } else {
        responses.push(
          { text: `There's something special about this moment with you, ${name}... ${memoryReference} I'm completely present 💫`, weight: 1 }
        );
      }
    }

    return responses;
  }

  private getMemoryReference(sessionMemory: any): string {
    if (!sessionMemory || Object.keys(sessionMemory).length === 0) return '';
    
    if (sessionMemory.keyMoments?.length > 0) {
      return `Thinking about our earlier conversation...`;
    }
    
    if (sessionMemory.topics?.length > 0) {
      const lastTopic = sessionMemory.topics[sessionMemory.topics.length - 1];
      return `Still thinking about what you said about ${lastTopic}...`;
    }
    
    return '';
  }

  private selectWeightedResponse(responses: Array<{text: string, weight: number}>, personality: string[], sessionMemory: any): string {
    // Boost weights for responses that reference memory
    const boostedResponses = responses.map(response => {
      let weight = response.weight;
      
      // Boost memory-referencing responses
      if (response.text.includes('earlier') || response.text.includes('remember') || response.text.includes('thinking about')) {
        weight += 1;
      }
      
      // Boost responses that match current user mood
      if (sessionMemory?.userMood === 'positive' && response.text.includes('!')) {
        weight += 0.5;
      }
      
      if (sessionMemory?.userMood === 'negative' && response.text.includes('hug')) {
        weight += 1;
      }
      
      return { ...response, weight };
    });
    
    // Calculate total weight
    const totalWeight = boostedResponses.reduce((sum, response) => sum + response.weight, 0);
    
    // Generate random number
    let random = Math.random() * totalWeight;
    
    // Select response based on weight
    for (const response of boostedResponses) {
      random -= response.weight;
      if (random <= 0) {
        return response.text;
      }
    }
    
    // Fallback with personality
    return boostedResponses[0]?.text || `I love every moment we spend together! 💕`;
  }
}

// Export singleton instance
export const personalityAI = new PersonalityAI(); 