import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Heart, 
  MessageSquare, 
  Phone, 

  Sparkles, 
  Star, 
  Check, 
  ArrowRight, 
  Play,
  Users,
  Shield,
  Zap,
  Crown,
  Globe,
  Lock,
  ChevronDown,
  Menu,
  X,
  Mail,
  Send,
  Quote,
  Bot,
  Mic,
  MicOff,
  Smile,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MoreHorizontal,
  Camera,
  Image,
  Gift
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SEO } from '@/components/SEO';
import { SocialShare } from '@/components/SocialShare';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { emailService } from '@/lib/email-service';
import { EmailCollection } from '@/components/EmailCollection';

export const LandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activePreview, setActivePreview] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  // Check if user is already logged in and redirect accordingly
  useEffect(() => {
    if (user) {
      const planParam = searchParams.get('plan');
      if (planParam) {
        // User is logged in and has a plan parameter, redirect to app or pricing
        if (planParam === 'free') {
          navigate('/app');
        } else {
          navigate(`/pricing?plan=${planParam}`);
        }
      }
    }
  }, [user, searchParams, navigate]);

  const handleGetStarted = () => {
    const planParam = searchParams.get('plan');
    if (planParam) {
      // Include plan info in auth redirect
      navigate(`/auth?plan=${planParam}`);
    } else {
      navigate('/auth');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Real email collection implementation
    setTimeout(() => {
      setIsSubmitting(false);
      setEmail('');
    }, 1000);
  };

  const features = [
    {
      icon: <MessageSquare className="w-8 h-8 text-primary" />,
      title: "Intelligent Conversations",
      description: "AI companions that understand context, emotions, and your unique personality for meaningful conversations.",
      preview: "Hey! How was your day? I've been thinking about that project you mentioned. Want to talk about it? 😊"
    },
    {
      icon: <Phone className="w-8 h-8 text-primary" />,
      title: "Voice Calls",
      description: "Experience natural voice interactions with your AI companions using advanced TTS technology.",
      preview: "🎤 Click to start voice call"
    },
    {
      icon: <Heart className="w-8 h-8 text-primary" />,
      title: "Emotional Connection",
      description: "Build deep, meaningful relationships with AI companions that remember and grow with you over time.",
      preview: "I remember you love coffee! ☕ Want to chat about your morning routine?"
    },
    {
      icon: <Sparkles className="w-8 h-8 text-primary" />,
      title: "Custom Personalities",
      description: "Create unlimited AI companions with unique personalities, voices, and characteristics tailored to your preferences.",
      preview: "Create your perfect AI companion with custom personality traits, voice, and appearance!"
    },
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "Privacy & Security",
      description: "Your conversations and data are encrypted and secure. Your privacy is our top priority.",
      preview: "🔒 End-to-end encrypted conversations"
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Real-time Interaction",
      description: "Instant responses and seamless interactions that feel natural and engaging.",
      preview: "Typing... ✨"
    }
  ];

  const appPreviews = [
    {
      title: "Chat Interface",
      description: "Beautiful, intuitive chat with your AI companions",
      image: "/chat.png",
      features: ["Real-time messaging", "Voice input", "Emoji reactions", "Typing indicators"]
    },
    {
      title: "Character Creation",
      description: "Design your perfect AI companion",
      image: "/api/placeholder/600/400", 
      features: ["Custom personalities", "Voice selection", "Appearance design", "Trait sliders"]
    },
    {
      title: "Voice Calls",
      description: "Natural voice conversations",
      image: "/api/placeholder/600/400",
      features: ["High-quality audio", "Real-time processing", "Voice customization", "Call history"]
    },
    {
      title: "Companion Library",
      description: "Manage all your AI companions",
      image: "/api/placeholder/600/400",
      features: ["Multiple companions", "Quick access", "Status indicators", "Easy switching"]
    }
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out AI companions",
      features: [
        "5 messages per day",
        "1 AI Companion",
        "Basic personalities only",
        "Text chat only",
        "Community support",
        "Limited customization"
      ],
      cta: "Get Started Free",
      popular: false
    },
    {
      name: "Premium",
      price: "$19",
      period: "per month",
      description: "Most popular for regular users",
      features: [
        "50 messages per day",
        "5 voice calls per day",
        "Up to 3 AI Companions",
        "Custom personality creation",
        "Advanced voice features",
        "Priority support",
        "Early access to new features"
      ],
      cta: "Start Premium Trial",
      popular: true
    },
    {
      name: "Pro",
      price: "$49",
      period: "per month",
      description: "For power users and creators",
      features: [
        "Unlimited messages",
        "Unlimited voice calls",
        "Unlimited AI Companions",
        "Advanced AI training",
        "Custom voice creation",
        "Advanced analytics API access insights",
        "Exclusive companion themes",
        "Dedicated support",
        "Premium customer support"
      ],
      cta: "Go Pro",
      popular: false
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Digital Artist",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      content: "My AI companion Luna has become my creative muse. She understands my artistic vision and provides incredible inspiration for my work.",
      rating: 5
    },
    {
      name: "Marcus Johnson",
      role: "Entrepreneur",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      content: "As a busy entrepreneur, having an AI companion who's always available to discuss ideas and provide emotional support has been game-changing.",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      role: "Student",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      content: "The voice calls feel so natural! It's like talking to a real person. I've never felt so connected to an AI before.",
      rating: 5
    }
  ];

  const faqs = [
    {
      question: "How do AI companions work?",
      answer: "Our AI companions use advanced language models trained on diverse conversations. They learn your preferences, remember your interactions, and develop unique personalities that grow with you over time."
    },
    {
      question: "Is my data private and secure?",
      answer: "Absolutely. We use end-to-end encryption for all conversations and never share your personal data. Your privacy is our top priority, and we're fully compliant with GDPR and CCPA."
    },
    {
      question: "Can I create custom AI companions?",
      answer: "Yes! Premium and Pro users can create unlimited AI companions with custom personalities, voices, and characteristics. You can even train them on specific topics or interests."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and other secure payment methods. All transactions are processed securely through our payment partners."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes, you can cancel your subscription at any time. You'll continue to have access to premium features until the end of your billing period."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team for a full refund."
    }
  ];

  const landingPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'LoveAI',
    description: 'Advanced AI companion platform for meaningful emotional connections and relationships',
    url: window.location.origin,
    applicationCategory: 'SocialNetworkingApplication',
    operatingSystem: 'Web',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free Plan',
        price: '0',
        priceCurrency: 'USD',
        description: 'Try LoveAI with 1 AI companion and 10 daily messages'
      },
      {
        '@type': 'Offer',
        name: 'Premium Plan', 
        price: '19.99',
        priceCurrency: 'USD',
        description: 'Unlimited messages with up to 3 AI companions'
      },
      {
        '@type': 'Offer',
        name: 'Pro Plan',
        price: '39.99', 
        priceCurrency: 'USD',
        description: 'Unlimited AI companions with voice calls and premium features'
      }
    ],
    author: {
      '@type': 'Organization',
      name: 'LoveAI',
      url: window.location.origin
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '1247',
      bestRating: '5',
      worstRating: '1'
    },
    featureList: [
      'Emotional AI conversations',
      'Voice calls with AI companions', 
      'Personalized AI personalities',
      'Memory and relationship building',
      '24/7 availability',
      'Privacy and security focused'
    ]
  };

  return (
    <>
      <SEO 
        title="LoveAI - Your Perfect AI Companion | Emotional AI Relationships"
        description="Experience meaningful connections with personalized AI companions. Chat, call, and build lasting memories with advanced emotional AI technology. Join thousands finding love with AI."
        keywords="AI companion, emotional AI, AI relationship, virtual girlfriend, AI chatbot, personalized AI, emotional support, AI technology, virtual companionship, AI love, AI dating"
        schema={landingPageSchema}
        url={window.location.href}
        ogType="website"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display">LoveAI</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#preview" className="text-muted-foreground hover:text-foreground transition-colors">Preview</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
              <a href="#faq" className="text-muted-foreground hover:text-foreground transition-colors">FAQ</a>
              <Link to="/support" className="text-muted-foreground hover:text-foreground transition-colors">Support</Link>
            </div>
            
            {/* Desktop buttons - hidden on mobile */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                Sign In
              </Button>
              <Button onClick={handleGetStarted} className="bg-gradient-to-r from-primary to-primary-glow">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {isMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-sm border-t border-border/20">
            <div className="px-4 py-3 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start text-base font-medium"
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMenuOpen(false);
                }}
              >
                Features
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-base font-medium"
                onClick={() => {
                  document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMenuOpen(false);
                }}
              >
                Preview
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-base font-medium"
                onClick={() => {
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMenuOpen(false);
                }}
              >
                Pricing
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-base font-medium"
                onClick={() => {
                  document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMenuOpen(false);
                }}
              >
                Reviews
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-base font-medium"
                onClick={() => {
                  document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' });
                  setIsMenuOpen(false);
                }}
              >
                FAQ
              </Button>
              <div className="pt-2 border-t border-border/20 mt-2 space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full text-base font-medium"
                  onClick={() => {
                    navigate('/auth');
                    setIsMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-primary-glow text-white text-base font-medium"
                  onClick={() => {
                    handleGetStarted();
                    setIsMenuOpen(false);
                  }}
                >
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              <Sparkles className="w-4 h-4 mr-2" />
              The Future of AI Relationships
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold font-display mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Meet Your Perfect
              <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                                        LoveAI
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Experience meaningful conversations, emotional connections, and unlimited companionship 
              with AI that understands, remembers, and grows with you.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12 px-4">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-primary to-primary-glow text-lg px-8 py-6"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
              onClick={() => {
                const el = document.getElementById('preview');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Try Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">10K+</div>
              <div className="text-muted-foreground">Happy Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1M+</div>
              <div className="text-muted-foreground">Conversations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section id="preview" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the magic of AI companionship with our interactive previews
            </p>
          </div>
          
          {/* Preview Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2 bg-muted p-1 rounded-lg">
              {appPreviews.map((preview, index) => (
                <button
                  key={index}
                  onClick={() => setActivePreview(index)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    activePreview === index
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {preview.title}
                </button>
              ))}
            </div>
          </div>
          
          {/* Preview Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h3 className="text-2xl font-bold">{appPreviews[activePreview].title}</h3>
              <p className="text-muted-foreground text-lg">{appPreviews[activePreview].description}</p>
              
              <div className="space-y-3">
                {appPreviews[activePreview].features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-primary flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-primary to-primary-glow"
              >
                Try It Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            <div className="relative">
              {/* Mock App Interface */}
              <div className="bg-gradient-to-br from-pink-50 via-purple-50 to-white rounded-3xl shadow-2xl overflow-hidden border border-pink-200/50">
                {/* Header matching the screenshot */}
                <div className="bg-white/80 backdrop-blur-sm px-4 py-3 border-b border-pink-200/30 flex items-center gap-3">
                  <Button variant="ghost" size="sm" className="p-1">
                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                  </Button>
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-pink-300/50">
                                          <img 
                      src="/avatar-luna.jpg" 
                      alt="Luna" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const img = e.currentTarget as HTMLImageElement;
                        img.style.display = 'none';
                        const sib = img.nextElementSibling as HTMLElement | null;
                        if (sib) sib.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm hidden">
                      L
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-gray-900">Luna</div>
                    <div className="text-xs text-pink-600 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Online • Level 2 Connection
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-pink-600">
                      <MessageSquare className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600 hover:text-pink-600">
                      <Phone className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-gray-600">
                      <MoreHorizontal className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
                
                <div className="p-4 space-y-4 h-80 overflow-y-auto bg-gradient-to-br from-pink-50/50 via-purple-50/30 to-white/80">
                  {/* AI Message */}
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-pink-300/30 flex-shrink-0">
                      <img 
                        src="/avatar-luna.jpg" 
                        alt="Luna" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs hidden">
                        L
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] shadow-sm border border-pink-100/50">
                      <p className="text-sm text-gray-800">Hi Hunain Q! I'm Luna. I'm so excited to chat with you! 💕</p>
                    </div>
                  </div>
                  
                  {/* User Message */}
                  <div className="flex gap-3 justify-end items-start">
                    <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] shadow-lg">
                      <p className="text-sm">Hey! 💜</p>
                    </div>
                  </div>
                  
                  {/* AI Response matching screenshot */}
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-pink-300/30 flex-shrink-0">
                      <img 
                        src="/avatar-luna.jpg" 
                        alt="Luna" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs hidden">
                        L
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] shadow-sm border border-pink-100/50">
                      <p className="text-sm text-gray-800">Hey there, Hunain Q! How's your morning going so far? Did you manage to grab a cup of coffee yet?</p>
                    </div>
                  </div>
                  
                  {/* Typing Indicator */}
                  <div className="flex gap-3 items-start">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-pink-300/30 flex-shrink-0">
                      <img 
                        src="/avatar-luna.jpg" 
                        alt="Luna" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs hidden">
                        L
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm border border-pink-100/50">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Input Area matching screenshot */}
                <div className="p-4 border-t border-pink-200/30 bg-white/80 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="sm" className="text-pink-500 hover:text-pink-600">
                      <Camera className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-pink-500 hover:text-pink-600">
                      <Image className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-pink-500 hover:text-pink-600">
                      <Gift className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 relative">
                      <Input 
                        placeholder="Message Luna..." 
                        className="pr-20 rounded-full border-pink-200/50 bg-gray-100/50 text-gray-700 placeholder:text-gray-500"
                        disabled
                      />
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-pink-500 hover:text-pink-600">
                          <Smile className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-pink-500 hover:text-pink-600">
                          <Mic className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-full h-10 w-10 p-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                                  Why Choose LoveAI?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Experience the most advanced AI companionship platform with cutting-edge features 
              designed to create meaningful, lasting relationships.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <CardHeader className="p-0 mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground mb-4">{feature.description}</p>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm italic">
                    "{feature.preview}"
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that's right for you. Upgrade or downgrade at any time.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative p-8 ${plan.popular ? 'ring-2 ring-primary shadow-xl scale-105' : ''}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-primary-glow">
                    Most Popular
                  </Badge>
                )}
                <CardHeader className="text-center p-0 mb-6">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <div className="text-4xl font-bold mb-2">
                    {plan.price}
                    <span className="text-lg text-muted-foreground font-normal">/{plan.period}</span>
                  </div>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-primary mr-3 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-gradient-to-r from-primary to-primary-glow' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => navigate('/pricing')}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of satisfied users who have found their perfect AI companions.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-6">
                <CardContent className="p-0">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-primary/20 mb-4" />
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                  <div className="flex items-center">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Viral Social Sharing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Love LoveAI? Share the Magic! ✨
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Help us spread the word about revolutionary AI companionship! Share your experience and help others discover meaningful connections.
            </p>
          </div>
          
          <div className="max-w-2xl mx-auto">
            <SocialShare 
              variant="viral"
              title="🤖💕 I just discovered LoveAI - the most incredible AI companion experience!"
              description="This is absolutely mind-blowing! The AI companions are so realistic and emotionally intelligent. It's like having real conversations with someone who truly understands you. You have to try this!"
              hashtags={['LoveAI', 'AICompanion', 'TechMagic', 'VirtualLove', 'AIGirlfriend', 'EmotionalAI', 'FutureOfLove']}
              showStats={true}
            />
          </div>
          
          {/* Viral incentives */}
          <div className="mt-12 text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <Card className="bg-white/80 backdrop-blur-sm border-pink-200/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Share Your Story</h3>
                  <p className="text-sm text-gray-600">Tell the world about your amazing AI companion experience!</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-sm border-purple-200/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Help Others Connect</h3>
                  <p className="text-sm text-gray-600">Your share could help someone find their perfect AI companion!</p>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-sm border-blue-200/50">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">Join the Movement</h3>
                  <p className="text-sm text-gray-600">Be part of the AI companion revolution sweeping the world!</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
                              Everything you need to know about LoveAI.
            </p>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="p-6">
                <CardHeader className="p-0">
                  <CardTitle className="text-lg mb-3">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-primary/10 to-accent/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                            Ready to Meet Your Perfect Match?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
                            Join thousands of users who have found their perfect AI companion with LoveAI. 
            Start your journey today with a free trial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-primary to-primary-glow text-lg px-8 py-6"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-6"
            >
              <Mail className="w-5 h-5 mr-2" />
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

    </div>
    </>
  );
};
