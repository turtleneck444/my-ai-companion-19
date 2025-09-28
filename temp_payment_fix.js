// Read the current file
const fs = require('fs');
let content = fs.readFileSync('netlify/functions/payments.mjs', 'utf8');

// Add better error handling and logging for payment confirmation
const newPaymentLogic = `    const latestInvoice = subscription.latest_invoice;
    const paymentIntent = latestInvoice?.payment_intent;

    console.log('🔍 Payment Intent Details:', {
      paymentIntentId: paymentIntent?.id,
      paymentIntentStatus: paymentIntent?.status,
      subscriptionStatus: subscription.status,
      hasPaymentMethod: !!paymentMethodId
    });

    // Confirm the payment intent immediately
    if (paymentIntent && paymentIntent.status === 'requires_confirmation') {
      try {
        console.log('🔄 Confirming payment intent:', paymentIntent.id);
        const confirmedPaymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id, {
          payment_method: paymentMethodId
        });
        
        console.log('💳 Payment intent confirmation result:', {
          id: confirmedPaymentIntent.id,
          status: confirmedPaymentIntent.status,
          last_payment_error: confirmedPaymentIntent.last_payment_error
        });
        
        if (isPaymentSuccessful(confirmedPaymentIntent)) {
          console.log('✅ Payment confirmed and successful, activating user:', customer.id, planId);
          
          // Get the payment method details for storage
          const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
          
          await activateSupabaseUser(customer.id, planId, paymentMethod);
        } else {
          console.log('❌ Payment confirmation failed:', {
            paymentIntentStatus: confirmedPaymentIntent.status,
            subscriptionStatus: subscription.status,
            lastPaymentError: confirmedPaymentIntent.last_payment_error
          });
        }
      } catch (confirmError) {
        console.error('💥 Payment confirmation error:', {
          error: confirmError.message,
          type: confirmError.type,
          code: confirmError.code,
          decline_code: confirmError.decline_code
        });
      }
    } else if (paymentIntent && isPaymentSuccessful(paymentIntent)) {
      console.log('✅ Payment already successful, activating user:', customer.id, planId);
      
      // Get the payment method details for storage
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      
      await activateSupabaseUser(customer.id, planId, paymentMethod);
    } else {
      console.log('❌ Payment not successful, not activating user:', {
        paymentIntentStatus: paymentIntent?.status,
        subscriptionStatus: subscription.status,
        hasPaymentIntent: !!paymentIntent
      });
    }`;

// Replace the payment confirmation logic
content = content.replace(
  /const latestInvoice = subscription\.latest_invoice;[\s\S]*?console\.log\('❌ Payment not successful, not activating user:', \{[\s\S]*?\}\);/,
  newPaymentLogic
);

// Write back
fs.writeFileSync('netlify/functions/payments.mjs', content);
console.log('Added better payment confirmation logging and error handling');
