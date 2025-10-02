import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff, 
  Volume2, 
  VolumeX,
  Loader2,
  Check,
  X
} from 'lucide-react';
import { personalityAI } from '@/lib/ai-chat';
import { memoryService } from '@/lib/memory-service';
import { useAuth } from '@/contexts/AuthContext';
import { speakText, stopAllSpeech } from '@/lib/voice';
import type { Character, UserPreferences, ChatMessage, ChatContext } from '@/types/character';

interface VoiceCallInterfaceProps {
  character: Character;
  userPreferences: UserPreferences;
  onEndCall: () => void;
  className?: string;
}

interface CallState {
  isConnected: boolean;
  isListening: boolean;
  isMuted: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  conversationHistory: ChatMessage[];
  callDuration: number;
  microphonePermission: boolean;
  microphoneDisabled: boolean;
}

export const VoiceCallInterface: React.FC<VoiceCallInterfaceProps> = ({
  character,
  userPreferences,
  onEndCall,
  className = ''
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Initialize global flags for speech blocking with enhanced intelligence
  if (typeof window !== "undefined") {
    (window as any).aiSpeaking = (window as any).aiSpeaking || false;
    (window as any).aiProcessing = (window as any).aiProcessing || false;
    (window as any).aiJustFinishedSpeaking = (window as any).aiJustFinishedSpeaking || null;
    (window as any).aiSpeakingTimestamp = (window as any).aiSpeakingTimestamp || null;
    (window as any).aiProcessingTimestamp = (window as any).aiProcessingTimestamp || null;
    (window as any).speechDetectionLocked = (window as any).speechDetectionLocked || false;
    (window as any).lastUserSpeechTime = (window as any).lastUserSpeechTime || 0;
    (window as any).userSpeechCount = (window as any).userSpeechCount || 0;
    (window as any).aiSpeechCount = (window as any).aiSpeechCount || 0;
    (window as any).speechDetectionEnabled = (window as any).speechDetectionEnabled || true;
  }

  const [callState, setCallState] = useState<CallState>({
    isConnected: false,
    isListening: false,
    isMuted: false,
    isProcessing: false,
    isSpeaking: false,
    currentTranscript: '',
    conversationHistory: [],
    callDuration: 0,
    microphonePermission: false
  });

  // Refs for cleanup and auto-scrolling
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const callStartTimeRef = useRef<Date>(new Date());
  const isCallActiveRef = useRef<boolean>(true);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const autoRestartTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const speechDetectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get character's voice ID (optimized) - Use confirmed female voices
  const getCharacterVoiceId = useCallback(() => {
    // Confirmed female voices from ElevenLabs documentation
    const femaleVoices = [
      'kdmDKE6EkgrWrrykO9Qt', // Alexandra - super realistic, young female voice
      'g6xIsTj2HwM6VR4iXFCw', // Jessica Anne Bogart - empathetic and expressive
      'OYTbf65OHHFELVut7v2H', // Hope - bright and uplifting
      'dj3G1R1ilKoFKhBnWOzG', // Eryn - friendly and relatable
      'PT4nqlKZfc06V1BuClj', // Angela - raw and relatable
      '56AoDkrOh6qfVPDXZ7Pt'  // Cassidy - engaging and energetic
    ];
    
    // Use character-specific voice or fallback to a confirmed female voice
    if (character.voice?.voice_id && character.voice.voice_id !== 'default_soft_melodic') {
      return character.voice.voice_id;
    }
    
    // Fallback to a random female voice for variety
    const randomIndex = Math.floor(Math.random() * femaleVoices.length);
    return femaleVoices[randomIndex];
  }, [character.voice?.voice_id]);

  // Enhanced speech detection intelligence
  const isUserSpeech = useCallback((transcript: string, confidence: number): boolean => {
    const now = Date.now();
    const timeSinceLastSpeech = now - lastSpeechTimeRef.current;
    
    // Block if too soon after last speech (prevent rapid fire)
    if (timeSinceLastSpeech < 1000) {
      console.log("🚫 BLOCKED: Too soon after last speech");
      return false;
    }
    
    // Block if AI is speaking or processing
    if (window.aiSpeaking || window.aiProcessing || callState.isSpeaking || callState.isProcessing) {
      console.log("🚫 BLOCKED: AI is speaking/processing");
      return false;
    }
    
    // Block if too soon after AI finished speaking
    if (window.aiJustFinishedSpeaking && (now - window.aiJustFinishedSpeaking < 3000)) {
      console.log("🚫 BLOCKED: Too soon after AI finished speaking");
      return false;
    }
    
    // Block if AI is processing
    if (window.aiProcessingTimestamp && (now - window.aiProcessingTimestamp < 1500)) {
      console.log("🚫 BLOCKED: AI is processing");
      return false;
    }
    
    // Enhanced confidence and content filtering
    if (confidence < 0.8) {
      console.log("🚫 BLOCKED: Low confidence:", confidence);
      return false;
    }
    
    // Filter out common AI speech patterns
    const aiPatterns = [
      /^(hello|hi|hey|good morning|good afternoon|good evening)$/i,
      /^(thank you|thanks|you're welcome)$/i,
      /^(how are you|how's it going|what's up)$/i,
      /^(yes|no|okay|ok|sure|alright)$/i,
      /^(I understand|I see|got it|I know)$/i,
      /^(that's|that is|it's|it is).*(interesting|good|great|amazing|wonderful)$/i,
      /^(I'm|I am).*(glad|happy|excited|pleased).*(to|that)/i,
      /^(let me|let's|I'll|I will).*(help|assist|support)/i,
      /^(I can|I could|I would|I might).*(help|assist|support)/i,
      /^(what|how|when|where|why).*(would you like|do you want|can I help)/i
    ];
    
    for (const pattern of aiPatterns) {
      if (pattern.test(transcript)) {
        console.log("🚫 BLOCKED: Matches AI speech pattern:", transcript);
        return false;
      }
    }
    
    // Filter out very short or repetitive speech
    if (transcript.length < 3) {
      console.log("🚫 BLOCKED: Too short");
      return false;
    }
    
    // Filter out repetitive words
    const words = transcript.split(' ');
    const uniqueWords = new Set(words);
    if (words.length > 2 && uniqueWords.size < words.length * 0.6) {
      console.log("🚫 BLOCKED: Too repetitive");
      return false;
    }
    
    // Filter out common filler words
    const fillerWords = ['uh', 'um', 'ah', 'oh', 'hmm', 'well', 'so', 'like', 'you know'];
    if (words.length === 1 && fillerWords.includes(transcript.toLowerCase())) {
      console.log("🚫 BLOCKED: Filler word");
      return false;
    }
    
    // Check for natural speech patterns (questions, statements, etc.)
    const hasNaturalPattern = 
      transcript.includes('?') || // Questions
      transcript.includes('.') || // Statements
      transcript.includes('!') || // Exclamations
      words.length >= 3 || // Multi-word phrases
      transcript.match(/^(can you|could you|would you|will you|do you|are you|is it|was it)/i); // Common question starters
    
    if (!hasNaturalPattern) {
      console.log("🚫 BLOCKED: No natural speech pattern");
      return false;
    }
    
    return true;
  }, [callState.isSpeaking, callState.isProcessing]);

  // Initialize microphone with enhanced error handling
  const initializeMicrophone = useCallback(async (): Promise<boolean> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Microphone Not Supported",
          description: "Your browser doesn't support microphone access",
          variant: "destructive"
        });
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      console.log('🎤 Microphone access granted');
      setCallState(prev => ({ ...prev, microphonePermission: true }));
      
      // Stop all tracks when component unmounts
      stream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          console.log('🎤 Microphone track ended');
        });
      });
      
      return true;
    } catch (error) {
      console.error('❌ Microphone error:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice features",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Enhanced speech recognition setup
  const setupSpeechRecognition = useCallback((): boolean => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition",
        variant: "destructive"
      });
      return false;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Enhanced recognition settings
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      isRecognitionActiveRef.current = true;
      setCallState(prev => ({ ...prev, isListening: true }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!isCallActiveRef.current || !window.speechDetectionEnabled) return;
      
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.trim();
      const confidence = lastResult[0].confidence || 0;
      
      console.log('🎤 Speech detected:', transcript, '(confidence:', confidence, ')');
      
      // Use enhanced intelligence to determine if this is user speech
      if (isUserSpeech(transcript, confidence)) {
        console.log("✅ ACCEPTED: User speech detected:", transcript);
        lastSpeechTimeRef.current = Date.now();
        window.userSpeechCount = (window.userSpeechCount || 0) + 1;
        
        setCallState(prev => ({ ...prev, currentTranscript: transcript }));
        handleUserMessage(transcript);
        
        // Temporarily disable speech detection to prevent AI voice detection
        window.speechDetectionEnabled = false;
        if (speechDetectionTimeoutRef.current) {
          clearTimeout(speechDetectionTimeoutRef.current);
        }
        speechDetectionTimeoutRef.current = setTimeout(() => {
          window.speechDetectionEnabled = true;
          console.log("🔓 Speech detection re-enabled");
        }, 5000); // Disable for 5 seconds after user speech
      } else {
        console.log("🚫 REJECTED: Not user speech:", transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('❌ Speech error:', event.error);
      isRecognitionActiveRef.current = false;
      setCallState(prev => ({ ...prev, isListening: false }));
      
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone Permission Denied",
          description: "Please allow microphone access",
          variant: "destructive"
        });
      }
    };

    recognition.onend = () => {
      console.log('🔄 Speech recognition ended');
      isRecognitionActiveRef.current = false;
      setCallState(prev => ({ ...prev, isListening: false }));
      
      // Auto-restart speech recognition for continuous operation
      if (isCallActiveRef.current && !callState.isSpeaking && !callState.isProcessing && window.speechDetectionEnabled) {
        setTimeout(() => {
          if (isCallActiveRef.current && recognitionRef.current && !isRecognitionActiveRef.current) {
            try {
              recognitionRef.current.start();
              console.log("🔄 AUTO-RESTART: Speech recognition restarted automatically");
            } catch (error) {
              console.log("⚠️ Auto-restart failed:", error);
            }
          }
        }, 1000);
      }
    };

    recognitionRef.current = recognition;
    return true;
  }, [toast, callState.isProcessing, callState.isSpeaking, isUserSpeech]);

  // Handle user message without duplicates
  const handleUserMessage = useCallback(async (message: string) => {
    if (!message.trim() || !isCallActiveRef.current || callState.isProcessing) return;

    console.log('💬 Processing:', message);
    
    setCallState(prev => ({ 
      ...prev, 
      isProcessing: true,
      isListening: false,
      currentTranscript: ''
    }));

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message only once
    setCallState(prev => ({
      ...prev,
      conversationHistory: [...prev.conversationHistory, userMessage]
    }));

    try {
      const chatContext: ChatContext = {
        character,
        userPreferences: {
          ...userPreferences,
          preferredName: userPreferences.petName || userPreferences.preferredName || 'friend'
        },
        conversationHistory: callState.conversationHistory,
        relationshipLevel: 80,
        timeOfDay: getTimeOfDay(),
        sessionMemory: {}
      };

      const aiResponse = await personalityAI.generateResponse(message, chatContext);
      
      if (!isCallActiveRef.current) return;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };

      // Add AI message only once
      setCallState(prev => ({
        ...prev,
        conversationHistory: [...prev.conversationHistory, aiMessage]
      }));

      console.log("🔊 About to call speakAIResponse with:", aiResponse.substring(0, 50) + "...");
      await speakAIResponse(aiResponse);
      console.log("🔊 speakAIResponse call completed");

    } catch (error) {
      console.error('❌ Error processing message:', error);
      if (isCallActiveRef.current) {
        toast({
          title: "Processing Error",
          description: "Sorry, I had trouble with that. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      if (isCallActiveRef.current) {
        setCallState(prev => ({ ...prev, isProcessing: false }));
      }
    }
  }, [character, userPreferences, callState.conversationHistory, callState.isProcessing]);

  // Enhanced AI response speaking with better blocking
  const speakAIResponse = useCallback(async (response: string) => {
    if (!isCallActiveRef.current || callState.isMuted) return;

    // Set blocking flags immediately
    window.aiSpeaking = true;
    window.aiProcessing = true;
    window.aiSpeakingTimestamp = Date.now();
    window.aiSpeechCount = (window.aiSpeechCount || 0) + 1;
    
    // Stop speech recognition immediately and disable detection
    if (recognitionRef.current && isRecognitionActiveRef.current) {
      try {
        recognitionRef.current.stop();
        isRecognitionActiveRef.current = false;
        setCallState(prev => ({ ...prev, isListening: false }));
        console.log("🚫 STOPPED speech recognition - AI is about to speak");
      } catch (error) {
        console.log("⚠️ Error stopping recognition:", error);
      }
    }
    
    // Disable speech detection during AI speech
    window.speechDetectionEnabled = false;

    try {
      setCallState(prev => ({ ...prev, isSpeaking: true }));
      
      const voiceId = getCharacterVoiceId();
      
      // Optimized voice settings
      const voiceSettings = {
        stability: 0.3,
        similarity_boost: 0.9,
        style: 0.6,
        use_speaker_boost: true
      };
      
      console.log('🎤 Speaking:', { characterName: character.name, voiceId });
      
      // Stop all current speech to prevent overlapping
      stopAllSpeech();
      
      await speakText(response, voiceId, voiceSettings);
      
    } catch (error) {
      console.error('❌ Speech error:', error);
    } finally {
      if (isCallActiveRef.current) {
        setCallState(prev => ({ ...prev, isSpeaking: false }));
        
        // Enhanced auto-restart logic with better timing
        setTimeout(() => {
          // Clear flags
          window.aiSpeaking = false;
          window.aiProcessing = false;
          window.aiJustFinishedSpeaking = Date.now();
          
          // Re-enable speech detection after AI finishes
          window.speechDetectionEnabled = true;
          
          // Auto-restart speech recognition with delay
          if (isCallActiveRef.current && recognitionRef.current && !isRecognitionActiveRef.current) {
            setTimeout(() => {
              if (isCallActiveRef.current && recognitionRef.current && !isRecognitionActiveRef.current) {
                try {
                  recognitionRef.current.start();
                  console.log("🔄 AUTO-RESTART: Speech recognition restarted after AI finished");
                } catch (error) {
                  console.log("⚠️ Auto-restart failed:", error);
                }
              }
            }, 2000); // Wait 2 seconds after AI finishes
          }
        }, 1000); // Wait 1 second before clearing flags
      }
    }
  }, [getCharacterVoiceId, character.name, callState.isMuted]);

  const getTimeOfDay = (): 'morning' | 'afternoon' | 'evening' => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  };

  // Call controls (simplified)
  const toggleMicrophone = useCallback(async () => {
    // Initialize audio context on first user interaction
    try {
      if (typeof window !== "undefined" && "AudioContext" in window) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === "suspended") {
          await audioContext.resume();
          console.log("🔊 Audio context resumed on user interaction");
        }
      }
    } catch (error) {
      console.log("⚠️ Audio context initialization failed:", error);
    }
    
    if (!callState.microphonePermission) {
      initializeMicrophone();
      return;
    }

    if (callState.isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setCallState(prev => ({ ...prev, isListening: false }));
    } else {
      if (recognitionRef.current && !callState.isSpeaking && !callState.isProcessing) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('❌ Failed to start recognition:', error);
        }
      }
    }
  }, [callState.microphonePermission, callState.isListening, callState.isSpeaking, callState.isProcessing, initializeMicrophone]);

  const toggleMute = useCallback(() => {
    setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const endCall = useCallback(() => {
    console.log('📞 ENDING VOICE CALL - Button clicked!');
    
    // Cleanup
    isCallActiveRef.current = false;
    isRecognitionActiveRef.current = false;
    
    // Stop all speech and audio
    stopAllSpeech();
    
    // Clear all global flags
    if (typeof window !== "undefined") {
      window.aiSpeaking = false;
      window.aiProcessing = false;
      window.aiJustFinishedSpeaking = null;
      window.aiSpeakingTimestamp = null;
      window.aiProcessingTimestamp = null;
      window.speechDetectionLocked = false;
      window.lastUserSpeechTime = 0;
      window.isSpeaking = false;
      window.currentSpeechPromise = null;
      window.speechDetectionEnabled = true;
      window.userSpeechCount = 0;
      window.aiSpeechCount = 0;
    }
    
    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (error) {
        console.log('⚠️ Error stopping recognition:', error);
      }
    }
    
    // Clear all timeouts
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }
    
    if (autoRestartTimeoutRef.current) {
      clearTimeout(autoRestartTimeoutRef.current);
      autoRestartTimeoutRef.current = null;
    }
    
    if (speechDetectionTimeoutRef.current) {
      clearTimeout(speechDetectionTimeoutRef.current);
      speechDetectionTimeoutRef.current = null;
    }
    
    console.log('✅ Call cleanup completed - calling onEndCall');
    onEndCall();
  }, [onEndCall]);

  // Initialize call (optimized)
  useEffect(() => {
    console.log('📞 Initializing voice call...');
    callStartTimeRef.current = new Date();
    
    const startCall = async () => {
      // Initialize audio context to help with autoplay
      try {
        if (typeof window !== 'undefined' && 'AudioContext' in window) {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('🔊 Audio context initialized and resumed');
          }
        }
      } catch (error) {
        console.log('⚠️ Audio context initialization failed:', error);
      }
      
      const micReady = await initializeMicrophone();
      const speechReady = setupSpeechRecognition();
      
      if (micReady && speechReady) {
        // Start listening after a delay
        setTimeout(() => {
          if (recognitionRef.current && isCallActiveRef.current) {
            try {
              recognitionRef.current.start();
              console.log('🎤 Voice call started - listening for speech');
            } catch (error) {
              console.error('❌ Failed to start recognition:', error);
            }
          }
        }, 1000);
        
        setCallState(prev => ({ ...prev, isConnected: true }));
      }
    };
    
    startCall();
    
    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up voice call...');
      isCallActiveRef.current = false;
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.log('⚠️ Error stopping recognition on cleanup:', error);
        }
      }
      
      stopAllSpeech();
    };
  }, [initializeMicrophone, setupSpeechRecognition]);

  // Auto-scroll conversation to bottom
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [callState.conversationHistory]);

  // Call duration timer
  useEffect(() => {
    if (!callState.isConnected) return;
    
    const timer = setInterval(() => {
      const duration = Math.floor((Date.now() - callStartTimeRef.current.getTime()) / 1000);
      setCallState(prev => ({ ...prev, callDuration: duration }));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [callState.isConnected]);

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <Card className="w-full max-w-4xl mx-4 bg-background/95 backdrop-blur-xl border-2">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {character.name[0]}
              </div>
              <div>
                <h2 className="text-xl font-semibold">{character.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {callState.isConnected ? `Connected • ${formatDuration(callState.callDuration)}` : 'Connecting...'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant={callState.isListening ? "default" : "secondary"}>
                {callState.isListening ? "Listening" : "Not Listening"}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={endCall}
                className="text-red-500 hover:text-red-700"
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Conversation */}
          <div 
            ref={conversationRef}
            className="h-96 overflow-y-auto border rounded-lg p-4 mb-6 bg-muted/30 space-y-4"
          >
            {callState.conversationHistory.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Start talking to {character.name}...</p>
                <p className="text-sm mt-2">They're listening for your voice</p>
              </div>
            ) : (
              callState.conversationHistory.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {callState.currentTranscript && (
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg p-3 bg-primary/50 text-primary-foreground">
                  <p className="text-sm italic">{callState.currentTranscript}</p>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={callState.isListening ? "default" : "outline"}
              size="lg"
              onClick={toggleMicrophone}
              disabled={!callState.microphonePermission || callState.isProcessing}
              className="w-16 h-16 rounded-full"
            >
              {callState.isProcessing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : callState.isListening ? (
                <Mic className="w-6 h-6" />
              ) : (
                <MicOff className="w-6 h-6" />
              )}
            </Button>
            
            <Button
              variant={callState.isMuted ? "destructive" : "outline"}
              size="lg"
              onClick={toggleMute}
              className="w-16 h-16 rounded-full"
            >
              {callState.isMuted ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </Button>
          </div>

          {/* Status */}
          <div className="text-center mt-4 text-sm text-muted-foreground">
            {callState.isProcessing ? (
              <p className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {character.name} is thinking...
              </p>
            ) : callState.isSpeaking ? (
              <p className="flex items-center justify-center gap-2">
                <Volume2 className="w-4 h-4" />
                {character.name} is speaking...
              </p>
            ) : callState.isListening ? (
              <p className="flex items-center justify-center gap-2">
                <Mic className="w-4 h-4" />
                Listening for your voice...
              </p>
            ) : (
              <p>Click the microphone to start talking</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
