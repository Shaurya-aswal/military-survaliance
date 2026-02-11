# 🚀 Model Upload & Deployment Guide

## Quick Start: Upload Models to Hugging Face

### Step 1: Get Hugging Face Token

1. Go to: https://huggingface.co/settings/tokens
2. Click **"New token"**
3. Name: `military-surveillance-upload`
4. Role: **Write** (to upload models)
5. Click **"Generate"**
6. Copy the token (starts with `hf_...`)

### Step 2: Upload Models

```bash
cd "/Users/apple/Desktop/military survaliance"
python upload_models_to_hf.py
```

When prompted, paste your Hugging Face token.

**What gets uploaded:**
- ✅ `vit_classifier.pth` (327MB)
- ✅ `yolov8n m.pt` (6.2MB)
- ✅ `model/README.md` (documentation)

### Step 3: Verify Upload

After upload completes, visit:
```
https://huggingface.co/Shaurya-aswal/military-surveillance-models
```

You should see your 3 files!

---

## For Railway/Render Deployment (With ML Support)

Once models are uploaded to Hugging Face, your backend can download them automatically on startup.

### Option A: Railway (Recommended)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Create new project
cd backend
railway init

# 4. Set environment variables
railway variables set MONGO_URL="your_mongodb_connection_string"
railway variables set HF_MODEL_REPO="Shaurya-aswal/military-surveillance-models"

# 5. Deploy
railway up
```

**Railway advantages:**
- ✅ 8GB RAM (enough for models)
- ✅ 100GB storage (enough for model download)
- ✅ $5/month free credit
- ✅ Automatic HTTPS

### Option B: Render

1. Go to https://render.com/
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo: `Shaurya-aswal/military-survaliance`
4. Configure:
   - **Name**: `military-surveillance-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements-full.txt && python download_models.py`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add Environment Variables:
   - `MONGO_URL`: Your MongoDB connection string
   - `HF_MODEL_REPO`: `Shaurya-aswal/military-surveillance-models`
6. Click **"Create Web Service"**

**Render advantages:**
- ✅ Free tier available
- ✅ 512MB RAM (tight but works)
- ✅ Auto-deploy from GitHub

---

## Update Backend to Auto-Download Models

The `backend/download_models.py` is already updated! It will:

1. Check if models exist locally
2. If not, download from Hugging Face
3. Cache them for future use

### Add to `main.py` startup:

```python
from download_models import download_from_huggingface
import asyncio

@app.on_event("startup")
async def startup_event():
    """Download models on startup if not present"""
    print("🚀 Starting Military Surveillance API...")
    
    # Check and download models
    if not Path("model/vit_classifier.pth").exists():
        print("📥 Models not found, downloading...")
        await asyncio.to_thread(download_from_huggingface)
    else:
        print("✅ Models already present")
```

---

## Model Download Performance

| Deployment | First Start | Subsequent Starts |
|------------|-------------|-------------------|
| **Railway** | ~3-5 min (download 333MB) | ~10 sec (cached) |
| **Render** | ~3-5 min (download 333MB) | ~10 sec (cached) |
| **Vercel** | ❌ Not supported (250MB limit) | ❌ |
| **Local** | Instant (models local) | Instant |

---

## Testing Model Download

Test locally before deployment:

```bash
# 1. Temporarily move models
mv model model_backup

# 2. Test download
cd backend
python download_models.py

# 3. Verify
ls -lh model/
# Should see:
# vit_classifier.pth  (~327MB)
# yolov8n m.pt        (~6.2MB)

# 4. Restore (optional)
rm -rf model
mv model_backup model
```

---

## Environment Variables Needed

### For Hugging Face Upload (One-time)
```bash
# None needed if using the upload script interactively
# It will prompt for token
```

### For Backend Deployment
```bash
# Required
MONGO_URL="mongodb+srv://username:password@cluster.mongodb.net/database"

# Optional (uses default if not set)
HF_MODEL_REPO="Shaurya-aswal/military-surveillance-models"
```

---

## Cost Comparison

| Service | Free Tier | ML Support | Cost (with ML) |
|---------|-----------|------------|----------------|
| **Hugging Face** | ✅ Unlimited model storage | N/A | **FREE** |
| **Railway** | ✅ $5/month credit | ✅ | ~$5/month |
| **Render** | ✅ 750 hours/month | ✅ | FREE (with limits) |
| **Vercel** | ✅ Unlimited | ❌ | FREE (DB only) |

---

## Deployment Architecture

### Current (Vercel - Database Only)
```
Frontend (Vercel) → Backend (Vercel) → MongoDB Atlas
                         ↓
                    ❌ No ML models
```

### Recommended (Railway - Full Stack)
```
Frontend (Vercel) → Backend (Railway) → MongoDB Atlas
                         ↓
                    Hugging Face (models)
                         ↓
                    ✅ Full ML inference
```

---

## Full Deployment Checklist

- [ ] **Upload models to Hugging Face** ← START HERE
  ```bash
  python upload_models_to_hf.py
  ```

- [ ] **Verify models uploaded**
  - Visit: https://huggingface.co/Shaurya-aswal/military-surveillance-models

- [ ] **Choose deployment platform**
  - Railway (recommended) or Render

- [ ] **Deploy backend with ML support**
  - Set `HF_MODEL_REPO` environment variable
  - Backend will auto-download models on first start

- [ ] **Update frontend API URL**
  - Point `VITE_API_BASE_URL` to new backend
  - Redeploy frontend on Vercel

- [ ] **Test ML endpoints**
  - `/detect/pipeline` - Image analysis
  - `/detect/video` - Video analysis

---

## Troubleshooting

### "Failed to download from Hugging Face"
```bash
# Check if repository exists
# Go to: https://huggingface.co/Shaurya-aswal/military-surveillance-models

# Make sure repository is public OR you're logged in
huggingface-cli login
```

### "Out of memory" on deployment
- Upgrade Railway plan ($5/month for more RAM)
- Or optimize model (quantization)

### "Models too large for Render free tier"
- Use Railway instead (better free tier)
- Or upgrade Render plan

---

## Next Steps

1. **Run the upload script NOW:**
   ```bash
   python upload_models_to_hf.py
   ```

2. **Deploy to Railway for full ML support:**
   ```bash
   railway init
   railway up
   ```

3. **Update frontend to use new backend URL**

4. **Test complete application with ML inference**

---

## Support

- Hugging Face issues: https://huggingface.co/docs
- Railway docs: https://docs.railway.app
- Render docs: https://render.com/docs

**You're almost there! Just run the upload script and deploy to Railway.** 🚀
