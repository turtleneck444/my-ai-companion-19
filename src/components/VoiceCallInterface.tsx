import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { speakText, stopAllTTS, getNaturalVoiceSettings } from '@/lib/voice';
import { personalityAI, ChatMessage, Character, UserPreferences, ChatContext } from '@/lib/ai-chat';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Phone, 
  PhoneOff, 
  Loader2,
  Settings,
  MessageCircle,
  User,
  Waves,
  Signal,
  Pause,
  Play
} from 'lucide-react';

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
  isSpeakerOn: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  currentTranscript: string;
  conversationHistory: ChatMessage[];
  voiceLevel: number;
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
    isSpeakerOn: true,
    isProcessing: false,
    isSpeaking: false,
    currentTranscript: '',
    conversationHistory: [],
    voiceLevel: 0,
    callDuration: 0,
    microphonePermission: false
  });

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const isCallActiveRef = useRef<boolean>(true);
  const callStartTimeRef = useRef<Date>(new Date());
  const isRecognitionActiveRef = useRef<boolean>(false);

  // Get character's custom voice ID
  const getCharacterVoiceId = useCallback(() => {
    // Always use your custom voice for Luna
    if (character.name.toLowerCase() === 'luna') {
      console.log('🎤 Using custom Luna voice: NAW2WDhAioeiIYFXitBQ');
      return 'NAW2WDhAioeiIYFXitBQ';
    }
    
    // For other characters, try to get their voice ID
    const voiceId = character.voice?.voice_id || 
                   character.voiceId || 
                   (character as any).voice_id ||
                   'NAW2WDhAioeiIYFXitBQ'; // Fallback to custom voice
    
    console.log('🎤 Character voice ID:', voiceId);
    return voiceId;
  }, [character]);

  // Initialize microphone with permission
  const initializeMicrophone = useCallback(async () => {
    try {
      console.log('🎤 Initializing microphone...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      setCallState(prev => ({ ...prev, microphonePermission: true }));
      
      // Setup audio context for voice visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      console.log('✅ Microphone initialized successfully');
      
      toast({
        title: "Microphone Ready",
        description: "Click the microphone button to start speaking",
      });
      
      return true;
    } catch (error) {
      console.error('❌ Microphone initialization failed:', error);
      setCallState(prev => ({ ...prev, microphonePermission: false }));
      
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice calls",
        variant: "destructive"
      });
      
      return false;
    }
  }, [toast]);

  // Setup speech recognition
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
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;
    
    recognition.onstart = () => {
      console.log('🎤 Speech recognition started');
      isRecognitionActiveRef.current = true;
      setCallState(prev => ({ ...prev, isListening: true }));
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!isCallActiveRef.current) return;
      
      let finalTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        }
      }

      if (finalTranscript && isCallActiveRef.current) {
        console.log('🎯 User said:', finalTranscript);
        setCallState(prev => ({ ...prev, currentTranscript: finalTranscript }));
        handleUserMessage(finalTranscript);
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
      } else if (event.error === 'aborted') {
        // Auto-restart on abort (common browser behavior)
        setTimeout(() => {
          if (isCallActiveRef.current && recognitionRef.current && !isRecognitionActiveRef.current) {
            try {
              recognitionRef.current.start();
              console.log('🔄 Auto-restarted after abort');
            } catch (error) {
              console.log('⚠️ Restart after abort failed:', error);
            }
          }
        }, 100);
      }
    };

    recognition.onend = () => {
      console.log('🔄 Speech recognition ended - auto-restarting...');
      isRecognitionActiveRef.current = false;
      setCallState(prev => ({ ...prev, isListening: false }));
      
      // Auto-restart after a brief delay (unless call ended or AI is speaking)
      if (isCallActiveRef.current) {
        setTimeout(() => {
          if (isCallActiveRef.current && recognitionRef.current && !isRecognitionActiveRef.current && !callState.isSpeaking) {
            try {
              recognitionRef.current.start();
              console.log('✅ Speech recognition auto-restarted');
            } catch (error) {
              console.log('⚠️ Auto-restart failed, will retry in 1s...', error);
              // If restart fails, try again after longer delay
              setTimeout(() => {
                if (isCallActiveRef.current && recognitionRef.current && !isRecognitionActiveRef.current) {
                  try {
                    recognitionRef.current.start();
                    console.log('✅ Speech recognition retry successful');
                  } catch (retryError) {
                    console.log('❌ Speech recognition retry failed:', retryError);
                  }
                }
              }, 1000);
            }
          }
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    return true;
  }, [toast]);

  // Voice level visualization
  const updateVoiceLevel = useCallback(() => {
    if (!analyserRef.current || !isCallActiveRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const voiceLevel = Math.min(100, average * 2);
    
    setCallState(prev => ({ ...prev, voiceLevel }));

    if (isCallActiveRef.current) {
      animationRef.current = requestAnimationFrame(updateVoiceLevel);
    }
  }, []);

  // Handle user message
  const handleUserMessage = useCallback(async (message: string) => {
    if (!message.trim() || !isCallActiveRef.current) return;

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
  }, [character, userPreferences, callState.conversationHistory]);

  // Speak AI response with custom voice
  const speakAIResponse = useCallback(async (response: string) => {
    if (!isCallActiveRef.current || callState.isMuted) return;

    try {
      setCallState(prev => ({ ...prev, isSpeaking: true }));
      
      const voiceId = getCharacterVoiceId();
      
      // Enhanced voice settings for natural speech
      const voiceSettings = {
        stability: 0.2,          // Very low for natural expression
        similarity_boost: 0.9,   // High for voice consistency  
        style: 0.7,              // High style for personality
        use_speaker_boost: true  // Better clarity
      };
      
      console.log('🎤 Speaking with enhanced voice:', {
        characterName: character.name,
        voiceId: voiceId,
        settings: voiceSettings
      });
      
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

  // Call controls
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
      if (recognitionRef.current && !callState.isSpeaking) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          console.error('❌ Failed to start recognition:', error);
        }
      }
    }
  }, [callState.microphonePermission, callState.isListening, callState.isSpeaking, initializeMicrophone]);

  const toggleMute = useCallback(() => {
    setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    if (!callState.isMuted) {
      stopAllTTS();
    }
  }, [callState.isMuted]);

  const toggleSpeaker = useCallback(() => {
    setCallState(prev => ({ ...prev, isSpeakerOn: !prev.isSpeakerOn }));
  }, []);

  // Initialize call
  useEffect(() => {
    console.log('📞 Initializing voice call...');
    callStartTimeRef.current = new Date();
    
    // Initialize microphone and auto-start listening
    const startCall = async () => {
      const micReady = await initializeMicrophone();
      const speechReady = setupSpeechRecognition();
      
      if (micReady && speechReady) {
        // Auto-start listening after brief delay
        setTimeout(() => {
          if (recognitionRef.current && isCallActiveRef.current) {
            try {
              recognitionRef.current.start();
              console.log('🎤 Auto-started continuous listening');
            } catch (error) {
              console.log('⚠️ Auto-start failed:', error);
            }
          }
        }, 1000);
      }
    };
    
    startCall();
    
    // Start call duration timer
    const timer = setInterval(() => {
      if (isCallActiveRef.current) {
        const duration = Math.floor((Date.now() - callStartTimeRef.current.getTime()) / 1000);
        setCallState(prev => ({ ...prev, callDuration: duration }));
      }
    }, 1000);

    // Start voice visualization
    updateVoiceLevel();
    
    setCallState(prev => ({ ...prev, isConnected: true }));
    
    console.log('✅ Voice call initialized');
    
    return () => {
      clearInterval(timer);
      isCallActiveRef.current = false;
      stopAllTTS();
      
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initializeMicrophone, setupSpeechRecognition, updateVoiceLevel]);

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white ${className}`}>
      {/* Professional Phone Call Interface */}
      <div className="flex flex-col h-full max-w-md mx-auto">
        
        {/* Header - Call Status */}
        <div className="flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${callState.isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
              <span className="text-sm text-white/70">
                {callState.isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
            <p className="text-lg font-medium">{formatDuration(callState.callDuration)}</p>
          </div>
        </div>

        {/* Character Display */}
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          
          {/* Large Character Avatar */}
          <div className="relative">
            <div className="w-48 h-48 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 p-2 shadow-2xl">
              <img 
                src={character.avatar} 
                alt={character.name}
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            
            {/* Speaking animation */}
            {callState.isSpeaking && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-pulse"></div>
              </>
            )}
            
            {/* Voice level indicators around avatar */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={`absolute w-3 h-3 rounded-full transition-all duration-200 ${
                      callState.voiceLevel > (i + 1) * 12 ? 'bg-green-400 opacity-80' : 'bg-gray-600 opacity-30'
                    }`}
                    style={{
                      top: '50%',
                      left: '50%',
                      transform: `translate(-50%, -50%) rotate(${i * 45}deg) translateY(-140px)`
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Character Info */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold">{character.name}</h2>
            <p className="text-white/70">Voice Call</p>
            <div className="text-sm text-white/60">
              Voice ID: {getCharacterVoiceId()}
            </div>
          </div>

          {/* Current Status */}
          <div className="text-center space-y-2">
            {callState.isProcessing && (
              <div className="flex items-center justify-center space-x-2 text-blue-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </div>
            )}
            
            {callState.isSpeaking && (
              <div className="flex items-center justify-center space-x-2 text-purple-400">
                <Volume2 className="w-4 h-4" />
                <span>{character.name} is speaking...</span>
              </div>
            )}
            
            {callState.isListening && (
              <div className="flex items-center justify-center space-x-2 text-green-400">
                <Mic className="w-4 h-4 animate-pulse" />
                <span>Ready to chat - Just speak naturally!</span>
              </div>
            )}
            
            {!callState.isListening && !callState.isSpeaking && !callState.isProcessing && (
              <div className="flex items-center justify-center space-x-2 text-yellow-400">
                <Mic className="w-4 h-4" />
                <span>Starting voice detection...</span>
              </div>
            )}
            
            {callState.currentTranscript && (
              <div className="bg-blue-500/20 rounded-lg p-3 max-w-xs">
                <p className="text-sm text-white/90">"{callState.currentTranscript}"</p>
              </div>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="p-6 bg-black/20 backdrop-blur-sm">
          <div className="flex items-center justify-center space-x-6">
            
            {/* Microphone Button */}
            <Button
              onClick={toggleMicrophone}
              className={`w-16 h-16 rounded-full ${
                callState.isListening 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : callState.microphonePermission
                  ? 'bg-gray-600 hover:bg-gray-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } shadow-lg`}
            >
              {callState.isListening ? (
                <Mic className="w-6 h-6" />
              ) : callState.microphonePermission ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>

            {/* End Call Button */}
            <Button
              onClick={onEndCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 shadow-lg"
            >
              <PhoneOff className="w-6 h-6" />
            </Button>

            {/* Speaker Button */}
            <Button
              onClick={toggleMute}
              className={`w-16 h-16 rounded-full ${
                callState.isMuted 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-gray-600 hover:bg-gray-700'
              } shadow-lg`}
            >
              {callState.isMuted ? (
                <VolumeX className="w-6 h-6" />
              ) : (
                <Volume2 className="w-6 h-6" />
              )}
            </Button>
            
          </div>
          
          {/* Control Labels */}
          <div className="flex items-center justify-center space-x-6 mt-3">
            <span className="text-xs text-white/60 w-16 text-center">
              {callState.isListening ? 'Listening' : callState.microphonePermission ? 'Tap to Talk' : 'Allow Mic'}
            </span>
            <span className="text-xs text-white/60 w-16 text-center">End Call</span>
            <span className="text-xs text-white/60 w-16 text-center">
              {callState.isMuted ? 'Muted' : 'Speaker'}
            </span>
          </div>
        </div>

        {/* Recent Conversation */}
        {callState.conversationHistory.length > 0 && (
          <div className="p-4 bg-black/10 backdrop-blur-sm max-h-32 overflow-y-auto">
            <div className="space-y-2">
              {callState.conversationHistory.slice(-2).map((message) => (
                <div
                  key={message.id}
                  className={`text-sm p-2 rounded ${
                    message.sender === 'user' 
                      ? 'bg-blue-500/20 text-blue-100' 
                      : 'bg-purple-500/20 text-purple-100'
                  }`}
                >
                  <span className="font-medium">
                    {message.sender === 'user' ? 'You' : character.name}:
                  </span>
                  <span className="ml-2">{message.content}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
