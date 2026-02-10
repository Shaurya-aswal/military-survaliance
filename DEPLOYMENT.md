# 🚀 Vercel Deployment Guide

## ⚠️ Important: Model Files Are Too Large for Vercel

Vercel has a **250MB deployment size limit**. Your model files exceed this:
- `yolov8n m.pt` (~6MB)
- `vit_classifier.pth` (~85MB)

**Solution**: Host models externally and download them on startup.

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas** - Free tier at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
3. **Clerk Account** - For authentication at [clerk.com](https://clerk.com)
4. **Model Hosting** - Hugging Face (recommended), AWS S3, or Google Cloud Storage

---

## Step 1: Upload Models to Hugging Face (Free & Recommended)

### 1.1 Create Hugging Face Account
Go to [huggingface.co](https://huggingface.co) and sign up.

### 1.2 Create a Model Repository
1. Go to https://huggingface.co/new
2. Repository type: **Model**
3. Repository name: `military-surveillance-models`
4. Make it **Public** (or Private if you have Pro)

### 1.3 Upload Model Files

**Option A: Via Web Interface**
1. Go to your repo: `https://huggingface.co/YOUR_USERNAME/military-surveillance-models`
2. Click "Add file" → "Upload files"
3. Upload both:
   - `model/yolov8n m.pt`
   - `model/vit_classifier.pth`

**Option B: Via CLI (Recommended)**
```bash
# Install Hugging Face CLI
pip install huggingface_hub

# Login
huggingface-cli login
# Paste your access token (get from https://huggingface.co/settings/tokens)

# Upload models
cd "/Users/apple/Desktop/military survaliance"

python3 << 'EOF'
from huggingface_hub import HfApi
api = HfApi()

# Replace YOUR_USERNAME with your actual username
repo_id = "YOUR_USERNAME/military-surveillance-models"

# Upload YOLO weights
print("Uploading YOLO weights...")
api.upload_file(
    path_or_fileobj="model/yolov8n m.pt",
    path_in_repo="yolov8n_m.pt",
    repo_id=repo_id,
    repo_type="model"
)

# Upload ViT weights
print("Uploading ViT classifier...")
api.upload_file(
    path_or_fileobj="model/vit_classifier.pth",
    path_in_repo="vit_classifier.pth",
    repo_id=repo_id,
    repo_type="model"
)
print("✓ All models uploaded!")
EOF
```

Your model URLs will be:
- YOLO: `https://huggingface.co/YOUR_USERNAME/military-surveillance-models/resolve/main/yolov8n_m.pt`
- ViT: `https://huggingface.co/YOUR_USERNAME/military-surveillance-models/resolve/main/vit_classifier.pth`

---

## Step 2: Set Up MongoDB Atlas

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a **Free M0 cluster**
3. Create database user:
   - Username: `military_surveillance_user`
   - Password: (generate a strong password)
4. Network Access → Add IP: `0.0.0.0/0` (allow from anywhere)
5. Get connection string:
   ```
   mongodb+srv://military_surveillance_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/military_surveillance
   ```

---

## Step 3: Set Up Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application (or use existing)
3. Get your **Production** publishable key (starts with `pk_live_...`)
4. Note: You'll add Vercel URLs to authorized redirects after deployment

---

## Step 4: Deploy Backend to Vercel

### 4.1 Install Vercel CLI
```bash
npm install -g vercel
```

### 4.2 Deploy Backend
```bash
cd "/Users/apple/Desktop/military survaliance/backend"

# Deploy to Vercel
vercel

# Follow the prompts:
# ✓ Set up and deploy? → Y
# ✓ Which scope? → [Your account]
# ✓ Link to existing project? → N
# ✓ What's your project's name? → military-surveillance-backend
# ✓ In which directory is your code located? → ./
# ✓ Want to override the settings? → N
```

**You'll get a URL like**: `https://military-surveillance-backend-abc123.vercel.app`

### 4.3 Set Backend Environment Variables

Replace placeholders with your actual values:

```bash
# MongoDB connection string
vercel env add MONGODB_URI production
# Paste: mongodb+srv://military_surveillance_user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/military_surveillance

# YOLO model URL (from Step 1.3)
vercel env add YOLO_WEIGHTS_URL production
# Paste: https://huggingface.co/YOUR_USERNAME/military-surveillance-models/resolve/main/yolov8n_m.pt

# ViT model URL (from Step 1.3)
vercel env add VIT_WEIGHTS_URL production
# Paste: https://huggingface.co/YOUR_USERNAME/military-surveillance-models/resolve/main/vit_classifier.pth

# Python config
vercel env add PYTHONUNBUFFERED production
# Value: 1

# Redeploy with environment variables
vercel --prod
```

### 4.4 Test Backend
```bash
# Replace with your actual URL
curl https://your-backend-url.vercel.app/health

# Should return:
# {"status":"ok","device":"cpu","mongodb":"connected"}
```

---

## Step 5: Deploy Frontend to Vercel

### 5.1 Update Frontend Configuration

Edit `home/vercel.json` and replace `YOUR_BACKEND_URL` with your actual backend URL:
```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://military-surveillance-backend-abc123.vercel.app/:path*"
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### 5.2 Deploy Frontend
```bash
cd "/Users/apple/Desktop/military survaliance/home"

# Deploy to Vercel
vercel

# Follow the prompts:
# ✓ Set up and deploy? → Y
# ✓ Which scope? → [Your account]
# ✓ Link to existing project? → N
# ✓ What's your project's name? → military-surveillance
# ✓ In which directory is your code located? → ./
# ✓ Want to override the settings? → N
```

**You'll get a URL like**: `https://military-surveillance-xyz789.vercel.app`

### 5.3 Set Frontend Environment Variables

```bash
# Clerk production key
vercel env add VITE_CLERK_PUBLISHABLE_KEY production
# Paste: pk_live_YOUR_PRODUCTION_KEY

# Backend API URL (from Step 4.2)
vercel env add VITE_API_BASE_URL production
# Value: https://military-surveillance-backend-abc123.vercel.app

# Redeploy with environment variables
vercel --prod
```

---

## Step 6: Configure Clerk Redirect URLs

1. Go to Clerk Dashboard → Your app → **Configure** → **Paths**
2. Add to **Authorized redirect URLs**:
   - `https://your-frontend-url.vercel.app`
   - `https://your-frontend-url.vercel.app/dashboard`
   - `https://your-frontend-url.vercel.app/*`

---

## Step 7: Update Backend CORS

The backend needs to allow your frontend URL. Update `backend/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://your-frontend-url.vercel.app",  # Add your Vercel URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Then redeploy backend:
```bash
cd "/Users/apple/Desktop/military survaliance/backend"
vercel --prod
```

---

## 🎉 Your App is Live!

Visit: `https://your-frontend-url.vercel.app`

### Test Checklist:
- [ ] Frontend loads
- [ ] Can sign in with Clerk
- [ ] Image analysis works
- [ ] Video analysis works
- [ ] Detection history persists (refresh page, data still there)
- [ ] Threat map shows markers
- [ ] Activity feed updates

---

## 🐛 Troubleshooting

### Backend Returns 500 Error
- Check Vercel logs: `vercel logs`
- Ensure all environment variables are set correctly
- Verify model URLs are publicly accessible

### Frontend Can't Connect to Backend
- Check CORS settings in `backend/main.py`
- Verify `VITE_API_BASE_URL` matches backend URL
- Open browser DevTools → Network tab to see actual requests

### Models Not Loading
- Check backend logs for download errors
- Verify Hugging Face model repo is public
- Test model URLs in browser (should download files)

### Authentication Not Working
- Check Clerk authorized redirect URLs
- Verify `VITE_CLERK_PUBLISHABLE_KEY` is production key (starts with `pk_live_`)

### Cold Start Timeout (First Request Takes 30+ Seconds)
This is normal for Vercel serverless functions with ML models. Solutions:
- Upgrade to Vercel Pro (longer timeouts)
- Use a cron job to ping backend every 5 minutes
- Deploy backend to Railway/Render instead (always-on)

---

## 💰 Cost Estimate

| Service | Free Tier | Cost After |
|---------|-----------|------------|
| **Vercel** | 100GB bandwidth/month, 100 builds/month | $20/month Pro |
| **MongoDB Atlas** | 512MB storage | $9/month (2GB) |
| **Clerk** | 10,000 MAU | $25/month |
| **Hugging Face** | Unlimited public models | Free forever |

**Total**: $0/month (free tiers) → $54/month (production with traffic)

---

## 🔄 Updating Your Deployment

After making code changes:

```bash
# Backend
cd backend
git add .
git commit -m "Update backend"
git push
vercel --prod

# Frontend
cd ../home
git add .
git commit -m "Update frontend"
git push
vercel --prod
```

---

## 🚀 Alternative: Deploy Backend to Railway (Recommended for ML)

Vercel serverless has limitations for ML workloads (cold starts, timeouts). **Railway** is better:

```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy backend
cd backend
railway login
railway init
railway up

# Set environment variables in Railway dashboard
# Deploy is always-on, no cold starts!
```

Railway free tier: $5 credit/month → ~$15-20/month for ML backend

---

## 📝 Quick Command Reference

```bash
# Check deployment status
vercel ls

# View logs
vercel logs <deployment-url>

# Roll back to previous deployment
vercel rollback

# Remove a deployment
vercel remove <deployment-url>

# Check environment variables
vercel env ls
```

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Clerk Docs: https://clerk.com/docs
- MongoDB Atlas Docs: https://www.mongodb.com/docs/atlas/
- Hugging Face Docs: https://huggingface.co/docs

Good luck with your deployment! 🎯
