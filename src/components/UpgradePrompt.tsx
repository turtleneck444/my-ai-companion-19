import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Zap, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  type: 'message' | 'voice' | 'general';
  currentPlan?: string;
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  type,
  currentPlan = 'free',
  className = ''
}) => {
  const navigate = useNavigate();

  const getPromptContent = () => {
    switch (type) {
      case 'message':
        return {
          title: 'Message Limit Reached',
          description: 'You\'ve used all your daily messages. Upgrade to continue chatting!',
          icon: <Zap className="w-6 h-6" />,
          color: 'from-blue-500 to-cyan-600'
        };
      case 'voice':
        return {
          title: 'Voice Call Limit Reached',
          description: 'You\'ve used all your daily voice calls. Upgrade for more!',
          icon: <Crown className="w-6 h-6" />,
          color: 'from-purple-500 to-pink-600'
        };
      default:
        return {
          title: 'Upgrade Your Plan',
          description: 'Unlock more features and higher limits!',
          icon: <Star className="w-6 h-6" />,
          color: 'from-pink-500 to-purple-600'
        };
    }
  };

  const content = getPromptContent();

  const handleUpgrade = (plan: string) => {
    navigate(`/auth?plan=${plan}`);
  };

  return (
    <Card className={`border-2 border-dashed border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50 ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${content.color} flex items-center justify-center mx-auto mb-4`}>
          {content.icon}
        </div>
        <CardTitle className="text-xl text-gray-900">{content.title}</CardTitle>
        <CardDescription className="text-gray-600">
          {content.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="text-center space-y-4">
        <div className="space-y-3">
          <Button
            onClick={() => handleUpgrade('premium')}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            <Star className="w-4 h-4 mr-2" />
            Upgrade to Premium ($19/month)
          </Button>
          
          <Button
            onClick={() => handleUpgrade('pro')}
            variant="outline"
            className="w-full border-2 border-pink-400 text-pink-600 hover:bg-pink-50"
          >
            <Crown className="w-4 h-4 mr-2" />
            Go Pro ($49/month)
          </Button>
        </div>
        
        <p className="text-xs text-gray-500">
          All plans include our core features and can be cancelled anytime.
        </p>
      </CardContent>
    </Card>
  );
};
