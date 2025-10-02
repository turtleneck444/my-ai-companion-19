import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { paymentProcessor, SUBSCRIPTION_PLANS, formatPrice, getPlanById } from '@/lib/payments';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Check, CreditCard, Shield, Zap } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: string;
  onSuccess: (subscription: any) => void;
}

// Stripe Elements component
const CheckoutForm = ({ selectedPlan, onSuccess, onClose }: { 
  selectedPlan: string; 
  onSuccess: (subscription: any) => void;
  onClose: () => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');

  const plan = getPlanById(selectedPlan);
  if (!plan) return null;

  useEffect(() => {
    if (selectedPlan !== 'free') {
      // Create payment intent for subscription
      paymentProcessor.createPaymentIntent(selectedPlan)
        .then(intent => setClientSecret(intent.clientSecret))
        .catch(error => {
          console.error('Failed to create payment intent:', error);
          toast({
            title: "Payment Error",
            description: "Failed to initialize payment. Please try again.",
            variant: "destructive"
          });
        });
    }
  }, [selectedPlan, toast]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      if (selectedPlan === 'free') {
        // Handle free plan
        onSuccess({
          id: 'free-plan',
          status: 'active',
          planId: 'free',
          currentPeriodStart: Date.now(),
          currentPeriodEnd: Date.now() + (365 * 24 * 60 * 60 * 1000) // 1 year
        });
        return;
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (pmError) {
        throw new Error(pmError.message);
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method');
      }

      // Create subscription
      const subscription = await paymentProcessor.createSubscription(
        selectedPlan,
        paymentMethod.id
      );

      if (subscription.success) {
        onSuccess(subscription.subscription);
        toast({
          title: "Success!",
          description: `Welcome to ${plan.name}! Your subscription is now active.`,
        });
      } else {
        throw new Error(subscription.error || 'Subscription creation failed');
      }

    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Card Information
          </label>
          <div className="border rounded-md p-3">
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

      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4" />
        <span>Your payment information is secure and encrypted</span>
      </div>

      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
          disabled={!stripe || isLoading}
        >
          {isLoading ? 'Processing...' : `Subscribe to ${plan.name}`}
        </Button>
      </div>
    </form>
  );
};

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  onSuccess
}) => {
  const [stripePromise, setStripePromise] = useState<Promise<any> | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | null>(null);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        // Initialize Stripe
        const stripe = await paymentProcessor.initializePaymentProvider();
        if (stripe) {
          setStripePromise(Promise.resolve(stripe));
          setPaymentProvider('stripe');
        }
      } catch (error) {
        console.error('Payment initialization failed:', error);
      }
    };

    if (isOpen) {
      initializePayment();
    }
  }, [isOpen]);

  const plan = getPlanById(selectedPlan);
  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            Subscribe to {plan.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Details */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                {plan.popular && (
                  <Badge variant="secondary" className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
              </div>
              <div className="text-3xl font-bold">
                {formatPrice(plan.price, plan.currency)}
                <span className="text-sm font-normal text-muted-foreground">
                  /{plan.interval === 'forever' ? 'forever' : plan.interval}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Separator />

          {/* Payment Form */}
          {paymentProvider === 'stripe' && stripePromise ? (
            <Elements stripe={stripePromise}>
              <CheckoutForm 
                selectedPlan={selectedPlan} 
                onSuccess={onSuccess} 
                onClose={onClose} 
              />
            </Elements>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading payment form...</p>
            </div>
          )}

          {selectedPlan !== 'free' && (
            <div className="text-xs text-center text-muted-foreground">
              <p>You can cancel your subscription at any time from your account settings.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
