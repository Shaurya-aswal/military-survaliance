#!/bin/bash

# 🚀 Automated Vercel Deployment Script
# This script guides you through deploying the Military Surveillance app to Vercel

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   🚀 Military Surveillance - Vercel Deployment Script         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠ Vercel CLI not found. Installing...${NC}"
    npm install -g vercel
fi

echo -e "${BLUE}📋 Pre-Deployment Checklist:${NC}"
echo ""
echo "Before deploying, make sure you have:"
echo "  ✓ MongoDB Atlas connection string"
echo "  ✓ Clerk production publishable key (pk_live_...)"
echo "  ✓ Model files uploaded to Hugging Face (or other hosting)"
echo ""
read -p "Have you completed these steps? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Please complete the prerequisites first.${NC}"
    echo "See DEPLOYMENT.md for detailed instructions."
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Prerequisites confirmed${NC}"
echo ""

# Deploy Backend
echo "═══════════════════════════════════════════════════════════════"
echo "  STEP 1: Deploy Backend"
echo "═══════════════════════════════════════════════════════════════"
echo ""
read -p "Deploy backend to Vercel? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    echo -e "${BLUE}🚀 Deploying backend...${NC}"
    vercel --prod
    
    echo ""
    echo -e "${YELLOW}📝 Now set environment variables for backend:${NC}"
    echo "Run these commands (replace with your actual values):"
    echo ""
    echo -e "${GREEN}vercel env add MONGODB_URI production${NC}"
    echo -e "${GREEN}vercel env add YOLO_WEIGHTS_URL production${NC}"
    echo -e "${GREEN}vercel env add VIT_WEIGHTS_URL production${NC}"
    echo -e "${GREEN}vercel env add PYTHONUNBUFFERED production${NC}"
    echo ""
    read -p "Press Enter after setting environment variables..." 
    
    echo -e "${BLUE}🔄 Redeploying with environment variables...${NC}"
    vercel --prod
    
    echo ""
    echo -e "${GREEN}✓ Backend deployed successfully!${NC}"
    echo -e "${YELLOW}📋 Save your backend URL, you'll need it for frontend deployment.${NC}"
    cd ..
else
    echo -e "${YELLOW}⏭ Skipping backend deployment${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  STEP 2: Deploy Frontend"
echo "═══════════════════════════════════════════════════════════════"
echo ""

read -p "Enter your backend URL (from Step 1): " BACKEND_URL
if [ -z "$BACKEND_URL" ]; then
    echo -e "${RED}❌ Backend URL is required${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}📝 Updating frontend configuration...${NC}"

# Update vercel.json with backend URL
cat > home/vercel.json << EOF
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "$BACKEND_URL/:path*"
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
EOF

echo -e "${GREEN}✓ Updated home/vercel.json with backend URL${NC}"

read -p "Deploy frontend to Vercel? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd home
    echo -e "${BLUE}🚀 Deploying frontend...${NC}"
    vercel --prod
    
    echo ""
    echo -e "${YELLOW}📝 Now set environment variables for frontend:${NC}"
    echo "Run these commands (replace with your actual values):"
    echo ""
    echo -e "${GREEN}vercel env add VITE_CLERK_PUBLISHABLE_KEY production${NC}"
    echo -e "${GREEN}vercel env add VITE_API_BASE_URL production${NC}"
    echo "  (Use: $BACKEND_URL)"
    echo ""
    read -p "Press Enter after setting environment variables..." 
    
    echo -e "${BLUE}🔄 Redeploying with environment variables...${NC}"
    vercel --prod
    
    echo ""
    echo -e "${GREEN}✓ Frontend deployed successfully!${NC}"
    cd ..
else
    echo -e "${YELLOW}⏭ Skipping frontend deployment${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   🎉 Deployment Complete!                                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Your app is now live!${NC}"
echo ""
echo -e "${YELLOW}⚠ Don't forget to:${NC}"
echo "  1. Update Clerk authorized redirect URLs with your Vercel frontend URL"
echo "  2. Update backend CORS settings to include your frontend URL"
echo "  3. Test all features (auth, image analysis, video analysis, map)"
echo ""
echo "See DEPLOYMENT.md for detailed troubleshooting and next steps."
echo ""
