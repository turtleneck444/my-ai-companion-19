# Payment Provider Setup Guide

This guide will help you configure payment processing for your AI Companion platform. The system supports multiple payment providers with easy configuration.

## Supported Payment Providers

- **Stripe** (Recommended)
- **Square**
- **PayPal**
- **Razorpay**

## Quick Setup

### 1. Choose Your Payment Provider

Select one of the supported providers and create an account:

- **Stripe**: https://stripe.com
- **Square**: https://squareup.com
- **PayPal**: https://developer.paypal.com
- **Razorpay**: https://razorpay.com

### 2. Configure Environment Variables

Copy the `.env.example` file to `.env` and fill in your payment provider credentials:

```bash
cp .env.example .env
```

#### For Stripe:
```env
VITE_PAYMENT_PROVIDER=stripe
VITE_PAYMENT_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
VITE_PAYMENT_SECRET_KEY=sk_test_your_stripe_secret_key_here
VITE_PAYMENT_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here
VITE_PAYMENT_ENVIRONMENT=test
```

#### For Square:
```env
VITE_PAYMENT_PROVIDER=square
VITE_PAYMENT_PUBLISHABLE_KEY=your_square_application_id_here
VITE_PAYMENT_SECRET_KEY=your_square_access_token_here
VITE_PAYMENT_WEBHOOK_SECRET=your_square_webhook_secret_here
VITE_PAYMENT_ENVIRONMENT=sandbox
```

#### For PayPal:
```env
VITE_PAYMENT_PROVIDER=paypal
VITE_PAYMENT_PUBLISHABLE_KEY=your_paypal_client_id_here
VITE_PAYMENT_SECRET_KEY=your_paypal_client_secret_here
VITE_PAYMENT_WEBHOOK_SECRET=your_paypal_webhook_secret_here
VITE_PAYMENT_ENVIRONMENT=sandbox
```

#### For Razorpay:
```env
VITE_PAYMENT_PROVIDER=razorpay
VITE_PAYMENT_PUBLISHABLE_KEY=your_razorpay_key_id_here
VITE_PAYMENT_SECRET_KEY=your_razorpay_key_secret_here
VITE_PAYMENT_WEBHOOK_SECRET=your_razorpay_webhook_secret_here
VITE_PAYMENT_ENVIRONMENT=test
```

### 3. Configure Netlify Environment Variables

If deploying to Netlify, add the same environment variables in your Netlify dashboard:

1. Go to Site Settings > Environment Variables
2. Add each variable with the same names (without VITE_ prefix for server-side)
3. Set the values for your chosen payment provider

### 4. Set Up Webhooks

Configure webhooks in your payment provider dashboard to handle events:

#### Stripe Webhook URL:
```
https://your-domain.netlify.app/.netlify/functions/payments/webhook
```

#### Square Webhook URL:
```
https://your-domain.netlify.app/.netlify/functions/payments/webhook
```

#### PayPal Webhook URL:
```
https://your-domain.netlify.app/.netlify/functions/payments/webhook
```

#### Razorpay Webhook URL:
```
https://your-domain.netlify.app/.netlify/functions/payments/webhook
```

### 5. Test Your Integration

1. Start your development server: `npm run dev`
2. Navigate to the pricing page: `http://localhost:3000/pricing`
3. Select a paid plan and test the payment flow
4. Check your payment provider dashboard for test transactions

## Payment Flow

The payment system works as follows:

1. **User selects a plan** on the pricing page
2. **Payment modal opens** with secure form
3. **Payment intent created** via API
4. **Payment processed** through chosen provider
5. **Subscription created** and user redirected to app
6. **Webhook events** handled for subscription management

## Security Features

- **PCI Compliance**: Payment forms are secure and PCI compliant
- **Encryption**: All payment data is encrypted in transit
- **Tokenization**: Card details are tokenized, never stored
- **Webhook Verification**: All webhooks are verified for authenticity

## Customization

### Modify Pricing Plans

Edit `src/lib/payments.ts` to customize:
- Plan names and prices
- Features included in each plan
- Billing intervals
- Currency settings

### Customize Payment UI

Edit `src/components/PaymentModal.tsx` to:
- Change form fields
- Modify styling
- Add custom validation
- Integrate additional payment methods

### Add New Payment Providers

1. Add provider configuration to `src/lib/payments.ts`
2. Implement provider-specific logic in `api/payments.js`
3. Update `netlify/functions/payments.mjs`
4. Add environment variables to `.env.example`

## Troubleshooting

### Common Issues

1. **Payment not processing**: Check environment variables are set correctly
2. **Webhook errors**: Verify webhook URL and secret in provider dashboard
3. **CORS errors**: Ensure API endpoints have proper CORS headers
4. **Test mode**: Make sure you're using test/sandbox credentials

### Debug Mode

Enable debug logging by setting:
```env
VITE_DEBUG_PAYMENTS=true
```

## Support

For payment-related issues:
1. Check your payment provider's documentation
2. Review the console logs for errors
3. Test with your provider's test cards
4. Contact support with specific error messages

## Production Checklist

Before going live:
- [ ] Switch to live/production credentials
- [ ] Test all payment flows thoroughly
- [ ] Set up proper webhook endpoints
- [ ] Configure proper error handling
- [ ] Set up monitoring and alerts
- [ ] Review security settings
- [ ] Test refund and cancellation flows
