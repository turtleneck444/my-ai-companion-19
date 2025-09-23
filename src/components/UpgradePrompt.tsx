import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Crown, 
  Lock, 
  MessageSquare, 
  Phone, 
  ArrowRight,
  X,
  Zap,
  Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SUBSCRIPTION_PLANS, formatPrice } from '@/lib/payments';

interface UpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  limitType: 'messages' | 'voiceCalls';
  currentPlan: string;
  remaining: number;
}

export const UpgradePrompt = ({ 
  isOpen, 
  onClose, 
  limitType, 
  currentPlan, 
  remaining 
}: UpgradePromptProps) => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<string>('premium');

  const handleUpgrade = () => {
    navigate('/pricing');
    onClose();
  };

  const getLimitMessage = () => {
    if (limitType === 'messages') {
      return `You've used all ${currentPlan === 'free' ? '5' : '50'} daily messages. Upgrade to continue chatting!`;
    } else {
      return `You've used all ${currentPlan === 'premium' ? '5' : '0'} daily voice calls. Upgrade to make more calls!`;
    }
  };

  const getFeatureHighlight = () => {
    if (limitType === 'messages') {
      return {
        icon: <MessageSquare className="w-6 h-6" />,
        title: "Unlimited Messages",
        description: "Chat as much as you want with your AI companions"
      };
    } else {
      return {
        icon: <Phone className="w-6 h-6" />,
        title: "Voice Calls",
        description: "Have natural voice conversations with your AI companions"
      };
    }
  };

  const feature = getFeatureHighlight();
  const premiumPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'premium');
  const proPlan = SUBSCRIPTION_PLANS.find(p => p.id === 'pro');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="text-center pb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-2">
              <Crown className="w-6 h-6 text-primary" />
              <CardTitle className="text-2xl">Upgrade Required</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          <CardDescription className="text-lg">
            {getLimitMessage()}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Feature Highlight */}
          <div className="text-center p-6 bg-gradient-to-r from-primary/10 to-accent/10 rounded-lg">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>

          {/* Plan Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Premium Plan */}
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                selectedPlan === 'premium' 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedPlan('premium')}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Premium</CardTitle>
                  <Badge className="bg-primary/10 text-primary">Popular</Badge>
                </div>
                <div className="text-3xl font-bold">
                  {formatPrice(premiumPlan?.price || 19)}
                  <span className="text-sm text-muted-foreground font-normal">/month</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <MessageSquare className="w-4 h-4 text-primary mr-2" />
                    50 messages/day
                  </li>
                  <li className="flex items-center">
                    <Phone className="w-4 h-4 text-primary mr-2" />
                    5 voice calls/day
                  </li>
                  <li className="flex items-center">
                    <Star className="w-4 h-4 text-primary mr-2" />
                    3 AI Companions
                  </li>
                  <li className="flex items-center">
                    <Zap className="w-4 h-4 text-primary mr-2" />
                    Custom personalities
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card 
              className={`cursor-pointer transition-all duration-200 ${
                selectedPlan === 'pro' 
                  ? 'ring-2 ring-primary shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedPlan('pro')}
            >
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Pro</CardTitle>
                </div>
                <div className="text-3xl font-bold">
                  {formatPrice(proPlan?.price || 49)}
                  <span className="text-sm text-muted-foreground font-normal">/month</span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <MessageSquare className="w-4 h-4 text-primary mr-2" />
                    Unlimited messages
                  </li>
                  <li className="flex items-center">
                    <Phone className="w-4 h-4 text-primary mr-2" />
                    Unlimited voice calls
                  </li>
                  <li className="flex items-center">
                    <Star className="w-4 h-4 text-primary mr-2" />
                    Unlimited companions
                  </li>
                  <li className="flex items-center">
                    <Zap className="w-4 h-4 text-primary mr-2" />
                    Premium voice options
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Current Usage Stats */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <h4 className="font-semibold mb-2">Your Current Usage</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Plan:</span>
                <span className="ml-2 font-medium capitalize">{currentPlan}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Remaining:</span>
                <span className="ml-2 font-medium">
                  {remaining === -1 ? 'Unlimited' : `${remaining} ${limitType === 'messages' ? 'messages' : 'calls'}`}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Maybe Later
            </Button>
            <Button
              onClick={handleUpgrade}
              className="flex-1 bg-gradient-to-r from-primary to-primary-glow"
            >
              Upgrade Now
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
