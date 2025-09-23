# 🤖 OpenAI API Setup Guide

## Critical: AI Personalities Require OpenAI API Key

Your AI companions are currently using fallback responses because the **OpenAI API key is not configured**. Here's how to fix it:

## 🔑 Required Environment Variables

Add these to your **Netlify environment variables** (for production) and your local `.env` file:

### OpenAI Configuration
```bash
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini
```

## 🚀 Setup Steps

### 1. Get OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the API key (starts with `sk-`)

### 2. Add to Netlify (Production)
1. Go to your Netlify dashboard
2. Select your site
3. Go to Site settings → Environment variables
4. Add:
   - `OPENAI_API_KEY` = `sk-your-actual-key-here`
   - `OPENAI_MODEL` = `gpt-4o-mini`

### 3. Add to Local Environment
Create or update your `.env` file:
```bash
# OpenAI Configuration (Required for AI Personalities)
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4o-mini

# Your existing variables...
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 🔍 Verify Setup

1. **Local Development**: Check browser console for:
   ```
   🔧 PersonalityAI initialized with endpoint: /api/openai-chat
   🔌 API Available: true
   ✅ AI Response generated: [actual AI response]
   ```

2. **Production**: Should see real AI responses instead of generic fallbacks

## 💰 OpenAI Pricing

- **GPT-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **Typical conversation**: ~$0.001-0.01 per message
- **Monthly budget**: $5-20 should handle hundreds of conversations

## 🛠️ Debugging

If still seeing fallback responses:

1. **Check Netlify Function Logs**:
   - Go to Netlify Dashboard → Functions → View logs
   - Look for errors in `openai-chat` function

2. **Check Browser Console**:
   - Should see debug logs starting with 🤖, 🔌, ✅
   - If seeing ❌ errors, API key might be invalid

3. **Test API Key**:
   ```bash
   curl https://api.openai.com/v1/models \
   -H "Authorization: Bearer YOUR_API_KEY"
   ```

## 🔧 Current Status

Without the OpenAI API key, your AI companions are using:
- ❌ Generic fallback responses
- ❌ No personality-specific behavior  
- ❌ No memory or context awareness

With the OpenAI API key configured:
- ✅ Real AI-powered responses
- ✅ Personality-driven conversations
- ✅ Memory and relationship building
- ✅ Contextual awareness

## 🆘 Need Help?

If you need help setting this up, the debug logs in the browser console will show exactly what's happening with the API calls. 