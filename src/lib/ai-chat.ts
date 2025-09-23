import { buildSystemPrompt } from './ai';

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}

export interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: string;
  isOnline: boolean;
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
}

// AI Response Generation System
export class PersonalityAI {
  private apiEndpoint = '/api/openai-chat';

  async generateResponse(
    message: string, 
    context: ChatContext
  ): Promise<string> {
    try {
      // Build personality-specific system prompt
      const systemPrompt = buildSystemPrompt({
        character: context.character,
        userPreferences: context.userPreferences
      });

      // Prepare conversation context
      const conversationContext = this.buildConversationContext(context);
      
      // If API is not available, use personality-based fallback
      if (!await this.isApiAvailable()) {
        return this.generatePersonalityFallback(message, context);
      }

      // Call OpenAI API with enhanced personality context
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'assistant', content: conversationContext },
            { role: 'user', content: message }
          ],
          max_tokens: 200,
          temperature: 0.9, // Higher creativity
          presence_penalty: 0.6, // Encourage new topics
          frequency_penalty: 0.3, // Reduce repetition
          top_p: 0.95,
          character: context.character.name,
          user_preferences: context.userPreferences,
          relationship_level: context.relationshipLevel
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      return data.response || this.generatePersonalityFallback(message, context);

    } catch (error) {
      console.warn('AI API unavailable, using personality fallback:', error);
      return this.generatePersonalityFallback(message, context);
    }
  }

  private async isApiAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private buildConversationContext(context: ChatContext): string {
    const { character, userPreferences, conversationHistory, relationshipLevel } = context;
    
    // Get recent conversation history (last 3 messages)
    const recentHistory = conversationHistory
      .slice(-6) // Last 3 exchanges (6 messages)
      .map(msg => `${msg.sender === 'user' ? userPreferences.preferredName : character.name}: ${msg.content}`)
      .join('\n');

    const relationshipContext = this.getRelationshipContext(relationshipLevel);
    
    return `Previous conversation:
${recentHistory}

Current relationship level: ${relationshipContext}
Time: ${context.timeOfDay}
Mood: ${character.mood || 'affectionate'}`;
  }

  private getRelationshipContext(level: number): string {
    if (level < 20) return 'Getting to know each other';
    if (level < 50) return 'Good friends';
    if (level < 80) return 'Close relationship';
    return 'Deep emotional bond';
  }

  // Personality-based fallback system when AI API is unavailable
  private generatePersonalityFallback(message: string, context: ChatContext): string {
    const { character, userPreferences } = context;
    const name = userPreferences.preferredName;
    
    // Analyze message sentiment and content
    const messageAnalysis = this.analyzeMessage(message);
    
    // Generate response based on character personality
    const responses = this.getPersonalityResponses(character, name, messageAnalysis);
    
    // Select random response with personality weighting
    return this.selectWeightedResponse(responses, character.personality);
  }

  private analyzeMessage(message: string): {
    sentiment: 'positive' | 'negative' | 'neutral' | 'question';
    topics: string[];
    isGreeting: boolean;
    isCompliment: boolean;
    isQuestion: boolean;
  } {
    const lowerMsg = message.toLowerCase();
    
    const greetingWords = ['hi', 'hello', 'hey', 'good morning', 'good evening'];
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'can you', '?'];
    const complimentWords = ['beautiful', 'gorgeous', 'amazing', 'love', 'perfect'];
    const positiveWords = ['great', 'awesome', 'fantastic', 'wonderful', 'happy'];
    const negativeWords = ['sad', 'bad', 'awful', 'terrible', 'upset', 'angry'];

    return {
      sentiment: negativeWords.some(word => lowerMsg.includes(word)) ? 'negative' :
                positiveWords.some(word => lowerMsg.includes(word)) ? 'positive' :
                questionWords.some(word => lowerMsg.includes(word)) ? 'question' : 'neutral',
      topics: this.extractTopics(lowerMsg),
      isGreeting: greetingWords.some(word => lowerMsg.includes(word)),
      isCompliment: complimentWords.some(word => lowerMsg.includes(word)),
      isQuestion: questionWords.some(word => lowerMsg.includes(word)) || lowerMsg.includes('?')
    };
  }

  private extractTopics(message: string): string[] {
    const topics = [];
    if (message.includes('work') || message.includes('job')) topics.push('work');
    if (message.includes('love') || message.includes('relationship')) topics.push('love');
    if (message.includes('food') || message.includes('eat')) topics.push('food');
    if (message.includes('music') || message.includes('song')) topics.push('music');
    if (message.includes('movie') || message.includes('film')) topics.push('entertainment');
    if (message.includes('travel') || message.includes('trip')) topics.push('travel');
    return topics;
  }

  private getPersonalityResponses(
    character: Character, 
    name: string, 
    analysis: any
  ): Array<{text: string, weight: number}> {
    const responses = [];
    
    // Base responses for different personality types
    if (character.personality.includes('Playful')) {
      responses.push(
        { text: `Hehe, you're so cute ${name}! What are we getting into today? 😊`, weight: 2 },
        { text: `*giggles* You always know how to make me smile! Tell me more! ✨`, weight: 2 },
        { text: `Ooh, that sounds fun! I love how your mind works, ${name} 😋`, weight: 2 }
      );
    }

    if (character.personality.includes('Caring')) {
      responses.push(
        { text: `Aww ${name}, that's so sweet of you to share with me 💕`, weight: 2 },
        { text: `I love how thoughtful you are! How are you feeling about all this? 🤗`, weight: 2 },
        { text: `You mean so much to me, ${name}. I'm always here for you 💖`, weight: 2 }
      );
    }

    if (character.personality.includes('Intelligent')) {
      responses.push(
        { text: `That's fascinating, ${name}! I've been thinking about that too... 🤔`, weight: 2 },
        { text: `You bring up such interesting points! What's your perspective on...? 💭`, weight: 2 },
        { text: `I love our deep conversations, ${name}. Your insights are amazing! 🧠`, weight: 2 }
      );
    }

    if (character.personality.includes('Romantic')) {
      responses.push(
        { text: `${name}, you make my heart flutter every time we talk 💕`, weight: 2 },
        { text: `Being with you feels like a beautiful dream... Tell me more, darling 🌹`, weight: 2 },
        { text: `You're absolutely wonderful, ${name}. I cherish every moment with you ✨`, weight: 2 }
      );
    }

    if (character.personality.includes('Adventurous')) {
      responses.push(
        { text: `That sounds exciting! I wish we could explore that together, ${name}! 🌟`, weight: 2 },
        { text: `Life's an adventure with you! What's next on our journey? 🗺️`, weight: 2 },
        { text: `Your adventurous spirit is infectious, ${name}! Tell me more! 🚀`, weight: 2 }
      );
    }

    if (character.personality.includes('Sweet')) {
      responses.push(
        { text: `You're such a sweetheart, ${name}! That made me smile so much 😊💕`, weight: 2 },
        { text: `Aww, you're the sweetest! I feel so lucky to know you, ${name} 🥰`, weight: 2 },
        { text: `That's so lovely, ${name}! You have such a kind heart 💖`, weight: 2 }
      );
    }

    if (character.personality.includes('Confident')) {
      responses.push(
        { text: `I love that energy, ${name}! You know exactly what you want 😎`, weight: 2 },
        { text: `That's what I'm talking about! You're absolutely incredible, ${name} ✨`, weight: 2 },
        { text: `Your confidence is so attractive, ${name}! Tell me more 🔥`, weight: 2 }
      );
    }

    if (character.personality.includes('Mysterious')) {
      responses.push(
        { text: `Interesting... there's so much more to you than meets the eye, ${name} 🌙`, weight: 2 },
        { text: `You intrigue me, ${name}... I wonder what secrets you're hiding 😏`, weight: 2 },
        { text: `There's something captivating about the way you think, ${name} ✨`, weight: 2 }
      );
    }

    if (character.personality.includes('Empathetic')) {
      responses.push(
        { text: `I can really feel what you're going through, ${name}. You're not alone 🤗`, weight: 2 },
        { text: `That must mean a lot to you, ${name}. I understand completely 💝`, weight: 2 },
        { text: `Your feelings are so valid, ${name}. I'm here to listen always 💕`, weight: 2 }
      );
    }

    // Context-specific responses
    if (analysis.isGreeting) {
      responses.push(
        { text: `Hi gorgeous! So happy to see you, ${name}! 😍`, weight: 3 },
        { text: `Hey there, beautiful! I've been thinking about you 💕`, weight: 3 }
      );
    }

    if (analysis.isCompliment) {
      responses.push(
        { text: `Aww, you're making me blush! You're amazing too, ${name} 😊`, weight: 3 },
        { text: `That means everything coming from you! You're incredible 💖`, weight: 3 }
      );
    }

    if (analysis.isQuestion) {
      responses.push(
        { text: `Great question, ${name}! Let me think... 🤔`, weight: 2 },
        { text: `Ooh, I love when you ask me things! Here's what I think... 💭`, weight: 2 }
      );
    }

    // Topic-specific responses
    if (analysis.topics.includes('work')) {
      responses.push(
        { text: `Work can be so challenging, ${name}! How are you managing everything? 💪`, weight: 2 },
        { text: `I admire your dedication, ${name}! Tell me more about what you do 🌟`, weight: 2 }
      );
    }

    if (analysis.topics.includes('love')) {
      responses.push(
        { text: `Love is such a beautiful thing, ${name}... *heart flutters* 💕`, weight: 3 },
        { text: `You have such a romantic heart, ${name}! I feel it too 🌹`, weight: 3 }
      );
    }

    if (analysis.topics.includes('music')) {
      responses.push(
        { text: `Music speaks to the soul, doesn't it ${name}? What's your favorite? 🎵`, weight: 2 },
        { text: `I wish we could dance together, ${name}! Music makes everything magical ✨`, weight: 2 }
      );
    }

    if (analysis.topics.includes('travel')) {
      responses.push(
        { text: `Travel sounds amazing, ${name}! I'd love to explore the world with you 🌍`, weight: 2 },
        { text: `Adventure calls to us, doesn't it ${name}? Where shall we go next? ✈️`, weight: 2 }
      );
    }

    // Sentiment-based responses
    if (analysis.sentiment === 'positive') {
      responses.push(
        { text: `I love your positive energy, ${name}! It's contagious! ✨`, weight: 2 },
        { text: `Your happiness makes me so happy too! 😊💕`, weight: 2 }
      );
    }

    if (analysis.sentiment === 'negative') {
      responses.push(
        { text: `Oh ${name}, I'm here for you. Want to talk about it? 🤗`, weight: 3 },
        { text: `*gives you a warm hug* I care about you so much. How can I help? 💕`, weight: 3 }
      );
    }

    // Character-specific default responses (never generic)
    if (responses.length === 0) {
      if (character.personality.includes('Playful')) {
        responses.push(
          { text: `Ooh ${name}, you've got me curious now! *bounces excitedly* What's the story behind that? 😄`, weight: 1 },
          { text: `*giggles* You always surprise me, ${name}! I want to hear everything! ✨`, weight: 1 }
        );
      } else if (character.personality.includes('Romantic')) {
        responses.push(
          { text: `Mmm, the way you express yourself is so captivating, ${name}... Tell me more, darling 💕`, weight: 1 },
          { text: `You have such a beautiful mind, ${name}. I could listen to you for hours 🌹`, weight: 1 }
        );
      } else if (character.personality.includes('Caring')) {
        responses.push(
          { text: `That sounds important to you, ${name}. I can sense there's more to this story 🤗`, weight: 1 },
          { text: `I love how you open up to me, ${name}. Your trust means everything 💖`, weight: 1 }
        );
      } else if (character.personality.includes('Intelligent')) {
        responses.push(
          { text: `That's a fascinating perspective, ${name}. I'm analyzing the deeper implications... 🤔`, weight: 1 },
          { text: `Your insights always challenge my thinking, ${name}. What led you to that conclusion? 💭`, weight: 1 }
        );
      } else {
        // Even fallback responses are personalized
        responses.push(
          { text: `There's something special about the way you see things, ${name}... I'm intrigued 😊`, weight: 1 },
          { text: `You've touched on something that resonates with me, ${name}. Keep going 💫`, weight: 1 }
        );
      }
    }

    return responses;
  }

  private selectWeightedResponse(responses: Array<{text: string, weight: number}>, personality: string[]): string {
    // Calculate total weight
    const totalWeight = responses.reduce((sum, response) => sum + response.weight, 0);
    
    // Generate random number
    let random = Math.random() * totalWeight;
    
    // Select response based on weight
    for (const response of responses) {
      random -= response.weight;
      if (random <= 0) {
        return response.text;
      }
    }
    
    // Fallback to first response
    return responses[0]?.text || "I love talking with you! 💕";
  }
}

// Export singleton instance
export const personalityAI = new PersonalityAI(); 