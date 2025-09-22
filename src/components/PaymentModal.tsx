import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CreditCard, 
  Lock, 
  Check, 
  Loader2, 
  AlertCircle,
  Shield,
  Crown,
  Star
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { SUBSCRIPTION_PLANS, formatPrice, paymentProcessor, isPaymentConfigured } from '@/lib/payments';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: string;
  onSuccess: (subscription: any) => void;
}

export const PaymentModal = ({ isOpen, onClose, selectedPlan, onSuccess }: PaymentModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
    email: user?.email || ''
  });
  const [billingAddress, setBillingAddress] = useState({
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'US'
  });

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === selectedPlan);

  useEffect(() => {
    if (user?.email) {
      setPaymentMethod(prev => ({ ...prev, email: user.email || '' }));
    }
  }, [user]);

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('payment.')) {
      const paymentField = field.replace('payment.', '');
      setPaymentMethod(prev => ({ ...prev, [paymentField]: value }));
    } else if (field.startsWith('billing.')) {
      const billingField = field.replace('billing.', '');
      setBillingAddress(prev => ({ ...prev, [billingField]: value }));
    }
  };

  const handlePayment = async () => {
    if (!plan) return;

    setIsLoading(true);

    try {
      // Validate payment method
      if (!paymentMethod.cardNumber || !paymentMethod.expiryDate || !paymentMethod.cvv || !paymentMethod.name) {
        throw new Error('Please fill in all payment details');
      }

      // Check if payment is configured
      if (!isPaymentConfigured()) {
        throw new Error('Payment processing is not configured. Please contact support.');
      }

      // Create payment intent
      const paymentIntent = await paymentProcessor.createPaymentIntent(plan.id, user?.id || '');
      
      // In a real implementation, you would integrate with your chosen payment provider here
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create subscription
      const subscription = await paymentProcessor.createSubscription(
        plan.id,
        user?.id || '',
        'pm_mock_payment_method'
      );

      toast({
        title: "Payment successful!",
        description: `Welcome to ${plan.name} plan!`,
      });

      onSuccess(subscription);
      onClose();
    } catch (error) {
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!plan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Complete Your Payment
          </DialogTitle>
          <DialogDescription>
            Secure payment processing powered by industry-leading providers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Plan Summary */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{plan.name} Plan</CardTitle>
                  <CardDescription>
                    {formatPrice(plan.price)} per {plan.interval}
                  </CardDescription>
                </div>
                {plan.popular && (
                  <Badge className="bg-gradient-to-r from-primary to-primary-glow">
                    <Crown className="w-3 h-3 mr-1" />
                    Popular
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <Check className="w-4 h-4 text-primary mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payment Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={paymentMethod.cardNumber}
                  onChange={(e) => handleInputChange('payment.cardNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/YY"
                  value={paymentMethod.expiryDate}
                  onChange={(e) => handleInputChange('payment.expiryDate', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  value={paymentMethod.cvv}
                  onChange={(e) => handleInputChange('payment.cvv', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Cardholder Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={paymentMethod.name}
                  onChange={(e) => handleInputChange('payment.name', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Billing Address</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="line1">Address Line 1</Label>
                <Input
                  id="line1"
                  placeholder="123 Main St"
                  value={billingAddress.line1}
                  onChange={(e) => handleInputChange('billing.line1', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="line2">Address Line 2</Label>
                <Input
                  id="line2"
                  placeholder="Apt 4B"
                  value={billingAddress.line2}
                  onChange={(e) => handleInputChange('billing.line2', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="New York"
                  value={billingAddress.city}
                  onChange={(e) => handleInputChange('billing.city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="NY"
                  value={billingAddress.state}
                  onChange={(e) => handleInputChange('billing.state', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code</Label>
                <Input
                  id="postalCode"
                  placeholder="10001"
                  value={billingAddress.postalCode}
                  onChange={(e) => handleInputChange('billing.postalCode', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={billingAddress.country}
                  onValueChange={(value) => handleInputChange('billing.country', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="JP">Japan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
            <Shield className="w-5 h-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Secure Payment Processing</p>
              <p className="text-muted-foreground">
                Your payment information is encrypted and processed securely. 
                We never store your card details on our servers.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Pay {formatPrice(plan.price)}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
