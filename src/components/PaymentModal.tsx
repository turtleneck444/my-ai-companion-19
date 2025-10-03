import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  plan
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const planData = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS] || SUBSCRIPTION_PLANS.free;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (plan === 'free') {
      // Handle free plan
      setLoading(true);
      try {
        const response = await fetch('/.netlify/functions/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            method: 'createPaymentIntent',
            plan: 'free'
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to activate free plan');
        }

        const data = await response.json();
        
        if (data.success) {
          setSuccess(true);
          setTimeout(() => {
            onSuccess('free');
            onClose();
          }, 2000);
        } else {
          throw new Error(data.error || 'Failed to activate plan');
        }
      } catch (err) {
        console.error('Payment error:', err);
        setError(err instanceof Error ? err.message : 'Payment failed');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Handle paid plans
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name) {
      setError('Please fill in all card details');
      return;
    }

    setLoading(true);
    setError(null);

    try {
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

      if (!response.ok) {
        throw new Error('Payment processing failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setSuccess(true);
        toast({
          title: "Payment Successful!",
          description: `Welcome to ${planData.name}!`,
        });
        
        setTimeout(() => {
          onSuccess(plan);
          onClose();
        }, 2000);
      } else {
        throw new Error(data.error || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCardDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(false);
      setCardDetails({
        number: '',
        expiry: '',
        cvc: '',
        name: ''
      });
    }
  }, [isOpen]);

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h3>
            <p className="text-muted-foreground mb-4">
              Welcome to {planData.name}! Your plan has been activated.
            </p>
            <div className="animate-spin">
              <Loader2 className="w-6 h-6 mx-auto" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {plan === 'free' ? 'Activate Free Plan' : 'Complete Payment'}
          </DialogTitle>
          <DialogDescription>
            {plan === 'free' 
              ? 'Activate your free plan to get started'
              : 'Enter your payment details to upgrade to ' + planData.name
            }
          </DialogDescription>
        </DialogHeader>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{planData.name}</CardTitle>
            <CardDescription>{planData.price}</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <ul className="space-y-2 text-sm">
              {planData.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {plan !== 'free' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardName">Cardholder Name</Label>
              <Input
                id="cardName"
                value={cardDetails.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardNumber">Card Number</Label>
              <Input
                id="cardNumber"
                value={cardDetails.number}
                onChange={(e) => handleInputChange('number', formatCardNumber(e.target.value))}
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  value={cardDetails.expiry}
                  onChange={(e) => handleInputChange('expiry', formatExpiry(e.target.value))}
                  placeholder="MM/YY"
                  maxLength={5}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvc">CVC</Label>
                <Input
                  id="cvc"
                  value={cardDetails.cvc}
                  onChange={(e) => handleInputChange('cvc', e.target.value.replace(/\D/g, ''))}
                  placeholder="123"
                  maxLength={4}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-pink-400 hover:bg-pink-500 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  `Pay ${planData.price}`
                )}
              </Button>
            </div>
          </form>
        )}

        {plan === 'free' && (
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 bg-pink-400 hover:bg-pink-500 text-white"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Activating...
                </>
              ) : (
                'Activate Free Plan'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
