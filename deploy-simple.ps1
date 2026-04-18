# Interview Coach - Simple Automated Deployment
# This script deploys your app with minimal configuration

Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "     INTERVIEW COACH - AUTOMATED DEPLOYMENT         " -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

# Configure Git
Write-Host "Step 1: Git Configuration" -ForegroundColor Yellow
$gitName = git config user.name
if ([string]::IsNullOrWhiteSpace($gitName)) {
    git config --global user.name "Interview Coach User"
}
$gitEmail = git config user.email
if ([string]::IsNullOrWhiteSpace($gitEmail)) {
    git config --global user.email "user@interviewcoach.app"
}
Write-Host "[OK] Git configured" -ForegroundColor Green

# Get GitHub username
Write-Host ""
Write-Host "Step 2: GitHub Setup" -ForegroundColor Yellow
$githubUser = Read-Host "Your GitHub username"

# Open GitHub
Write-Host ""
Write-Host "Opening GitHub to create repository..." -ForegroundColor Yellow
Write-Host "Repository name: interview-coach" -ForegroundColor White
Write-Host "DO NOT initialize with README" -ForegroundColor White
Start-Process "https://github.com/new"
Write-Host ""
Read-Host "Press Enter after creating the repository"

# Push to GitHub
Write-Host ""
Write-Host "Step 3: Pushing to GitHub..." -ForegroundColor Yellow
$repoUrl = "https://github.com/$githubUser/interview-coach.git"
git remote add origin $repoUrl 2>$null
if ($LASTEXITCODE -ne 0) {
    git remote set-url origin $repoUrl
}
git branch -M main
git push -u origin main
Write-Host "[OK] Code pushed to GitHub" -ForegroundColor Green

# Supabase Setup
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Step 4: Supabase Setup" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create new project: interview-coach" -ForegroundColor White
Write-Host "2. Wait for setup (2 minutes)" -ForegroundColor White  
Write-Host "3. Go to SQL Editor" -ForegroundColor White
Write-Host "4. Copy content from: c:\interview-coach\supabase\schema.sql" -ForegroundColor White
Write-Host "5. Paste and Run" -ForegroundColor White
Write-Host "6. Go to Settings > API and get keys" -ForegroundColor White
Write-Host ""

Start-Process "https://supabase.com/dashboard"
Start-Process "c:\interview-coach\supabase\schema.sql"
Write-Host ""
Read-Host "Press Enter after completing Supabase setup"

Write-Host ""
$supabaseUrl = Read-Host "Supabase URL"
$supabaseAnon = Read-Host "Supabase anon key"
$supabaseService = Read-Host "Supabase service_role key"

# Anthropic Setup
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Step 5: Anthropic API" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Sign in or create account" -ForegroundColor White
Write-Host "2. Create API key" -ForegroundColor White
Write-Host "3. Add credits (minimum $5)" -ForegroundColor White
Write-Host ""

Start-Process "https://console.anthropic.com/settings/keys"
Write-Host ""
Read-Host "Press Enter after getting API key"

Write-Host ""
$anthropicKey = Read-Host "Anthropic API key"

# Stripe (Optional)
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Step 6: Stripe (Optional)" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
$setupStripe = Read-Host "Setup Stripe now? (y/n)"

if ($setupStripe -eq "y") {
    Write-Host ""
    Write-Host "1. Switch to Test Mode" -ForegroundColor White
    Write-Host "2. Create products: Basic ($9) and Pro ($19)" -ForegroundColor White
    Write-Host "3. Copy Price IDs" -ForegroundColor White
    Write-Host "4. Go to Developers > API Keys" -ForegroundColor White
    Write-Host ""
    
    Start-Process "https://dashboard.stripe.com/test/products"
    Start-Process "https://dashboard.stripe.com/test/apikeys"
    Write-Host ""
    Read-Host "Press Enter after setup"
    
    Write-Host ""
    $stripeSecret = Read-Host "Stripe Secret Key"
    $stripePub = Read-Host "Stripe Publishable Key"
    $stripeBasic = Read-Host "Basic Plan Price ID"
    $stripePro = Read-Host "Pro Plan Price ID"
    $stripeWebhook = "whsec_will_update_later"
} else {
    $stripeSecret = "sk_test_placeholder"
    $stripePub = "pk_test_placeholder"
    $stripeBasic = "price_placeholder"
    $stripePro = "price_placeholder"
    $stripeWebhook = "whsec_placeholder"
}

# Create environment file
Write-Host ""
Write-Host "Creating environment configuration..." -ForegroundColor Yellow

$envContent = "NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnon
SUPABASE_SERVICE_ROLE_KEY=$supabaseService
ANTHROPIC_API_KEY=$anthropicKey
STRIPE_SECRET_KEY=$stripeSecret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$stripePub
STRIPE_WEBHOOK_SECRET=$stripeWebhook
STRIPE_BASIC_PRICE_ID=$stripeBasic
STRIPE_PRO_PRICE_ID=$stripePro
NEXT_PUBLIC_APP_URL=http://localhost:3000"

Set-Content -Path ".env.local" -Value $envContent
Write-Host "[OK] Environment file created" -ForegroundColor Green

# Copy to clipboard for Vercel
$clipboardText = "NEXT_PUBLIC_SUPABASE_URL=$supabaseUrl
NEXT_PUBLIC_SUPABASE_ANON_KEY=$supabaseAnon
SUPABASE_SERVICE_ROLE_KEY=$supabaseService
ANTHROPIC_API_KEY=$anthropicKey
STRIPE_SECRET_KEY=$stripeSecret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$stripePub
STRIPE_WEBHOOK_SECRET=$stripeWebhook
STRIPE_BASIC_PRICE_ID=$stripeBasic
STRIPE_PRO_PRICE_ID=$stripePro
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app"

try {
    Set-Clipboard -Value $clipboardText
    Write-Host "[OK] Variables copied to clipboard!" -ForegroundColor Green
} catch {
    Write-Host "[INFO] Could not copy to clipboard" -ForegroundColor Yellow
}

# Deploy to Vercel
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host "Step 7: Deploy to Vercel" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Sign in with GitHub" -ForegroundColor White
Write-Host "2. Click Add New > Project" -ForegroundColor White
Write-Host "3. Import: interview-coach" -ForegroundColor White
Write-Host "4. Add Environment Variables (paste from clipboard)" -ForegroundColor White
Write-Host "5. Deploy!" -ForegroundColor White
Write-Host ""

Start-Process "https://vercel.com/new"
Write-Host ""
Read-Host "Press Enter after deployment completes"

Write-Host ""
$deployUrl = Read-Host "Your Vercel URL"

# Update environment with deployment URL
$envContent = Get-Content ".env.local" -Raw
$envContent = $envContent -replace "NEXT_PUBLIC_APP_URL=.*", "NEXT_PUBLIC_APP_URL=$deployUrl"
Set-Content -Path ".env.local" -Value $envContent

# Stripe Webhook (if configured)
if ($setupStripe -eq "y") {
    Write-Host ""
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host "Step 8: Stripe Webhook" -ForegroundColor Cyan
    Write-Host "=====================================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "1. Go to Developers > Webhooks" -ForegroundColor White
    Write-Host "2. Add endpoint: $deployUrl/api/stripe/webhook" -ForegroundColor White
    Write-Host "3. Select events: checkout.session.completed," -ForegroundColor White
    Write-Host "   customer.subscription.updated," -ForegroundColor White
    Write-Host "   customer.subscription.deleted" -ForegroundColor White
    Write-Host "4. Copy Signing Secret" -ForegroundColor White
    Write-Host "5. Update in Vercel: Project Settings > Environment Variables" -ForegroundColor White
    Write-Host ""
    
    Start-Process "https://dashboard.stripe.com/test/webhooks"
    Write-Host ""
    Read-Host "Press Enter after webhook setup"
}

# Success!
Write-Host ""
Write-Host "=====================================================" -ForegroundColor Green
Write-Host "           DEPLOYMENT COMPLETE!                      " -ForegroundColor Green
Write-Host "=====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "[OK] Your app is LIVE!" -ForegroundColor Green
Write-Host ""
Write-Host "URL: $deployUrl" -ForegroundColor Cyan
Write-Host ""
Write-Host "Opening your app..." -ForegroundColor Yellow

Start-Sleep -Seconds 2
Start-Process $deployUrl

Write-Host ""
Write-Host "Enjoy your Interview Coach app!" -ForegroundColor Green
Write-Host ""
