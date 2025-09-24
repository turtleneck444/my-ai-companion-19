import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { emailService } from '@/lib/email-service';
import { Mail, Check, Loader2 } from 'lucide-react';

interface EmailCollectionProps {
  placeholder?: string;
  buttonText?: string;
  className?: string;
  onSuccess?: (email: string) => void;
}

export const EmailCollection = ({ 
  placeholder = "Enter your email", 
  buttonText = "Get Updates",
  className = "",
  onSuccess
}: EmailCollectionProps) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !emailService.validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive"
      });
      return;
    }

    if (emailService.isEmailSubscribed(email)) {
      toast({
        title: "Already Subscribed",
        description: "This email is already subscribed to our newsletter.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await emailService.subscribeEmail(email, 'landing');
      
      if (success) {
        emailService.markEmailSubscribed(email);
        setIsSuccess(true);
        toast({
          title: "Welcome to LoveAI! 💕",
          description: "Thank you for subscribing! You'll receive updates about our launch.",
        });
        onSuccess?.(email);
        setEmail('');
      } else {
        throw new Error('Subscription failed');
      }
    } catch (error) {
      console.error('Email subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: "Something went wrong. Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`flex items-center justify-center space-x-2 text-green-600 ${className}`}>
        <Check className="h-5 w-5" />
        <span className="font-medium">Thank you for subscribing!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`flex space-x-2 ${className}`}>
      <div className="flex-1 relative">
        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="email"
          placeholder={placeholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="pl-10"
          required
        />
      </div>
      <Button 
        type="submit" 
        disabled={isSubmitting || !email}
        className="px-6"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Subscribing...
          </>
        ) : (
          buttonText
        )}
      </Button>
    </form>
  );
};
