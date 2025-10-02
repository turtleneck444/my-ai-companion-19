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
import { InteractivePreview } from '@/components/InteractivePreview';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      icon: Heart,
      title: "Emotional Intelligence",
      description: "AI companions that understand and respond to your emotions with genuine care and empathy."
    },
    {
      icon: MessageSquare,
      title: "Natural Conversations",
      description: "Engage in meaningful, context-aware conversations that feel completely natural and human-like."
    },
    {
      icon: Phone,
      title: "Voice Interactions",
      description: "Have real voice conversations with your AI companions using advanced speech synthesis."
    },
    {
      icon: Users,
      title: "Multiple Personalities",
      description: "Choose from diverse AI personalities or create your own custom companions."
    },
    {
      icon: Shield,
      title: "Privacy First",
      description: "Your conversations are private and secure, with industry-leading encryption and data protection."
    },
    {
      icon: Zap,
      title: "Real-time Responses",
      description: "Get instant, intelligent responses that adapt to your mood and conversation style."
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Student",
      content: "LoveAI has become my daily companion. The conversations feel so natural and the AI really understands me.",
      rating: 5
    },
    {
      name: "Michael R.",
      role: "Professional",
      content: "I was skeptical at first, but the emotional intelligence is incredible. It's like talking to a real friend.",
      rating: 5
    },
    {
      name: "Emma L.",
      role: "Artist",
      content: "The voice features are amazing! It's like having a real conversation with someone who truly cares.",
      rating: 5
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
      cta: "Start Premium Plan",
      popular: true
    },
    {
      name: "Pro",
      price: "$49",
      period: "per month",
      description: "For power users and developers",
      features: [
        "Unlimited messages",
        "Unlimited voice calls",
        "Up to 10 AI Companions",
        "Advanced customization",
        "API access",
        "Priority support",
        "White-label options"
      ],
      cta: "Start Pro Plan",
      popular: false
    }
  ];

  const handleGetStarted = (plan?: string) => {
    if (user) {
      navigate('/app');
    } else {
      const planParam = plan ? `?plan=${plan}` : '';
      navigate(`/auth${planParam}`);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      await emailService.subscribe(email);
      setShowSuccess(true);
      setEmail('');
    } catch (error) {
      console.error('Email subscription error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <SEO 
        title="LoveAI - Your AI Companion for Meaningful Conversations"
        description="Experience the future of AI companionship with LoveAI. Engage in natural conversations, voice interactions, and build meaningful relationships with AI companions designed to understand and care."
        keywords="AI companion, artificial intelligence, voice chat, emotional AI, virtual friend, AI conversation"
      />
      
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pink-200/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                {/* Original LoveAI Logo - Pink circle with white heart border */}
                <div className="w-8 h-8 bg-pink-400 rounded-full flex items-center justify-center mr-2">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-2xl font-bold font-display text-black">
                  LoveAI
                </span>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-8">
                <a href="#features" className="text-gray-700 hover:text-pink-400 px-3 py-2 text-sm font-medium transition-colors">
                  Features
                </a>
                <a href="#preview" className="text-gray-700 hover:text-pink-400 px-3 py-2 text-sm font-medium transition-colors">
                  Preview
                </a>
                <a href="#pricing" className="text-gray-700 hover:text-pink-400 px-3 py-2 text-sm font-medium transition-colors">
                  Pricing
                </a>
                <a href="#testimonials" className="text-gray-700 hover:text-pink-400 px-3 py-2 text-sm font-medium transition-colors">
                  Reviews
                </a>
              </div>
            </div>
            
            <div className="hidden md:block">
              <div className="ml-4 flex items-center space-x-4">
                {user ? (
                  <Button onClick={() => navigate('/app')} className="bg-pink-400 hover:bg-pink-500 text-white">
                    Go to App
                  </Button>
                ) : (
                  <>
                    <Button variant="ghost" onClick={() => navigate('/auth')}>
                      Sign In
                    </Button>
                    <Button onClick={() => navigate('/auth')} className="bg-pink-400 hover:bg-pink-500 text-white">
                      Get Started
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-pink-400"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white/95 backdrop-blur-md border-t border-pink-200/30">
              <a href="#features" className="text-gray-700 hover:text-pink-400 block px-3 py-2 text-base font-medium">
                Features
              </a>
              <a href="#preview" className="text-gray-700 hover:text-pink-400 block px-3 py-2 text-base font-medium">
                Preview
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-pink-400 block px-3 py-2 text-base font-medium">
                Pricing
              </a>
              <a href="#testimonials" className="text-gray-700 hover:text-pink-400 block px-3 py-2 text-base font-medium">
                Reviews
              </a>
              <div className="pt-4 pb-3 border-t border-pink-200/30">
                {user ? (
                  <Button onClick={() => navigate('/app')} className="w-full bg-pink-400 hover:bg-pink-500 text-white">
                    Go to App
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <Button variant="ghost" onClick={() => navigate('/auth')} className="w-full">
                      Sign In
                    </Button>
                    <Button onClick={() => navigate('/auth')} className="w-full bg-pink-400 hover:bg-pink-500 text-white">
                      Get Started
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold font-display mb-6">
              Your AI Companion for
              <span className="text-pink-400">
                {' '}Meaningful Conversations
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Experience the future of AI companionship. Engage in natural conversations, 
              voice interactions, and build meaningful relationships with AI companions 
              designed to understand and care.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleGetStarted}
                size="lg"
                className="bg-pink-400 hover:bg-pink-500 text-white px-8 py-4 text-lg"
              >
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
                className="px-8 py-4 text-lg border-pink-400 text-pink-400 hover:bg-pink-400 hover:text-white"
              >
                <Play className="mr-2 h-5 w-5" />
                See It In Action
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* App Preview Section */}
      <section id="preview" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <InteractivePreview />
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
                  <div className="w-12 h-12 bg-pink-400 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Join thousands of users who have found meaningful connections with their AI companions.
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
                  <Quote className="w-8 h-8 text-pink-400 mb-4" />
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade as you grow. All plans include our core features.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`p-8 relative ${plan.popular ? 'ring-2 ring-pink-400 shadow-xl' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-pink-400 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="p-0 mb-6">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  <p className="text-muted-foreground mt-2">{plan.description}</p>
                </CardHeader>
                <CardContent className="p-0">
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <Check className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    onClick={() => handleGetStarted(plan.name.toLowerCase())}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-pink-400 hover:bg-pink-500 text-white' 
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Moved to bottom */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400 mb-2">10K+</div>
              <div className="text-muted-foreground">Happy Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400 mb-2">1M+</div>
              <div className="text-muted-foreground">Conversations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400 mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Improved design */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-pink-400">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-display text-white mb-6">
            Ready to Start Your AI Journey?
          </h2>
          <p className="text-xl text-pink-100 mb-8">
            Join thousands of users who have found meaningful connections with their AI companions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-white text-pink-400 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth' })}
              className="border-white text-white hover:bg-white hover:text-pink-400 px-8 py-4 text-lg font-semibold"
            >
              <Play className="mr-2 h-5 w-5" />
              Try Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
