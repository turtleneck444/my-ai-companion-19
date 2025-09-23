# 🔐 Square Payment Integration Guide

This guide will help you securely integrate your Square production credentials into the LoveAI platform.

## 📋 Prerequisites

✅ You have received from Square:
- Production Application ID
- Production Access Token
- Square Developer Account Access

## 🔒 Step 1: Create Local Environment File

1. **Create a `.env` file** in your project root (same level as package.json)

2. **Add the following configuration** to your `.env` file:

```env
# ===================================
# SQUARE PAYMENT CONFIGURATION
# ===================================

# Square Payment Provider Configuration
VITE_PAYMENT_PROVIDER=square
VITE_PAYMENT_ENVIRONMENT=production

# Square Application ID (from Square Developer Dashboard)
VITE_PAYMENT_PUBLISHABLE_KEY=YOUR_SQUARE_APPLICATION_ID_HERE

# Square Access Token (from Square Developer Dashboard) 
VITE_PAYMENT_SECRET_KEY=YOUR_SQUARE_ACCESS_TOKEN_HERE

# Square Webhook Secret (generate this in Square Dashboard)
VITE_PAYMENT_WEBHOOK_SECRET=YOUR_SQUARE_WEBHOOK_SECRET_HERE

# ===================================
# SERVER-SIDE ENVIRONMENT VARIABLES
# (For Netlify Functions - NO VITE_ PREFIX)
# ===================================
SQUARE_APPLICATION_ID=YOUR_SQUARE_APPLICATION_ID_HERE
SQUARE_ACCESS_TOKEN=YOUR_SQUARE_ACCESS_TOKEN_HERE
SQUARE_ENVIRONMENT=production
SQUARE_WEBHOOK_SECRET=YOUR_SQUARE_WEBHOOK_SECRET_HERE
```

3. **Replace the placeholder values** with your actual Square credentials:
   - Replace `YOUR_SQUARE_APPLICATION_ID_HERE` with your production Application ID
   - Replace `YOUR_SQUARE_ACCESS_TOKEN_HERE` with your production Access Token

## 🌐 Step 2: Configure Netlify Environment Variables

Since your app is deployed on Netlify, you need to add these variables to your Netlify dashboard:

### Netlify Dashboard Steps:
1. Go to [netlify.com](https://netlify.com) and open your site dashboard
2. Navigate to **Site Settings** → **Environment Variables**
3. Click **Add Variable** for each of the following:

```env
VITE_PAYMENT_PROVIDER = square
VITE_PAYMENT_ENVIRONMENT = production
VITE_PAYMENT_PUBLISHABLE_KEY = [Your Square Application ID]
VITE_PAYMENT_SECRET_KEY = [Your Square Access Token]
SQUARE_APPLICATION_ID = [Your Square Application ID]
SQUARE_ACCESS_TOKEN = [Your Square Access Token]
SQUARE_ENVIRONMENT = production
```

⚠️ **Important**: Use the **exact same values** for both VITE_ and non-VITE_ versions

## 🔗 Step 3: Set Up Square Webhooks

1. **Go to Square Developer Dashboard**:
   - Visit: https://developer.squareup.com/apps
   - Select your production application

2. **Configure Webhook Endpoint**:
   - Navigate to **Webhooks** section
   - Add webhook URL: `https://www.loveaicompanion.com/.netlify/functions/payments`
   - Subscribe to these events:
     - `payment.created`
     - `payment.updated`
     - `invoice.payment_made`
     - `subscription.created`
     - `subscription.updated`
     - `subscription.canceled`

3. **Generate Webhook Secret**:
   - Square will provide a webhook signature key
   - Add this to both `.env` and Netlify as `SQUARE_WEBHOOK_SECRET`

## 🧪 Step 4: Test Integration

After setting up the environment variables:

1. **Test Locally**:
   ```bash
   npm run dev
   ```
   - Navigate to a pricing page
   - Try to upgrade a plan
   - Check browser console for any payment errors

2. **Test on Production**:
   - Deploy your changes to Netlify
   - Test payment flow on your live site
   - Monitor Netlify function logs for any issues

## 🛡️ Security Best Practices

### ✅ DO:
- Keep your Square Access Token secret and secure
- Use environment variables for all sensitive data
- Enable webhook signature verification
- Monitor payment transactions regularly
- Use HTTPS for all payment pages

### ❌ DON'T:
- Never commit credentials to Git
- Don't share access tokens in public channels
- Don't use production credentials for testing
- Don't disable SSL/TLS verification

## 🔍 Verification Checklist

- [ ] Square credentials added to local `.env` file
- [ ] Environment variables configured in Netlify dashboard
- [ ] Webhook endpoint configured in Square dashboard
- [ ] Webhook secret added to environment variables
- [ ] Local testing successful
- [ ] Production deployment successful
- [ ] Payment flow working end-to-end
- [ ] Webhook events being received

## 📞 Support

If you encounter issues:

1. **Check Netlify Function Logs**: 
   - Go to Netlify Dashboard → Functions → View logs

2. **Check Square Developer Logs**:
   - Monitor webhook delivery in Square dashboard

3. **Common Issues**:
   - **Environment variables not loading**: Redeploy after adding variables
   - **CORS errors**: Check if domain is whitelisted in Square settings
   - **Webhook failures**: Verify endpoint URL and signature validation

## 🚀 Next Steps

Once Square is configured:
1. Update your profile tab payment methods section
2. Test subscription upgrades
3. Monitor payment success rates
4. Set up payment analytics

---

**Need Help?** The payment system will automatically switch to Square once environment variables are configured correctly. 