# AI-Powered Interview Coach

A full-stack web application that helps users practice job interviews with AI-powered feedback from Claude. Built with Next.js 14, Tailwind CSS, Supabase, and Stripe.

![Interview Coach](https://via.placeholder.com/1200x600?text=Interview+Coach)

## Features

- 🤖 **AI-Powered Interview Practice** - Chat with Claude AI for realistic mock interviews
- 📊 **Detailed Feedback** - Get scored responses (1-10) with strengths, weaknesses, and improved answer examples
- 🎯 **Multiple Job Roles** - Practice for Software Engineer, Product Manager, Sales, and more
- 📈 **Progress Tracking** - Dashboard with stats, session history, and performance analytics
- 💳 **Stripe Payment Integration** - Three subscription tiers (Free, Basic, Pro)
- 🔐 **User Authentication** - Secure signup/login with Supabase
- 🎨 **Modern UI** - Dark theme with purple/blue gradients and smooth animations
- 📱 **Mobile Responsive** - Works perfectly on all devices

## Tech Stack

- **Frontend:** Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude API (claude-sonnet-4-20250514) via Anthropic SDK
- **Payments:** Stripe
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account
- Anthropic API key (Claude)
- Stripe account

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/interview-coach.git
cd interview-coach
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp .env.example .env.local
```

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Anthropic Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_BASIC_PRICE_ID=price_basic_plan_id
STRIPE_PRO_PRICE_ID=price_pro_plan_id

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **Set up Supabase database**

Run the SQL schema in your Supabase SQL editor:

```bash
# Copy the contents of supabase/schema.sql
# Paste and execute in Supabase SQL Editor
```

5. **Set up Stripe Products**

- Create two subscription products in Stripe Dashboard:
  - **Basic Plan:** $9/month
  - **Pro Plan:** $19/month
- Copy the Price IDs to your `.env.local` file

6. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

### Tables

- **profiles** - User profiles with subscription details
- **interview_sessions** - Interview session records
- **interview_answers** - Individual answers and AI feedback
- **subscription_history** - Payment and subscription history

## API Routes

### Interview Management

- `POST /api/interview/create` - Create new interview session
- `POST /api/interview/question` - Generate next question
- `POST /api/interview/answer` - Submit answer and get feedback
- `GET /api/interview/[id]` - Get session details

### Stripe Integration

- `POST /api/stripe/create-checkout` - Create Stripe checkout session
- `POST /api/stripe/create-portal` - Create Stripe customer portal
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## Deployment

### Deploy to Vercel

1. **Push to GitHub**

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Import to Vercel**

- Go to [vercel.com](https://vercel.com)
- Import your GitHub repository
- Add environment variables
- Deploy

3. **Set up Stripe Webhook**

- Go to Stripe Dashboard → Webhooks
- Add endpoint: `https://your-domain.vercel.app/api/stripe/webhook`
- Select events:
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
- Copy the webhook secret to your environment variables

## Usage

### For Users

1. **Sign Up** - Create an account
2. **Choose Plan** - Start with Free (3 interviews/month) or upgrade
3. **Setup Interview** - Select job role and difficulty level
4. **Practice** - Answer AI-generated questions
5. **Get Feedback** - Receive detailed feedback after each answer
6. **Review Summary** - See overall performance and improvement tips

### Subscription Tiers

- **Free** - 3 interviews/month, basic feedback
- **Basic ($9/month)** - 20 interviews/month, detailed feedback
- **Pro ($19/month)** - Unlimited interviews, advanced features

## Project Structure

```
interview-coach/
├── app/
│   ├── api/                  # API routes
│   │   ├── interview/        # Interview management
│   │   └── stripe/           # Stripe integration
│   ├── dashboard/            # Dashboard page
│   ├── interview/            # Interview pages
│   │   ├── setup/           # Setup page
│   │   ├── [id]/            # Chat interface
│   │   └── summary/[id]/    # Summary page
│   ├── login/               # Login page
│   ├── signup/              # Signup page
│   ├── pricing/             # Pricing page
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   ├── AuthProvider.tsx     # Auth context
│   └── ui/                  # UI components
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── claude.ts            # Claude API integration
│   └── stripe.ts            # Stripe utilities
├── supabase/
│   └── schema.sql           # Database schema
└── package.json
```

## Key Features Explained

### AI Interview Coach

The app uses Claude (claude-sonnet-4-20250514) to:
- Generate relevant interview questions based on job role and level
- Provide structured feedback on answers
- Score responses (1-10)
- Give specific improvement suggestions

### Feedback Structure

Each answer receives:
- **Score** (1-10)
- **Strengths** - What you did well
- **Weaknesses** - Areas to improve
- **Improved Answer** - Example of a better response

### Progress Tracking

Dashboard shows:
- Total interviews completed
- Average score
- Monthly activity
- Session history with scores

## Troubleshooting

### Common Issues

**Build errors about missing modules:**
```bash
npm install
```

**TypeScript errors:**
```bash
npm run build
```

**Supabase connection issues:**
- Verify environment variables
- Check Supabase project status
- Ensure RLS policies are set correctly

**Stripe webhook not working:**
- Use Stripe CLI for local testing
- Verify webhook secret in environment
- Check webhook endpoint URL

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@interviewcoach.com or open an issue on GitHub.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Anthropic Claude](https://www.anthropic.com/)
- [Supabase](https://supabase.com/)
- [Stripe](https://stripe.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

---

Built with ❤️ using Claude AI
