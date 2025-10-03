import React from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickUpgradeButtonProps {
  plan?: string;
  className?: string;
  children?: React.ReactNode;
}

export const QuickUpgradeButton: React.FC<QuickUpgradeButtonProps> = ({
  plan = 'premium',
  className = '',
  children
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate(`/auth?plan=${plan}`);
  };

  return (
    <Button
      onClick={handleUpgrade}
      className={`bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white ${className}`}
    >
      {children || (
        <>
          <Crown className="w-4 h-4 mr-2" />
          Upgrade to {plan === 'premium' ? 'Premium' : 'Pro'}
        </>
      )}
    </Button>
  );
};
