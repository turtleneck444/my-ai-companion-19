import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (plan: string) => void;
  plan: string;
}

const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: '$0',
    features: ['5 messages per day', '1 voice call per day', 'Basic features'],
    limits: { messages: 5, voice_calls: 1 }
  },
  premium: {
    name: 'Premium',
    price: '$19/month',
    features: ['50 messages per day', '5 voice calls per day', 'Advanced features', 'Priority support'],
    limits: { messages: 50, voice_calls: 5 }
  },
  pro: {
    name: 'Pro',
    price: '$49/month',
    features: ['Unlimited messages', 'Unlimited voice calls', 'All features', 'API access'],
    limits: { messages: -1, voice_calls: -1 }
  }
};

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Payment Form Component
const PaymentForm: React.FC<{ plan: string; onSuccess: (plan: string) => void; onClose: () => void }> = ({ 
  plan, 
  onSuccess, 
  onClose 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const planData = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create payment intent
      const response = await fetch('/.netlify/functions/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'createPaymentIntent',
          plan: plan
        }),
      });

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (error) {
        setError(error.message || 'Payment failed');
      } else if (paymentIntent.status === 'succeeded') {
        toast({
          title: "Payment Successful!",
          description: `Welcome to ${planData.name}!`,
        });
        onSuccess(plan);
        onClose();
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="p-4 border border-gray-300 rounded-lg">
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
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-pink-500 hover:bg-pink-600 text-white"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4 mr-2" />
            Pay {planData.price}
          </>
        )}
      </Button>
    </form>
  );
};

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  plan
}) => {
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);

  const planData = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;

  const handleFreePlan = () => {
    setSuccess(true);
    toast({
      title: "Free Plan Activated!",
      description: "Welcome to LoveAI!",
    });
    
    setTimeout(() => {
      onSuccess(plan);
      onClose();
    }, 2000);
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Success!</h3>
            <p className="text-gray-600 mb-6">
              Your {planData.name} plan has been activated successfully.
            </p>
            <Button onClick={onClose} className="bg-pink-500 hover:bg-pink-600 text-white">
              Continue to App
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Complete Your Subscription
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose your plan and complete the payment to get started
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Selection */}
          <Card className="border-2 border-pink-200 bg-pink-50">
            <CardHeader className="text-center">
              <CardTitle className="text-xl text-pink-700">{planData.name} Plan</CardTitle>
              <CardDescription className="text-2xl font-bold text-pink-600">
                {planData.price}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-700">
                {planData.features.map((feature, index) => (
                  <li key={index} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Payment Form */}
          {plan === 'free' ? (
            <div className="text-center">
              <Button
                onClick={handleFreePlan}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate Free Plan
              </Button>
            </div>
          ) : (
            <Elements stripe={stripePromise}>
              <PaymentForm plan={plan} onSuccess={onSuccess} onClose={onClose} />
            </Elements>
          )}

          {/* Security Notice */}
          <div className="text-center text-xs text-gray-500">
            <Shield className="w-4 h-4 inline mr-1" />
            Your payment information is secure and encrypted
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};