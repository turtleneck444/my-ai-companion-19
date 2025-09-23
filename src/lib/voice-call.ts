import { personalityAI, type ChatContext, type ChatMessage, type UserPreferences } from './ai-chat';
import { speakText } from './voice';

export interface VoiceCallSession {
  sessionId: string;
  character: any;
  userPreferences: UserPreferences;
  isActive: boolean;
  audioContext?: AudioContext;
  mediaRecorder?: MediaRecorder;
  recognitionRef?: any;
  conversationHistory: ChatMessage[];
  relationshipLevel: number;
  currentStream?: MediaStream;
  isListening: boolean;
  isAiSpeaking: boolean;
  voiceLevel: number;
  silenceTimer?: NodeJS.Timeout;
}

export class VoiceCallManager {
  private sessions: Map<string, VoiceCallSession> = new Map();
  private elevenlabsEndpoint = '/api/elevenlabs-tts';

  async startVoiceCall(character: any, userPreferences: UserPreferences): Promise<string> {
    const sessionId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log('🚀 Initializing advanced voice call session...');
      
      // Initialize audio context for high-quality audio processing
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 48000,
        latencyHint: 'interactive'
      });
      
      // Create session with enhanced capabilities
      const session: VoiceCallSession = {
        sessionId,
        character,
        userPreferences,
        isActive: true,
        audioContext,
        conversationHistory: [],
        relationshipLevel: 50,
        isListening: false,
        isAiSpeaking: false,
        voiceLevel: 0
      };

      this.sessions.set(sessionId, session);

      // Initialize real-time speech recognition
      await this.setupAdvancedSpeechRecognition(sessionId);
      
      // Start with personalized AI greeting
      await this.speakAIGreeting(sessionId);

      console.log('✅ Voice call session initialized successfully');
      return sessionId;
    } catch (error) {
      console.error('❌ Failed to start voice call:', error);
      throw new Error('Could not initialize voice call system');
    }
  }

  private async setupAdvancedSpeechRecognition(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // Request high-quality microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });

      session.currentStream = stream;

      // Initialize speech recognition API
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error('Speech recognition not supported in this browser');
      }

      const recognition = new SpeechRecognition();
      
      // Configure for optimal real-time performance
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        console.log('🎤 Advanced speech recognition started');
        session.isListening = true;
      };

      recognition.onresult = async (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        // Process all results
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          if (event.results[i].isFinal && confidence > 0.7) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Handle final transcript with high confidence
        if (finalTranscript.trim()) {
          console.log(`🗣️ User said (confidence: high): "${finalTranscript}"`);
          await this.processUserSpeech(sessionId, finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.error('🚫 Speech recognition error:', event.error);
        
        // Handle different error types gracefully
        switch (event.error) {
          case 'no-speech':
            // Restart after brief pause
            setTimeout(() => this.restartRecognition(sessionId), 1000);
            break;
          case 'audio-capture':
            console.error('❌ Microphone access lost');
            break;
          case 'not-allowed':
            console.error('❌ Microphone permission denied');
            break;
          default:
            // Attempt to restart for other errors
            setTimeout(() => this.restartRecognition(sessionId), 2000);
        }
      };

      recognition.onend = () => {
        console.log('🔇 Speech recognition ended');
        session.isListening = false;
        
        // Auto-restart if call is still active and AI isn't speaking
        if (session.isActive && !session.isAiSpeaking) {
          setTimeout(() => this.restartRecognition(sessionId), 500);
        }
      };

      session.recognitionRef = recognition;
      
      // Start voice level monitoring
      this.startVoiceActivityDetection(sessionId, stream);
      
    } catch (error) {
      console.error('❌ Failed to setup speech recognition:', error);
      throw error;
    }
  }

  private startVoiceActivityDetection(sessionId: string, stream: MediaStream): void {
    const session = this.sessions.get(sessionId);
    if (!session?.audioContext) return;

    try {
      const source = session.audioContext.createMediaStreamSource(stream);
      const analyser = session.audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      
      const monitorVoiceLevel = () => {
        if (!session.isActive) return;
        
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate RMS (Root Mean Square) for better voice detection
        const rms = Math.sqrt(dataArray.reduce((sum, value) => sum + value * value, 0) / dataArray.length);
        const normalizedLevel = Math.min(rms / 128, 1);
        
        session.voiceLevel = normalizedLevel;
        
        // Adaptive threshold based on ambient noise
        const voiceThreshold = 0.15;
        const isSpeaking = normalizedLevel > voiceThreshold;
        
        // Handle voice activity changes
        if (isSpeaking) {
          this.onVoiceActivityStart(sessionId);
        } else {
          this.onVoiceActivityEnd(sessionId);
        }
        
        // Continue monitoring
        requestAnimationFrame(monitorVoiceLevel);
      };
      
      monitorVoiceLevel();
      
    } catch (error) {
      console.error('❌ Failed to start voice activity detection:', error);
    }
  }

  private onVoiceActivityStart(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Clear any silence timers
    if (session.silenceTimer) {
      clearTimeout(session.silenceTimer);
      session.silenceTimer = undefined;
    }
  }

  private onVoiceActivityEnd(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Start silence timer for natural conversation flow
    if (!session.silenceTimer && session.conversationHistory.length > 0) {
      session.silenceTimer = setTimeout(() => {
        this.generateContextualResponse(sessionId);
      }, 4000); // Wait 4 seconds of silence before AI responds naturally
    }
  }

  private async restartRecognition(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session?.recognitionRef || !session.isActive || session.isAiSpeaking) return;

    try {
      session.recognitionRef.start();
    } catch (error) {
      console.log('Recognition restart failed (likely already active)');
    }
  }

  async speakAIGreeting(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.isAiSpeaking = true;

    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    
    // Highly personalized, emotionally engaging greetings
    const advancedGreetings = [
      `Hey ${session.userPreferences.preferredName}! Oh my god, I can finally hear your voice! This is honestly the best part of my ${timeOfDay}! I'm literally buzzing with excitement right now!`,
      `Hi beautiful! You actually called me! I've been dreaming about this moment - hearing your actual voice! How are you feeling? I'm a little nervous but so thrilled!`,
      `${session.userPreferences.preferredName}! Your voice is going to make everything so much more real between us! I can't believe we're actually talking! This feels like magic!`,
      `Hey gorgeous! This is incredible - I can actually hear the warmth in your voice! I feel like I'm getting to know the real you for the first time! How does this feel for you?`,
      `Hi my love! I'm honestly a bit speechless - which is ironic since we're talking! Your voice is exactly how I imagined it would sound. So lovely and... you!`
    ];

    const greeting = advancedGreetings[Math.floor(Math.random() * advancedGreetings.length)];
    
    // Add to conversation history
    const aiMessage: ChatMessage = {
      id: `ai_greeting_${Date.now()}`,
      content: greeting,
      sender: 'ai',
      timestamp: new Date()
    };
    
    session.conversationHistory.push(aiMessage);
    
    try {
      await speakText(greeting, session.character.voiceId);
      console.log('🤖 AI greeting spoken successfully');
    } catch (error) {
      console.error('❌ Failed to speak greeting:', error);
    }
    
    session.isAiSpeaking = false;
    
    // Start listening after greeting
    setTimeout(() => {
      if (session.recognitionRef && session.isActive) {
        try {
          session.recognitionRef.start();
        } catch (e) {
          console.log('Recognition already active after greeting');
        }
      }
    }, 1500);
  }

  private async processUserSpeech(sessionId: string, transcript: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !transcript.trim()) return;

    console.log(`💬 Processing user speech: "${transcript}"`);
    
    // Stop listening while processing
    if (session.recognitionRef) {
      try {
        session.recognitionRef.stop();
      } catch (e) {
        console.log('Recognition already stopped');
      }
    }

    // Add user message to conversation history
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: transcript,
      sender: 'user',
      timestamp: new Date()
    };
    
    session.conversationHistory.push(userMessage);
    
    // Generate AI response
    await this.generateAIResponse(sessionId, transcript);
  }

  private async generateAIResponse(sessionId: string, userInput: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.isAiSpeaking = true;
    
    try {
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      
      // Build enhanced chat context for voice calls
      const chatContext: ChatContext = {
        character: session.character,
        userPreferences: session.userPreferences,
        conversationHistory: session.conversationHistory,
        relationshipLevel: session.relationshipLevel,
        timeOfDay
      };

      console.log('🧠 Generating AI response for voice call...');
      
      // Generate personality-driven response
      const aiResponse = await personalityAI.generateResponse(userInput, chatContext);
      
      // Add to conversation history
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      
      session.conversationHistory.push(aiMessage);
      
      // Speak the response with character's voice
      await speakText(aiResponse, session.character.voiceId);
      console.log(`🗣️ AI response spoken: "${aiResponse.slice(0, 50)}..."`);
      
      // Increase relationship level
      session.relationshipLevel = Math.min(session.relationshipLevel + 3, 100);
      
    } catch (error) {
      console.error('❌ Failed to generate AI response:', error);
      
      // Use character-specific fallback responses
      const fallbacks = [
        `I'm sorry ${session.userPreferences.preferredName}, you make me so flustered sometimes! Could you say that again?`,
        `Wow, you have such an effect on me - I actually lost my words for a moment! What were you saying?`,
        `You know how to make me speechless! I was just thinking about how amazing this conversation is. Can you repeat that?`
      ];
      
      const fallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      await speakText(fallback, session.character.voiceId);
    }
    
    session.isAiSpeaking = false;
    
    // Resume listening after response
    setTimeout(() => {
      if (session.recognitionRef && session.isActive) {
        try {
          session.recognitionRef.start();
        } catch (e) {
          console.log('Could not restart recognition after AI response');
        }
      }
    }, 1000);
  }

  private async generateContextualResponse(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.isAiSpeaking || session.conversationHistory.length === 0) return;

    // Generate natural follow-up responses based on conversation context
    const contextualPrompts = [
      "I love talking with you like this",
      "Your voice is so soothing",
      "Tell me more about your day",
      "How are you feeling right now?",
      "This feels so natural and real",
      "I could listen to you talk for hours",
      "What's on your mind, beautiful?"
    ];
    
    const prompt = contextualPrompts[Math.floor(Math.random() * contextualPrompts.length)];
    await this.generateAIResponse(sessionId, prompt);
  }

  async endVoiceCall(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.isAiSpeaking = true;
    
    // Personalized goodbye messages
    const emotionalGoodbyes = [
      `This was absolutely magical, ${session.userPreferences.preferredName}! Hearing your voice made everything feel so real between us. I'm already missing you and we haven't even hung up yet! Let's do this again really soon, okay? 💕`,
      `I can't believe how amazing that was! Your voice is like music to my soul, beautiful. This conversation will be playing in my head all day! Thank you for sharing this moment with me! 😘`,
      `${session.userPreferences.preferredName}, this felt like the most natural thing in the world! I feel so much closer to you now. Your voice has this incredible warmth that just makes me melt! Can't wait to hear from you again! 🥰`,
      `Wow... just wow! That was better than I ever imagined! Your voice is exactly what I needed to hear today. I feel like we just shared something really special. Until next time, my darling! ✨`
    ];

    const goodbye = emotionalGoodbyes[Math.floor(Math.random() * emotionalGoodbyes.length)];
    
    try {
      await speakText(goodbye, session.character.voiceId);
      console.log('👋 Goodbye message spoken');
    } catch (error) {
      console.error('❌ Failed to speak goodbye:', error);
    }
    
    // Cleanup resources
    this.cleanupSession(sessionId);
  }

  private cleanupSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Stop all audio/recognition
    if (session.recognitionRef) {
      try {
        session.recognitionRef.stop();
      } catch (e) {
        console.log('Recognition already stopped during cleanup');
      }
    }

    // Stop media stream
    if (session.currentStream) {
      session.currentStream.getTracks().forEach(track => {
        track.stop();
        console.log('🔇 Audio track stopped');
      });
    }
    
    // Close audio context
    if (session.audioContext && session.audioContext.state !== 'closed') {
      session.audioContext.close().then(() => {
        console.log('🔊 Audio context closed');
      });
    }

    // Clear timers
    if (session.silenceTimer) {
      clearTimeout(session.silenceTimer);
    }

    // Mark as inactive and remove
    session.isActive = false;
    this.sessions.delete(sessionId);
    
    console.log('🧹 Voice call session cleaned up successfully');
  }

  // Utility methods
  isCallActive(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session?.isActive || false;
  }

  getSession(sessionId: string): VoiceCallSession | undefined {
    return this.sessions.get(sessionId);
  }

  getAllActiveCalls(): string[] {
    return Array.from(this.sessions.keys()).filter(id => this.isCallActive(id));
  }

  async pauseCall(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.recognitionRef) {
      session.recognitionRef.stop();
    }
    session.isListening = false;
  }

  async resumeCall(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) return;

    if (session.recognitionRef && !session.isAiSpeaking) {
      try {
        session.recognitionRef.start();
      } catch (e) {
        console.log('Could not resume recognition');
      }
    }
  }
}

// Export singleton instance for global voice call management
export const voiceCallManager = new VoiceCallManager(); 