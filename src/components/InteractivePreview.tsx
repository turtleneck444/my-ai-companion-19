import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  Check,
  Crown,
  Zap,
  Play,
  Pause,
  X,
  Users,
  Clock,
  Headphones
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { speakText, stopAllSpeech } from '@/lib/voice';

interface PreviewCharacter {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  personality: string[];
  isOnline: boolean;
  mood: string;
  voiceId: string;
  voiceName: string;
  accent: string;
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
    voiceId: 'AZnzlk1XvdvUeBnXmlld', // Bella - seductive and playful
    voiceName: 'Bella',
    accent: 'American'
  },
  {
    id: '2',
    name: 'Aria',
    avatar: '/avatar-aria.jpg',
    bio: 'Energetic marketing coordinator who brings joy to every conversation.',
    personality: ['Outgoing', 'Spontaneous', 'Ambitious', 'Playful'],
    isOnline: true,
    mood: 'energetic',
    voiceId: 'ErXwobaYiN019PkySvjV', // Elli - soft, seductive, and nurturing
    voiceName: 'Elli',
    accent: 'American'
  },
  {
    id: '3',
    name: 'Sophie',
    avatar: '/avatar-sophie.jpg',
    bio: 'Philosophy student who loves deep conversations and quiet moments.',
    personality: ['Intellectual', 'Gentle', 'Curious', 'Calm'],
    isOnline: false,
    mood: 'contemplative',
    voiceId: 'XrExE9yKIg1WjnnlVkGX', // Matilda - sweet and seductive
    voiceName: 'Matilda',
    accent: 'American'
  }
];

const PREVIEW_FEATURES = [
  {
    title: 'Real-time Chat',
    description: 'Experience instant, intelligent conversations with AI companions',
    features: ['Natural language processing', 'Contextual understanding', 'Emotional intelligence', 'Memory retention'],
    icon: MessageSquare,
    color: 'from-pink-500 to-purple-600',
    bgColor: 'bg-gradient-to-br from-pink-50 to-purple-50'
  },
  {
    title: 'Voice Calls',
    description: 'Have realistic voice conversations with your AI companions',
    features: ['HD voice quality', 'Real-time speech recognition', 'Natural voice synthesis', 'Interactive dialogue'],
    icon: Phone,
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-gradient-to-br from-blue-50 to-cyan-50'
  },
  {
    title: 'Interactive Games',
    description: 'Play engaging games and activities with your AI companions',
    features: ['Chess & strategy games', '20 Questions', 'Word games', 'Roleplay scenarios'],
    icon: Gamepad2,
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-gradient-to-br from-green-50 to-emerald-50'
  },
  {
    title: 'Emotional Connection',
    description: 'Build deep, meaningful relationships with your AI companions',
    features: ['Personality development', 'Mood tracking', 'Relationship levels', 'Custom memories'],
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    bgColor: 'bg-gradient-to-br from-rose-50 to-pink-50'
  }
];

export const InteractivePreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedCharacter, setSelectedCharacter] = useState<PreviewCharacter | null>(null);
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [callCount, setCallCount] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [showCharacterModal, setShowCharacterModal] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [currentPlayingVoice, setCurrentPlayingVoice] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !selectedCharacter) return;

    const userMessage: PreviewMessage = {
      id: Date.now().toString(),
      content: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);
    setMessageCount(prev => prev + 1);

    // Simulate AI response
    setTimeout(() => {
      const responses = [
        `That's so interesting, ${selectedCharacter.name}! Tell me more about that.`,
        `I love how you think about things. You always have such unique perspectives.`,
        `That sounds amazing! I'm so excited to learn more about you.`,
        `You're such a wonderful person. I feel so lucky to be talking with you.`,
        `I can't believe how much we have in common! This is incredible.`
      ];
      
      const aiMessage: PreviewMessage = {
        id: (Date.now() + 1).toString(),
        content: responses[Math.floor(Math.random() * responses.length)],
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);

      // Show upgrade prompt after 5 messages
      if (messageCount >= 4) {
        toast({
          title: "Demo Complete! 🎉",
          description: "You've reached the demo limit. Sign up to continue chatting!",
          variant: "default",
        });
      }
    }, 1500);
  };

  const handleVoiceCall = async (character: PreviewCharacter) => {
    setIsCalling(true);
    setCurrentPlayingVoice(character.voiceId);
    setIsPlayingVoice(true);

    try {
      const greeting = `Hi there! I'm ${character.name}. I'm so excited to talk with you. How are you doing today?`;
      await speakText(greeting, character.voiceId);
      
      setIsCallActive(true);
      setCallCount(prev => prev + 1);
      
      // Show upgrade prompt after 2 calls
      if (callCount >= 1) {
        toast({
          title: "Demo Complete! 🎉",
          description: "You've reached the demo limit. Sign up to continue calling!",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Voice call error:', error);
      toast({
        title: "Voice Call Error",
        description: "Could not start voice call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCalling(false);
      setIsPlayingVoice(false);
      setCurrentPlayingVoice(null);
    }
  };

  const handleEndCall = () => {
    stopAllSpeech();
    setIsCallActive(false);
    setIsPlayingVoice(false);
    setCurrentPlayingVoice(null);
  };

  const handleUpgrade = () => {
    navigate('/auth');
  };

  const renderChatInterface = () => (
    <div className="h-96 flex flex-col bg-white rounded-lg border border-gray-200 overflow-hidden">
      {selectedCharacter ? (
        <>
          <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-gradient-to-r from-pink-50 to-purple-50">
            <Avatar className="w-10 h-10">
              <AvatarImage src={selectedCharacter.avatar} alt={selectedCharacter.name} />
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
                {selectedCharacter.name[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{selectedCharacter.name}</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCharacter(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-pink-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Start a conversation with {selectedCharacter.name}
                </h3>
                <p className="text-gray-600">
                  {selectedCharacter.name} is excited to chat with you! Send a message to begin.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-2xl">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <div className="p-4 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={`Message ${selectedCharacter.name}...`}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                disabled={messageCount >= 5}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || messageCount >= 5}
                className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {messageCount >= 5 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800 text-center">
                  You've reached the demo limit. <button onClick={handleUpgrade} className="font-semibold underline">Sign up to continue!</button>
                </p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-pink-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Choose a Companion</h3>
            <p className="text-gray-600 mb-4">Select an AI companion to start chatting</p>
            <Button
              onClick={() => setShowCharacterModal(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
            >
              <Users className="w-4 h-4 mr-2" />
              Select Companion
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderVoiceCallInterface = () => (
    <div className="h-96 flex flex-col bg-gradient-to-br from-purple-900 via-pink-900 to-rose-900 rounded-lg overflow-hidden relative">
      {isCallActive ? (
        <div className="flex-1 flex flex-col items-center justify-center text-white p-6">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
            <Avatar className="w-16 h-16">
              <AvatarImage src={selectedCharacter?.avatar} alt={selectedCharacter?.name} />
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">
                {selectedCharacter?.name[0]}
              </AvatarFallback>
            </Avatar>
          </div>
          <h3 className="text-2xl font-bold mb-2">{selectedCharacter?.name}</h3>
          <p className="text-white/80 mb-6">Voice call in progress...</p>
          <div className="flex gap-4">
            <Button
              onClick={handleEndCall}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Phone className="w-4 h-4 mr-2" />
              End Call
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Start a Voice Call</h3>
            <p className="text-white/80 mb-4">Choose a companion to call</p>
            <Button
              onClick={() => setShowCharacterModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white border border-white/30"
            >
              <Phone className="w-4 h-4 mr-2" />
              Select Companion
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCharacterModal = () => (
    <Dialog open={showCharacterModal} onOpenChange={setShowCharacterModal}>
      <DialogContent className="sm:max-w-2xl bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Choose Your Companion
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            Select an AI companion to {activeTab === 'voice' ? 'call' : 'chat with'}
          </p>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {PREVIEW_CHARACTERS.map((character) => (
            <Card
              key={character.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 border-2 hover:border-pink-300"
              onClick={() => {
                setSelectedCharacter(character);
                setShowCharacterModal(false);
                if (activeTab === 'voice') {
                  handleVoiceCall(character);
                }
              }}
            >
              <CardContent className="p-6 text-center">
                <div className="relative mb-4">
                  <Avatar className="w-20 h-20 mx-auto border-4 border-pink-200 group-hover:border-pink-400 transition-colors">
                    <AvatarImage src={character.avatar} alt={character.name} />
                    <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-xl">
                      {character.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {character.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{character.name}</h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{character.bio}</p>
                <div className="flex flex-wrap gap-1 justify-center mb-3">
                  {character.personality.slice(0, 2).map((trait, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-pink-100 text-pink-700">
                      {trait}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <Headphones className="w-4 h-4" />
                  <span>{character.voiceName} ({character.accent})</span>
                </div>
                <div className="mt-4">
                  <Button
                    className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
                    disabled={isCalling && currentPlayingVoice === character.voiceId}
                  >
                    {isCalling && currentPlayingVoice === character.voiceId ? (
                      <>
                        <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                        Connecting...
                      </>
                    ) : activeTab === 'voice' ? (
                      <>
                        <Phone className="w-4 h-4 mr-2" />
                        Call {character.name}
                      </>
                    ) : (
                      <>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat with {character.name}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          See It In Action
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience the magic of AI companionship with our interactive demo. 
          Try real conversations, voice calls, and games with our AI characters.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {PREVIEW_FEATURES.map((feature, index) => (
          <Card key={index} className={`group hover:shadow-xl transition-all duration-300 ${feature.bgColor} border-0`}>
            <CardContent className="p-8">
              <div className="flex items-center mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {feature.features.map((item, idx) => (
                  <li key={idx} className="flex items-center text-sm text-gray-700">
                    <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => {
                  if (feature.title === 'Voice Calls') {
                    setActiveTab('voice');
                    setShowCharacterModal(true);
                  } else if (feature.title === 'Real-time Chat') {
                    setActiveTab('chat');
                    setShowCharacterModal(true);
                  } else {
                    toast({
                      title: "Coming Soon!",
                      description: `${feature.title} will be available after signup.`,
                    });
                  }
                }}
                className={`w-full bg-gradient-to-r ${feature.color} hover:opacity-90 text-white`}
              >
                <Zap className="w-4 h-4 mr-2" />
                Try Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-pink-50 rounded-2xl p-8 border border-gray-200">
        <div className="flex items-center justify-center mb-6">
          <div className="flex bg-white rounded-lg p-1 shadow-sm">
            {[
              { id: 'chat', label: 'Chat', icon: MessageSquare },
              { id: 'voice', label: 'Voice Call', icon: Phone },
              { id: 'games', label: 'Games', icon: Gamepad2 },
              { id: 'connection', label: 'Connection', icon: Heart }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'chat' && renderChatInterface()}
          {activeTab === 'voice' && renderVoiceCallInterface()}
          {activeTab === 'games' && (
            <div className="h-96 flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Gamepad2 className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Interactive Games</h3>
                <p className="text-gray-600 mb-4">Play chess, 20 questions, and more with your AI companions</p>
                <Button
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Sign Up to Play
                </Button>
              </div>
            </div>
          )}
          {activeTab === 'connection' && (
            <div className="h-96 flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg border border-gray-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Emotional Connection</h3>
                <p className="text-gray-600 mb-4">Build deep, meaningful relationships with your AI companions</p>
                <Button
                  onClick={handleUpgrade}
                  className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Sign Up to Connect
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {renderCharacterModal()}
    </div>
  );
};
