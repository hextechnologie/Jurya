# Social Login Setup Guide

Your app now supports Google, Facebook, and GitHub login! But you need to enable these OAuth providers in your Supabase project.

## Quick Setup Steps

### 1. Access Supabase Authentication Settings

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Authentication** in the left sidebar
4. Click **Providers** tab

---

## Provider Setup

### 🔵 Google OAuth

**In Google Cloud Console:**

1. Go to https://console.cloud.google.com/
2. Create a new project or select existing
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. Application type: **Web application**
7. Add authorized redirect URIs:
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
   ```
   Get your project ref from Supabase settings URL
8. Copy the **Client ID** and **Client Secret**

**In Supabase:**

1. Go to Authentication → Providers → Google
2. Enable Google provider
3. Paste Client ID and Client Secret
4. Save

---

### ⚫ GitHub OAuth

**In GitHub:**

1. Go to https://github.com/settings/developers
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: Interview Coach
   - **Homepage URL**: `https://interview-coach-tau.vercel.app`
   - **Authorization callback URL**: 
     ```
     https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Copy **Client ID**
6. Generate a **Client Secret** and copy it

**In Supabase:**

1. Go to Authentication → Providers → GitHub
2. Enable GitHub provider
3. Paste Client ID and Client Secret
4. Save

---

### 🔵 Facebook OAuth

**In Facebook Developers:**

1. Go to https://developers.facebook.com/apps
2. Click **Create App**
3. Choose app type: **Consumer**
4. Add a product: **Facebook Login**
5. In Facebook Login settings:
   - Valid OAuth Redirect URIs:
     ```
     https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
     ```
6. Go to **Settings** → **Basic**
7. Copy **App ID** and **App Secret**

**In Supabase:**

1. Go to Authentication → Providers → Facebook
2. Enable Facebook provider
3. Paste App ID as Client ID
4. Paste App Secret as Client Secret
5. Save

---

## Testing

After setup:

1. Deploy your changes (already done with the commit)
2. Go to https://interview-coach-tau.vercel.app/login
3. Click any of the social login buttons
4. It should redirect to the OAuth provider
5. After authentication, return to your dashboard

---

## Important Notes

⚠️ **Site URL Configuration**

In Supabase Authentication settings:
- Set **Site URL**: `https://interview-coach-tau.vercel.app`
- Add **Redirect URLs**:
  - `https://interview-coach-tau.vercel.app/**`
  - `http://localhost:3000/**` (for local development)

⚠️ **Email from OAuth**

When users sign in with OAuth:
- Their profile will be created automatically
- Email comes from their OAuth account
- `full_name` will be populated from OAuth data

⚠️ **Local Development**

For local testing:
- Use `http://localhost:3000/dashboard` as redirect URL
- Make sure to add localhost to allowed redirect URLs in Supabase

---

## Quick Enable (Minimal Setup)

If you just want to test quickly:

### Google (Easiest)
- **Enable in Supabase without credentials** (some Supabase projects have Google enabled by default)
- Or use the full setup above

### GitHub (Second Easiest)
- Takes 2 minutes
- No verification required
- Works immediately

### Facebook (Most Complex)
- Requires app review for production
- Can test in Development mode with test users
- Consider enabling only Google + GitHub first

---

## Need Help?

Common issues:
- **"Invalid callback URL"** - Check your Supabase project ref in redirect URI
- **"Not authorized"** - Make sure OAuth app is not in restricted mode
- **"Invalid credentials"** - Double-check Client ID/Secret copy-paste

Your code is ready! Just need to enable the providers in Supabase. 🚀
