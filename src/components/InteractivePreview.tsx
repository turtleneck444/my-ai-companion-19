import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Phone, 
  Heart, 
  Star,
  Send,
  Smile,
  Camera,
  Gamepad2,
  Gift,
  Calendar,
  ArrowLeft,
  Volume2,
  Mic,
  MicOff,
  Sparkles,
  Check
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PreviewCharacter {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  isOnline: boolean;
  mood: string;
  voiceId: string;
}

interface PreviewMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isTyping?: boolean;
}

const PREVIEW_CHARACTERS: PreviewCharacter[] = [
  {
    id: '1',
    name: 'Luna',
    avatar: '/avatar-luna.jpg',
    bio: 'Creative graphic designer who loves late-night art sessions and meaningful conversations.',
    personality: ['Creative', 'Thoughtful', 'Independent', 'Romantic'],
    isOnline: true,
    mood: 'focused',
    voiceId: '21m00Tcm4TlvDq8ikWAM'
  },
  {
    id: '2',
    name: 'Aria',
    avatar: '/avatar-aria.jpg',
    bio: 'Energetic marketing coordinator who brings joy to every conversation.',
    personality: ['Outgoing', 'Spontaneous', 'Ambitious', 'Playful'],
    isOnline: true,
    mood: 'energetic',
    voiceId: 'AZnzlk1XvdvUeBnXmlld'
  },
  {
    id: '3',
    name: 'Sophie',
    avatar: '/avatar-sophie.jpg',
    bio: 'Philosophy student who loves deep conversations and quiet moments.',
    personality: ['Intellectual', 'Gentle', 'Curious', 'Calm'],
    isOnline: false,
    mood: 'contemplative',
    voiceId: 'EXAVITQu4vr4xnSDxMaL'
  }
];

const PREVIEW_FEATURES = [
  {
    title: 'Real-time Chat',
    description: 'Experience instant, intelligent conversations with AI companions',
    features: ['Natural language processing', 'Contextual understanding', 'Emotional intelligence', 'Memory retention'],
    icon: MessageSquare,
    color: 'from-pink-500 to-purple-600'
  },
  {
    title: 'Voice Calls',
    description: 'Have realistic voice conversations with your AI companions',
    features: ['HD voice quality', 'Real-time speech recognition', 'Natural voice synthesis', 'Interactive dialogue'],
    icon: Phone,
    color: 'from-blue-500 to-cyan-600'
  },
  {
    title: 'Interactive Games',
    description: 'Play engaging games and activities with your AI companions',
    features: ['Chess & strategy games', '20 Questions', 'Word games', 'Roleplay scenarios'],
    icon: Gamepad2,
    color: 'from-green-500 to-emerald-600'
  },
  {
    title: 'Emotional Connection',
    description: 'Build meaningful relationships with AI that understand and care',
    features: ['Personality development', 'Mood tracking', 'Relationship levels', 'Personalized responses'],
    icon: Heart,
    color: 'from-red-500 to-pink-600'
  }
];

export const InteractivePreview: React.FC = () => {
  const { toast } = useToast();
  const [activeFeature, setActiveFeature] = useState(0);
  const [selectedCharacter, setSelectedCharacter] = useState<PreviewCharacter>(PREVIEW_CHARACTERS[0]);
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: PreviewMessage = {
        id: '1',
        content: `Hi there! I'm ${selectedCharacter.name}. I'm so excited to chat with you! 💕`,
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages([welcomeMessage]);
    }
  }, [selectedCharacter, messages.length]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isTyping) return;

    const userMessage: PreviewMessage = {
      id: Date.now().toString(),
      content: messageText,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        "That's so interesting! Tell me more about that. 😊",
        "I love how you think! You always have such unique perspectives.",
        "You know, I was just thinking about something similar. Great minds think alike! 💭",
        "I'm really enjoying our conversation. You're such a wonderful person to talk to! ✨",
        "That's amazing! I'm learning so much from you. What else is on your mind?",
        "You always know exactly what to say to make me smile. Thank you for being you! 💕"
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const aiMessage: PreviewMessage = {
        id: (Date.now() + 1).toString(),
        content: randomResponse,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      handleSendMessage(input);
    }
  };

  const handleCharacterChange = (character: PreviewCharacter) => {
    setSelectedCharacter(character);
    setMessages([]);
    setShowCharacterSelect(false);
    toast({
      title: `Switched to ${character.name}`,
      description: "Starting a new conversation!",
    });
  };

  const handleVoiceCall = () => {
    setIsCallActive(!isCallActive);
    toast({
      title: isCallActive ? "Call ended" : "Voice call started",
      description: isCallActive ? "Thanks for the great conversation!" : `Now talking with ${selectedCharacter.name}`,
    });
  };

  const currentFeature = PREVIEW_FEATURES[activeFeature];

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
          See It In Action
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Experience the magic of AI companionship with our interactive previews
        </p>
      </div>
      
      {/* Feature Tabs */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-2 bg-muted p-1 rounded-lg">
          {PREVIEW_FEATURES.map((feature, index) => (
            <button
              key={index}
              onClick={() => setActiveFeature(index)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeFeature === index
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {feature.title}
            </button>
          ))}
        </div>
      </div>
      
      {/* Preview Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Side - Feature Description */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${currentFeature.color} flex items-center justify-center`}>
              <currentFeature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-2xl font-bold">{currentFeature.title}</h3>
          </div>
          
          <p className="text-muted-foreground text-lg">{currentFeature.description}</p>
          
          <div className="space-y-3">
            {currentFeature.features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <Check className="w-5 h-5 text-primary flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={() => setShowCharacterSelect(true)}
            className="bg-gradient-to-r from-primary to-primary-glow"
          >
            Try It Now
            <Sparkles className="w-4 h-4 ml-2" />
          </Button>
        </div>
        
        {/* Right Side - Interactive Preview */}
        <div className="relative">
          <Card className="bg-gradient-to-br from-pink-50 via-purple-50 to-white rounded-3xl shadow-2xl overflow-hidden border border-pink-200/50">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-sm px-4 py-3 border-b border-pink-200/30 flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-1"
                onClick={() => setShowCharacterSelect(true)}
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Button>
              
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-pink-300/50">
                <Avatar className="w-full h-full">
                  <AvatarImage src={selectedCharacter.avatar} alt={selectedCharacter.name} />
                  <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white font-bold text-sm">
                    {selectedCharacter.name[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1">
                <div className="font-semibold text-gray-900">{selectedCharacter.name}</div>
                <div className="text-xs text-pink-600 flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${selectedCharacter.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  {selectedCharacter.isOnline ? 'Online' : 'Offline'} • {selectedCharacter.mood}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-gray-600 hover:text-pink-600"
                  onClick={handleVoiceCall}
                >
                  {isCallActive ? <Phone className="w-5 h-5 text-green-600" /> : <Phone className="w-5 h-5" />}
                </Button>
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-pink-600">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="p-4 space-y-4 h-80 overflow-y-auto bg-gradient-to-br from-pink-50/50 via-purple-50/30 to-white/80">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {message.sender === 'ai' && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarImage src={selectedCharacter.avatar} alt={selectedCharacter.name} />
                        <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-xs">
                          {selectedCharacter.name[0]}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div
                      className={`rounded-2xl px-4 py-3 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                          : 'bg-white/90 backdrop-blur-sm border border-pink-100/50'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${
                        message.sender === 'user' ? 'text-pink-100' : 'text-gray-500'
                      }`}>
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start gap-2">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={selectedCharacter.avatar} alt={selectedCharacter.name} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-xs">
                      {selectedCharacter.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-pink-100/50">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t border-pink-200/30 bg-white/80 backdrop-blur-sm">
              <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <Button variant="ghost" size="sm" className="text-pink-500 hover:text-pink-600">
                  <Camera className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-pink-500 hover:text-pink-600">
                  <Smile className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-pink-500 hover:text-pink-600">
                  <Gamepad2 className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="text-pink-500 hover:text-pink-600">
                  <Gift className="w-5 h-5" />
                </Button>
                
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`Message ${selectedCharacter.name}...`}
                    className="w-full px-4 py-2 border border-pink-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    disabled={isTyping}
                  />
                </div>
                
                <Button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full p-2"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>

      {/* Character Selection Modal */}
      {showCharacterSelect && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-semibold mb-4">Choose Your Companion</h3>
            <div className="space-y-3">
              {PREVIEW_CHARACTERS.map((character) => (
                <Button
                  key={character.id}
                  variant="outline"
                  onClick={() => handleCharacterChange(character)}
                  className="w-full justify-start h-auto p-4"
                >
                  <Avatar className="w-10 h-10 mr-3">
                    <AvatarImage src={character.avatar} alt={character.name} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
                      {character.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="font-semibold">{character.name}</div>
                    <div className="text-sm text-muted-foreground">{character.bio}</div>
                    <div className="flex gap-1 mt-1">
                      {character.personality.slice(0, 2).map((trait, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {trait}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              onClick={() => setShowCharacterSelect(false)}
              className="w-full mt-4"
            >
              Cancel
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
