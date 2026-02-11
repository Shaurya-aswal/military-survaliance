# 🚀 RAILWAY DEPLOYMENT - QUICK SETUP

## ⚠️ IMPORTANT: Railway CLI Upload Doesn't Support Git LFS

The `railway up` command uploads files directly and **doesn't fetch LFS files** from GitHub.

**Solution**: Connect Railway to your GitHub repository so it can fetch LFS models automatically.

---

## 🎯 COMPLETE THESE STEPS NOW:

### Step 1: Open Railway Dashboard
```bash
railway open
```
Or go to: https://railway.com/project/5df089ba-f18c-4c97-b1fd-dee18925bedd

### Step 2: Connect GitHub Repository

1. **Click on your "military" service** in the dashboard
2. **Click "Settings"** (gear icon)
3. **Scroll to "Source"** section
4. **Click "Connect GitHub Repository"**
5. **Select repository**: `Shaurya-aswal/military-survaliance`
6. **Root Directory**: `/backend`
7. **Branch**: `main`
8. **Click "Connect"**

### Step 3: Configure Build Settings

Railway should auto-detect Python, but verify:

1. **Build Command**: (leave empty - nixpacks.toml handles it)
2. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. **Root Directory**: `/backend`

### Step 4: Environment Variables

Already set via CLI:
- ✅ `MONGO_URL` = `mongodb+srv://aarav:Aarav3535@military.wevjz18.mongodb.net/?appName=military`

Verify in **Settings → Variables**.

### Step 5: Deploy

1. **Click "Deploy"** button
2. Railway will:
   - Clone from GitHub
   - Fetch Git LFS files automatically (models included!)
   - Install requirements-full.txt
   - Start the server

### Step 6: Get Deployment URL

Once deployed:
1. Go to **Settings → Domains**
2. Click **"Generate Domain"**
3. You'll get: `https://military-production.up.railway.app`

---

## 📊 What Railway Will Do

```
1. Clone GitHub repo ✅
2. Fetch LFS files (350MB models) ✅
3. Run nixpacks build:
   - Install Python 3.11
   - pip install -r requirements-full.txt
   - Install torch, ultralytics, fastapi, etc.
4. Start server: uvicorn main:app --host 0.0.0.0 --port $PORT
```

**Build time**: ~5-10 minutes (first time, includes model download + pip install)

---

## ✅ After Deployment

### Test Backend

```bash
# Check health endpoint
curl https://military-production.up.railway.app/health

# Expected response:
{
  "status": "ok",
  "device": "cpu",
  "mongodb": "connected",
  "yolo_loaded": true,
  "vit_loaded": true,
  "models": {
    "yolo": "yolov8n m.pt",
    "vit": "vit_classifier.pth"
  }
}
```

### Update Frontend

Update frontend environment variable in Vercel:

```bash
# Set VITE_API_BASE_URL
vercel env add VITE_API_BASE_URL production
# Value: https://military-production.up.railway.app

# Or update in Vercel dashboard:
# 1. Go to: https://vercel.com/dashboard
# 2. Select "military-surveillance" project
# 3. Settings → Environment Variables
# 4. Edit VITE_API_BASE_URL
# 5. Value: https://military-production.up.railway.app
# 6. Redeploy frontend
```

Then redeploy frontend:
```bash
cd ../home
vercel --prod
```

---

## 🐛 Troubleshooting

### Build Fails with "Out of Memory"

Railway free tier has 512MB RAM limit. If models loading fails:

**Solution**: Upgrade to Hobby plan ($5/month) with 8GB RAM

### Models Not Found

Check Railway logs:
```bash
railway logs
```

Look for:
```
[INFO] Loading YOLOv8 from: /app/model/yolov8n m.pt
[INFO] Loading ViT classifier from: /app/model/vit_classifier.pth
```

If missing, verify:
1. Git LFS is working: `git lfs ls-files` shows models
2. Railway connected to GitHub (not CLI upload)
3. Root directory is `/backend`

### Port Binding Error

Ensure start command uses `$PORT`:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Railway provides PORT environment variable automatically.

---

## 📦 Current Files

Your repository has:
```
✅ model/vit_classifier.pth (343MB) - Git LFS
✅ model/yolov8n m.pt (6.5MB) - Git LFS
✅ backend/requirements-full.txt - All dependencies
✅ backend/nixpacks.toml - Build config
✅ backend/railway.toml - Railway config
✅ backend/main.py - FastAPI server
```

---

## 💰 Cost

**Railway Free Tier**:
- $5 free credit/month
- 512MB RAM
- 1GB disk
- 100GB bandwidth

**Your Usage**:
- ~$3-4/month (within free tier) ✅
- Models: 350MB (fits in 1GB disk)
- RAM: May need upgrade if heavy use

**Upgrade if needed**: $5/month for 8GB RAM

---

## 🎯 Summary

**Current Status**: Railway project created, needs GitHub connection

**Next Steps**:
1. ✅ Open Railway dashboard: `railway open`
2. ⏳ Connect to GitHub repository
3. ⏳ Deploy from GitHub (models fetch automatically)
4. ⏳ Update frontend with Railway URL
5. ⏳ Test full application

**Timeline**: ~10 minutes total

---

## 🚀 Alternative: Deploy from GitHub Now

If you prefer CLI:

```bash
# Link service to GitHub repo (requires GitHub app permission)
railway link

# Deploy from GitHub (fetches LFS)
railway up --from-github
```

This will prompt you to connect GitHub if not already connected.

---

## Need Help?

**Railway Dashboard**: https://railway.com/project/5df089ba-f18c-4c97-b1fd-dee18925bedd
**Railway Docs**: https://docs.railway.app
**Your GitHub**: https://github.com/Shaurya-aswal/military-survaliance

**Quick Command**:
```bash
# Open dashboard and connect GitHub manually
railway open
```

**After GitHub connection**, Railway will automatically detect your nixpacks.toml and deploy with models! 🎉
