import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  X,
  Heart,
  MessageSquare,
  Minimize2,
  Settings,
  Sparkles,
  Zap,
  Crown
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
  onMinimize?: () => void;
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
  onMinimize,
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

  // Additional state for enhanced UI
  const [pushToTalk, setPushToTalk] = useState(false);
  const [isPTTHeld, setIsPTTHeld] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [spokenWords, setSpokenWords] = useState<string[]>([]);
  const [displayedWordIndex, setDisplayedWordIndex] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');

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
  const restartAttemptsRef = useRef<number>(0);

  // Get character's voice ID (optimized) - Use confirmed female voices
  const getCharacterVoiceId = useCallback(() => {
    // Confirmed female voices from ElevenLabs documentation
    const femaleVoices = [
      'kdmDKE6EkgrWrrykO9Qt', // Alexandra - super realistic, young female voice
      'g6xIsTj2HwM6VR4iXFCw', // Jessica Anne Bogart - empathetic and expressive
      'OYTbf65OHHFELVut7v2H', // Hope - bright and uplifting
      'dj3G1R1ilKoFKhBnWOzG', // Eryn - friendly and relatable
      'PT4nqlKZfc06VW1BuClj', // Angela - raw and relatable
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
    if (confidence < 0.6) {
      console.log("🚫 BLOCKED: Low confidence:", confidence);
      return false;
    }
    
    // Filter out very short or repetitive speech
    if (transcript.length < 2) {
      console.log("🚫 BLOCKED: Too short");
      return false;
    }
    
    // Filter out common filler words
    const fillerWords = ['uh', 'um', 'ah', 'oh', 'hmm', 'well', 'so', 'like', 'you know'];
    if (fillerWords.includes(transcript.toLowerCase())) {
      console.log("🚫 BLOCKED: Filler word");
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

  // Enhanced speech recognition setup with better error handling
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
      restartAttemptsRef.current = 0; // Reset restart attempts on successful start
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
      
      // Handle specific errors
      if (event.error === 'not-allowed') {
        toast({
          title: "Microphone Permission Denied",
          description: "Please allow microphone access",
          variant: "destructive"
        });
        return;
      }
      
      if (event.error === 'aborted') {
        console.log('⚠️ Speech recognition aborted - stopping auto-restart');
        restartAttemptsRef.current = 0;
        return;
      }
      
      if (event.error === 'no-speech') {
        console.log('⚠️ No speech detected - continuing to listen');
        return;
      }
    };

    recognition.onend = () => {
      console.log('🔄 Speech recognition ended');
      isRecognitionActiveRef.current = false;
      setCallState(prev => ({ ...prev, isListening: false }));
      
      // Only auto-restart if we haven't exceeded max attempts and call is still active
      if (isCallActiveRef.current && !callState.isSpeaking && !callState.isProcessing && window.speechDetectionEnabled && restartAttemptsRef.current < 3) {
        restartAttemptsRef.current++;
        setTimeout(() => {
          if (isCallActiveRef.current && recognitionRef.current && !isRecognitionActiveRef.current) {
            try {
              recognitionRef.current.start();
              console.log("🔄 AUTO-RESTART: Speech recognition restarted automatically (attempt", restartAttemptsRef.current, ")");
            } catch (error) {
              console.log("⚠️ Auto-restart failed:", error);
            }
          }
        }, 2000); // Increased delay to prevent rapid restarts
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
      console.log("🔊 Call active status:", isCallActiveRef.current);
      console.log("🔊 Call state:", callState);
      
      if (!isCallActiveRef.current) {
        console.log("❌ Call is not active, skipping speakAIResponse");
        return;
      }
      
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
      
      // Split response into words for animation
      const words = response.split(' ');
      setSpokenWords(words);
      setDisplayedWordIndex(0);
      
      const voiceId = getCharacterVoiceId();
      
      // Optimized voice settings
      const voiceSettings = {
        stability: 0.3,
        similarity_boost: 0.9,
        style: 0.6,
        use_speaker_boost: true
      };
      
      console.log('🎤 Speaking:', { characterName: character.name, voiceId });
      console.log('🎤 Response text:', response.substring(0, 100) + '...');
      console.log('🎤 Voice settings:', voiceSettings);
      
      // Stop all current speech to prevent overlapping
      stopAllSpeech();
      
      console.log('🎤 About to call speakText...');
      await speakText(response, voiceId, voiceSettings);
      console.log('🎤 speakText completed');
      
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
            }, 3000); // Wait 3 seconds after AI finishes
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

  const unlockAudio = useCallback(() => {
    try {
      if (typeof window !== "undefined" && "AudioContext" in window) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === "suspended") {
          audioContext.resume();
        }
      }
    } catch (error) {
      console.log("⚠️ Audio context initialization failed:", error);
    }
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
        // Start listening immediately after a short delay
        setTimeout(() => {
          if (recognitionRef.current && isCallActiveRef.current) {
            try {
              recognitionRef.current.start();
              console.log('🎤 Voice call started - listening for speech');
              setIsInitialized(true);
            } catch (error) {
              console.error('❌ Failed to start recognition:', error);
            }
          }
        }, 2000); // Increased delay to prevent issues
        
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

  // Word animation effect
  useEffect(() => {
    if (callState.isSpeaking && spokenWords.length > 0) {
      const interval = setInterval(() => {
        setDisplayedWordIndex(prev => {
          if (prev < spokenWords.length) {
            return prev + 1;
          }
          return prev;
        });
      }, 150);
      
      return () => clearInterval(interval);
    }
  }, [callState.isSpeaking, spokenWords.length]);

  // Format call duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 flex flex-col relative overflow-hidden" onClick={unlockAudio} onTouchStart={unlockAudio}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-pink-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-br from-blue-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-20 h-20 bg-gradient-to-br from-violet-400/20 to-pink-400/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 ring-4 ring-white/20">
            <AvatarImage src={character.avatar} alt={character.name} />
            <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xl font-bold">
              {character.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-bold text-white">{character.name}</h3>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-300">Connected</span>
              </div>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                HD Voice
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-lg font-mono text-white">{formatDuration(callState.callDuration)}</div>
            <div className="text-xs text-white/70">Duration</div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-white hover:bg-white/20 h-10 w-10 rounded-full"
          >
            <MessageSquare className="w-5 h-5" />
          </Button>
          
          {onMinimize && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMinimize}
              className="text-white hover:bg-white/20 h-10 w-10 rounded-full"
            >
              <Minimize2 className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10">
        {/* Left Side - Character Avatar and Status */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
          {/* Character Avatar with Enhanced Voice Visualization */}
          <div className="relative">
            <div className={`w-32 h-32 lg:w-40 lg:h-40 rounded-full overflow-hidden border-4 transition-all duration-500 ${
              callState.isSpeaking ? 'border-pink-400 shadow-2xl shadow-pink-400/50 scale-110' : 
              callState.isListening ? 'border-blue-400 shadow-2xl shadow-blue-400/50 scale-105' : 
              'border-white/30 scale-100'
            }`}>
              <Avatar className="w-full h-full">
                <AvatarImage src={character.avatar} alt={character.name} />
                <AvatarFallback className="text-4xl lg:text-5xl bg-gradient-to-br from-pink-500 to-purple-600 text-white font-bold">
                  {character.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            </div>
            
            {/* Enhanced Voice activity indicator */}
            {(callState.isSpeaking || callState.isListening) && (
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                <div className={`flex space-x-1 ${callState.isSpeaking ? 'text-pink-400' : 'text-blue-400'}`}>
                  {[...Array(5)].map((_, i) => (
                    <div 
                      key={i}
                      className="w-1 bg-current rounded animate-pulse" 
                      style={{ 
                        height: `${12 + i * 4}px`,
                        animationDelay: `${i * 100}ms`,
                        animationDuration: '0.8s'
                      }} 
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Connection Quality Indicator */}
            <div className="absolute -top-2 -right-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                connectionQuality === 'excellent' ? 'bg-green-500' :
                connectionQuality === 'good' ? 'bg-yellow-500' :
                connectionQuality === 'fair' ? 'bg-orange-500' : 'bg-red-500'
              }`}>
                <Zap className="w-3 h-3 text-white" />
              </div>
            </div>
          </div>

          {/* Enhanced Status Display */}
          <div className="space-y-4">
            <h2 className="text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">{character.name}</h2>
            
            <div className="space-y-2">
              <div className="text-xl lg:text-2xl font-medium text-white/90">
                {callState.isSpeaking ? '🗣️ Speaking...' :
                 callState.isProcessing ? '💭 Thinking...' :
                 callState.isListening ? '🎤 Your turn to speak!' :
                 callState.isMuted ? '🔇 Muted' :
                 '📞 In call'}
              </div>
              
              {/* Interactive guidance */}
              {callState.isListening && !callState.isMuted && (
                <p className="text-sm text-white/70 animate-pulse">
                  I'm listening! Say something and I'll respond when you pause 💕
                </p>
              )}
              
              {callState.isMuted && (
                <p className="text-sm text-yellow-300">
                  Unmute to start talking with me!
                </p>
              )}
            </div>
            
            {/* Animated word-by-word visualization */}
            {callState.isSpeaking && spokenWords.length > 0 && (
              <div className="mt-4 min-h-[48px] lg:min-h-[64px]">
                <div className="flex flex-wrap gap-2 justify-center">
                  {spokenWords.slice(0, displayedWordIndex).map((w, idx) => (
                    <span
                      key={`${w}-${idx}`}
                      className="text-sm lg:text-base px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 animate-in fade-in-0 backdrop-blur-sm"
                      style={{ animationDelay: `${idx * 50}ms` }}
                    >
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Real-time transcript */}
            {callState.currentTranscript && (
              <div className="bg-black/30 backdrop-blur-sm rounded-2xl p-4 max-w-md mx-auto border border-white/20">
                <p className="text-sm text-white/80 italic">
                  You're saying: "{callState.currentTranscript}"
                </p>
              </div>
            )}
          </div>

          {/* Enhanced Call Quality Indicators */}
          <div className="flex items-center gap-4 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>HD Voice</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              <span>AI Powered</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span>Real-time</span>
            </div>
          </div>
        </div>

        {/* Right Side - Real-time Chat Transcript */}
        <div className={`w-full lg:w-96 border-l border-white/20 bg-black/20 backdrop-blur-md ${showTranscript ? 'block' : 'hidden lg:block'}`}>
          <div className="p-4 border-b border-white/20">
            <h3 className="font-semibold text-lg text-white">Live Transcript</h3>
            <p className="text-sm text-white/70">Real-time conversation</p>
          </div>
          
          <div 
            ref={conversationRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 h-64 lg:h-96"
          >
            {callState.conversationHistory.length === 0 ? (
              <div className="text-center text-white/70 py-8">
                <p>Start talking to {character.name}...</p>
                <p className="text-sm mt-2">Your conversation will appear here</p>
              </div>
            ) : (
              callState.conversationHistory.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {message.sender === 'ai' && (
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarImage src={character.avatar} alt={character.name} />
                        <AvatarFallback className="text-xs bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                          {character.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-white/20 text-white backdrop-blur-sm border border-white/30'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-pink-100' : 'text-white/70'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {callState.isProcessing && (
              <div className="flex items-start gap-2">
                <Avatar className="w-6 h-6 flex-shrink-0">
                  <AvatarImage src={character.avatar} alt={character.name} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-pink-500 to-purple-600 text-white">
                    {character.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/30">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-white/70 rounded-full animate-bounce"></div>
                    <div className="w-1 h-1 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-1 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Call Controls */}
      <div className="relative z-10 p-6 bg-black/20 backdrop-blur-md border-t border-white/10">
        <div className="flex items-center justify-center gap-4 lg:gap-6 flex-wrap">
          {/* Push-to-Talk Toggle */}
          <Button
            variant={pushToTalk ? "default" : "outline"}
            size="sm"
            onClick={() => setPushToTalk(!pushToTalk)}
            className="h-10 px-4 rounded-full text-sm bg-white/20 text-white border-white/30 hover:bg-white/30"
          >
            {pushToTalk ? 'PTT: On' : 'PTT: Off'}
          </Button>

          {/* Hold-to-speak button (visible when PTT on) */}
          {pushToTalk && (
            <Button
              variant={isPTTHeld ? "default" : "outline"}
              size="sm"
              onMouseDown={() => { setIsPTTHeld(true); try { recognitionRef.current?.start(); } catch {} }}
              onMouseUp={() => { setIsPTTHeld(false); try { recognitionRef.current?.stop(); } catch {} }}
              onTouchStart={() => { setIsPTTHeld(true); try { recognitionRef.current?.start(); } catch {} }}
              onTouchEnd={() => { setIsPTTHeld(false); try { recognitionRef.current?.stop(); } catch {} }}
              className="h-12 px-6 rounded-full text-sm bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 hover:from-blue-600 hover:to-cyan-700"
            >
              Hold to Speak
            </Button>
          )}
          
          {/* Mute Button */}
          <Button
            variant={callState.isMuted ? "destructive" : "outline"}
            size="sm"
            onClick={toggleMute}
            className="h-12 w-12 rounded-full bg-white/20 text-white border-white/30 hover:bg-white/30"
          >
            {callState.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          {/* Speaker Button */}
          <Button
            variant={isSpeakerOn ? "default" : "outline"}
            size="sm"
            onClick={() => { setIsSpeakerOn(!isSpeakerOn); unlockAudio(); }}
            className="h-12 w-12 rounded-full bg-white/20 text-white border-white/30 hover:bg-white/30"
          >
            {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>

          {/* End Call Button */}
          <Button
            variant="destructive"
            size="sm"
            onClick={endCall}
            className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600 shadow-lg"
          >
            <PhoneOff className="w-6 h-6" />
          </Button>

          {/* Switch to Chat */}
          {onMinimize && (
            <Button
              variant="outline"
              size="sm"
              onClick={onMinimize}
              className="h-12 w-12 rounded-full bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
          )}

          {/* Love Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              toast({
                title: "💕 Love sent!",
                description: `${character.name} felt your love!`
              });
            }}
            className="h-12 w-12 rounded-full bg-white/20 text-white border-white/30 hover:bg-white/30"
          >
            <Heart className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
