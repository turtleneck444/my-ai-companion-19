import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Bot, 
  MessageSquare, 
  Phone, 
  Settings, 
  Mic, 
  MicOff, 
  Send, 
  Smile,
  Heart,
  Star,
  Zap,
  Plus,
  Users,
  Crown
} from 'lucide-react';

interface AppPreviewProps {
  type: 'chat' | 'creation' | 'voice' | 'library';
  isPlaying?: boolean;
  onPlay?: () => void;
  onPause?: () => void;
}

export const AppPreview = ({ type, isPlaying = false, onPlay, onPause }: AppPreviewProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const chatSteps = [
    {
      title: "Start Conversation",
      content: "Hey there! How was your day? I've been thinking about that project you mentioned. Want to talk about it? 😊",
      user: false,
      timestamp: "2:34 PM"
    },
    {
      title: "User Response", 
      content: "It was great! I made some progress on the design. What do you think about this approach?",
      user: true,
      timestamp: "2:35 PM"
    },
    {
      title: "AI Analysis",
      content: "That's fantastic! I love how you're thinking about user experience first. The color palette you chose really creates a warm, inviting feeling. Have you considered adding some micro-interactions?",
      user: false,
      timestamp: "2:36 PM"
    },
    {
      title: "Typing Indicator",
      content: "Typing...",
      user: false,
      timestamp: "2:37 PM",
      isTyping: true
    }
  ];

  const creationSteps = [
    {
      title: "Choose Personality",
      content: "Select traits that define your AI companion's character",
      traits: ["Friendly", "Creative", "Supportive", "Playful"]
    },
    {
      title: "Customize Voice",
      content: "Pick the perfect voice that matches their personality",
      voices: ["Warm & Caring", "Energetic & Fun", "Calm & Wise", "Playful & Quirky"]
    },
    {
      title: "Set Appearance",
      content: "Design how your companion looks and presents themselves",
      appearance: ["Avatar", "Color Theme", "Style", "Mood"]
    },
    {
      title: "Finalize Creation",
      content: "Your perfect AI companion is ready!",
      final: true
    }
  ];

  const voiceSteps = [
    {
      title: "Start Voice Call",
      content: "🎤 Click to start voice call",
      action: "call_start"
    },
    {
      title: "Connecting",
      content: "Connecting to your AI companion...",
      action: "connecting"
    },
    {
      title: "Active Call",
      content: "You're now in a voice call with Luna",
      action: "active_call"
    },
    {
      title: "End Call",
      content: "Call ended. Duration: 3:24",
      action: "call_end"
    }
  ];

  const librarySteps = [
    {
      title: "Your Companions",
      content: "Manage all your AI companions",
      companions: [
        { name: "Luna", status: "Online", mood: "Happy" },
        { name: "Alex", status: "Away", mood: "Thoughtful" },
        { name: "Maya", status: "Online", mood: "Excited" }
      ]
    },
    {
      title: "Create New",
      content: "Add another AI companion to your collection",
      action: "create_new"
    },
    {
      title: "Settings",
      content: "Customize your experience",
      settings: ["Notifications", "Privacy", "Billing", "Preferences"]
    }
  ];

  const getSteps = () => {
    switch (type) {
      case 'chat': return chatSteps;
      case 'creation': return creationSteps;
      case 'voice': return voiceSteps;
      case 'library': return librarySteps;
      default: return chatSteps;
    }
  };

  const steps = getSteps();

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying) {
      const interval = setInterval(() => {
        setCurrentStep((prev) => (prev + 1) % steps.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isAutoPlaying, steps.length]);

  const handleNext = () => {
    setCurrentStep((prev) => (prev + 1) % steps.length);
  };

  const handlePrev = () => {
    setCurrentStep((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const handlePlayPause = () => {
    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      onPause?.();
    } else {
      setIsAutoPlaying(true);
      onPlay?.();
    }
  };

  const renderChatInterface = () => {
    const step = steps[currentStep] as any;
    
    return (
      <div className="bg-background rounded-2xl shadow-2xl overflow-hidden border h-96 flex flex-col">
        {/* Header */}
        <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm">Luna</div>
            <div className="text-xs text-muted-foreground">Online • AI Companion</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 p-4 space-y-4 overflow-y-auto">
          {/* AI Message */}
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-muted rounded-2xl px-4 py-3 max-w-[80%]">
              <p className="text-sm">{step.content}</p>
              <div className="text-xs text-muted-foreground mt-1">{step.timestamp}</div>
            </div>
          </div>
          
          {/* User Message */}
          {step.user && (
            <div className="flex gap-3 justify-end">
              <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-3 max-w-[80%]">
                <p className="text-sm">{step.content}</p>
                <div className="text-xs opacity-70 mt-1">{step.timestamp}</div>
              </div>
              <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold">You</span>
              </div>
            </div>
          )}
          
          {/* Typing Indicator */}
          {step.isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Input Area */}
        <div className="p-4 border-t bg-muted/20">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Smile className="w-4 h-4" />
            </Button>
            <div className="flex-1 relative">
              <input 
                placeholder="Type a message..." 
                className="w-full px-3 py-2 bg-background border rounded-lg pr-20"
                disabled
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button size="sm" className="bg-gradient-to-r from-primary to-primary-glow">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderCreationInterface = () => {
    const step = steps[currentStep] as any;
    
    return (
      <div className="bg-background rounded-2xl shadow-2xl overflow-hidden border h-96 flex flex-col">
        {/* Header */}
        <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center">
            <Plus className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm">Create AI Companion</div>
            <div className="text-xs text-muted-foreground">Step {currentStep + 1} of {steps.length}</div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-6">
          <h3 className="text-lg font-semibold mb-4">{step.title}</h3>
          <p className="text-muted-foreground mb-6">{step.content}</p>
          
          {step.traits && (
            <div className="grid grid-cols-2 gap-3">
              {step.traits.map((trait: string, index: number) => (
                <Button key={index} variant="outline" className="justify-start">
                  {trait}
                </Button>
              ))}
            </div>
          )}
          
          {step.voices && (
            <div className="space-y-3">
              {step.voices.map((voice: string, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <span className="text-sm">{voice}</span>
                </div>
              ))}
            </div>
          )}
          
          {step.appearance && (
            <div className="grid grid-cols-2 gap-4">
              {step.appearance.map((item: string, index: number) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <div className="w-12 h-12 bg-primary/10 rounded-full mx-auto mb-2 flex items-center justify-center">
                    <Heart className="w-6 h-6 text-primary" />
                  </div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          )}
          
          {step.final && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-primary-glow rounded-full mx-auto mb-4 flex items-center justify-center">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Luna is Ready!</h4>
              <p className="text-muted-foreground">Your AI companion is created and ready to chat</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderVoiceInterface = () => {
    const step = steps[currentStep] as any;
    
    return (
      <div className="bg-background rounded-2xl shadow-2xl overflow-hidden border h-96 flex flex-col">
        {/* Header */}
        <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center">
            <Phone className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm">Voice Call</div>
            <div className="text-xs text-muted-foreground">High-quality audio conversation</div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <div className="text-center mb-8">
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <p className="text-muted-foreground">{step.content}</p>
          </div>
          
          {step.action === 'call_start' && (
            <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow">
              <Phone className="w-6 h-6 mr-2" />
              Start Voice Call
            </Button>
          )}
          
          {step.action === 'connecting' && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-muted-foreground">Connecting...</span>
            </div>
          )}
          
          {step.action === 'active_call' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-primary to-primary-glow rounded-full mx-auto mb-4 flex items-center justify-center">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <div className="text-2xl font-bold mb-2">3:24</div>
              <div className="flex gap-4">
                <Button variant="outline" size="lg">
                  <MicOff className="w-5 h-5" />
                </Button>
                <Button variant="destructive" size="lg">
                  <Phone className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}
          
          {step.action === 'call_end' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                <Phone className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Call ended</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderLibraryInterface = () => {
    const step = steps[currentStep] as any;
    
    return (
      <div className="bg-background rounded-2xl shadow-2xl overflow-hidden border h-96 flex flex-col">
        {/* Header */}
        <div className="bg-muted/50 px-4 py-3 border-b flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-sm">Companion Library</div>
            <div className="text-xs text-muted-foreground">Manage your AI companions</div>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-6">
          <h3 className="text-lg font-semibold mb-4">{step.title}</h3>
          <p className="text-muted-foreground mb-6">{step.content}</p>
          
          {step.companions && (
            <div className="space-y-3">
              {step.companions.map((companion: any, index: number) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{companion.name}</div>
                    <div className="text-xs text-muted-foreground">{companion.status} • {companion.mood}</div>
                  </div>
                  <Badge variant={companion.status === 'Online' ? 'default' : 'secondary'}>
                    {companion.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          
          {step.action === 'create_new' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h4 className="text-lg font-semibold mb-2">Create New Companion</h4>
              <p className="text-muted-foreground">Add another AI companion to your collection</p>
            </div>
          )}
          
          {step.settings && (
            <div className="grid grid-cols-2 gap-3">
              {step.settings.map((setting: string, index: number) => (
                <Button key={index} variant="outline" className="justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  {setting}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInterface = () => {
    switch (type) {
      case 'chat': return renderChatInterface();
      case 'creation': return renderCreationInterface();
      case 'voice': return renderVoiceInterface();
      case 'library': return renderLibraryInterface();
      default: return renderChatInterface();
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentStep === steps.length - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
          >
            {isAutoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </Button>
          <span className="text-sm text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>
        </div>
      </div>
      
      {/* Interface Preview */}
      {renderInterface()}
      
      {/* Step Indicator */}
      <div className="flex justify-center gap-2">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStep(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === currentStep ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
