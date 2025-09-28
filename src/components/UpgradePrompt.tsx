import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X } from 'lucide-react';
import { useUpgrade } from '@/hooks/useUpgrade';
import { SUBSCRIPTION_PLANS } from '@/lib/payments';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  limitType?: 'message' | 'voice_call';
  currentPlan?: string;
}

export const UpgradePrompt = ({ 
  isOpen, 
  onClose, 
  limitType = 'message',
  currentPlan = 'free' 
}: UpgradePromptProps) => {
  const { handleUpgrade, isUpgrading } = useUpgrade();
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');

  if (!isOpen) return null;

  const suggestedPlans = SUBSCRIPTION_PLANS.filter(plan => 
    plan.id !== 'free' && plan.id !== currentPlan
  );

  const handleUpgradeClick = async () => {
    const success = await handleUpgrade({
      planId: selectedPlan,
      paymentMethodId: null, // Will be set by payment form
      customerEmail: 'user@example.com' // In real app, get from user context
    });
    
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Upgrade Your Plan</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="mb-4">
            <p className="text-gray-600 mb-2">
              You've reached your daily {limitType === 'message' ? 'message' : 'voice call'} limit.
            </p>
            <p className="text-sm text-gray-500">
              Choose a plan to continue enjoying unlimited conversations:
            </p>
          </div>

          <div className="space-y-3 mb-6">
            {suggestedPlans.map((plan) => (
              <div
                key={plan.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPlan === plan.id 
                    ? 'border-pink-500 bg-pink-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPlan(plan.id)}
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
                    selectedPlan === plan.id 
                      ? 'border-pink-500 bg-pink-500' 
                      : 'border-gray-300'
                  }`}>
                    {selectedPlan === plan.id && (
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
              onClick={handleUpgradeClick}
              disabled={isUpgrading}
              className="flex-1 bg-pink-500 hover:bg-pink-600"
            >
              {isUpgrading ? 'Processing...' : 'Upgrade Now'}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Maybe Later
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
