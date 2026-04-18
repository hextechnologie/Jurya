# FULLY AUTOMATED DEPLOYMENT SCRIPT
# This script will deploy your Interview Coach app with minimal input

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║     🚀 INTERVIEW COACH - AUTOMATED DEPLOYMENT 🚀          ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Function to open URLs
function Open-URL {
    param($url, $description)
    Write-Host "🌐 Opening: $description" -ForegroundColor Yellow
    Start-Process $url
    Start-Sleep -Seconds 2
}

# Function to wait for user
function Wait-ForUser {
    param($message)
    Write-Host ""
    Write-Host "⏸️  $message" -ForegroundColor Yellow
    Read-Host "Press Enter when done"
}

# Set git config if not set
Write-Host "⚙️  Step 1: Configuring Git..." -ForegroundColor Cyan
Write-Host ""

$gitName = git config user.name
if ([string]::IsNullOrWhiteSpace($gitName)) {
    $name = Read-Host "Enter your name (for git commits)"
    git config --global user.name "$name"
    Write-Host "✅ Git name set" -ForegroundColor Green
}

$gitEmail = git config user.email
if ([string]::IsNullOrWhiteSpace($gitEmail)) {
    $email = Read-Host "Enter your email"
    git config --global user.email "$email"
    Write-Host "✅ Git email set" -ForegroundColor Green
}

# Get GitHub username
Write-Host ""
Write-Host "📝 Step 2: GitHub Setup" -ForegroundColor Cyan
Write-Host ""
$githubUser = Read-Host "Enter your GitHub username"

if ([string]::IsNullOrWhiteSpace($githubUser)) {
    Write-Host "❌ GitHub username required!" -ForegroundColor Red
    exit
}

Write-Host "✅ Using: $githubUser" -ForegroundColor Green

# Open GitHub to create repository
Write-Host ""
Write-Host "📦 Step 3: Creating GitHub Repository..." -ForegroundColor Cyan
Write-Host ""
Write-Host "I'm opening GitHub for you to create the repository..." -ForegroundColor Yellow
Write-Host ""
Write-Host "👉 Repository name: interview-coach" -ForegroundColor White
Write-Host "👉 Visibility: Public or Private (your choice)" -ForegroundColor White  
Write-Host "👉 DO NOT initialize with README" -ForegroundColor White
Write-Host ""

Open-URL "https://github.com/new" "GitHub - Create Repository"
Wait-ForUser "Complete the repository creation, then"

# Push to GitHub
Write-Host ""
Write-Host "📤 Step 4: Pushing code to GitHub..." -ForegroundColor Cyan
Write-Host ""

$repoUrl = "https://github.com/$githubUser/interview-coach.git"
try {
    git remote add origin $repoUrl 2>$null
    if ($LASTEXITCODE -ne 0) {
        git remote set-url origin $repoUrl
    }
    git branch -M main
    Write-Host "⚠️  You may need to authenticate with GitHub..." -ForegroundColor Yellow
    Write-Host ""
    git push -u origin main
    Write-Host ""
    Write-Host "✅ Code pushed successfully!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Push may require authentication. Check the output above." -ForegroundColor Yellow
}

# Setup Supabase
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🗄️  Step 5: Supabase Setup (Database + Auth)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "I'm opening Supabase for you..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Instructions:" -ForegroundColor White
Write-Host "  1. Click 'New Project'" -ForegroundColor White
Write-Host "  2. Name: interview-coach" -ForegroundColor White
Write-Host "  3. Database Password: (choose a strong password)" -ForegroundColor White
Write-Host "  4. Region: (choose closest to you)" -ForegroundColor White
Write-Host "  5. Wait ~2 minutes for setup" -ForegroundColor White
Write-Host "  6. Go to SQL Editor" -ForegroundColor White
Write-Host "  7. Click 'New Query'" -ForegroundColor White
Write-Host "  8. Copy ALL content from: c:\interview-coach\supabase\schema.sql" -ForegroundColor Yellow
Write-Host "  9. Paste and click 'Run'" -ForegroundColor White
Write-Host "  10. Go to Settings - API" -ForegroundColor White
Write-Host ""

Open-URL "https://supabase.com/dashboard" "Supabase Dashboard"
Wait-ForUser "Complete Supabase setup and get your API keys, then"

Write-Host ""
Write-Host "📋 Enter your Supabase credentials:" -ForegroundColor Cyan
$supabaseUrl = Read-Host "Supabase URL (https://xxx.supabase.co)"
$supabaseAnonKey = Read-Host "Supabase anon key (starts with eyJ)"
$supabaseServiceKey = Read-Host "Supabase service_role key (starts with eyJ)"

# Setup Anthropic
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🤖 Step 6: Anthropic API Setup (AI Power)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "I'm opening Anthropic Console for you..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Instructions:" -ForegroundColor White
Write-Host "  1. Sign in or create account" -ForegroundColor White
Write-Host "  2. Go to API Keys" -ForegroundColor White
Write-Host "  3. Click 'Create Key'" -ForegroundColor White
Write-Host "  4. Copy the key" -ForegroundColor White
Write-Host "  5. Add credits (minimum $5 recommended)" -ForegroundColor White
Write-Host ""

Open-URL "https://console.anthropic.com/settings/keys" "Anthropic API Keys"
Wait-ForUser "Get your Anthropic API key, then"

Write-Host ""
$anthropicKey = Read-Host "Anthropic API Key (starts with sk-ant-)"

# Setup Stripe (Optional)
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "💳 Step 7: Stripe Setup (Payments - Optional)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
$setupStripe = Read-Host "Do you want to set up Stripe payments now? (y/n)"

$stripeSecretKey = ""
$stripePubKey = ""
$stripeBasicPrice = ""
$stripeProPrice = ""
$stripeWebhookSecret = ""

if ($setupStripe -eq "y" -or $setupStripe -eq "Y") {
    Write-Host ""
    Write-Host "I'm opening Stripe Dashboard for you..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📋 Instructions:" -ForegroundColor White
    Write-Host "  1. Switch to 'Test Mode' (toggle in sidebar)" -ForegroundColor White
    Write-Host "  2. Go to Products → Add Product" -ForegroundColor White
    Write-Host "     • Name: 'Interview Coach Basic', Price: $9/month" -ForegroundColor White
    Write-Host "     • Name: 'Interview Coach Pro', Price: $19/month" -ForegroundColor White
    Write-Host "     • Copy both Price IDs" -ForegroundColor White
    Write-Host "  3. Go to Developers → API Keys" -ForegroundColor White
    Write-Host "     • Copy Publishable key (pk_test_...)" -ForegroundColor White
    Write-Host "     • Copy Secret key (sk_test_...)" -ForegroundColor White
    Write-Host ""
    
    Open-URL "https://dashboard.stripe.com/test/products" "Stripe - Products"
    Start-Sleep -Seconds 2
    Open-URL "https://dashboard.stripe.com/test/apikeys" "Stripe - API Keys"
    Wait-ForUser "Set up Stripe products and get API keys, then"
    
    Write-Host ""
    Write-Host "📋 Enter your Stripe credentials:" -ForegroundColor Cyan
    $stripeSecretKey = Read-Host "Stripe Secret Key (sk_test_...)"
    $stripePubKey = Read-Host "Stripe Publishable Key (pk_test_...)"
    $stripeBasicPrice = Read-Host "Basic Plan Price ID (price_...)"
    $stripeProPrice = Read-Host "Pro Plan Price ID (price_...)"
    $stripeWebhookSecret = "whsec_placeholder_will_update_after_deploy"
    
    Write-Host "✅ Stripe configured (webhook will be set up after deployment)" -ForegroundColor Green
} else {
    Write-Host "⏭️  Skipping Stripe - You can add it later" -ForegroundColor Yellow
    $stripeSecretKey = "sk_test_placeholder"
    $stripePubKey = "pk_test_placeholder"
    $stripeBasicPrice = "price_placeholder"
    $stripeProPrice = "price_placeholder"
    $stripeWebhookSecret = "whsec_placeholder"
}

# Create environment file
Write-Host ""
Write-Host "📝 Step 8: Creating environment configuration..." -ForegroundColor Cyan

$envContent = @"
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnonKey
SUPABASE_SERVICE_ROLE_KEY=$supabaseServiceKey

# Anthropic Claude API
ANTHROPIC_API_KEY=$anthropicKey

# Stripe Configuration
STRIPE_SECRET_KEY=$stripeSecretKey
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$stripePubKey
STRIPE_WEBHOOK_SECRET=$stripeWebhookSecret
STRIPE_BASIC_PRICE_ID=$stripeBasicPrice
STRIPE_PRO_PRICE_ID=$stripeProPrice

# Application URL (will be updated after deployment)
NEXT_PUBLIC_APP_URL=http://localhost:3000
"@

$envContent | Out-File -FilePath ".env.local" -Encoding UTF8
Write-Host "✅ Environment file created" -ForegroundColor Green

# Deploy to Vercel
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🚀 Step 9: Deploy to Vercel" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "I'm opening Vercel for you..." -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Instructions:" -ForegroundColor White
Write-Host "  1. Sign in with GitHub" -ForegroundColor White
Write-Host "  2. Click 'Add New' then 'Project'" -ForegroundColor White
Write-Host "  3. Import: 'interview-coach'" -ForegroundColor White
Write-Host "  4. Click 'Environment Variables'" -ForegroundColor White
Write-Host "  5. Add these variables:" -ForegroundColor White
Write-Host ""
Write-Host "     NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl" -ForegroundColor Gray
Write-Host "     NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnonKey" -ForegroundColor Gray
Write-Host "     SUPABASE_SERVICE_ROLE_KEY=$supabaseServiceKey" -ForegroundColor Gray
Write-Host "     ANTHROPIC_API_KEY=$anthropicKey" -ForegroundColor Gray

if ($setupStripe -eq "y" -or $setupStripe -eq "Y") {
    Write-Host "     STRIPE_SECRET_KEY=$stripeSecretKey" -ForegroundColor Gray
    Write-Host "     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$stripePubKey" -ForegroundColor Gray
    Write-Host "     STRIPE_WEBHOOK_SECRET=$stripeWebhookSecret" -ForegroundColor Gray
    Write-Host "     STRIPE_BASIC_PRICE_ID=$stripeBasicPrice" -ForegroundColor Gray
    Write-Host "     STRIPE_PRO_PRICE_ID=$stripeProPrice" -ForegroundColor Gray
}

Write-Host "     NEXT_PUBLIC_APP_URL=https://your-app.vercel.app" -ForegroundColor Gray
Write-Host ""
Write-Host "  6. Click 'Deploy'!" -ForegroundColor White
Write-Host "  7. Wait 2-3 minutes" -ForegroundColor White
Write-Host "  8. Copy your deployment URL" -ForegroundColor White
Write-Host ""

# Copy environment variables to clipboard for easy pasting
$clipboardContent = @"
NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnonKey
SUPABASE_SERVICE_ROLE_KEY=$supabaseServiceKey
ANTHROPIC_API_KEY=$anthropicKey
STRIPE_SECRET_KEY=$stripeSecretKey
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$stripePubKey
STRIPE_WEBHOOK_SECRET=$stripeWebhookSecret
STRIPE_BASIC_PRICE_ID=$stripeBasicPrice
STRIPE_PRO_PRICE_ID=$stripeProPrice
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
"@

# Try to copy to clipboard
try {
    $clipboardContent | Set-Clipboard
    Write-Host "✅ Environment variables copied to clipboard - you can paste them in Vercel!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Couldn't copy to clipboard, but values are shown above" -ForegroundColor Yellow
}

Open-URL "https://vercel.com/new" "Vercel - New Project"
Wait-ForUser "Deploy to Vercel and copy your deployment URL, then"

# Get deployment URL
Write-Host ""
$deploymentUrl = Read-Host "Enter your Vercel deployment URL"

# Update environment variable with actual URL
Write-Host ""
Write-Host "📝 Updating environment with deployment URL..." -ForegroundColor Cyan
$envContent = Get-Content ".env.local" -Raw
$envContent = $envContent -replace "NEXT_PUBLIC_APP_URL=.*", "NEXT_PUBLIC_APP_URL=$deploymentUrl"
$envContent | Out-File -FilePath ".env.local" -Encoding UTF8

# Setup Stripe webhook if configured
if ($setupStripe -eq "y" -or $setupStripe -eq "Y") {
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🔗 Step 10: Configure Stripe Webhook" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 Instructions:" -ForegroundColor White
    Write-Host "  1. In Stripe Dashboard, go to Developers - Webhooks" -ForegroundColor White
    Write-Host "  2. Click 'Add endpoint'" -ForegroundColor White
    Write-Host "  3. Enter URL: $deploymentUrl/api/stripe/webhook" -ForegroundColor Yellow
    Write-Host "  4. Select events:" -ForegroundColor White
    Write-Host "     checkout.session.completed" -ForegroundColor White
    Write-Host "     customer.subscription.updated" -ForegroundColor White
    Write-Host "     customer.subscription.deleted" -ForegroundColor White
    Write-Host "  5. Click 'Add endpoint'" -ForegroundColor White
    Write-Host "  6. Copy the 'Signing secret'" -ForegroundColor White
    Write-Host ""
    
    Open-URL "https://dashboard.stripe.com/test/webhooks" "Stripe - Webhooks"
    Wait-ForUser "Set up webhook and get signing secret, then"
    
    Write-Host ""
    $webhookSecret = Read-Host "Enter Stripe Webhook Signing Secret (whsec_...)"
    
    # Update webhook secret in Vercel
    Write-Host ""
    Write-Host "📝 Update this in Vercel:" -ForegroundColor Yellow
    Write-Host "  Go to: Project Settings - Environment Variables" -ForegroundColor White
    Write-Host "  Update: STRIPE_WEBHOOK_SECRET=$webhookSecret" -ForegroundColor White
    Write-Host "  Then: Redeploy" -ForegroundColor White
    Write-Host ""
    Wait-ForUser "Update webhook secret in Vercel, then"
}

# Final success message
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "           🎉 DEPLOYMENT COMPLETE! 🎉                      " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Your Interview Coach app is LIVE!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Open your app: $deploymentUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 What to test:" -ForegroundColor Yellow
Write-Host "  - Sign up for an account" -ForegroundColor White
Write-Host "  - Start a mock interview" -ForegroundColor White
Write-Host "  - Answer questions and get AI feedback" -ForegroundColor White
Write-Host "  - View your dashboard" -ForegroundColor White
if ($setupStripe -eq "y" -or $setupStripe -eq "Y") {
    Write-Host "  - Test subscription (use card: 4242 4242 4242 4242)" -ForegroundColor White
}
Write-Host ""
Write-Host "📊 Your Resources:" -ForegroundColor Yellow
Write-Host "  GitHub: https://github.com/$githubUser/interview-coach" -ForegroundColor White
Write-Host "  Vercel: https://vercel.com" -ForegroundColor White
Write-Host "  Supabase: https://supabase.com/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "🎓 Documentation:" -ForegroundColor Yellow
Write-Host "  Full docs in README.md" -ForegroundColor White
Write-Host "  Troubleshooting in DEPLOYMENT.md" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Opening your live app..." -ForegroundColor Cyan

Start-Sleep -Seconds 2
Start-Process $deploymentUrl

Write-Host ""
Write-Host "Enjoy your Interview Coach app! 🎉" -ForegroundColor Green
Write-Host ""
