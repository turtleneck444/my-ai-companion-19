# 🔄 Supabase Migration Guide

Follow these steps to migrate your LoveAI app to a new Supabase project.

## Step 1: Create New Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. **Sign up with a new email** (e.g., `hunainqureshicardinal@gmail.com`)
3. Click "New Project"
4. Fill in project details:
   - **Name**: LoveAI-New
   - **Database Password**: (create a strong password - save it!)
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. **Wait for project to be ready** (2-3 minutes)

## Step 2: Set Up Database Schema

1. In your new Supabase dashboard, go to **SQL Editor**
2. Copy the entire contents of `setup-new-supabase.sql`
3. Paste it into the SQL Editor
4. Click **"Run"** to create all tables and functions

## Step 3: Get New Credentials

1. Go to **Settings** → **API**
2. Copy these values:
   - **URL**: `https://your-new-project.supabase.co`
   - **anon public key**: `eyJhbGci...` (the long key)

## Step 4: Update Your App Configuration

1. Update your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-new-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-new-anon-key-here
   ```

2. Restart your development server:
   ```bash
   npm run dev
   ```

## Step 5: Test Your App

1. Go to your app: http://localhost:5175
2. Try creating a new account
3. Test the signup → payment flow
4. Verify everything works

## Step 6: Restore Any Existing Data (If Needed)

If you had any data in your old database:

1. Update `supabase-backup/restore-to-new-supabase.js`:
   - Replace `YOUR_NEW_SUPABASE_URL_HERE` with your new URL
   - Replace `YOUR_NEW_SUPABASE_ANON_KEY_HERE` with your new anon key

2. Run the restore script:
   ```bash
   node supabase-backup/restore-to-new-supabase.js
   ```

## Step 7: Update Environment Variables

For production deployment, update these in:

### Netlify:
- Go to your Netlify dashboard
- Site Settings → Environment Variables
- Update `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### Vercel:
- Go to your Vercel dashboard
- Project Settings → Environment Variables
- Update the Supabase variables

## ✅ Success Checklist

- [ ] New Supabase project created
- [ ] Database schema set up
- [ ] New credentials added to `.env`
- [ ] App works locally
- [ ] Signup/payment flow tested
- [ ] Production environment updated

## 🆘 If You Need Help

- **Supabase Support**: support@supabase.io
- **Your project is working**: Your app should function normally with the new database
- **No data loss**: Any important data can be migrated using the backup/restore scripts

---

**Your app is now running on a fresh Supabase project!** 🎉 