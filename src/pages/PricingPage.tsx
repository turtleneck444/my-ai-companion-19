import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Check, 
  Crown, 
  Star, 
  Zap, 
  Heart, 
  ArrowRight,
  Shield,
  Lock,
  Users,
  MessageSquare,
  Phone,

  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PaymentModal } from '@/components/PaymentModal';
import { SUBSCRIPTION_PLANS, formatPrice } from '@/lib/payments';
import { SEO } from '@/components/SEO';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPlanById } from '@/lib/payments';

export const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchParams] = useSearchParams();

  // Auto-open checkout if arriving with ?plan=
  useEffect(() => {
    const planParam = searchParams.get('plan');
    if (!planParam) return;
    const plan = getPlanById(planParam);
    if (!plan) return;

    if (plan.id === 'free') {
      navigate('/app');
      return;
    }

    if (user) {
      setSelectedPlan(plan.id);
      setShowPaymentModal(true);
    } else {
      navigate(`/auth?plan=${plan.id}`);
    }
  }, [searchParams, user, navigate]);

  const handleSelectPlan = (planId: string) => {
    if (planId === 'free') {
      // Free plan - check if user is logged in
      if (user) {
        // User is logged in, go to app
        navigate('/app');
      } else {
        // User not logged in, redirect to home for signup/login
        navigate('/auth?plan=free');
      }
    } else {
      // Paid plan - check if user is logged in
      if (user) {
        setSelectedPlan(planId);
        setShowPaymentModal(true);
      } else {
        // User not logged in, redirect to home for signup/login with plan info
        navigate(`/auth?plan=${planId}`);
      }
    }
  };

  const handlePaymentSuccess = (subscription: any) => {
    setShowPaymentModal(false);
    setSelectedPlan(null);
    navigate('/app');
  };

  const pricingSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'LoveAI Subscription Plans',
    description: 'Choose your perfect AI companion experience with flexible pricing plans',
    brand: {
      '@type': 'Brand',
      name: 'LoveAI'
    },
    offers: SUBSCRIPTION_PLANS.map(plan => ({
      '@type': 'Offer',
      name: plan.name,
      price: plan.price,
      priceCurrency: plan.currency,
      description: `${plan.name} plan with ${plan.limits.companions} companions and ${plan.limits.messagesPerDay} daily messages`,
      availability: 'https://schema.org/InStock',
      priceValidUntil: '2025-12-31'
    }))
  };

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Unlimited Conversations",
      description: "Chat with your AI companions without limits"
    },
    {
      icon: <Phone className="w-6 h-6" />,
      title: "Voice Calls",
      description: "Experience natural voice interactions"
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Custom Personalities",
      description: "Create unique AI companions tailored to you"
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "Advanced AI Training",
      description: "Train your companions on specific topics"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Privacy & Security",
      description: "Your data is encrypted and secure"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Multiple Companions",
      description: "Create and manage unlimited AI companions"
    }
  ];

  const faqs = [
    {
      question: "What's included in the free plan?",
      answer: "The free plan includes 1 AI companion, 5 messages per day, basic voice features, and standard personalities. Perfect for trying out the platform."
    },
    {
      question: "Can I change plans anytime?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any billing differences."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and other secure payment methods. All transactions are processed securely through our payment partners."
    },
    {
      question: "Is there a money-back guarantee?",
      answer: "Yes! We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team for a full refund."
    },
    {
      question: "Do you offer team or enterprise plans?",
      answer: "Yes! Contact our sales team for custom enterprise solutions with advanced features, dedicated support, and volume discounts."
    },
    {
      question: "How does billing work?",
      answer: "Billing is automatic and recurring. You'll be charged on the same date each month or year, depending on your chosen plan."
    }
  ];

  return (
    <>
      <SEO 
        title="LoveAI Pricing - Choose Your AI Companion Plan | Affordable AI Relationships"
        description="Choose the perfect LoveAI plan for your needs. From free AI companion trials to unlimited relationships with premium features. Start your AI love journey today!"
        keywords="AI companion pricing, AI girlfriend cost, virtual relationship plans, AI chatbot subscription, emotional AI pricing, LoveAI plans, AI companion membership"
        schema={pricingSchema}
        url={window.location.href}
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-glow rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold font-display">LoveAI</span>
            </div>
            <Button variant="ghost" onClick={() => navigate('/')}>
              Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold font-display mb-6">
            Choose Your
            <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Perfect Plan
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Start free, upgrade anytime. All plans include our core features with no hidden fees.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={`text-sm font-medium ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-sm font-medium ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            <Badge className="bg-primary/10 text-primary border-primary/20">
              Save 20%
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {SUBSCRIPTION_PLANS.map((plan, index) => (
              <Card 
                key={plan.id} 
                className={`relative p-8 ${
                  plan.popular 
                    ? 'ring-2 ring-primary shadow-xl scale-105 bg-gradient-to-br from-primary/5 to-accent/5' 
                    : 'hover:shadow-lg transition-all duration-300 hover:-translate-y-1'
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-primary-glow">
                    <Crown className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center p-0 mb-6">
                  <CardTitle className="text-2xl mb-2 flex items-center justify-center gap-2">
                    {plan.name}
                    {plan.popular && <Star className="w-5 h-5 text-yellow-400 fill-current" />}
                  </CardTitle>
                  <div className="text-4xl font-bold mb-2">
                    {formatPrice(plan.price)}
                    <span className="text-lg text-muted-foreground font-normal">/{plan.interval}</span>
                  </div>
                  <CardDescription className="text-base">
                    {plan.id === 'free' 
                      ? 'Perfect for trying out AI companions'
                      : plan.id === 'premium'
                      ? 'Most popular for regular users'
                      : 'For power users and creators'
                    }
                  </CardDescription>
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
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-primary to-primary-glow' 
                        : plan.id === 'free'
                        ? 'bg-muted hover:bg-muted/80'
                        : ''
                    }`}
                    variant={plan.id === 'free' ? 'secondary' : plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    {plan.id === 'free' ? 'Get Started Free' : `Choose ${plan.name}`}
                    {plan.id !== 'free' && <ArrowRight className="w-4 h-4 ml-2" />}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              All plans include our core features. Premium plans unlock advanced capabilities.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to know about our pricing and plans.
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
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of users who have found their perfect AI companion. 
            Start your journey today with a free trial.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => navigate('/app')}
              className="bg-gradient-to-r from-primary to-primary-glow text-lg px-8 py-6"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => navigate('/')}
              className="text-lg px-8 py-6"
            >
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Payment Modal */}
      {selectedPlan && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedPlan(null);
          }}
          selectedPlan={selectedPlan}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
    </>
  );
};
