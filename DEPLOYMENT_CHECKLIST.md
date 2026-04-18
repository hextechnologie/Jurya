# 📋 Deployment Checklist

Use this checklist to track your deployment progress!

## ✅ Pre-Deployment (Already Done!)

- [x] Created all application files
- [x] Installed dependencies (161 packages)
- [x] Fixed security vulnerabilities (Next.js 14.2.35)
- [x] Verified TypeScript (0 errors)
- [x] Initialized Git repository
- [x] Created initial commit (39 files)
- [x] Created Vercel configuration
- [x] Created comprehensive documentation

## 🚀 Step 1: Push to GitHub

- [ ] Created GitHub repository (https://github.com/new)
  - Repository name: `interview-coach`
  - Visibility: Public or Private
  - **DO NOT** initialize with README
  
- [ ] Pushed code to GitHub
  ```powershell
  # Run the automated script:
  powershell -ExecutionPolicy Bypass -File .\deploy.ps1
  
  # OR manually:
  git remote add origin https://github.com/YOUR_USERNAME/interview-coach.git
  git branch -M main
  git push -u origin main
  ```

- [ ] Verified repository on GitHub (all files visible)

**Your Repo**: https://github.com/____________/interview-coach

## 🗄️ Step 2A: Supabase Setup

- [ ] Created Supabase account (https://supabase.com)
- [ ] Created new project
  - Project name: `interview-coach`
  - Database password: ___________________
  - Region: ___________________
  
- [ ] Waited for project initialization (~2 minutes)

- [ ] Ran database schema
  - Opened SQL Editor
  - Copied all content from `supabase/schema.sql`
  - Clicked "Run"
  - ✅ All tables created successfully

- [ ] Copied API credentials (Settings → API)
  - [ ] Project URL: https://_________________.supabase.co
  - [ ] anon/public key: eyJ_____________________
  - [ ] service_role key: eyJ_____________________

- [ ] Verified authentication is enabled (Authentication → Providers → Email)

## 🤖 Step 2B: Anthropic API Setup

- [ ] Created Anthropic account (https://console.anthropic.com)
- [ ] Generated API key
  - Key: sk-ant-_____________________
  
- [ ] Added credits (minimum $5 recommended)
- [ ] Verified API key works

## 💳 Step 2C: Stripe Setup (Optional)

Skip this if you want to deploy without payments first.

- [ ] Created Stripe account (https://dashboard.stripe.com)
- [ ] Switched to Test Mode (toggle in sidebar)

- [ ] Created Basic Plan Product
  - Name: "Interview Coach Basic"
  - Price: $9.00 USD/month
  - Price ID: price__________________

- [ ] Created Pro Plan Product
  - Name: "Interview Coach Pro"
  - Price: $19.00 USD/month
  - Price ID: price__________________

- [ ] Copied API keys (Developers → API Keys)
  - [ ] Publishable key: pk_test_____________________
  - [ ] Secret key: sk_test_____________________

## 🚢 Step 3: Deploy to Vercel

- [ ] Signed in to Vercel (https://vercel.com)
- [ ] Clicked "Add New" → "Project"
- [ ] Imported GitHub repository: `interview-coach`
- [ ] Verified settings:
  - Framework: Next.js (auto-detected)
  - Root Directory: `./`
  - Build Command: `npm run build`
  - Output Directory: `.next`

- [ ] Added ALL environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_BASIC_PRICE_ID=
STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

- [ ] Clicked "Deploy"
- [ ] Waited for deployment to complete
- [ ] Deployment succeeded! 🎉

**Your App URL**: https://_________________.vercel.app

- [ ] Updated `NEXT_PUBLIC_APP_URL` environment variable with actual URL
- [ ] Redeployed (Deployments → ... → Redeploy)

## 🔗 Step 4: Stripe Webhook (If Using Stripe)

- [ ] Opened Stripe Dashboard → Developers → Webhooks
- [ ] Clicked "Add endpoint"
- [ ] Set endpoint URL: https://your-vercel-url.vercel.app/api/stripe/webhook
- [ ] Selected events:
  - [ ] checkout.session.completed
  - [ ] customer.subscription.updated
  - [ ] customer.subscription.deleted
- [ ] Clicked "Add endpoint"
- [ ] Copied Signing Secret: whsec____________________
- [ ] Added to Vercel Environment Variables as `STRIPE_WEBHOOK_SECRET`
- [ ] Redeployed application

## ✨ Step 5: Testing

### Basic Functionality
- [ ] Visited deployment URL
- [ ] Signed up for a new account
- [ ] Received confirmation email
- [ ] Logged in successfully
- [ ] Dashboard loads correctly

### Interview Flow
- [ ] Started new interview
- [ ] Selected job role and difficulty
- [ ] Received first question from AI
- [ ] Submitted answer
- [ ] Received AI feedback with score
- [ ] Completed full interview (6 questions)
- [ ] Viewed summary page with overall score

### Dashboard
- [ ] Stats display correctly
- [ ] Interview history shows
- [ ] Can click on past sessions
- [ ] Usage count displays

### Payments (If Stripe Configured)
- [ ] Pricing page loads
- [ ] Can click "Subscribe"
- [ ] Redirected to Stripe checkout
- [ ] Used test card: 4242 4242 4242 4242
- [ ] Subscription activated
- [ ] Interview limit increased
- [ ] Can access customer portal

## 🎉 Post-Deployment

- [ ] Verified webhook works (check Stripe Dashboard → Webhooks → Events)
- [ ] Set up monitoring in Vercel (optional)
- [ ] Configured custom domain (optional)
- [ ] Set up Supabase email templates (optional)
- [ ] Configured email SMTP provider (optional)

## 📊 Deployment Summary

**Date Deployed**: _____________________

**URLs**:
- GitHub: https://github.com/____________/interview-coach
- Production: https://_________________.vercel.app
- Dashboard: https://vercel.com/____________/interview-coach

**Services**:
- Supabase: https://app.supabase.com/project/_____________
- Anthropic: https://console.anthropic.com
- Stripe: https://dashboard.stripe.com
- Vercel: https://vercel.com

**Costs**:
- Vercel: Free (Hobby plan)
- Supabase: Free (with limits)
- Anthropic: Pay per use (~$0.003 per request)
- Stripe: 2.9% + $0.30 per transaction

## 🚨 Troubleshooting

### Build Failed?
- [ ] Check all environment variables are set
- [ ] Verify no typos in variable names
- [ ] Check build logs in Vercel

### API Not Working?
- [ ] Verify Anthropic API key is valid
- [ ] Check API quota and billing
- [ ] Review Vercel function logs

### Database Errors?
- [ ] Verify Supabase service role key
- [ ] Check database schema was created
- [ ] Review RLS policies

### Stripe Not Working?
- [ ] Verify webhook secret is correct
- [ ] Check webhook events in Stripe Dashboard
- [ ] Ensure using correct mode (test/live)

## 📞 Support Resources

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Anthropic Docs**: https://docs.anthropic.com
- **Stripe Docs**: https://stripe.com/docs

## ✅ Deployment Complete!

Congratulations! Your Interview Coach application is live! 🎉

**Next Steps**:
1. Share your app URL with friends
2. Monitor usage and costs
3. Set up custom domain
4. Switch Stripe to live mode when ready
5. Add more features from ROADMAP.md

---

**Deployed**: ___/___/______  
**Status**: 🟢 Live  
**Version**: 1.0.0
