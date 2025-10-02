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
  
  // Initialize global flags for speech blocking
  if (typeof window !== "undefined") {
    (window as any).aiSpeaking = (window as any).aiSpeaking || false;
    (window as any).aiProcessing = (window as any).aiProcessing || false;
    (window as any).aiJustFinishedSpeaking = (window as any).aiJustFinishedSpeaking || null;
    (window as any).aiSpeakingTimestamp = (window as any).aiSpeakingTimestamp || null;
    (window as any).aiProcessingTimestamp = (window as any).aiProcessingTimestamp || null;
    (window as any).speechDetectionLocked = (window as any).speechDetectionLocked || false;
    (window as any).lastUserSpeechTime = (window as any).lastUserSpeechTime || 0;
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
    
    // Fallback to Alexandra (super realistic, young female voice) for Luna
    return 'kdmDKE6EkgrWrrykO9Qt';
  }, [character]);

  // Initialize microphone (simplified)
  const initializeMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      setCallState(prev => ({ ...prev, microphonePermission: true }));
      return true;
    } catch (error) {
      console.error('❌ Microphone access denied:', error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access for voice calls",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Setup speech recognition (FIXED: Continuous mode for automatic operation)
  const setupSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Please use Chrome or Edge for voice calls",
        variant: "destructive"
      });
      return false;
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // FIXED: Set to continuous for automatic operation
    recognition.continuous = true; // Changed from false to true
    recognition.interimResults = false; // Only final results to prevent false triggers
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      isRecognitionActiveRef.current = true;
      setCallState(prev => ({ ...prev, isListening: true }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!isCallActiveRef.current) return;
      
      const lastResult = event.results[event.results.length - 1];
      const transcript = lastResult[0].transcript.trim();
      const confidence = lastResult[0].confidence || 0;
      
      // FIXED: Enhanced blocking to prevent AI voice detection
      const now = Date.now();
      
      // Block if AI is speaking or processing
      if (window.aiSpeaking || window.aiProcessing || callState.isSpeaking || callState.isProcessing) {
        console.log("🚫 BLOCKED: AI is speaking/processing, ignoring speech input");
        return;
      }
      
      // Block if too soon after AI finished speaking
      if (window.aiJustFinishedSpeaking && (now - window.aiJustFinishedSpeaking < 2000)) {
        console.log("🚫 BLOCKED: Too soon after AI finished speaking");
        return;
      }
      
      // Block if AI is processing
      if (window.aiProcessingTimestamp && (now - window.aiProcessingTimestamp < 1000)) {
        console.log("🚫 BLOCKED: AI is processing, ignoring speech input");
        return;
      }
      
      // FIXED: More lenient filtering for better user experience
      if (transcript && transcript.length > 2 && confidence > 0.7) {
        // Additional check for intentional speech
        const words = transcript.split(" ");
        if (words.length >= 1 && !transcript.match(/^(uh|um|ah|oh|hmm)$/i)) {
          console.log("🎯 User said:", transcript, "(confidence:", confidence, ")");
          setCallState(prev => ({ ...prev, currentTranscript: transcript }));
          handleUserMessage(transcript);
        } else {
          console.log("🚫 Ignoring short/noise:", transcript);
        }
      } else {
        console.log("🚫 Ignoring low confidence/noise:", transcript, "(confidence:", confidence, ")");
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
      
      // FIXED: Auto-restart speech recognition for continuous operation
      if (isCallActiveRef.current && !callState.isSpeaking && !callState.isProcessing) {
        setTimeout(() => {
          if (isCallActiveRef.current && recognitionRef.current && !isRecognitionActiveRef.current) {
            try {
              recognitionRef.current.start();
              console.log("🔄 AUTO-RESTART: Speech recognition restarted automatically");
            } catch (error) {
              console.log("⚠️ Auto-restart failed:", error);
            }
          }
        }, 500);
      }
    };

    recognitionRef.current = recognition;
    return true;
  }, [toast, callState.isProcessing, callState.isSpeaking]);

  // FIXED: Handle user message without duplicates
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

    // FIXED: Add user message only once
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

      // FIXED: Add AI message only once
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

  // FIXED: Speak AI response with faster restart
  const speakAIResponse = useCallback(async (response: string) => {
    if (!isCallActiveRef.current || callState.isMuted) return;

    // Set blocking flags immediately
    window.aiSpeaking = true;
    window.aiProcessing = true;
    window.aiSpeakingTimestamp = Date.now();
    
    // Stop speech recognition immediately
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
      
      stopAllSpeech();
      
      await speakText(response, voiceId, voiceSettings);
      
    } catch (error) {
      console.error('❌ Speech error:', error);
    } finally {
      if (isCallActiveRef.current) {
        setCallState(prev => ({ ...prev, isSpeaking: false }));
        
        // FIXED: Much faster auto-restart logic
        setTimeout(() => {
          // Clear flags
          window.aiSpeaking = false;
          window.aiProcessing = false;
          window.aiJustFinishedSpeaking = Date.now();
          
          // Auto-restart speech recognition much faster
          if (isCallActiveRef.current && recognitionRef.current && !isRecognitionActiveRef.current) {
            try {
              recognitionRef.current.start();
              console.log("🔄 AUTO-RESTART: Speech recognition restarted after AI finished");
            } catch (error) {
              console.log("⚠️ Auto-restart failed:", error);
            }
          }
        }, 200); // FIXED: Reduced from 1500ms to 200ms for much faster response
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
              console.log('🎤 Started listening');
            } catch (error) {
              console.log('⚠️ Start failed:', error);
            }
          }
        }, 2000);
      }
    };
    
    startCall();
    
    // Call duration timer
    const timer = setInterval(() => {
      if (isCallActiveRef.current) {
        const duration = Math.floor((Date.now() - callStartTimeRef.current.getTime()) / 1000);
        setCallState(prev => ({ ...prev, callDuration: duration }));
      }
    }, 1000);

    setCallState(prev => ({ ...prev, isConnected: true }));
    
    return () => {
      clearInterval(timer);
      isCallActiveRef.current = false;
      stopAllSpeech();
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // FIXED: Enhanced auto-scroll conversation to bottom when new messages arrive
  useEffect(() => {
    if (conversationRef.current) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        if (conversationRef.current) {
          conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
        }
      });
    }
  }, [callState.conversationHistory]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-br from-pink-50 via-white to-pink-100 text-gray-900 
      flex flex-col backdrop-blur-sm overflow-hidden ${className}`}>
      {/* Enhanced Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-40 h-40 bg-pink-300 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-32 right-32 w-32 h-32 bg-pink-400 rounded-full blur-2xl animate-float" style={{animationDelay: "2s"}}></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-pink-200 rounded-full blur-xl animate-float" style={{animationDelay: "4s"}}></div>
        <div className="absolute top-1/3 right-1/3 w-20 h-20 bg-pink-300 rounded-full blur-lg animate-float" style={{animationDelay: "1s"}}></div>
      </div>
      
      {/* Enhanced Header */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-pink-200 bg-white/95 backdrop-blur-md shadow-xl relative z-10">
        {/* Header Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-50/50 to-white/50"></div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 flex items-center justify-center shadow-lg">
            <img 
              src={character.avatar} 
              alt={character.name}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{character.name}</h2>
            <p className="text-pink-600 text-xs sm:text-sm font-medium">Voice Call</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-pink-100 text-pink-700 border-pink-200 text-xs sm:text-sm">
            {formatDuration(callState.callDuration)}
          </Badge>
          <Button
            variant="destructive"
            size="sm"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔴 END CALL BUTTON CLICKED!');
              endCall();
            }}
            className="bg-red-500 hover:bg-red-600 text-white border-2 border-red-600 hover:border-red-700 rounded-full px-3 py-2 sm:px-4 sm:py-2 transition-all duration-200 hover:scale-110 shadow-lg z-50 relative text-xs sm:text-sm"
            title="End Call"
          >
            <PhoneOff className="w-4 h-4 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">End Call</span>
            <span className="sm:hidden">End</span>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 relative">
        {/* Beautiful background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-pink-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-pink-400 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-200 rounded-full blur-xl"></div>
        </div>
        
        {/* Enhanced Character Avatar */}
        <div className="relative mb-6 sm:mb-8 z-10">
          <div className={`w-24 h-24 sm:w-36 sm:h-36 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 p-2 sm:p-3 shadow-2xl transition-all duration-500 ${
            callState.isSpeaking ? "animate-pulse scale-110 shadow-pink-500/50" : "hover:scale-105"
          }`}>
            <img 
              src={character.avatar} 
              alt={character.name}
              className="w-full h-full rounded-full object-cover transition-transform duration-300"
            />
          </div>
          
          {/* Enhanced Status Indicators */}
          <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 flex gap-2">
            {callState.isSpeaking && (
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-xl animate-bounce">
                <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-pulse" />
              </div>
            )}
            {callState.isProcessing && (
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-pink-400 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-spin" />
              </div>
            )}
          </div>
          
          {/* Enhanced Speaking Animation Rings */}
          {callState.isSpeaking && (
            <>
              <div className="absolute inset-0 rounded-full border-4 border-pink-300 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-2 border-pink-200 animate-ping" style={{animationDelay: "0.5s"}}></div>
            </>
          )}
          
          {/* Character Name Badge */}
          <div className="absolute -bottom-6 sm:-bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 sm:px-4 sm:py-2 rounded-full shadow-lg border border-pink-200">
            <span className="text-pink-700 font-semibold text-xs sm:text-sm">{character.name}</span>
          </div>
        </div>

        {/* Status Messages */}
        <div className="text-center mb-6 sm:mb-8 relative z-10">
          {callState.isSpeaking && (
            <div className="bg-pink-100 rounded-2xl p-3 sm:p-4 shadow-lg animate-pulse">
              <p className="text-pink-700 text-sm sm:text-lg font-semibold animate-bounce">🎤 {character.name} is speaking...</p>
            </div>
          )}
          {callState.isProcessing && (
            <div className="bg-pink-50 rounded-2xl p-3 sm:p-4 shadow-lg">
              <p className="text-pink-600 text-sm sm:text-lg font-semibold">🤔 {character.name} is thinking...</p>
            </div>
          )}
          {callState.isListening && !callState.isSpeaking && !callState.isProcessing && (
            <div className="bg-green-50 rounded-2xl p-3 sm:p-4 shadow-lg animate-pulse">
              <p className="text-green-700 text-sm sm:text-lg font-semibold">👂 Listening for your voice...</p>
            </div>
          )}
          {!callState.isListening && !callState.isSpeaking && !callState.isProcessing && (
            <div className="bg-gray-50 rounded-2xl p-3 sm:p-4 shadow-lg">
              <p className="text-gray-700 text-sm sm:text-lg font-semibold">💬 Say something to {character.name}...</p>
            </div>
          )}
        </div>

        {/* Enhanced Current Transcript */}
        {callState.currentTranscript && (
          <div className="flex justify-end mb-4 sm:mb-6 animate-fadeIn">
            <div className="max-w-[90%] sm:max-w-md px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl rounded-br-md shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-pink-200 rounded-full animate-pulse"></div>
                <span className="text-pink-100 text-xs font-semibold uppercase tracking-wide">You said:</span>
                <span className="text-pink-200 text-xs">
                  {new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                </span>
              </div>
              <p className="text-white text-sm sm:text-base font-medium leading-relaxed break-words">{callState.currentTranscript}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3 sm:gap-4 relative z-10">
          <Button
            onClick={toggleMicrophone}
            disabled={!callState.microphonePermission}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full ${
              callState.isListening 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {callState.isListening ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </Button>
          
          <Button
            onClick={toggleMute}
            variant="outline"
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-slate-600"
          >
            {callState.isMuted ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
          </Button>
        </div>
      </div>

      {/* FIXED: Enhanced Conversation History with proper scrolling and mobile optimization */}
      {callState.conversationHistory.length > 0 && (
        <div className="border-t border-pink-200 bg-gradient-to-b from-pink-50/50 to-white/50 p-4 sm:p-6 flex flex-col flex-shrink-0">
          <h3 className="text-base sm:text-lg font-bold text-pink-700 mb-3 sm:mb-4 flex items-center gap-2 flex-shrink-0">
            <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
            Conversation with {character.name}
          </h3>
          <div 
            ref={conversationRef}
            className="flex-1 overflow-y-auto space-y-3 max-h-48 sm:max-h-64 scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-100"
            style={{
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch'
            }}
          >
            {callState.conversationHistory.map((message, index) => (
              <div key={`${message.id}-${index}`} className="flex flex-col gap-2">
                {message.sender === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-[85%] sm:max-w-md px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl rounded-br-md shadow-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-pink-100 text-xs font-semibold">You</span>
                        <span className="text-pink-200 text-xs">
                          {new Date(message.timestamp).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium leading-relaxed break-words">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] sm:max-w-md px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-bl-md shadow-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-100 text-xs font-semibold">{character.name}</span>
                        <span className="text-blue-200 text-xs">
                          {new Date(message.timestamp).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium leading-relaxed break-words">{message.content}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
