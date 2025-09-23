# 🔐 Supabase Authentication Setup Guide

## Quick Setup for LoveAI Platform

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/Sign in to your account
3. Click "New Project"
4. Choose your organization
5. Fill in project details:
   - **Name**: LoveAI
   - **Database Password**: (create a strong password)
   - **Region**: Choose closest to your users
6. Click "Create new project"

### 2. Get Your Configuration Keys

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **URL**: `https://your-project-ref.supabase.co`
   - **anon public**: `eyJhbGci...` (long key starting with eyJ)

### 3. Configure Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Database Setup

The app will work immediately with Supabase's built-in auth tables. Optionally, you can create additional tables for user profiles:

```sql
-- Create user profiles table
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  preferred_name TEXT,
  treatment_style TEXT DEFAULT 'romantic',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to see and edit their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```

### 5. Email Configuration (Optional)

For production email verification:

1. Go to **Authentication** > **Settings**
2. Configure your email provider (SMTP)
3. Customize email templates
4. Set your site URL

### 6. Authentication Providers (Optional)

Enable social logins:

1. Go to **Authentication** > **Providers**
2. Enable desired providers (Google, GitHub, etc.)
3. Configure OAuth credentials

### 7. Testing Your Setup

1. Start your development server: `npm run dev`
2. Navigate to the signup page
3. Try creating an account
4. Check your Supabase dashboard > **Authentication** > **Users**

### 8. Troubleshooting

#### Common Issues:

**"Supabase not configured" error:**
- Check your `.env` file exists and has correct values
- Restart your development server after adding environment variables
- Ensure environment variables start with `VITE_`

**Signup fails silently:**
- Check browser console for errors
- Verify Supabase URL is correct (should include `https://`)
- Ensure anon key is the full key (starts with `eyJ`)

**Email confirmation not working:**
- Configure email settings in Supabase dashboard
- Check spam folder
- For development, disable email confirmation in Supabase settings

#### Demo Mode:

If Supabase is not configured, the app automatically falls back to demo mode:
- Users are stored in localStorage
- All features work locally
- No real authentication/database

### 9. Production Deployment

For production:

1. Set environment variables in your hosting platform
2. Configure custom domain in Supabase settings
3. Set up proper email configuration
4. Enable email verification
5. Configure rate limiting and security policies

### 10. Security Best Practices

- Never commit `.env` files to version control
- Use strong database passwords
- Enable email verification in production
- Set up proper RLS policies
- Monitor authentication logs
- Configure CORS settings appropriately

---

## Support

If you need help with Supabase setup:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)
- Check the browser console for detailed error messages

Your LoveAI platform will work both with and without Supabase configuration, making it flexible for development and testing! 