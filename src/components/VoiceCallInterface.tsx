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
  
  
  // ULTRA-AGGRESSIVE SPEECH BLOCKING: Initialize global flags
  if (typeof window !== "undefined") {
    (window as any).aiSpeaking = (window as any).aiSpeaking || false;
    (window as any).aiProcessing = (window as any).aiProcessing || false;
    (window as any).aiJustFinishedSpeaking = (window as any).aiJustFinishedSpeaking || null;
    (window as any).aiSpeakingTimestamp = (window as any).aiSpeakingTimestamp || null;
    (window as any).aiProcessingTimestamp = (window as any).aiProcessingTimestamp || null;
    (window as any).speechDetectionLocked = (window as any).speechDetectionLocked || false;
    (window as any).lastUserSpeechTime = (window as any).lastUserSpeechTime || 0;
  }  const [callState, setCallState] = useState<CallState>({
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

  // Refs for cleanup
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const callStartTimeRef = useRef<Date>(new Date());
  const isCallActiveRef = useRef<boolean>(true);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Setup speech recognition (optimized)
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
    
    recognition.continuous = false; // Set to false to prevent false detection
    recognition.interimResults = false; // Only final results to prevent false triggers
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    // Add confidence threshold
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
      
      // INTERRUPTION SUPPORT: If user speaks while AI is speaking, interrupt immediately
      if (window.aiSpeaking && transcript && transcript.length > 2 && confidence > 0.7) {
        console.log("🛑 INTERRUPTION: User spoke while AI was speaking, stopping AI");
        stopAllSpeech();
        window.aiSpeaking = false;
        window.aiProcessing = false;
        setCallState(prev => ({ ...prev, isSpeaking: false }));
        
        // Process the interruption immediately
        if (transcript.length > 3 && confidence > 0.8) {
          console.log("🎯 Interruption message:", transcript, "(confidence:", confidence, ")");
          setCallState(prev => ({ ...prev, currentTranscript: transcript }));
          handleUserMessage(transcript);
        }
        return;
      }
      
      // ULTRA-AGGRESSIVE BLOCKING: Block ALL speech input when AI is active
      if (window.aiSpeaking || window.aiProcessing || callState.isSpeaking || callState.isProcessing) {
        console.log("🚫 BLOCKED: AI is speaking/processing, ignoring speech input");
        return;
      }
      
      // Additional timestamp-based blocking
      const now = Date.now();
      if (window.aiJustFinishedSpeaking && (now - window.aiJustFinishedSpeaking < 1000)) {
        console.log("🚫 BLOCKED: Too soon after AI finished speaking");
        return;
      }
      
      // Block if AI is processing
      if (window.aiProcessingTimestamp && (now - window.aiProcessingTimestamp < 500)) {
        console.log("🚫 BLOCKED: AI is processing, ignoring speech input");
        return;
      }
      
      // STRICT FILTERING: Only accept clear, intentional speech
      if (transcript && transcript.length > 3 && confidence > 0.9) {
        // Additional check for intentional speech
        const words = transcript.split(" ");
        if (words.length >= 2 && !transcript.match(/^(uh|um|ah|oh|hmm|yeah|ok|okay|hi|hey)$/i)) {
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
      
    };

    recognitionRef.current = recognition;
    return true;
  }, [toast, callState.isProcessing, callState.isSpeaking]);

  // Manual restart function for speech recognition
  const restartSpeechRecognition = useCallback(() => {
    if (isCallActiveRef.current && recognitionRef.current) {
      try {
        if (isRecognitionActiveRef.current) {
          recognitionRef.current.stop();
        }
        setTimeout(() => {
          if (isCallActiveRef.current && recognitionRef.current && !isRecognitionActiveRef.current) {
            recognitionRef.current.start();
            isRecognitionActiveRef.current = true;
            setCallState(prev => ({ ...prev, isListening: true }));
            console.log("🎤 MANUAL RESTART - Speech recognition restarted");
          }
        }, 100);
      } catch (error) {
        console.log("⚠️ Manual restart failed:", error);
      }
    }
  }, []);

  // Handle user message (optimized)
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

      // Update conversation history
      setCallState(prev => ({
        ...prev,
        conversationHistory: [...prev.conversationHistory, userMessage, aiMessage]
      }));

      console.log("🔊 About to call speakAIResponse with:", aiResponse.substring(0, 50) + "...");
      console.log("🔊 isCallActiveRef.current before speakAIResponse:", isCallActiveRef.current);
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

  // Speak AI response (optimized)
  const speakAIResponse = useCallback(async (response: string) => {
    if (!isCallActiveRef.current || callState.isMuted) return;

    // NUCLEAR BLOCKING: Set all blocking flags immediately
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
        
        // AUTOMATIC RESTART: Clear all flags and automatically restart like a real call
        setTimeout(() => {
          // Clear ALL advanced flags
          window.aiSpeaking = false;
          window.aiProcessing = false;
          window.aiJustFinished = false;
          console.log("🔇 ADVANCED CLEANUP - All flags cleared");
          
          // Re-enable microphone
          setCallState(prev => ({ 
            ...prev, 
            microphoneDisabled: false,
            isListening: false,
            isSpeaking: false,
            isProcessing: false
          }));
          
          // AUTOMATIC RESTART: Use the dedicated restart function
          setTimeout(() => {
            restartSpeechRecognition();
          }, 2000); // Wait 2 seconds after AI finishes before restarting
          
        }, 2000); // Wait 2 seconds after AI finishes
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

  // ULTRA-FAST Speech Recognition Restart
  const restartSpeechRecognition = useCallback(() => {
    if (!isCallActiveRef.current || callState.isSpeaking || callState.isProcessing) return;
    
    try {
      if (recognitionRef.current && !isRecognitionActiveRef.current) {
        recognitionRef.current.start();
        isRecognitionActiveRef.current = true;
        setCallState(prev => ({ ...prev, isListening: true }));
        console.log("🎤 ULTRA-FAST RESTART - Speech recognition restarted");
      }
    } catch (error) {
      console.log("⚠️ Restart failed:", error);
      // Retry after a short delay
      setTimeout(() => {
        if (recognitionRef.current && !isRecognitionActiveRef.current) {
          try {
            recognitionRef.current.start();
            isRecognitionActiveRef.current = true;
            setCallState(prev => ({ ...prev, isListening: true }));
            console.log("🎤 RETRY RESTART - Speech recognition restarted");
          } catch (retryError) {
            console.log("⚠️ Retry restart failed:", retryError);
          }
        }
      }, 100);
    }
  }, [callState.isSpeaking, callState.isProcessing]);

  const endCall = useCallback(() => {
    console.log('📞 Ending voice call...');
    isCallActiveRef.current = false;
    
    stopAllSpeech();
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    
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
        }, 2000); // Longer delay for stability
      }
    };
    
    startCall();
    
    // Call duration timer (simplified)
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
  }, []); // Run only once on mount

  // Auto-scroll transcript to bottom when new messages arrive
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
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
      <div className="flex items-center justify-between p-6 border-b border-pink-200 bg-white/95 backdrop-blur-md shadow-xl relative z-10">
        {/* Header Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-pink-50/50 to-white/50"></div>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 flex items-center justify-center shadow-lg">
            <img 
              src={character.avatar} 
              alt={character.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{character.name}</h2>
            <p className="text-pink-600 text-sm font-medium">Voice Call</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-pink-100 text-pink-700 border-pink-200">
            {formatDuration(callState.callDuration)}
          </Badge>
          {/* Clear chat history button removed to prevent crashes */}
          <Button
            variant="ghost"
            size="sm"
            onClick={endCall}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 rounded-full p-2 transition-all duration-200 hover:scale-110"
            title="End Call"
          >
            <PhoneOff className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        {/* Beautiful background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-32 h-32 bg-pink-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-24 h-24 bg-pink-400 rounded-full blur-2xl"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-pink-200 rounded-full blur-xl"></div>
        </div>
        
        {/* Enhanced Character Avatar */}
        <div className="relative mb-8 z-10">
          <div className={`w-36 h-36 rounded-full bg-gradient-to-r from-pink-500 to-pink-600 p-3 shadow-2xl transition-all duration-500 ${
            callState.isSpeaking ? "animate-pulse scale-110 shadow-pink-500/50" : "hover:scale-105"
          }`}>
            <img 
              src={character.avatar} 
              alt={character.name}
              className="w-full h-full rounded-full object-cover transition-transform duration-300"
            />
          </div>
          
          {/* Enhanced Status Indicators */}
          <div className="absolute -bottom-3 -right-3 flex gap-2">
            {callState.isSpeaking && (
              <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center shadow-xl animate-bounce">
                <Volume2 className="w-4 h-4 text-white animate-pulse" />
              </div>
            )}
            {callState.isProcessing && (
              <div className="w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
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
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-pink-200">
            <span className="text-pink-700 font-semibold text-sm">{character.name}</span>
          </div>
        </div>

        {/* Status Messages */}
        <div className="text-center mb-8 relative z-10">
          {callState.isSpeaking && (
            <div className="bg-pink-100 rounded-2xl p-4 shadow-lg animate-pulse">
              <p className="text-pink-700 text-lg font-semibold animate-bounce">🎤 {character.name} is speaking...</p>
            </div>
          )}
          {callState.isProcessing && (
            <div className="bg-pink-50 rounded-2xl p-4 shadow-lg">
              <p className="text-pink-600 text-lg font-semibold">🤔 {character.name} is thinking...</p>
            </div>
          )}
          {callState.isListening && !callState.isSpeaking && !callState.isProcessing && (
            <div className="bg-green-50 rounded-2xl p-4 shadow-lg animate-pulse">
              <p className="text-green-700 text-lg font-semibold">👂 Listening for your voice...</p>
            </div>
          )}
          {!callState.isListening && !callState.isSpeaking && !callState.isProcessing && (
            <div className="bg-gray-50 rounded-2xl p-4 shadow-lg">
              <p className="text-gray-700 text-lg font-semibold">💬 Say something to {character.name}...</p>
            </div>
          )}
        </div>

        {/* Enhanced Current Transcript */}
        {callState.currentTranscript && (
          <div className="flex justify-end mb-6 animate-fadeIn">
            <div className="max-w-md px-6 py-4 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl rounded-br-md shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-pink-200 rounded-full animate-pulse"></div>
                <span className="text-pink-100 text-xs font-semibold uppercase tracking-wide">You said:</span>
                <span className="text-pink-200 text-xs">
                  {new Date().toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                </span>
              </div>
              <p className="text-white text-base font-medium leading-relaxed">{callState.currentTranscript}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-4 relative z-10">
          <Button
            onClick={toggleMicrophone}
            disabled={!callState.microphonePermission}
            className={`w-16 h-16 rounded-full ${
              callState.isListening 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-green-500 hover:bg-green-600'
            }`}
          >
            {callState.isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>
          
          <Button
            onClick={toggleMute}
            variant="outline"
            className="w-16 h-16 rounded-full border-slate-600"
          >
            {callState.isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Enhanced Conversation History */}
      {callState.conversationHistory.length > 0 && (
        <div className="border-t border-pink-200 bg-gradient-to-b from-pink-50/50 to-white/50 p-6 max-h-60 overflow-y-auto">
          <h3 className="text-lg font-bold text-pink-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-pink-400 rounded-full"></span>
            Conversation with {character.name}
          </h3>
          <div className="space-y-4">
            {callState.conversationHistory.slice(-5).map((message, index) => (
              <div key={`${message.id}-${index}`} className="flex flex-col gap-2">
                {message.sender === 'user' ? (
                  <div className="flex justify-end">
                    <div className="max-w-xs lg:max-w-md px-4 py-3 bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-2xl rounded-br-md shadow-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-pink-100 text-xs font-semibold">You</span>
                        <span className="text-pink-200 text-xs">
                          {new Date(message.timestamp).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-start">
                    <div className="max-w-xs lg:max-w-md px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl rounded-bl-md shadow-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-blue-100 text-xs font-semibold">{character.name}</span>
                        <span className="text-blue-200 text-xs">
                          {new Date(message.timestamp).toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})}
                        </span>
                      </div>
                      <p className="text-white text-sm font-medium leading-relaxed">{message.content}</p>
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
