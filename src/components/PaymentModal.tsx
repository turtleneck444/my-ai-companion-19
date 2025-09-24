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

    if (selectedPlan === 'free') {
      // Handle free plan
      onSuccess({ planId: 'free', status: 'active' });
      onClose();
      return;
    }

    setIsLoading(true);

    try {
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

      // Create subscription
      const subscription = await paymentProcessor.createSubscription(
        selectedPlan,
        paymentMethod.id
      );

      // Confirm payment
      if (subscription.clientSecret) {
        const { error: confirmError } = await stripe.confirmCardPayment(
          subscription.clientSecret
        );

        if (confirmError) {
          throw new Error(confirmError.message);
        }
      }

      toast({
        title: "Payment Successful!",
        description: `Welcome to ${plan.name} plan! Your subscription is now active.`,
      });

      onSuccess(subscription);
      onClose();

    } catch (error: any) {
      console.error('Payment failed:', error);
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
        <div className="text-center">
          <h3 className="text-2xl font-bold">{plan.name} Plan</h3>
          <p className="text-3xl font-bold text-primary">
            {formatPrice(plan.price, plan.currency)}
            <span className="text-lg font-normal text-muted-foreground">/{plan.interval}</span>
          </p>
        </div>

        <div className="space-y-2">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {selectedPlan !== 'free' && (
        <div className="space-y-4">
          <Separator />
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Information</label>
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
          </div>

          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Your payment information is secure and encrypted</span>
          </div>
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isLoading || (selectedPlan !== 'free' && !clientSecret)}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Zap className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : selectedPlan === 'free' ? (
          'Get Started Free'
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Subscribe to {plan.name}
          </>
        )}
      </Button>
    </form>
  );
};

export const PaymentModal = ({ isOpen, onClose, selectedPlan, onSuccess }: PaymentModalProps) => {
  const [stripePromise, setStripePromise] = useState<any>(null);

  useEffect(() => {
    if (paymentProcessor.isConfigured()) {
      setStripePromise(loadStripe(paymentProcessor.getStripe()?.publishableKey || ''));
    }
  }, []);

  const plan = getPlanById(selectedPlan);
  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            {selectedPlan === 'free' ? 'Get Started' : 'Complete Your Subscription'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {selectedPlan === 'free' ? (
            <CheckoutForm 
              selectedPlan={selectedPlan} 
              onSuccess={onSuccess} 
              onClose={onClose} 
            />
          ) : stripePromise ? (
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
