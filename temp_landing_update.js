// Update the handleEmailSubmit function in LandingPage.tsx
const handleEmailSubmit = async (e: React.FormEvent) => {
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
      toast({
        title: "Welcome to LoveAI! 💕",
        description: "Thank you for subscribing! You'll receive updates about our launch.",
      });
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
