# Quick Start Guide

Get your Interview Coach application running locally in under 10 minutes!

## Prerequisites

- Node.js 18+ installed
- npm or yarn
- Supabase account
- Anthropic API key
- Stripe account (optional for testing core features)

## Quick Setup

### 1. Clone and Install (2 minutes)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/interview-coach.git
cd interview-coach

# Install dependencies
npm install
```

### 2. Set Up Supabase (3 minutes)

1. Go to https://supabase.com and create a new project
2. Wait for the project to initialize
3. Go to SQL Editor and run the SQL from `supabase/schema.sql`
4. Go to Settings → API and copy:
   - Project URL
   - `anon` public key
   - `service_role` key

### 3. Get Anthropic API Key (2 minutes)

1. Go to https://console.anthropic.com
2. Create an account or sign in
3. Generate a new API key
4. Copy the key (starts with `sk-ant-`)

### 4. Configure Environment (1 minute)

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_key

# Stripe (optional - use test keys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...
STRIPE_BASIC_PRICE_ID=price_test_...
STRIPE_PRO_PRICE_ID=price_test_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run the Application (1 minute)

```bash
npm run dev
```

Open http://localhost:3000 in your browser!

## First Steps

1. **Sign Up**: Create your first user account
2. **Start Interview**: Click "Start New Interview"
3. **Choose Settings**: Select a job role and difficulty level
4. **Practice**: Answer questions and get AI feedback!

## Testing Without Stripe

The free tier works without Stripe configuration:
- You get 3 interviews per month
- All core features work
- No payment required

To test paid features locally, you'll need to:
1. Set up Stripe test mode
2. Create test products
3. Configure webhook with Stripe CLI

## Common Issues

### Build Errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### "Unauthorized" Errors

- Check your Supabase keys are correct
- Ensure the database schema was created successfully
- Verify RLS policies are set up

### AI Not Responding

- Verify your Anthropic API key is valid
- Check you have API credits
- Review console for error messages

## Next Steps

- Read the full [README.md](README.md) for detailed information
- Check [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment
- Customize the job roles in `/app/interview/setup/page.tsx`
- Adjust the number of questions per interview in `/lib/claude.ts`

## Development Tips

### Hot Reload

The app uses Next.js hot reload - changes appear automatically!

### Database Changes

After modifying `supabase/schema.sql`:
1. Go to Supabase SQL Editor
2. Run the new schema
3. Restart the dev server

### Styling

- Global styles: `app/globals.css`
- Tailwind config: `tailwind.config.js`
- UI components: `components/ui/index.tsx`

## Testing User Flows

### Test Free User Journey

1. Sign up with a new account
2. Complete 3 interviews
3. Try to start a 4th → should prompt to upgrade

### Test Interview Flow

1. Start interview
2. Answer 6 questions
3. View summary with scores
4. Check dashboard for session history

### Test Subscription (with Stripe)

1. Go to /pricing
2. Click "Subscribe" on Basic plan
3. Use test card: 4242 4242 4242 4242
4. Complete checkout
5. Verify in dashboard your limit increased

## Useful Commands

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

## Getting Help

- Check the console for error messages
- Review Supabase logs in the dashboard
- Ensure all environment variables are set
- Verify database tables were created

## Ready to Deploy?

Once everything works locally, follow [DEPLOYMENT.md](DEPLOYMENT.md) to deploy to production!

---

Happy coding! 🚀
