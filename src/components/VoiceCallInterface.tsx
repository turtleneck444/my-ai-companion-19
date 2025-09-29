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
import { speakText, stopAllTTS } from '@/lib/voice';

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice?: {
    voice_id: string;
    name: string;
  };
  voiceId?: string;
}

interface UserPreferences {
  preferredName?: string;
  petName?: string;
  treatmentStyle?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatContext {
  character: Character;
  userPreferences: UserPreferences;
  conversationHistory: ChatMessage[];
  relationshipLevel: number;
  timeOfDay: string;
  sessionMemory: Record<string, any>;
}

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
}

export const VoiceCallInterface: React.FC<VoiceCallInterfaceProps> = ({
  character,
  userPreferences,
  onEndCall,
  className = ''
}) => {
  const { toast } = useToast();
  
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

  // Refs for cleanup
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const callStartTimeRef = useRef<Date>(new Date());
  const isCallActiveRef = useRef<boolean>(true);
  const isRecognitionActiveRef = useRef<boolean>(false);
  const processingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get character's voice ID (optimized)
  const getCharacterVoiceId = useCallback(() => {
    return character.voice?.voice_id || 
           character.voiceId || 
           'NAW2WDhAioeiIYFXitBQ'; // Default to Luna's voice
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
    
    recognition.continuous = true;
    recognition.interimResults = false; // Only final results for better performance
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      isRecognitionActiveRef.current = true;
      setCallState(prev => ({ ...prev, isListening: true }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!isCallActiveRef.current) return;
      
      const transcript = event.results[event.results.length - 1][0].transcript.trim();
      
      if (transcript) {
        console.log('🎯 User said:', transcript);
        setCallState(prev => ({ ...prev, currentTranscript: transcript }));
        handleUserMessage(transcript);
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
      
      // Only restart if call is active and not processing
      if (isCallActiveRef.current && !callState.isProcessing && !callState.isSpeaking) {
        setTimeout(() => {
          if (isCallActiveRef.current && recognitionRef.current && !isRecognitionActiveRef.current) {
            try {
              recognitionRef.current.start();
              console.log('✅ Speech recognition restarted');
            } catch (error) {
              console.log('⚠️ Restart failed:', error);
            }
          }
        }, 1000); // Longer delay to prevent rapid restarts
      }
    };

    recognitionRef.current = recognition;
    return true;
  }, [toast, callState.isProcessing, callState.isSpeaking]);

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
        conversationHistory: [...callState.conversationHistory, userMessage],
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

      setCallState(prev => ({
        ...prev,
        conversationHistory: [...prev.conversationHistory, aiMessage]
      }));

      await speakAIResponse(aiResponse);

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
      
      stopAllTTS();
      
      await speakText(response, voiceId, {
        modelId: 'eleven_multilingual_v2',
        voiceSettings
      });
      
    } catch (error) {
      console.error('❌ Speech error:', error);
    } finally {
      if (isCallActiveRef.current) {
        setCallState(prev => ({ ...prev, isSpeaking: false }));
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
  const toggleMicrophone = useCallback(() => {
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
    console.log('📞 Ending voice call...');
    isCallActiveRef.current = false;
    
    stopAllTTS();
    
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
      stopAllTTS();
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [initializeMicrophone, setupSpeechRecognition]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white 
      flex flex-col ${className}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center">
            <img 
              src={character.avatar} 
              alt={character.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-xl font-semibold">{character.name}</h2>
            <p className="text-slate-400 text-sm">Voice Call</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-green-600">
            {formatDuration(callState.callDuration)}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={endCall}
            className="text-red-400 hover:text-red-300"
          >
            <PhoneOff className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        
        {/* Character Avatar */}
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 p-1">
            <img 
              src={character.avatar} 
              alt={character.name}
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          
          {/* Status Indicators */}
          <div className="absolute -bottom-2 -right-2 flex gap-1">
            {callState.isSpeaking && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Volume2 className="w-3 h-3 text-white" />
              </div>
            )}
            {callState.isProcessing && (
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        <div className="text-center mb-8">
          {callState.isSpeaking && (
            <p className="text-green-400 text-lg">🎤 {character.name} is speaking...</p>
          )}
          {callState.isProcessing && (
            <p className="text-blue-400 text-lg">🤔 {character.name} is thinking...</p>
          )}
          {callState.isListening && !callState.isSpeaking && !callState.isProcessing && (
            <p className="text-slate-400 text-lg">👂 Listening for your voice...</p>
          )}
          {!callState.isListening && !callState.isSpeaking && !callState.isProcessing && (
            <p className="text-slate-400 text-lg">💬 Say something to {character.name}...</p>
          )}
        </div>

        {/* Current Transcript */}
        {callState.currentTranscript && (
          <div className="bg-slate-800 rounded-lg p-4 mb-6 max-w-md">
            <p className="text-slate-300 text-sm">You said:</p>
            <p className="text-white">{callState.currentTranscript}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-4">
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

      {/* Conversation History (Collapsible) */}
      {callState.conversationHistory.length > 0 && (
        <div className="border-t border-slate-700 p-4 max-h-40 overflow-y-auto">
          <h3 className="text-sm font-semibold text-slate-400 mb-2">Conversation</h3>
          <div className="space-y-2">
            {callState.conversationHistory.slice(-3).map((message) => (
              <div key={message.id} className="text-xs">
                <span className="text-slate-500">
                  {message.sender === 'user' ? 'You' : character.name}:
                </span>
                <span className="text-slate-300 ml-2">{message.content}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
