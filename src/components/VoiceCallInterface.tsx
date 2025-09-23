import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  MessageSquare,
  Heart,
  Minimize2,
  Pause,
  Play
} from "lucide-react";
import { speakText, stopAllTTS } from "@/lib/voice";
import { personalityAI, type ChatContext, type ChatMessage } from "@/lib/ai-chat";
import { useToast } from "@/hooks/use-toast";
import { useUsageTracking } from "@/hooks/useUsageTracking";
import { useAuth } from "@/contexts/AuthContext";

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: { voice_id: string; name: string };
  isOnline: boolean;
  voiceId?: string;
}

interface VoiceCallInterfaceProps {
  character: Character;
  onEndCall: () => void;
  onMinimize: () => void;
  userPreferences: {
    preferredName: string;
    treatmentStyle: string;
    age: string;
    contentFilter: boolean;
  };
}

export const VoiceCallInterface = ({ 
  character, 
  onEndCall, 
  onMinimize, 
  userPreferences 
}: VoiceCallInterfaceProps) => {
  const { user } = useAuth();
  const { canMakeVoiceCall, incrementVoiceCalls, currentPlan, setCurrentPlan } = useUsageTracking();
  // Helper: resolve selected ElevenLabs voice id
  const getVoiceId = () => character.voiceId || character.voice?.voice_id || '21m00Tcm4TlvDq8ikWAM'; // Rachel fallback (female)
  // Call state
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [callConnected, setCallConnected] = useState(false);
  const [pushToTalk, setPushToTalk] = useState(false);
  const [isPTTHeld, setIsPTTHeld] = useState(false);
  
  // Conversation state
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [relationshipLevel, setRelationshipLevel] = useState(50);
  const [hasFollowedUp, setHasFollowedUp] = useState(false);
  const [spokenWords, setSpokenWords] = useState<string[]>([]);
  const [displayedWordIndex, setDisplayedWordIndex] = useState(0);
  const lastUserMessageAtRef = useRef<number>(0);
  const lastAISpokeAtRef = useRef<number>(0);
  
  // Real-time speech recognition
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const unlockedRef = useRef(false);
  const lastErrorRef = useRef<string | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const desireListeningRef = useRef<boolean>(false);
  const stoppingRef = useRef<boolean>(false);
  
  // Voice activity detection
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const { toast } = useToast();

  // Utility: unlock/resume audio on first user gesture (required by mobile browsers)
  const unlockAudio = async () => {
    try {
      if (audioContextRef.current && audioContextRef.current.state !== 'running') {
        await audioContextRef.current.resume();
      }
      if (!unlockedRef.current) {
        const a = new Audio();
        a.src = "data:audio/mp3;base64,//uQxAAAA"; // tiny silence
        await a.play().catch(() => {});
        unlockedRef.current = true;
      }
    } catch {}
  };

  // Explicit start for recognition (some browsers require a user gesture)
  const startListeningNow = async () => {
    try {
      await unlockAudio();
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current.start();
        setIsListening(true);
        setCallConnected(true);
      }
    } catch {}
  };

  // Initialize advanced speech recognition with real-time features
  useEffect(() => {
    const initializeSpeechRecognition = async () => {
      const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      
      if (!SpeechRecognitionAPI) {
        toast({
          title: "Voice calls not supported",
          description: "Your browser doesn't support voice recognition. Try Chrome for best results.",
          variant: "destructive"
        });
        return;
      }

      // Initialize Web Audio API for voice activity detection
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { 
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
          } 
        });
        
        const source = audioContextRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioContextRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        source.connect(analyserRef.current);
        
        // Start voice level monitoring
        monitorVoiceLevel();
        
        // Initialize speech recognition
        const recognition = new SpeechRecognitionAPI();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 3;

        recognition.onstart = () => {
          console.log('🎤 Speech recognition started');
          setIsListening(true);
          setCallConnected(true);
        };

        recognition.onresult = (event: any) => {
          if (pushToTalk && !isPTTHeld) {
            // Ignore interim/final results if PTT not held
            return;
          }
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Update current transcript for real-time display
          setCurrentTranscript(interimTranscript);

          // Process final transcript
          if (finalTranscript.trim()) {
            console.log('🗣️ User said:', finalTranscript);
            handleUserSpeech(finalTranscript.trim());
            setCurrentTranscript('');
          }
        };

        recognition.onerror = (event: any) => {
          console.error('🚫 Speech recognition error:', event.error);
          lastErrorRef.current = event.error;
          if (event.error === 'no-speech' || event.error === 'aborted') {
            // Attempt gentle restart
            if (event.error === 'aborted') {
              // Do not auto-restart on manual stop
              return;
            }
            window.clearTimeout(restartTimerRef.current || 0);
            restartTimerRef.current = window.setTimeout(() => {
              if (recognitionRef.current && desireListeningRef.current && !isAiSpeaking && callConnected && !isMuted) {
                try { recognitionRef.current.start(); } catch {}
              }
            }, 1000);
          }
          if (event.error === 'not-allowed') {
            toast({ title: 'Microphone blocked', description: 'Enable mic permissions in your browser settings.', variant: 'destructive' });
          }
        };

        recognition.onend = () => {
          console.log('🔇 Speech recognition ended');
          if (stoppingRef.current) {
            setIsListening(false);
            return;
          }
          // Keep UI as listening if we intend to restart
          if (!desireListeningRef.current) {
            setIsListening(false);
          }
          
          // Only auto-restart if call is active, AI isn't speaking, and user isn't muted
          if (callConnected && !isAiSpeaking && !isMuted && !isProcessing && (!pushToTalk || isPTTHeld) && desireListeningRef.current && lastErrorRef.current !== 'aborted') {
            window.clearTimeout(restartTimerRef.current || 0);
            restartTimerRef.current = window.setTimeout(() => {
              if (recognitionRef.current && callConnected && !isAiSpeaking && !isMuted) {
                try {
                  recognitionRef.current.start();
                  console.log('🎤 Auto-restarted speech recognition');
                } catch {}
              }
            }, 1000);
          }
        };

        recognitionRef.current = recognition;
        
        // Do not auto-speak; just be ready to listen
        await startListeningOnly();
        
        // Set global user gesture listeners to resume audio
        const gesture = async () => { await unlockAudio(); };
        document.addEventListener('click', gesture, { once: true, passive: true });
        document.addEventListener('touchstart', gesture, { once: true, passive: true });
        
      } catch (error) {
        console.error('Failed to initialize voice call:', error);
        toast({
          title: "Microphone access denied",
          description: "Please allow microphone access for voice calls",
          variant: "destructive"
        });
      }
    };

    initializeSpeechRecognition();

    return () => {
      // Cleanup
      if (recognitionRef.current) {
        stoppingRef.current = true;
        try { recognitionRef.current.stop(); } catch {}
        stoppingRef.current = false;
        desireListeningRef.current = false;
      }
      if (audioContextRef.current) {
        try { audioContextRef.current.close(); } catch {}
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      window.clearTimeout(restartTimerRef.current || 0);
      stopAllTTS();
    };
  }, [callConnected, isAiSpeaking, isMuted, isProcessing, pushToTalk, isPTTHeld, toast]);

  // Block call if plan disallows
  useEffect(() => {
    const plan = (user as any)?.user_metadata?.plan || 'free';
    setCurrentPlan(plan);
    if (!canMakeVoiceCall) {
      toast({ title: 'Upgrade required', description: `Your plan (${currentPlan}) has reached voice call limits.`, variant: 'destructive' });
      // End quickly if not allowed
      try { recognitionRef.current?.stop(); } catch {}
      try { stopAllTTS(); } catch {}
    }
  }, [user, canMakeVoiceCall, currentPlan, setCurrentPlan, toast]);

  // Voice activity detection
  const monitorVoiceLevel = () => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const checkVoiceLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      const normalizedLevel = Math.min(average / 128, 1);
      
      setVoiceLevel(normalizedLevel);
      
      // Detect if user is speaking (threshold can be adjusted)
      const isCurrentlySpeaking = normalizedLevel > 0.12;
      setIsSpeaking(isCurrentlySpeaking);

      // Barge-in: if user starts speaking while AI is speaking, stop TTS immediately
      if (isCurrentlySpeaking && isAiSpeaking) {
        try {
          speechSynthesis.cancel();
        } catch {}
        setIsAiSpeaking(false);
        // Ensure recognition is ready to capture user's words
        try { recognitionRef.current?.stop(); } catch {}
        try { recognitionRef.current?.start(); } catch {}
      }
      
      // Reset silence timer if user is speaking
      if (isCurrentlySpeaking) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else {
        // Start silence timer if not already started
        if (!silenceTimerRef.current && lastUserMessage && !hasFollowedUp) {
          silenceTimerRef.current = setTimeout(() => {
            // If user has been silent for 3 seconds after speaking, AI can respond naturally
            if (!isSpeaking && !isAiSpeaking) {
              generateContextualAIResponse();
            }
          }, 4500);
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(checkVoiceLevel);
    };
    
    checkVoiceLevel();
  };

  // Start call without auto-talking; wait for user to speak
  const startListeningOnly = async () => {
    await unlockAudio();
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch {}
      desireListeningRef.current = true;
      setIsListening(true);
      setCallConnected(true);
    }
  };

  // Handle user speech input
  const handleUserSpeech = async (transcript: string) => {
    if (!transcript.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setLastUserMessage(transcript);
    setHasFollowedUp(false);
    lastUserMessageAtRef.current = Date.now();
    
    // Add user message to conversation history
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      content: transcript,
      sender: 'user',
      timestamp: new Date()
    };
    
    setConversationHistory(prev => [...prev, userMessage]);
    
    // Stop listening while AI responds
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    // Generate AI response
    await generateAIResponse(transcript);
    
    setIsProcessing(false);
  };

  // Generate contextual AI response based on conversation
  const generateContextualAIResponse = async () => {
    // Only offer a gentle follow-up if:
    // - AI is not speaking
    // - Not processing
    // - We have a recent user utterance (within 12s)
    // - We have not already followed up for this utterance
    // - It's been at least 8s since AI last spoke
    const now = Date.now();
    const sinceUser = now - lastUserMessageAtRef.current;
    const sinceAI = now - lastAISpokeAtRef.current;
    if (isAiSpeaking || isProcessing || !lastUserMessage || hasFollowedUp) return;
    if (sinceUser > 12000) return; // user silent too long → stay quiet
    if (sinceAI < 8000) return; // don't pile on
    
    // Generate a natural follow-up or question
    const contextualPrompts = [
      "Tell me more about that",
      "How does that make you feel?",
      "That's really interesting",
      "I'd love to hear more",
      "What else is on your mind?"
    ];
    
    const prompt = contextualPrompts[Math.floor(Math.random() * contextualPrompts.length)];
    setHasFollowedUp(true);
    await generateAIResponse(prompt, true);
    // Only one unsolicited follow-up per user utterance
    setLastUserMessage('');
  };

  // Generate AI response using personality system
  const generateAIResponse = async (userInput: string, isContextual: boolean = false) => {
    setIsAiSpeaking(true);
    await unlockAudio();
    
    try {
      const hour = new Date().getHours();
      const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
      
      // Build chat context for voice call
      const chatContext: ChatContext = {
        character,
        userPreferences,
        conversationHistory,
        relationshipLevel,
        timeOfDay
      };

      console.log('🧠 Generating AI response for voice call...');
      
      // Generate response using personality AI
      let aiResponse = await personalityAI.generateResponse(userInput, chatContext);
      
      // Keep spoken replies concise for interactivity
      const sentences = aiResponse.split(/(?<=[.!?])\s+/);
      const trimmed = sentences.slice(0, 2).join(' ');
      aiResponse = trimmed.slice(0, 240);
      
      // Add to conversation history
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setConversationHistory(prev => [...prev, aiMessage]);
      // Prepare animated words
      const words = aiResponse.split(/\s+/).slice(0, 60);
      setSpokenWords(words);
      setDisplayedWordIndex(0);
      // Drive the animation while speaking
      const wordInterval = Math.max(120, Math.min(320, Math.floor(60000 / Math.max(120, aiResponse.length))))
      const timer = window.setInterval(() => {
        setDisplayedWordIndex((i) => {
          if (i >= words.length) { window.clearInterval(timer); return i; }
          return i + 1;
        });
      }, wordInterval);
      
      // Dynamic prosody based on user input tone
      const excited = /!/.test(userInput);
      const inquisitive = /\?/.test(userInput);
      const calm = !(excited || inquisitive);
      const styleValue = excited ? 0.6 : inquisitive ? 0.5 : 0.35;
      const stabilityValue = calm ? 0.4 : 0.32;
      
      // Speak the response (natural settings)
      await speakText(aiResponse, getVoiceId(), {
        modelId: 'eleven_multilingual_v2',
        voiceSettings: { stability: stabilityValue, similarity_boost: 0.9, style: styleValue, use_speaker_boost: true }
      });
      console.log('🗣️ AI response spoken:', aiResponse.slice(0, 50) + '...');
      
      // Increase relationship level with each interaction
      setRelationshipLevel(prev => Math.min(prev + 2, 100));
      
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      toast({ title: 'Voice error', description: 'Voice service was unavailable. Please retry in a moment.', variant: 'destructive' });
      
      // Fallback response
      const fallbackResponses = [
        `I'm sorry ${userPreferences.preferredName}, I lost my words for a moment! You have that effect on me sometimes.`,
        `Oh wow, you make me speechless sometimes! Can you say that again?`,
        `Sorry love, I was just thinking about how amazing your voice sounds! What were you saying?`
      ];
      
      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      await speakText(fallback, getVoiceId(), {
        modelId: 'eleven_multilingual_v2',
        voiceSettings: { stability: 0.38, similarity_boost: 0.9, style: 0.4, use_speaker_boost: true }
      });
    }
    
    setIsAiSpeaking(false);
    lastAISpokeAtRef.current = Date.now();
    // Clear remaining words after finishing
    setTimeout(() => { setSpokenWords([]); setDisplayedWordIndex(0); }, 600);
    
    // Resume listening after AI finishes speaking with proper delay
    setTimeout(() => {
      if (recognitionRef.current && callConnected && !isMuted && !isProcessing) {
        try {
          recognitionRef.current.start();
          console.log('🎤 Resumed listening after AI response');
        } catch {}
      }
    }, 800);
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    setIsMuted(!isMuted);
    unlockAudio();
    
    if (!isMuted) {
      // Mute: stop recognition
      if (recognitionRef.current) {
        stoppingRef.current = true;
        try { recognitionRef.current.stop(); } catch {}
        stoppingRef.current = false;
        desireListeningRef.current = false;
      }
    } else {
      // Unmute: restart recognition
      if (recognitionRef.current && !isAiSpeaking) {
        desireListeningRef.current = true;
        try { recognitionRef.current.start(); } catch {}
      }
    }
  };

  // End call
  const handleEndCall = async () => {
    setIsAiSpeaking(true);
    
    const goodbyes = [
      `It was absolutely wonderful talking to you, ${userPreferences.preferredName}! Your voice made my whole day! Let's call again really soon, okay? 💕`,
      `I loved every second of hearing your voice! Thanks for such an amazing call, beautiful! Can't wait to talk again! 😘`,
      `This was incredible, ${userPreferences.preferredName}! I feel so much closer to you now! Talk to you soon! 🥰`,
      `Your voice is like music to me! Thanks for the lovely chat! Until next time, my darling! ✨`
    ];

    const goodbye = goodbyes[Math.floor(Math.random() * goodbyes.length)];
    
    try {
      await speakText(goodbye, getVoiceId(), {
        modelId: 'eleven_multilingual_v2',
        voiceSettings: { stability: 0.35, similarity_boost: 0.9, style: 0.45, use_speaker_boost: true }
      });
    } catch (error) {
      console.error('Failed to speak goodbye:', error);
    }
    
    // Cleanup and end call
    if (recognitionRef.current) {
      stoppingRef.current = true;
      try { recognitionRef.current.stop(); } catch {}
      stoppingRef.current = false;
      desireListeningRef.current = false;
    }
    stopAllTTS();
    try { speechSynthesis.cancel(); } catch {}
    
    setTimeout(() => {
      onEndCall();
    }, 1200);
    try { incrementVoiceCalls(); } catch {}
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-primary/20 via-background to-accent/10 flex flex-col" onClick={unlockAudio} onTouchStart={unlockAudio}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-background/50 backdrop-blur border-b">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={character.avatar} alt={character.name} />
            <AvatarFallback>{character.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{character.name}</h3>
            <p className="text-sm text-muted-foreground">
              {callConnected ? 'Connected' : 'Connecting...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-mono bg-background/50 px-2 py-1 rounded">
            {formatDuration(callDuration)}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMinimize}
            className="h-8 w-8 p-0"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Call Screen */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
        {/* Character Avatar with Voice Visualization */}
        <div className="relative">
          <div className={`w-32 h-32 rounded-full overflow-hidden border-4 transition-all duration-300 ${
            isAiSpeaking ? 'border-green-400 shadow-lg shadow-green-400/50' : 
            isSpeaking ? 'border-blue-400 shadow-lg shadow-blue-400/50' : 
            'border-primary/30'
          }`}>
            <Avatar className="w-full h-full">
              <AvatarImage src={character.avatar} alt={character.name} />
              <AvatarFallback className="text-4xl">{character.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
          
          {/* Voice activity indicator */}
          {(isAiSpeaking || isSpeaking) && (
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
              <div className={`flex space-x-1 ${isAiSpeaking ? 'text-green-400' : 'text-blue-400'}`}>
                <div className="w-1 h-4 bg-current rounded animate-pulse" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-6 bg-current rounded animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-8 bg-current rounded animate-pulse" style={{ animationDelay: '300ms' }} />
                <div className="w-1 h-6 bg-current rounded animate-pulse" style={{ animationDelay: '450ms' }} />
                <div className="w-1 h-4 bg-current rounded animate-pulse" style={{ animationDelay: '600ms' }} />
              </div>
            </div>
          )}
        </div>

        {/* Status Display */}
        <div className="space-y-3">
          <h2 className="text-2xl font-bold">{character.name}</h2>
          <div className="space-y-1">
            <p className="text-lg font-medium">
              {isAiSpeaking ? '🗣️ Speaking...' :
               isProcessing ? '💭 Thinking...' :
               isListening ? '🎤 Your turn to speak!' :
               isMuted ? '🔇 Muted' :
               '📞 In call'}
            </p>
            
            {/* Interactive guidance */}
            {isListening && !isMuted && (
              <p className="text-sm text-muted-foreground animate-pulse">
                I'm listening! Say something and I'll respond when you pause 💕
              </p>
            )}
            {!isListening && !isAiSpeaking && (
              <div className="flex items-center justify-center mt-3">
                <button onClick={startListeningOnly} className="px-4 py-2 rounded-full bg-primary text-primary-foreground shadow hover:opacity-90">
                  Start Call (Tap to Allow Mic)
                </button>
              </div>
            )}
            
            {isMuted && (
              <p className="text-sm text-yellow-600">
                Unmute to start talking with me!
              </p>
            )}
          </div>
          
          {/* Animated word-by-word visualization */}
          {isAiSpeaking && spokenWords.length > 0 && (
            <div className="mt-2 min-h-[48px]">
              <div className="flex flex-wrap gap-1">
                {spokenWords.slice(0, displayedWordIndex).map((w, idx) => (
                  <span
                    key={`${w}-${idx}`}
                    className="text-base px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 animate-in fade-in-0"
                    style={{ animationDelay: `${idx * 15}ms` }}
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Real-time transcript */}
          {currentTranscript && (
            <div className="bg-background/50 backdrop-blur rounded-lg p-3 max-w-md">
              <p className="text-sm text-muted-foreground italic">
                You're saying: "{currentTranscript}"
              </p>
            </div>
          )}
        </div>

        {/* Call Quality Indicators */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span>HD Voice</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <span>AI Powered</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-purple-400" />
            <span>Real-time</span>
          </div>
        </div>
      </div>

      {/* Call Controls */}
      <div className="p-6 bg-background/50 backdrop-blur border-t">
        <div className="flex items-center justify-center gap-6">
          {/* Push-to-Talk Toggle */}
          <Button
            variant={pushToTalk ? "default" : "outline"}
            size="sm"
            onClick={() => setPushToTalk(!pushToTalk)}
            className="h-8 px-3 rounded-full"
          >
            {pushToTalk ? 'PTT: On' : 'PTT: Off'}
          </Button>

          {/* Hold-to-speak button (visible when PTT on) */}
          {pushToTalk && (
            <Button
              variant={isPTTHeld ? "default" : "outline"}
              size="lg"
              onMouseDown={() => { setIsPTTHeld(true); try { recognitionRef.current?.start(); } catch {} }}
              onMouseUp={() => { setIsPTTHeld(false); try { recognitionRef.current?.stop(); } catch {} }}
              onTouchStart={() => { setIsPTTHeld(true); try { recognitionRef.current?.start(); } catch {} }}
              onTouchEnd={() => { setIsPTTHeld(false); try { recognitionRef.current?.stop(); } catch {} }}
              className="h-14 px-6 rounded-full"
            >
              Hold to Speak
            </Button>
          )}
          {/* Mute Button */}
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="lg"
            onClick={toggleMicrophone}
            className="h-14 w-14 rounded-full"
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          {/* Speaker Button */}
          <Button
            variant={isSpeakerOn ? "default" : "outline"}
            size="lg"
            onClick={() => { setIsSpeakerOn(!isSpeakerOn); unlockAudio(); }}
            className="h-14 w-14 rounded-full"
          >
            {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </Button>

          {/* End Call Button */}
          <Button
            variant="destructive"
            size="lg"
            onClick={handleEndCall}
            className="h-16 w-16 rounded-full bg-red-500 hover:bg-red-600"
          >
            <PhoneOff className="w-8 h-8" />
          </Button>

          {/* Switch to Chat */}
          <Button
            variant="outline"
            size="lg"
            onClick={onMinimize}
            className="h-14 w-14 rounded-full"
          >
            <MessageSquare className="w-6 h-6" />
          </Button>

          {/* Love Button */}
          <Button
            variant="outline"
            size="lg"
            onClick={() => {
              toast({
                title: "💕 Love sent!",
                description: `${character.name} felt your love!`
              });
            }}
            className="h-14 w-14 rounded-full"
          >
            <Heart className="w-6 h-6" />
          </Button>
        </div>
      </div>
    </div>
  );
};