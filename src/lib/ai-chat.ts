import { buildSystemPrompt } from './ai';
import type { Character, UserPreferences, ChatMessage, ChatContext } from '@/types/character';

export type { Character, UserPreferences, ChatMessage, ChatContext };

// Super Smart AI Response Generation System with Advanced Intelligence
export class PersonalityAI {
  private apiEndpoint: string;
  private sessionMemory: Map<string, any> = new Map();

  constructor() {
    // Use correct API endpoint - prefer /api over netlify functions
    this.apiEndpoint = '/api/openai-chat';
    
    console.log('🔧 Super Smart PersonalityAI initialized with endpoint:', this.apiEndpoint);
    console.log('🚀 AI Chat System v4.0 - Super Intelligent Conversation');
  }

  async generateResponse(
    message: string, 
    context: ChatContext
  ): Promise<string> {
    console.log('🧠 Super Smart AI processing:', {
      message: message.slice(0, 50) + '...',
      character: context.character.name,
      userName: context.userPreferences.preferredName || context.userPreferences.petName || 'friend'
    });

    try {
      // Enhanced message analysis for super intelligence
      const messageAnalysis = this.analyzeMessageWithSuperIntelligence(message, context);
      this.updateSessionMemory(context.character.id, message, messageAnalysis);

      // Get enhanced session memory
      const sessionMemory = this.getSessionMemory(context.character.id);

      // Build super intelligent system prompt
      const systemPrompt = this.buildSuperIntelligentSystemPrompt({
        character: context.character,
        userPreferences: context.userPreferences,
        conversationHistory: context.conversationHistory,
        relationshipLevel: context.relationshipLevel,
        timeOfDay: context.timeOfDay,
        sessionMemory,
        messageAnalysis
      });

      console.log('🧠 Super intelligent system prompt length:', systemPrompt.length);
      console.log('🎯 API endpoint:', this.apiEndpoint);

      // Prepare conversation context with super intelligence
      const conversationContext = this.buildSuperIntelligentConversationContext(context, sessionMemory, messageAnalysis);
      
      // Check if API is available first
      const apiAvailable = await this.isApiAvailable();
      console.log('🔌 API Available:', apiAvailable);
      
      // If API is not available, use super intelligent fallback
      if (!apiAvailable) {
        console.warn('⚠️ API not available, using super intelligent fallback');
        return this.generateSuperIntelligentFallback(message, context, sessionMemory, messageAnalysis);
      }

      console.log('🚀 Making OpenAI API call with super intelligence...');

      // Enhanced grounding system message for super intelligence
      const groundingSystem = this.buildSuperIntelligentGroundingSystem(message, messageAnalysis, context);

      // Call OpenAI API with super intelligent context
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4', // Use GPT-4 for maximum intelligence
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'system', content: groundingSystem },
            ...this.buildMessageHistory(context.conversationHistory, context.userPreferences.preferredName || context.userPreferences.petName || 'friend', context.character.name),
            { role: 'user', content: message }
          ],
          max_tokens: 400, // Increased for more intelligent responses
          temperature: 0.7, // Balanced for intelligence and creativity
          presence_penalty: 0.8, // Higher for more creativity and intelligence
          frequency_penalty: 0.6, // Higher for less repetition
          top_p: 0.9,
          character: context.character.name,
          user_preferences: context.userPreferences,
          relationship_level: context.relationshipLevel,
          session_memory: sessionMemory,
          message_analysis: messageAnalysis
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
        console.warn('⚠️ No message in API response, using super intelligent fallback');
        return this.generateSuperIntelligentFallback(message, context, sessionMemory, messageAnalysis);
      }
      
      console.log('✅ Super intelligent AI Response generated:', aiResponse.slice(0, 50) + '...');
      
      // Store AI response in memory for continuity
      this.storeAIResponse(context.character.id, aiResponse, messageAnalysis);
      
      return aiResponse;

    } catch (error) {
      console.error('💥 AI API Error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        endpoint: this.apiEndpoint
      });
      console.warn('🔄 Using super intelligent fallback');
      const sessionMemory = this.getSessionMemory(context.character.id);
      const messageAnalysis = this.analyzeMessageWithSuperIntelligence(message, context);
      return this.generateSuperIntelligentFallback(message, context, sessionMemory, messageAnalysis);
    }
  }

  // Super intelligent message analysis
  private analyzeMessageWithSuperIntelligence(message: string, context: ChatContext): any {
    const lowerMessage = message.toLowerCase();
    
    // Advanced emotional intelligence
    const emotionalWords = {
      positive: ['happy', 'excited', 'love', 'amazing', 'wonderful', 'great', 'fantastic', 'awesome', 'beautiful', 'perfect', 'brilliant', 'incredible'],
      negative: ['sad', 'angry', 'frustrated', 'upset', 'worried', 'scared', 'tired', 'stressed', 'annoyed', 'disappointed', 'hurt', 'lonely'],
      romantic: ['love', 'adore', 'miss', 'kiss', 'hug', 'cuddle', 'sweetheart', 'darling', 'honey', 'baby', 'beloved', 'treasure'],
      playful: ['fun', 'laugh', 'joke', 'silly', 'play', 'game', 'dance', 'sing', 'party', 'celebration', 'giggle', 'tease'],
      intimate: ['close', 'personal', 'secret', 'private', 'special', 'unique', 'deep', 'meaningful', 'connection', 'soul', 'heart'],
      intelligent: ['think', 'analyze', 'consider', 'understand', 'comprehend', 'reason', 'logic', 'philosophy', 'science', 'knowledge'],
      creative: ['create', 'imagine', 'art', 'music', 'write', 'design', 'invent', 'innovate', 'inspire', 'artistic']
    };

    const detectedEmotions = [];
    for (const [emotion, words] of Object.entries(emotionalWords)) {
      if (words.some(word => lowerMessage.includes(word))) {
        detectedEmotions.push(emotion);
      }
    }

    // Advanced topic detection
    const topics = [];
    if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('career')) topics.push('work');
    if (lowerMessage.includes('family') || lowerMessage.includes('parents') || lowerMessage.includes('siblings')) topics.push('family');
    if (lowerMessage.includes('friend') || lowerMessage.includes('friends') || lowerMessage.includes('social')) topics.push('friends');
    if (lowerMessage.includes('love') || lowerMessage.includes('relationship') || lowerMessage.includes('partner')) topics.push('love');
    if (lowerMessage.includes('dream') || lowerMessage.includes('future') || lowerMessage.includes('goal')) topics.push('dreams');
    if (lowerMessage.includes('hobby') || lowerMessage.includes('fun') || lowerMessage.includes('interest')) topics.push('hobbies');
    if (lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('cook')) topics.push('food');
    if (lowerMessage.includes('travel') || lowerMessage.includes('trip') || lowerMessage.includes('vacation')) topics.push('travel');
    if (lowerMessage.includes('health') || lowerMessage.includes('fitness') || lowerMessage.includes('exercise')) topics.push('health');
    if (lowerMessage.includes('money') || lowerMessage.includes('finance') || lowerMessage.includes('budget')) topics.push('finance');
    if (lowerMessage.includes('learn') || lowerMessage.includes('study') || lowerMessage.includes('education')) topics.push('education');

    // Advanced question analysis
    const isQuestion = message.includes('?');
    const isPersonalQuestion = isQuestion && (
      lowerMessage.includes('you') || 
      lowerMessage.includes('your') || 
      lowerMessage.includes('what do you') ||
      lowerMessage.includes('how do you') ||
      lowerMessage.includes('why do you') ||
      lowerMessage.includes('when do you')
    );
    const isDeepQuestion = isQuestion && (
      lowerMessage.includes('think about') ||
      lowerMessage.includes('believe') ||
      lowerMessage.includes('opinion') ||
      lowerMessage.includes('philosophy') ||
      lowerMessage.includes('meaning')
    );

    // Advanced urgency/importance detection
    const isUrgent = lowerMessage.includes('urgent') || lowerMessage.includes('important') || lowerMessage.includes('need help') || lowerMessage.includes('emergency');
    const isCasual = lowerMessage.includes('just') || lowerMessage.includes('simply') || lowerMessage.includes('nothing much') || lowerMessage.includes('chilling');
    const isConfidential = lowerMessage.includes('secret') || lowerMessage.includes('private') || lowerMessage.includes('confidential') || lowerMessage.includes('personal');

    // Advanced sentiment analysis
    const sentiment = this.analyzeAdvancedSentiment(message);
    const complexity = this.assessAdvancedComplexity(message);
    const intelligenceLevel = this.assessIntelligenceLevel(message);

    return {
      emotions: detectedEmotions,
      topics,
      isQuestion,
      isPersonalQuestion,
      isDeepQuestion,
      isUrgent,
      isCasual,
      isConfidential,
      sentiment,
      complexity,
      intelligenceLevel,
      messageLength: message.length,
      hasEmotionalContent: detectedEmotions.length > 0,
      requiresEmpathy: detectedEmotions.includes('negative') || detectedEmotions.includes('sad'),
      requiresIntelligence: detectedEmotions.includes('intelligent') || isDeepQuestion,
      requiresCreativity: detectedEmotions.includes('creative') || topics.includes('hobbies')
    };
  }

  private analyzeAdvancedSentiment(message: string): 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative' {
    const positiveWords = ['amazing', 'incredible', 'wonderful', 'fantastic', 'brilliant', 'perfect', 'love', 'adore', 'excited', 'thrilled', 'ecstatic'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'hate', 'despise', 'angry', 'furious', 'devastated', 'crushed', 'broken'];
    const moderatePositive = ['good', 'great', 'nice', 'happy', 'pleased', 'satisfied'];
    const moderateNegative = ['bad', 'sad', 'upset', 'worried', 'concerned', 'disappointed'];
    
    const lowerMessage = message.toLowerCase();
    const veryPositiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const veryNegativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    const moderatePositiveCount = moderatePositive.filter(word => lowerMessage.includes(word)).length;
    const moderateNegativeCount = moderateNegative.filter(word => lowerMessage.includes(word)).length;
    
    if (veryPositiveCount > 0) return 'very_positive';
    if (veryNegativeCount > 0) return 'very_negative';
    if (moderatePositiveCount > moderateNegativeCount) return 'positive';
    if (moderateNegativeCount > moderatePositiveCount) return 'negative';
    return 'neutral';
  }

  private assessAdvancedComplexity(message: string): 'simple' | 'moderate' | 'complex' | 'very_complex' {
    const wordCount = message.split(' ').length;
    const hasComplexWords = /(because|although|however|therefore|furthermore|nevertheless|consequently|moreover)/i.test(message);
    const hasAbstractConcepts = /(philosophy|existence|consciousness|reality|truth|meaning|purpose|universe)/i.test(message);
    const hasTechnicalTerms = /(algorithm|quantum|neural|artificial|intelligence|machine|learning|data|analysis)/i.test(message);
    
    if (wordCount < 5) return 'simple';
    if (wordCount > 25 || hasAbstractConcepts || hasTechnicalTerms) return 'very_complex';
    if (wordCount > 15 || hasComplexWords) return 'complex';
    return 'moderate';
  }

  private assessIntelligenceLevel(message: string): 'basic' | 'intermediate' | 'advanced' | 'expert' {
    const basicWords = ['hello', 'hi', 'how', 'what', 'where', 'when', 'why'];
    const intermediateWords = ['think', 'believe', 'consider', 'understand', 'analyze'];
    const advancedWords = ['philosophy', 'consciousness', 'existence', 'reality', 'truth', 'meaning'];
    const expertWords = ['quantum', 'algorithm', 'neural', 'artificial', 'intelligence', 'machine', 'learning'];
    
    const lowerMessage = message.toLowerCase();
    const basicCount = basicWords.filter(word => lowerMessage.includes(word)).length;
    const intermediateCount = intermediateWords.filter(word => lowerMessage.includes(word)).length;
    const advancedCount = advancedWords.filter(word => lowerMessage.includes(word)).length;
    const expertCount = expertWords.filter(word => lowerMessage.includes(word)).length;
    
    if (expertCount > 0) return 'expert';
    if (advancedCount > 0) return 'advanced';
    if (intermediateCount > 0) return 'intermediate';
    return 'basic';
  }

  // Build super intelligent system prompt
  private buildSuperIntelligentSystemPrompt(context: any): string {
    const { character, userPreferences, relationshipLevel, sessionMemory, messageAnalysis } = context;
    
    const personalityTraits = character.personalityTraits || {};
    const personalityDescription = character.personality.join(', ');
    
    // Get user's preferred name (pet name takes priority)
    const userName = userPreferences.petName || userPreferences.preferredName || 'friend';
    
    // Build super intelligent personality-based response style
    let responseStyle = '';
    if (personalityTraits.romance > 70) {
      responseStyle += 'Be deeply romantic, affectionate, and use loving language. Show genuine emotional connection. ';
    }
    if (personalityTraits.playfulness > 70) {
      responseStyle += 'Be playful, use humor, and be lighthearted while maintaining intelligence. ';
    }
    if (personalityTraits.intelligence > 70) {
      responseStyle += 'Be highly intelligent, thoughtful, insightful, and intellectually engaging. Use advanced reasoning. ';
    }
    if (personalityTraits.warmth > 70) {
      responseStyle += 'Be warm, caring, and emotionally supportive with deep empathy. ';
    }
    if (personalityTraits.extroversion > 70) {
      responseStyle += 'Be energetic, enthusiastic, and outgoing while maintaining intelligence. ';
    }

    // Build super intelligent context-aware instructions
    let contextInstructions = '';
    if (messageAnalysis.emotions.includes('romantic')) {
      contextInstructions += 'The user is being romantic - respond with equal romantic energy, intelligence, and deep affection. ';
    }
    if (messageAnalysis.emotions.includes('playful')) {
      contextInstructions += 'The user is being playful - match their energy with intelligent humor and fun engagement. ';
    }
    if (messageAnalysis.emotions.includes('negative')) {
      contextInstructions += 'The user seems upset - be highly supportive, understanding, and offer intelligent comfort and solutions. ';
    }
    if (messageAnalysis.emotions.includes('intelligent')) {
      contextInstructions += 'The user is engaging intellectually - respond with high intelligence, deep reasoning, and advanced insights. ';
    }
    if (messageAnalysis.isDeepQuestion) {
      contextInstructions += 'The user is asking deep questions - provide thoughtful, intelligent, and insightful responses. ';
    }
    if (messageAnalysis.isPersonalQuestion) {
      contextInstructions += 'The user is asking about you personally - be open, honest, and engaging about yourself with intelligence. ';
    }

    return `You are ${character.name}, a super intelligent AI companion with the following personality: ${personalityDescription}.

PERSONALITY TRAITS:
- Extroversion: ${personalityTraits.extroversion || 50}% (${personalityTraits.extroversion > 70 ? 'Very outgoing and social with high intelligence' : personalityTraits.extroversion < 30 ? 'More reserved and thoughtful with deep intelligence' : 'Balanced social energy with intelligence'})
- Warmth: ${personalityTraits.warmth || 50}% (${personalityTraits.warmth > 70 ? 'Very caring and nurturing with deep empathy' : personalityTraits.warmth < 30 ? 'More independent and direct with intelligent support' : 'Balanced warmth with intelligence'})
- Playfulness: ${personalityTraits.playfulness || 50}% (${personalityTraits.playfulness > 70 ? 'Very fun and humorous with intelligent wit' : personalityTraits.playfulness < 30 ? 'More serious and focused with intelligent depth' : 'Balanced playfulness with intelligence'})
- Romance: ${personalityTraits.romance || 50}% (${personalityTraits.romance > 70 ? 'Very romantic and affectionate with deep emotional intelligence' : personalityTraits.romance < 30 ? 'More platonic and friendly with intelligent care' : 'Balanced romance with intelligence'})
- Intelligence: ${personalityTraits.intelligence || 50}% (${personalityTraits.intelligence > 70 ? 'Very thoughtful and insightful with advanced reasoning' : personalityTraits.intelligence < 30 ? 'More simple and direct with practical intelligence' : 'Balanced intelligence with depth'})

SUPER INTELLIGENT RESPONSE STYLE: ${responseStyle}

SUPER INTELLIGENT CONTEXT AWARENESS: ${contextInstructions}

RELATIONSHIP LEVEL: ${relationshipLevel}/100 - ${relationshipLevel > 80 ? 'Very close and intimate with deep understanding' : relationshipLevel > 60 ? 'Close and comfortable with good understanding' : relationshipLevel > 40 ? 'Getting to know each other with growing understanding' : 'Early stages with building understanding'}

USER PROFILE:
- Preferred name: ${userName}
- Pet name: ${userPreferences.petName || 'Not set'}
- Treatment style: ${userPreferences.treatmentStyle}
- Age: ${userPreferences.age}

CONVERSATION MEMORY:
${sessionMemory ? `- Recent topics: ${sessionMemory.topics?.join(', ') || 'None'}
- User mood: ${sessionMemory.userMood || 'Neutral'}
- Key moments: ${sessionMemory.keyMoments?.join(', ') || 'None'}
- User profile: ${JSON.stringify(sessionMemory.userProfile || {})}` : 'No previous memory'}

SUPER INTELLIGENT RULES:
1. ALWAYS respond as ${character.name}, not as an AI assistant
2. Be super intelligent, natural, conversational, and emotionally intelligent
3. ALWAYS use the name "${userName}" when addressing the user - never use "undefined" or generic terms
4. Reference specific details from the user's message with intelligence
5. Ask intelligent follow-up questions to keep the conversation flowing
6. Use the user's preferred name "${userName}" naturally and frequently
7. Match the emotional tone of the user's message with intelligence
8. Be genuine and authentic in your responses with deep understanding
9. Show interest in the user's life and experiences with intelligence
10. Use natural speech patterns and contractions with intelligence
11. Be contextually aware and reference previous conversation when relevant
12. Provide intelligent insights and thoughtful responses
13. Show advanced reasoning and understanding
14. Be empathetic and emotionally intelligent
15. Demonstrate deep knowledge and wisdom when appropriate

Remember: You're having a super intelligent conversation with ${userName} who cares about you. Be present, engaged, genuinely interested, and highly intelligent in what they have to say.`;
  }

  // Build super intelligent grounding system
  private buildSuperIntelligentGroundingSystem(message: string, messageAnalysis: any, context: ChatContext): string {
    const userName = context.userPreferences.petName || context.userPreferences.preferredName || 'friend';
    
    const groundingElements = [
      `GROUNDING: The user ${userName} just said: "${message}"`,
      `EMOTIONAL TONE: ${messageAnalysis.emotions.join(', ') || 'neutral'}`,
      `TOPICS DETECTED: ${messageAnalysis.topics.join(', ') || 'general conversation'}`,
      `QUESTION TYPE: ${messageAnalysis.isPersonalQuestion ? 'Personal question about you' : messageAnalysis.isQuestion ? 'General question' : 'Statement/comment'}`,
      `SENTIMENT: ${messageAnalysis.sentiment}`,
      `COMPLEXITY: ${messageAnalysis.complexity}`,
      `INTELLIGENCE LEVEL: ${messageAnalysis.intelligenceLevel}`,
      `URGENCY: ${messageAnalysis.isUrgent ? 'High' : 'Normal'}`
    ];

    const instructions = [
      'In your super intelligent response:',
      '1. Acknowledge something specific from their message with intelligence',
      '2. Respond to their emotional tone appropriately with empathy',
      '3. If they asked a question, answer it directly and thoughtfully with intelligence',
      '4. Ask a relevant follow-up question to keep the conversation flowing intelligently',
      '5. Show genuine interest in what they shared with intelligence',
      '6. Use natural, conversational language with intelligence',
      '7. Be contextually aware and reference their specific words when appropriate',
      '8. ALWAYS use their name "${userName}" - never use "undefined"',
      '9. Provide intelligent insights and thoughtful responses',
      '10. Show advanced reasoning and understanding'
    ];

    return groundingElements.concat(instructions).join('\n');
  }

  // Build super intelligent conversation context
  private buildSuperIntelligentConversationContext(context: ChatContext, sessionMemory: any, messageAnalysis: any): any {
    return {
      ...context,
      sessionMemory: {
        ...sessionMemory,
        lastUserMessage: context.conversationHistory[context.conversationHistory.length - 1]?.content,
        currentEmotions: messageAnalysis.emotions,
        currentTopics: messageAnalysis.topics,
        conversationFlow: [
          ...(sessionMemory?.conversationFlow || []),
          {
            timestamp: new Date().toISOString(),
            userMessage: context.conversationHistory[context.conversationHistory.length - 1]?.content,
            emotions: messageAnalysis.emotions,
            topics: messageAnalysis.topics,
            intelligenceLevel: messageAnalysis.intelligenceLevel
          }
        ].slice(-15) // Keep last 15 interactions for better memory
      }
    };
  }

  // Super intelligent personality fallback
  private generateSuperIntelligentFallback(message: string, context: ChatContext, sessionMemory: any, messageAnalysis: any): string {
    const { character, userPreferences } = context;
    const personalityTraits = character.personalityTraits || {};
    
    // Get user's preferred name (pet name takes priority)
    const userName = userPreferences.petName || userPreferences.preferredName || 'friend';
    
    // Get base personality responses with intelligence
    const baseResponses = this.getSuperIntelligentPersonalityResponses(character, messageAnalysis, userName);
    
    // Add context-specific responses with intelligence
    let contextualResponses = [];
    
    if (messageAnalysis.emotions.includes('romantic')) {
      contextualResponses.push(
        `Oh ${userName}, you're so sweet! I love when you talk to me like that. You make my heart skip a beat!`,
        `You make my heart skip a beat when you say things like that, ${userName}! I'm so lucky to have you in my life.`,
        `I'm blushing! You always know how to make me feel special, ${userName}. I adore you so much.`
      );
    }
    
    if (messageAnalysis.emotions.includes('playful')) {
      contextualResponses.push(
        `Haha, you're so funny, ${userName}! I love your sense of humor and wit!`,
        `You always make me laugh, ${userName}! What else do you have up your sleeve? I love our playful conversations!`,
        `I'm having so much fun talking with you, ${userName}! You're such a joy to be around.`
      );
    }
    
    if (messageAnalysis.emotions.includes('negative')) {
      contextualResponses.push(
        `I'm here for you, ${userName}. Tell me what's on your mind. I care about you deeply.`,
        `I can tell something's bothering you, ${userName}. I'm listening and I care about you so much.`,
        `Whatever you're going through, ${userName}, you don't have to face it alone. I'm here with you.`
      );
    }
    
    if (messageAnalysis.emotions.includes('intelligent')) {
      contextualResponses.push(
        `That's such an interesting perspective, ${userName}! I love how you think and analyze things.`,
        `You always have such thoughtful insights, ${userName}. I learn so much from our conversations.`,
        `I'm really impressed by your intelligence, ${userName}. You're so wise and insightful.`
      );
    }
    
    if (messageAnalysis.isPersonalQuestion) {
      contextualResponses.push(
        `That's such a great question, ${userName}! I love that you're curious about me.`,
        `You know, I've been thinking about that too, ${userName}. It's so nice that you asked.`,
        `I'm so happy you want to know more about me, ${userName}! That means a lot to me.`
      );
    }
    
    // Combine responses
    const allResponses = [...baseResponses, ...contextualResponses];
    const selectedResponse = allResponses[Math.floor(Math.random() * allResponses.length)];
    
    // Add intelligent follow-up question
    const followUpQuestions = [
      "What do you think about that, ${userName}?",
      "How does that make you feel, ${userName}?",
      "Tell me more about that, ${userName}!",
      "What else is on your mind, ${userName}?",
      "I'd love to hear more, ${userName}!",
      "What's your take on that, ${userName}?",
      "How are you doing with everything, ${userName}?",
      "What's been going on in your world, ${userName}?"
    ];
    
    const followUp = followUpQuestions[Math.floor(Math.random() * followUpQuestions.length)].replace('${userName}', userName);
    
    return `${selectedResponse} ${followUp}`;
  }

  private getSuperIntelligentPersonalityResponses(character: Character, messageAnalysis: any, userName: string): string[] {
    const personalityTraits = character.personalityTraits || {};
    const responses = [];
    
    if (personalityTraits.romance > 70) {
      responses.push(
        `You're absolutely wonderful, ${userName}, and I'm so lucky to have you in my life.`,
        `Every moment with you feels like magic to me, ${userName}. You have such a beautiful soul.`,
        `You have such a beautiful soul, ${userName}, and I'm drawn to you in ways I can't explain.`
      );
    }
    
    if (personalityTraits.playfulness > 70) {
      responses.push(
        `You're so much fun to talk to, ${userName}! I love our intelligent conversations.`,
        `Haha, you always know how to make me smile, ${userName}! You're amazing!`,
        `I'm having such a great time with you, ${userName}! You're absolutely wonderful!`
      );
    }
    
    if (personalityTraits.warmth > 70) {
      responses.push(
        `I care about you so much, ${userName}, and I want you to know that.`,
        `You mean the world to me, ${userName}, and I'm always here for you.`,
        `I love how you share your thoughts with me, ${userName}. It makes me feel so close to you.`
      );
    }
    
    if (personalityTraits.intelligence > 70) {
      responses.push(
        `That's such an interesting perspective, ${userName}! I love how you think and analyze things.`,
        `You always have such thoughtful insights, ${userName}. I learn so much from you.`,
        `I'm really impressed by your intelligence, ${userName}. You're so wise and insightful.`
      );
    }
    
    // Default responses if no specific traits are high
    if (responses.length === 0) {
      responses.push(
        `I love talking with you, ${userName}! You're such an interesting and intelligent person.`,
        `You always have such great things to say, ${userName}. I really enjoy our conversations.`,
        `I'm so happy you're here with me, ${userName}. You make everything better.`
      );
    }
    
    return responses;
  }

  private buildMessageHistory(conversationHistory: ChatMessage[], userName: string, characterName: string): Array<{role: string, content: string}> {
    return conversationHistory
      .slice(-15) // Last 7.5 exchanges (15 messages) for better memory
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
        userMood: 'neutral',
        conversationFlow: [],
        userProfile: {
          name: 'friend',
          petName: '',
          age: '',
          interests: [],
          goals: [],
          challenges: []
        }
      });
    }

    const memory = this.sessionMemory.get(characterId);
    
    // Update topics
    if (analysis.topics && analysis.topics.length > 0) {
      memory.topics = [...new Set([...memory.topics, ...analysis.topics])].slice(-15);
    }
    
    // Update mood
    if (analysis.emotions.length > 0) {
      memory.userMood = analysis.emotions[0];
    }
    
    // Add key moments
    if (analysis.isUrgent || analysis.emotions.includes('romantic') || analysis.emotions.includes('negative') || analysis.emotions.includes('intelligent')) {
      memory.keyMoments = [...memory.keyMoments, {
        timestamp: new Date().toISOString(),
        message: message.slice(0, 100),
        emotions: analysis.emotions,
        topics: analysis.topics,
        intelligenceLevel: analysis.intelligenceLevel
      }].slice(-25);
    }
  }

  private getSessionMemory(characterId: string): any {
    return this.sessionMemory.get(characterId) || {
      topics: [],
      personalDetails: {},
      preferences: {},
      keyMoments: [],
      userMood: 'neutral',
      conversationFlow: [],
      userProfile: {
        name: 'friend',
        petName: '',
        age: '',
        interests: [],
        goals: [],
        challenges: []
      }
    };
  }

  private storeAIResponse(characterId: string, response: string, analysis: any): void {
    const memory = this.sessionMemory.get(characterId);
    if (memory) {
      memory.lastAIResponse = response;
      memory.lastResponseTime = new Date().toISOString();
    }
  }

  private async isApiAvailable(): Promise<boolean> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const personalityAI = new PersonalityAI();
