  const mountSquareCard = async () => {
    try {
      // Ensure Square is properly initialized
      const isInitialized = await paymentProcessor.ensureSquareInitialized();
      if (!isInitialized) {
        throw new Error('Square not properly configured');
      }
      
      const card = await paymentProcessor.createSquareCard();
      await card.attach('#square-card');
      setSquareCard(card);
      setSquareReady(true);
    } catch (e) {
      console.error('Square init error', e);
      toast({ 
        title: 'Payment Error', 
        description: e.message || 'Failed to load payment form. Please check your Square configuration.', 
        variant: 'destructive' 
      });
    }
  };
