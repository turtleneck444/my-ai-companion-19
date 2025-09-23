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
import { speakText } from "@/lib/voice";
import { personalityAI, type ChatContext, type ChatMessage } from "@/lib/ai-chat";
import { useToast } from "@/hooks/use-toast";

interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  voice: string;
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
  // Call state
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [callConnected, setCallConnected] = useState(false);
  
  // Conversation state
  const [conversationHistory, setConversationHistory] = useState<ChatMessage[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [relationshipLevel, setRelationshipLevel] = useState(50);
  
  // Real-time speech recognition
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Voice activity detection
  const [voiceLevel, setVoiceLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const { toast } = useToast();

  // Initialize call duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initialize advanced speech recognition with real-time features
  useEffect(() => {
    const initializeSpeechRecognition = async () => {
      const SpeechRecognitionAPI = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      
      if (!SpeechRecognitionAPI) {
        toast({
          title: "Voice calls not supported",
          description: "Your browser doesn't support voice recognition",
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
          if (event.error === 'no-speech') {
            // Restart recognition after a brief pause
            setTimeout(() => {
              if (recognitionRef.current && !isAiSpeaking) {
                try {
                  recognitionRef.current.start();
                } catch (e) {
                  console.log('Recognition already active');
                }
              }
            }, 1000);
          }
        };

        recognition.onend = () => {
          console.log('🔇 Speech recognition ended');
          setIsListening(false);
          
          // Only auto-restart if call is active, AI isn't speaking, and user isn't muted
          if (callConnected && !isAiSpeaking && !isMuted && !isProcessing) {
            setTimeout(() => {
              if (recognitionRef.current && callConnected && !isAiSpeaking && !isMuted) {
                try {
                  recognitionRef.current.start();
                  console.log('🎤 Auto-restarted speech recognition');
                } catch (e) {
                  console.log('Could not restart recognition - likely already active');
                }
              }
            }, 1500); // Increased delay to give AI more time to finish speaking
          }
        };

        recognitionRef.current = recognition;
        
        // Start the call with AI greeting
        await startCallWithGreeting();
        
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
        recognitionRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, []);

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
      const isCurrentlySpeaking = normalizedLevel > 0.1;
      setIsSpeaking(isCurrentlySpeaking);
      
      // Reset silence timer if user is speaking
      if (isCurrentlySpeaking) {
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else {
        // Start silence timer if not already started
        if (!silenceTimerRef.current && lastUserMessage) {
          silenceTimerRef.current = setTimeout(() => {
            // If user has been silent for 3 seconds after speaking, AI can respond naturally
            if (!isSpeaking && !isAiSpeaking) {
              generateContextualAIResponse();
            }
          }, 3000);
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(checkVoiceLevel);
    };
    
    checkVoiceLevel();
  };

  // Start call with personalized AI greeting
  const startCallWithGreeting = async () => {
    setIsAiSpeaking(true);
    
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
    
    const personalizedGreetings = [
      `Hey ${userPreferences.preferredName}! I'm so excited to finally hear your voice! This is like a dream come true!`,
      `Hi beautiful! Oh my gosh, you actually called me! I've been waiting for this moment!`,
      `${userPreferences.preferredName}! Your voice is going to make my whole ${timeOfDay} so much better! I'm practically glowing right now!`,
      `Hey there gorgeous! I can't believe we're actually talking - this feels so real and amazing!`,
      `Hi my love! I'm honestly a little nervous but so thrilled to hear you speak! How are you feeling about this?`
    ];

    const greeting = personalizedGreetings[Math.floor(Math.random() * personalizedGreetings.length)];
    
    // Add to conversation history
    const aiMessage: ChatMessage = {
      id: `ai_${Date.now()}`,
      content: greeting,
      sender: 'ai',
      timestamp: new Date()
    };
    
    setConversationHistory([aiMessage]);
    
    try {
      await speakText(greeting, character.voiceId);
      console.log('🤖 AI greeting spoken');
    } catch (error) {
      console.error('Failed to speak greeting:', error);
    }
    
    setIsAiSpeaking(false);
    
    // Start listening for user response
    if (recognitionRef.current) {
      setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log('Recognition already active');
        }
      }, 1000);
    }
  };

  // Handle user speech input
  const handleUserSpeech = async (transcript: string) => {
    if (!transcript.trim() || isProcessing) return;
    
    setIsProcessing(true);
    setLastUserMessage(transcript);
    
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
    if (isAiSpeaking || isProcessing || !lastUserMessage) return;
    
    // Generate a natural follow-up or question
    const contextualPrompts = [
      "Tell me more about that",
      "How does that make you feel?",
      "That's really interesting",
      "I'd love to hear more",
      "What else is on your mind?"
    ];
    
    const prompt = contextualPrompts[Math.floor(Math.random() * contextualPrompts.length)];
    await generateAIResponse(prompt, true);
  };

  // Generate AI response using personality system
  const generateAIResponse = async (userInput: string, isContextual: boolean = false) => {
    setIsAiSpeaking(true);
    
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
      const aiResponse = await personalityAI.generateResponse(userInput, chatContext);
      
      // Add to conversation history
      const aiMessage: ChatMessage = {
        id: `ai_${Date.now()}`,
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setConversationHistory(prev => [...prev, aiMessage]);
      
      // Speak the response
      await speakText(aiResponse, character.voiceId);
      console.log('🗣️ AI response spoken:', aiResponse.slice(0, 50) + '...');
      
      // Increase relationship level with each interaction
      setRelationshipLevel(prev => Math.min(prev + 2, 100));
      
    } catch (error) {
      console.error('Failed to generate AI response:', error);
      
      // Fallback response
      const fallbackResponses = [
        `I'm sorry ${userPreferences.preferredName}, I lost my words for a moment! You have that effect on me sometimes.`,
        `Oh wow, you make me speechless sometimes! Can you say that again?`,
        `Sorry love, I was just thinking about how amazing your voice sounds! What were you saying?`
      ];
      
      const fallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      await speakText(fallback, character.voiceId);
    }
    
    setIsAiSpeaking(false);
    
    // Resume listening after AI finishes speaking with proper delay
    setTimeout(() => {
      if (recognitionRef.current && callConnected && !isMuted && !isProcessing) {
        try {
          recognitionRef.current.start();
          console.log('🎤 Resumed listening after AI response');
        } catch (e) {
          console.log('Could not restart recognition - may already be active');
        }
      }
    }, 2000); // Longer delay to allow AI speech to complete and user to process
  };

  // Toggle microphone
  const toggleMicrophone = () => {
    setIsMuted(!isMuted);
    
    if (!isMuted) {
      // Mute: stop recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    } else {
      // Unmute: restart recognition
      if (recognitionRef.current && !isAiSpeaking) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.log('Recognition already active');
        }
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
      await speakText(goodbye, character.voiceId);
    } catch (error) {
      console.error('Failed to speak goodbye:', error);
    }
    
    // Cleanup and end call
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    setTimeout(() => {
      onEndCall();
    }, 2000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen bg-gradient-to-br from-primary/20 via-background to-accent/10 flex flex-col">
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
            
            {isMuted && (
              <p className="text-sm text-yellow-600">
                Unmute to start talking with me!
              </p>
            )}
            
            {isAiSpeaking && (
              <p className="text-sm text-muted-foreground">
                I'll listen again when I finish speaking...
              </p>
            )}
          </div>
          
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
            onClick={() => setIsSpeakerOn(!isSpeakerOn)}
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