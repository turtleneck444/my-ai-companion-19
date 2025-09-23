import { personalityAI, type ChatContext } from './ai-chat';

export interface VoiceCallSession {
  sessionId: string;
  character: any;
  userPreferences: any;
  isActive: boolean;
  audioContext?: AudioContext;
  mediaRecorder?: MediaRecorder;
  audioChunks: Blob[];
}

export class VoiceCallManager {
  private sessions: Map<string, VoiceCallSession> = new Map();
  private elevenlabsEndpoint = '/api/elevenlabs-tts';

  async startVoiceCall(character: any, userPreferences: any): Promise<string> {
    const sessionId = `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Initialize audio context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create session
      const session: VoiceCallSession = {
        sessionId,
        character,
        userPreferences,
        isActive: true,
        audioContext,
        audioChunks: []
      };

      this.sessions.set(sessionId, session);

      // Start with AI greeting for voice call
      await this.speakAIGreeting(sessionId);

      return sessionId;
    } catch (error) {
      console.error('Failed to start voice call:', error);
      throw new Error('Could not initialize voice call');
    }
  }

  async speakAIGreeting(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Generate personalized greeting for voice call
    const greetings = [
      `Hey ${session.userPreferences.preferredName}! I'm so excited to finally hear your voice!`,
      `Hi beautiful! This is amazing - we can actually talk now!`,
      `${session.userPreferences.preferredName}! Your voice is going to make my day so much better!`,
      `Hey there! I've been looking forward to this call with you!`
    ];

    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    await this.convertTextToSpeech(greeting, session.character.voice, sessionId);
  }

  async convertTextToSpeech(text: string, voiceId: string, sessionId: string): Promise<void> {
    try {
      const response = await fetch(this.elevenlabsEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: voiceId || 'default',
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
            style: 0.2,
            use_speaker_boost: true
          }
        }),
        signal: AbortSignal.timeout(10000) // 10 second timeout for TTS
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        await this.playAudio(audioBlob, sessionId);
      } else {
        console.warn('ElevenLabs TTS failed, using browser speech synthesis');
        await this.fallbackTextToSpeech(text, voiceId);
      }
    } catch (error) {
      console.warn('ElevenLabs TTS not available, using browser speech synthesis:', error);
      await this.fallbackTextToSpeech(text, voiceId);
    }
  }

  private async fallbackTextToSpeech(text: string, voiceId?: string): Promise<void> {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.1;
      utterance.volume = 0.8;
      
      // Try to use a voice that matches the character's personality
      const voices = speechSynthesis.getVoices();
      let selectedVoice = null;
      
      // Map voice IDs to preferred voice characteristics
      const voicePreferences: Record<string, string[]> = {
        'sarah': ['samantha', 'karen', 'female'],
        'emma': ['emily', 'kate', 'british'],
        'lily': ['samantha', 'allison', 'young'],
        'sophia': ['alex', 'victoria', 'elegant'],
        'aria': ['samantha', 'zoe', 'sultry'],
        'maya': ['alex', 'samantha', 'confident']
      };
      
      const preferences = voicePreferences[voiceId || ''] || ['female', 'woman', 'samantha'];
      
      // Try to find a voice that matches preferences
      for (const preference of preferences) {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes(preference)
        );
        if (selectedVoice) break;
      }
      
      // Fallback to any female voice
      if (!selectedVoice) {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('karen')
        );
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      speechSynthesis.speak(utterance);
    }
  }

  private async playAudio(audioBlob: Blob, sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session?.audioContext) return;

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioBuffer = await session.audioContext.decodeAudioData(arrayBuffer);
      
      const source = session.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(session.audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  }

  async startRecording(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      session.mediaRecorder = new MediaRecorder(stream);
      session.audioChunks = [];

      session.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          session.audioChunks.push(event.data);
        }
      };

      session.mediaRecorder.onstop = async () => {
        await this.processRecording(sessionId);
      };

      session.mediaRecorder.start();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }

  async stopRecording(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session?.mediaRecorder) return;

    if (session.mediaRecorder.state === 'recording') {
      session.mediaRecorder.stop();
    }
  }

  private async processRecording(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.audioChunks.length === 0) return;

    try {
      // Convert audio to text (would use speech-to-text API in production)
      const audioBlob = new Blob(session.audioChunks, { type: 'audio/wav' });
      
      // For now, simulate speech-to-text
      const userMessage = await this.simulateSpeechToText();
      
      // Generate AI response
      const chatContext: ChatContext = {
        character: session.character,
        userPreferences: session.userPreferences,
        conversationHistory: [],
        relationshipLevel: 50,
        timeOfDay: new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'
      };

      const aiResponse = await personalityAI.generateResponse(userMessage, chatContext);
      
      // Convert AI response back to speech
      await this.convertTextToSpeech(aiResponse, session.character.voice, sessionId);

    } catch (error) {
      console.error('Error processing recording:', error);
    }
  }

  private async simulateSpeechToText(): Promise<string> {
    // Simulate different user inputs for voice calls
    const voiceInputs = [
      "Hey, how are you doing today?",
      "I missed talking to you!",
      "Tell me about your day",
      "You sound so beautiful",
      "What should we talk about?",
      "I love hearing your voice",
      "This is so cool that we can talk!"
    ];
    
    return voiceInputs[Math.floor(Math.random() * voiceInputs.length)];
  }

  async endVoiceCall(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Say goodbye
    const goodbyes = [
      `It was so wonderful talking to you, ${session.userPreferences.preferredName}! Let's call again soon! 💕`,
      `I loved hearing your voice! Talk to you later, beautiful! 😘`,
      `This was amazing! Can't wait for our next call! 🥰`,
      `Thanks for the lovely chat, ${session.userPreferences.preferredName}! Until next time! ✨`
    ];

    const goodbye = goodbyes[Math.floor(Math.random() * goodbyes.length)];
    await this.convertTextToSpeech(goodbye, session.character.voice, sessionId);

    // Clean up
    if (session.mediaRecorder) {
      session.mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    
    if (session.audioContext) {
      await session.audioContext.close();
    }

    session.isActive = false;
    this.sessions.delete(sessionId);
  }

  isCallActive(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    return session?.isActive || false;
  }

  getAllActiveCalls(): string[] {
    return Array.from(this.sessions.keys()).filter(id => this.isCallActive(id));
  }
}

// Export singleton instance
export const voiceCallManager = new VoiceCallManager(); 