import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, CreditCard, Loader2, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { SUBSCRIPTION_PLANS } from '@/lib/payments';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Stripe configuration
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY );

interface QuickUpgradeButtonProps {
  currentPlan?: string;
  limitType?: 'message' | 'voice_call';
  className?: string;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

// Payment form component
const PaymentForm = ({ 
  selectedPlan, 
  onSuccess, 
  onClose 
}: { 
  selectedPlan: any;
  onSuccess: (result: any) => void;
  onClose: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!stripe || !elements) {
      toast({ title: 'Payment Error', description: 'Payment system not ready. Please try again.', variant: 'destructive' });
      return;
    }

    if (!cardComplete) {
      toast({ title: 'Payment Error', description: 'Please complete your card details.', variant: 'destructive' });
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          email: user?.email || '',
          name: user?.user_metadata?.preferredName || '',
        },
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      if (!paymentMethod) {
        throw new Error('Payment method could not be created');
      }

      // Create subscription with payment method
      const response = await fetch('/.netlify/functions/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_subscription',
          planId: selectedPlan.id,
          paymentMethodId: paymentMethod.id,
          customerEmail: user?.email || '',
          customerName: user?.user_metadata?.preferredName || '',
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Subscription creation failed');
      }

      toast({
        title: "Upgrade Successful!",
        description: `Welcome to ${selectedPlan.name} plan! Your subscription is now active.`,
      });

      onSuccess(result);
    } catch (error: any) {
      console.error('Payment failed:', error);
      toast({
        title: "Payment Failed",
        description: error.message || 'Something went wrong. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Card Details</label>
        <div className="mt-2 p-3 border rounded-md">
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
            onChange={(event) => {
              setCardComplete(event.complete);
              setCardError(event.error ? event.error.message : null);
            }}
          />
        </div>
        {cardError && (
          <p className="text-sm text-red-600 mt-1">{cardError}</p>
        )}
      </div>

      <div className="flex space-x-3">
        <Button
          type="submit"
          disabled={!stripe || !cardComplete || isProcessing}
          className="flex-1 bg-pink-500 hover:bg-pink-600"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 mr-2" />
              Complete Payment
            </>
          )}
        </Button>
        <Button
          type="button"
          onClick={onClose}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export const QuickUpgradeButton = ({ 
  currentPlan = 'free',
  limitType = 'message',
  className = '',
  variant = 'default',
  size = 'default'
}: QuickUpgradeButtonProps) => {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { toast } = useToast();

  const suggestedPlans = SUBSCRIPTION_PLANS.filter(plan => 
    plan.id !== 'free' && plan.id !== currentPlan
  );

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  const handlePlanSelect = (plan: any) => {
    setSelectedPlan(plan);
    setShowPaymentForm(true);
  };

  const handlePaymentSuccess = (result: any) => {
    setShowUpgradeModal(false);
    setShowPaymentForm(false);
    setSelectedPlan(null);
    
    // Refresh the page to update the user's plan
    window.location.reload();
  };

  return (
    <>
      <Button
        onClick={handleUpgradeClick}
        variant={variant}
        size={size}
        className={`bg-pink-500 hover:bg-pink-600 ${className}`}
      >
        <Zap className="w-4 h-4 mr-2" />
        Upgrade Plan
      </Button>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Upgrade Your Plan</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUpgradeModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mb-4">
                <p className="text-gray-600 mb-2">
                  {limitType === 'message' ? 'Daily message' : 'Daily voice call'} limit reached.
                </p>
                <p className="text-sm text-gray-500">
                  Choose a plan to continue enjoying unlimited conversations:
                </p>
              </div>

              {!showPaymentForm ? (
                <>
                  <div className="space-y-3 mb-6">
                    {suggestedPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedPlan?.id === plan.id 
                            ? 'border-pink-500 bg-pink-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => handlePlanSelect(plan)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="font-semibold">{plan.name}</h4>
                              {plan.popular && (
                                <Badge variant="secondary">Popular</Badge>
                              )}
                            </div>
                            <p className="text-2xl font-bold text-pink-600">
                              ${plan.price}
                              <span className="text-sm font-normal text-gray-500">
                                /{plan.interval}
                              </span>
                            </p>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 ${
                            selectedPlan?.id === plan.id 
                              ? 'border-pink-500 bg-pink-500' 
                              : 'border-gray-300'
                          }`}>
                            {selectedPlan?.id === plan.id && (
                              <Check className="h-3 w-3 text-white" />
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3">
                          <ul className="text-sm text-gray-600 space-y-1">
                            {plan.features.slice(0, 3).map((feature, index) => (
                              <li key={index} className="flex items-center space-x-2">
                                <Check className="h-3 w-3 text-green-500" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => selectedPlan && handlePlanSelect(selectedPlan)}
                      disabled={!selectedPlan}
                      className="flex-1 bg-pink-500 hover:bg-pink-600"
                    >
                      Continue to Payment
                    </Button>
                    <Button
                      onClick={() => setShowUpgradeModal(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Maybe Later
                    </Button>
                  </div>
                </>
              ) : (
                <Elements stripe={stripePromise}>
                  <div>
                    <div className="mb-4">
                      <h4 className="text-lg font-semibold mb-2">Complete Your Payment</h4>
                      <p className="text-sm text-gray-600">
                        You're upgrading to <strong>{selectedPlan.name}</strong> for ${selectedPlan.price}/{selectedPlan.interval}
                      </p>
                    </div>
                    
                    <PaymentForm
                      selectedPlan={selectedPlan}
                      onSuccess={handlePaymentSuccess}
                      onClose={() => setShowPaymentForm(false)}
                    />
                  </div>
                </Elements>
              )}
            </div>
          </Card>
        </div>
      )}
    </>
  );
};
