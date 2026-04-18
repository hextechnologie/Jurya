# Deploy Interview Coach to GitHub and Vercel
# Run this script to automate the deployment process

Write-Host "🚀 Interview Coach Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get GitHub username
Write-Host "📝 Step 1: GitHub Setup" -ForegroundColor Yellow
Write-Host ""
$githubUsername = Read-Host "Enter your GitHub username"

if ([string]::IsNullOrWhiteSpace($githubUsername)) {
    Write-Host "❌ GitHub username is required!" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "✅ Using GitHub username: $githubUsername" -ForegroundColor Green

# Step 2: Set up Git remote
Write-Host ""
Write-Host "🔗 Step 2: Connecting to GitHub..." -ForegroundColor Yellow

$repoUrl = "https://github.com/$githubUsername/interview-coach.git"
Write-Host "Repository URL: $repoUrl" -ForegroundColor Cyan

try {
    git remote add origin $repoUrl 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️  Remote 'origin' already exists, updating..." -ForegroundColor Yellow
        git remote set-url origin $repoUrl
    }
    Write-Host "✅ GitHub remote configured!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set up remote" -ForegroundColor Red
    exit
}

# Step 3: Rename branch to main
Write-Host ""
Write-Host "🌿 Step 3: Preparing branch..." -ForegroundColor Yellow
try {
    git branch -M main
    Write-Host "✅ Branch renamed to 'main'" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Branch renaming failed (may already be main)" -ForegroundColor Yellow
}

# Step 4: Push to GitHub
Write-Host ""
Write-Host "📤 Step 4: Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT: You may need to authenticate with GitHub!" -ForegroundColor Yellow
Write-Host "If prompted, use your GitHub Personal Access Token as password" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter when ready to push"

try {
    git push -u origin main
    Write-Host ""
    Write-Host "✅ Code pushed to GitHub successfully!" -ForegroundColor Green
} catch {
    Write-Host ""
    Write-Host "❌ Push failed! You may need to:" -ForegroundColor Red
    Write-Host "  1. Create the repository on GitHub first: https://github.com/new" -ForegroundColor Yellow
    Write-Host "  2. Set up GitHub CLI or Personal Access Token" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual push command:" -ForegroundColor Cyan
    Write-Host "  git push -u origin main" -ForegroundColor White
    exit
}

# Step 5: Next steps
Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "🎉 Git Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Your repository:" -ForegroundColor Yellow
Write-Host "   https://github.com/$githubUsername/interview-coach" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Set up Supabase:" -ForegroundColor Cyan
Write-Host "   → https://supabase.com/dashboard" -ForegroundColor White
Write-Host "   → Create new project" -ForegroundColor White
Write-Host "   → Run SQL from: supabase/schema.sql" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Get Anthropic API Key:" -ForegroundColor Cyan
Write-Host "   → https://console.anthropic.com" -ForegroundColor White
Write-Host "   → Create API key" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Deploy to Vercel:" -ForegroundColor Cyan
Write-Host "   → https://vercel.com/new" -ForegroundColor White
Write-Host "   → Import: interview-coach" -ForegroundColor White
Write-Host "   → Add environment variables (see DEPLOY_NOW.md)" -ForegroundColor White
Write-Host ""
Write-Host "📖 Full deployment guide: DEPLOY_NOW.md" -ForegroundColor Yellow
Write-Host ""
Write-Host "✨ Good luck with your deployment!" -ForegroundColor Green
Write-Host ""
