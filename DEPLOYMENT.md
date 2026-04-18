# Deployment Guide for Interview Coach

This guide will walk you through deploying the Interview Coach application to production.

## Prerequisites

Before you begin, ensure you have:

- [ ] GitHub account
- [ ] Vercel account (sign up at https://vercel.com)
- [ ] Supabase account (sign up at https://supabase.com)
- [ ] Anthropic API key (get from https://console.anthropic.com)
- [ ] Stripe account (sign up at https://stripe.com)

## Step 1: Set Up Supabase

### 1.1 Create a New Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in project details:
   - Name: `interview-coach`
   - Database Password: (generate a strong password)
   - Region: (choose closest to your users)
4. Click "Create new project"

### 1.2 Run Database Schema

1. Wait for your project to finish setting up
2. Go to the SQL Editor in your Supabase dashboard
3. Copy the entire contents of `supabase/schema.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute the schema
6. Verify all tables were created successfully

### 1.3 Get API Keys

1. Go to Project Settings → API
2. Copy the following:
   - **Project URL** (looks like `https://xxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) ⚠️ Keep this secret!

### 1.4 Configure Authentication

1. Go to Authentication → Providers
2. Enable Email provider (should be enabled by default)
3. Configure email templates (optional but recommended):
   - Go to Authentication → Email Templates
   - Customize confirmation and recovery emails

### 1.5 Set Up Monthly Reset (Optional)

To automatically reset interview counts each month:

1. Go to Database → Functions
2. Create a new function or use pg_cron extension
3. Schedule the `reset_monthly_interviews()` function to run monthly

```sql
-- Example using pg_cron (if available)
SELECT cron.schedule(
  'reset-monthly-interviews',
  '0 0 1 * *', -- First day of every month at midnight
  $$SELECT reset_monthly_interviews()$$
);
```

## Step 2: Set Up Stripe

### 2.1 Create Products and Prices

1. Go to https://dashboard.stripe.com
2. Navigate to Products → Add Product

**Basic Plan:**
- Name: `Interview Coach Basic`
- Description: `20 interviews per month with detailed AI feedback`
- Pricing: `$9.00 USD` per month (recurring)
- Click "Save product"
- Copy the **Price ID** (starts with `price_...`)

**Pro Plan:**
- Name: `Interview Coach Pro`
- Description: `Unlimited interviews with advanced features`
- Pricing: `$19.00 USD` per month (recurring)
- Click "Save product"
- Copy the **Price ID** (starts with `price_...`)

### 2.2 Get API Keys

1. Go to Developers → API Keys
2. Copy:
   - **Publishable key** (starts with `pk_...`)
   - **Secret key** (starts with `sk_...`) ⚠️ Keep this secret!

### 2.3 Set Up Webhook (After Deployment)

⚠️ Complete this step after deploying to Vercel

1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Endpoint URL: `https://your-domain.vercel.app/api/stripe/webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Click "Add endpoint"
6. Click to reveal the **Signing secret** (starts with `whsec_...`)

## Step 3: Get Anthropic API Key

1. Go to https://console.anthropic.com
2. Sign up or log in
3. Navigate to API Keys
4. Create a new API key
5. Copy the key (starts with `sk-ant-...`) ⚠️ Keep this secret!
6. Add credits to your account if needed

## Step 4: Deploy to Vercel

### 4.1 Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Interview Coach"

# Create a new repository on GitHub
# Then add the remote and push
git remote add origin https://github.com/YOUR_USERNAME/interview-coach.git
git branch -M main
git push -u origin main
```

### 4.2 Import to Vercel

1. Go to https://vercel.com
2. Click "New Project"
3. Import your GitHub repository
4. Configure project:
   - Framework Preset: `Next.js`
   - Root Directory: `./`
   - Build Command: `next build`
   - Output Directory: `.next`

### 4.3 Add Environment Variables

Click "Environment Variables" and add the following:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic Claude API
ANTHROPIC_API_KEY=sk-ant-...

# Stripe
STRIPE_SECRET_KEY=sk_live_... (or sk_test_... for testing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
STRIPE_WEBHOOK_SECRET=whsec_... (get this after Step 2.3)
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PRO_PRICE_ID=price_...

# App URL (update after deployment)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 4.4 Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Copy your deployment URL

### 4.5 Update Environment Variables

1. Go back to Vercel project settings
2. Update `NEXT_PUBLIC_APP_URL` with your actual Vercel URL
3. Redeploy the application

## Step 5: Configure Stripe Webhook

Now that you have a deployment URL:

1. Return to Stripe Dashboard → Developers → Webhooks
2. Add endpoint with your Vercel URL: `https://your-domain.vercel.app/api/stripe/webhook`
3. Select the required events (as mentioned in Step 2.3)
4. Copy the webhook signing secret
5. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`
6. Redeploy the application

## Step 6: Test Your Deployment

### 6.1 Test User Authentication

1. Visit your deployed application
2. Click "Sign Up"
3. Create a test account
4. Verify you receive the confirmation email
5. Log in successfully

### 6.2 Test Free Interview

1. Log in to your account
2. Click "Start New Interview"
3. Select a job role and difficulty
4. Answer a few questions
5. Verify AI feedback appears
6. Complete the interview
7. Check the summary page

### 6.3 Test Stripe Integration (Test Mode)

1. Go to Pricing page
2. Try to subscribe to Basic plan
3. Use Stripe test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
4. Complete checkout
5. Verify subscription is active in dashboard
6. Check Stripe dashboard for the test payment

### 6.4 Test Webhook

1. In Stripe Dashboard, go to Developers → Webhooks
2. Click on your webhook endpoint
3. Click "Send test webhook"
4. Choose `checkout.session.completed`
5. Verify it succeeds (check Vercel logs if needed)

## Step 7: Go Live

### 7.1 Switch Stripe to Live Mode

1. In Stripe Dashboard, toggle from "Test mode" to "Live mode"
2. Create new products and prices in Live mode
3. Update Vercel environment variables with live keys
4. Create a new webhook endpoint with live keys
5. Redeploy

### 7.2 Update Supabase Settings

1. Configure production email settings
2. Set up proper SMTP provider (SendGrid, Postmark, etc.)
3. Review and adjust rate limits
4. Set up monitoring and alerts

## Step 8: Custom Domain (Optional)

### 8.1 Add Custom Domain in Vercel

1. Go to your Vercel project
2. Settings → Domains
3. Add your domain (e.g., `interviewcoach.com`)
4. Follow DNS configuration instructions

### 8.2 Update Environment Variables

```env
NEXT_PUBLIC_APP_URL=https://your-custom-domain.com
```

### 8.3 Update Stripe Webhook

Update the webhook URL in Stripe to use your custom domain

## Monitoring & Maintenance

### Vercel Logs

- Go to your Vercel project → Logs
- Monitor for errors and performance issues

### Supabase Logs

- Go to Supabase Dashboard → Logs
- Monitor database queries and errors

### Stripe Dashboard

- Monitor payments, subscriptions, and failed payments
- Set up email notifications for important events

### Regular Maintenance

1. **Monthly**: Check Anthropic API usage and costs
2. **Monthly**: Review Stripe revenue and subscriptions
3. **Weekly**: Check error logs in Vercel
4. **Weekly**: Monitor database performance in Supabase

## Troubleshooting

### Build Fails on Vercel

```bash
# Clear cache and rebuild
vercel --prod --force
```

### Database Connection Issues

- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check Supabase project is not paused
- Review RLS policies

### Stripe Webhook Failures

- Verify webhook secret matches
- Check endpoint URL is correct and accessible
- Review webhook event logs in Stripe Dashboard

### AI Responses Not Working

- Verify Anthropic API key is valid
- Check API quota and billing
- Review API error logs in Vercel

## Security Checklist

- [ ] All environment variables are properly set
- [ ] Service role keys are never exposed to client
- [ ] RLS policies are enabled on all tables
- [ ] CORS is properly configured
- [ ] Webhook signatures are verified
- [ ] Rate limiting is implemented (consider adding)
- [ ] Error messages don't expose sensitive data

## Scaling Considerations

### When You Grow

1. **Database**: Upgrade Supabase plan for more connections
2. **API**: Monitor Anthropic usage, implement caching if needed
3. **Hosting**: Vercel scales automatically
4. **Email**: Implement dedicated SMTP service

### Performance Optimization

- Enable Vercel Edge caching where appropriate
- Implement database query optimization
- Add Redis caching for frequently accessed data
- Consider using Vercel Edge Functions for latency-sensitive operations

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Review Supabase logs
3. Check Stripe webhook event logs
4. Review [Next.js documentation](https://nextjs.org/docs)
5. Check [Supabase documentation](https://supabase.com/docs)

---

Congratulations! Your Interview Coach application is now live! 🎉
