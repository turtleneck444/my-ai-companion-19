import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, Check, Star, Crown, Zap } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { PaymentProcessor, SUBSCRIPTION_PLANS } from '@/lib/payments';
import { Elements, useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

interface UnifiedSignupFlowProps {
  preselectedPlan?: string;
  onClose?: () => void;
}

// Load Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

// Payment form component that uses Stripe Elements
const PaymentForm = ({ 
  selectedPlan, 
  selectedPlanDetails, 
  formData, 
  handleInputChange, 
  showPassword, 
  setShowPassword, 
  isLoading, 
  setIsLoading, 
  setStep, 
  createAccount, 
  toast, 
  navigate 
}: any) => {
  const stripe = useStripe();
  const elements = useElements();

  const handlePayment = async () => {
    if (!selectedPlanDetails) return;

    // Require email to proceed (used for receipts/customer association)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({ title: 'Email required', description: 'Enter a valid email to continue', variant: 'destructive' });
      return;
    }

    // Require password for account creation
    if (!formData.password || formData.password.length < 6) {
      toast({ title: 'Password required', description: 'Enter a password (min 6 characters) to create your account', variant: 'destructive' });
      return;
    }

    if (!stripe || !elements) {
      toast({ title: 'Payment Error', description: 'Payment system not ready. Please try again.', variant: 'destructive' });
      return;
    }

    setStep('processing');
    setIsLoading(true);

    try {
      // Get the card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error: createPaymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (createPaymentMethodError) {
        throw new Error(createPaymentMethodError.message);
      }

      // Process payment with backend (create subscription)
      const paymentProcessor = new PaymentProcessor();
      const subscriptionResult = await paymentProcessor.createSubscription(
        selectedPlan,
        paymentMethod.id,
        formData.email,
        formData.preferredName,
        formData.age
      );

      if (subscriptionResult.success) {
        // Payment successful - create account with paid plan
        await createAccount(selectedPlan);

        toast({
          title: "Payment Successful! 🎉",
          description: `Welcome to LoveAI ${selectedPlanDetails.name}! Your account is ready.`,
        });

        navigate('/app', { replace: true, state: { startChatDefault: true } });
        return;
      } else {
        console.error('Payment failed:', subscriptionResult.error);
        toast({
          title: "Payment Failed",
          description: subscriptionResult.error || "Payment could not be processed. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setStep('payment');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Complete Your Purchase</h2>
        <p className="text-muted-foreground">
          {selectedPlanDetails?.name} - ${selectedPlanDetails?.price}/{selectedPlanDetails?.interval}
        </p>
      </div>

      {/* Ensure we have an email for receipts/customer mapping */}
      <div className="space-y-2">
        <Label htmlFor="emailForPayment">Email Address *</Label>
        <Input
          id="emailForPayment"
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          placeholder="your@email.com"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>{selectedPlanDetails?.name} Plan</span>
            <span>${selectedPlanDetails?.price}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${selectedPlanDetails?.price}</span>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Card Element */}
      <div className="p-4 border rounded-lg">
        <CardElement 
          options={{ 
            style: { 
              base: { 
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
            },
          }} 
        />
      </div>

      {/* Password field */}
      <div className="space-y-2">
        <Label htmlFor="passwordForPayment">Password *</Label>
        <div className="relative">
          <Input
            id="passwordForPayment"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            placeholder="Enter your password"
            required
            minLength={6}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword((prev) => !prev)}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Minimum 6 characters</p>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setStep('details')}
          className="flex-1"
        >
          Back
        </Button>
        <Button 
          onClick={handlePayment}
          disabled={isLoading || !stripe || !elements}
          className="flex-1"
        >
          Complete Purchase
        </Button>
      </div>
    </div>
  );
};

export const UnifiedSignupFlow = ({ preselectedPlan = 'free', onClose }: UnifiedSignupFlowProps) => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'plan' | 'details' | 'payment' | 'processing'>('plan');
  const [selectedPlan, setSelectedPlan] = useState(preselectedPlan);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    preferredName: '',
    age: '',
    agreeTerms: false
  });

  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedPlanDetails = SUBSCRIPTION_PLANS.find(plan => plan.id === selectedPlan);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlanSelection = (planId: string) => {
    setSelectedPlan(planId);
    if (planId === 'free') {
      setStep('details');
    } else {
      setStep('payment');
      // Keep focus centered on the signup flow to avoid footer distractions
      setTimeout(() => {
        if (containerRef.current) {
          containerRef.current.scrollIntoView({ behavior: 'auto', block: 'center' });
        } else {
          window.scrollTo({ top: 0, left: 0 });
        }
      }, 0);
    }
  };

  const handleAccountCreation = async () => {
    // Validate required fields
    if (!formData.email || !formData.password || !formData.preferredName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive"
      });
      return;
    }

    // Check terms agreement
    if (!formData.agreeTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions.",
        variant: "destructive"
      });
      return;
    }

    if (selectedPlan === 'free') {
      // Free plan - create account directly
      await createAccount();
    } else {
      // Paid plan - go to payment step
      setStep('payment');
    }
  };

  const createAccount = async (planOverride?: string) => {
    setIsLoading(true);
    try {
      const finalPlan = planOverride || selectedPlan;
      
      const { error } = await signUp(
        formData.email,
        formData.password,
        {
          preferred_name: formData.preferredName,
          plan: finalPlan,
          age: formData.age
        }
      );

      if (error) {
        toast({
          title: "Signup Failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Account Created! 🎉",
        description: `Welcome to LoveAI! Check your email to verify your account.`,
      });

      // Navigate based on plan
      if (finalPlan === 'free') {
        navigate('/app');
      } else {
        // For paid plans, the payment was already processed
        navigate('/app');
      }
      
      onClose?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlanSelection = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Choose Your Perfect Plan</h2>
        <p className="text-lg text-muted-foreground mt-2">Select the plan that fits your AI companion needs</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card 
            key={plan.id}
            className={`relative cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-105 ${
              selectedPlan === plan.id ? 'ring-2 ring-purple-500 shadow-xl' : 'hover:shadow-lg'
            } ${plan.popular ? 'border-2 border-purple-500 shadow-lg' : 'border'}`}
            onClick={() => handlePlanSelection(plan.id)}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 text-white px-4 py-1 text-sm">
                <Star className="h-4 w-4 mr-1" />
                Most Popular
              </Badge>
            )}
            
            <CardHeader className="text-center pb-4 pt-8">
              <CardTitle className="text-2xl font-bold mb-2">{plan.name}</CardTitle>
              <div className="mb-4">
                <span className="text-4xl font-bold">
                  ${plan.price}
                </span>
                <span className="text-lg text-muted-foreground ml-1">
                  /{plan.interval === 'forever' ? 'forever' : 'per month'}
                </span>
              </div>
              <p className="text-muted-foreground">
                {plan.id === 'free' && 'Perfect for trying out AI companions'}
                {plan.id === 'premium' && 'Most popular for regular users'}
                {plan.id === 'pro' && 'For power users and creators'}
              </p>
            </CardHeader>
            
            <CardContent className="px-6 pb-8">
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                type="button"
                className={`w-full py-3 text-base font-semibold ${
                  plan.id === 'free' ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' :
                  plan.id === 'premium' ? 'bg-purple-500 hover:bg-purple-600 text-white' :
                  'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                }`}
                variant={plan.id === 'free' ? 'outline' : 'default'}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handlePlanSelection(plan.id);
                }}
              >
                {plan.id === 'free' ? 'Get Started Free' : 
                 plan.id === 'premium' ? 'Start Premium Plan' : 'Go Pro'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>🔒 Secure payment • ⚡ Instant activation • 💫 Cancel anytime</p>
      </div>
    </div>
  );

  const renderAccountDetails = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Create Your Account</h2>
        <p className="text-muted-foreground">
          Selected: {selectedPlanDetails?.name} - ${selectedPlanDetails?.price}/{selectedPlanDetails?.interval}
        </p>
      </div>

      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="preferredName">Preferred Name *</Label>
          <Input
            id="preferredName"
            value={formData.preferredName}
            onChange={(e) => handleInputChange('preferredName', e.target.value)}
            placeholder="What should your AI companion call you?"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password *</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              placeholder="Choose a secure password"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            value={formData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
            placeholder="18+"
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="agreeTerms"
            checked={formData.agreeTerms}
            onChange={(e) => handleInputChange('agreeTerms', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="agreeTerms" className="text-sm">
            I agree to the Terms of Service and Privacy Policy
          </Label>
        </div>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={() => setStep('plan')}
          className="flex-1"
        >
          Back to Plans
        </Button>
        <Button 
          onClick={handleAccountCreation}
          disabled={isLoading}
          className="flex-1"
        >
          {selectedPlan === 'free' ? 'Create Free Account' : 'Continue to Payment'}
        </Button>
      </div>
    </div>
  );

  const renderProcessing = () => (
    <div className="text-center space-y-6 py-8">
      <div className="animate-pulse">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Crown className="h-8 w-8 text-purple-600" />
        </div>
      </div>
      <h2 className="text-2xl font-bold">Processing Your Payment...</h2>
      <p className="text-muted-foreground">
        Please wait while we set up your {selectedPlanDetails?.name} account.
      </p>
    </div>
  );

  return (
    <Elements stripe={stripePromise}>
      <div className="w-full" ref={containerRef}>
        {step === 'plan' ? (
          <div className="w-full">
            {renderPlanSelection()}
          </div>
        ) : (
          <Card className="w-full max-w-2xl mx-auto">
            <CardContent className="p-8">
              {step === 'details' && renderAccountDetails()}
              {step === 'payment' && (
                <PaymentForm
                  selectedPlan={selectedPlan}
                  selectedPlanDetails={selectedPlanDetails}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  showPassword={showPassword}
                  setShowPassword={setShowPassword}
                  isLoading={isLoading}
                  setIsLoading={setIsLoading}
                  setStep={setStep}
                  createAccount={createAccount}
                  toast={toast}
                  navigate={navigate}
                />
              )}
              {step === 'processing' && renderProcessing()}
            </CardContent>
          </Card>
        )}
      </div>
    </Elements>
  );
};
