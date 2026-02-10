# 🚀 Quick Deployment Guide

## TL;DR

```bash
# 1. Upload models to Hugging Face
# 2. Get MongoDB Atlas connection string
# 3. Get Clerk production key
# 4. Run deployment script
./deploy.sh
```

---

## Option 1: Automated Deployment (Recommended)

### Prerequisites (5 minutes)

1. **Upload Models to Hugging Face** ([Guide](https://huggingface.co/docs))
   ```bash
   pip install huggingface_hub
   huggingface-cli login
   
   # Upload via Python
   python3 << 'EOF'
   from huggingface_hub import HfApi
   api = HfApi()
   api.upload_file("model/yolov8n m.pt", "yolov8n_m.pt", "YOUR_USERNAME/military-surveillance-models", repo_type="model")
   api.upload_file("model/vit_classifier.pth", "vit_classifier.pth", "YOUR_USERNAME/military-surveillance-models", repo_type="model")
   EOF
   ```

2. **Get MongoDB Atlas Connection** ([mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas))
   - Create free M0 cluster
   - Create user, whitelist `0.0.0.0/0`
   - Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/military_surveillance`

3. **Get Clerk Production Key** ([clerk.com](https://clerk.com))
   - Create app (or use existing)
   - Get production key: `pk_live_...`

### Deploy

```bash
./deploy.sh
```

Follow the interactive prompts. The script will:
- Deploy backend to Vercel
- Guide you through setting environment variables
- Deploy frontend to Vercel
- Configure API routing

---

## Option 2: Manual Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for step-by-step manual instructions.

---

## Post-Deployment

### 1. Update Clerk Redirect URLs
In Clerk Dashboard → Configure → Paths → Authorized redirect URLs:
- Add: `https://your-frontend.vercel.app`
- Add: `https://your-frontend.vercel.app/*`

### 2. Update Backend CORS
Edit `backend/main.py`:
```python
allow_origins=[
    "http://localhost:5173",
    "https://your-frontend.vercel.app",  # Add this
]
```

Redeploy:
```bash
cd backend && vercel --prod
```

### 3. Test Your Deployment

Visit: `https://your-frontend.vercel.app`

- [ ] Sign in works
- [ ] Image analysis works
- [ ] Video analysis works
- [ ] Detection history persists
- [ ] Map shows markers
- [ ] Activity feed updates

---

## Troubleshooting

### Backend 500 Error
```bash
# Check logs
cd backend
vercel logs --prod

# Verify environment variables
vercel env ls
```

### Frontend Can't Connect
- Check `VITE_API_BASE_URL` matches backend URL
- Check CORS settings in `backend/main.py`
- Open DevTools → Network tab

### Models Not Loading
- Verify Hugging Face repo is public
- Test URLs in browser (should download)
- Check backend logs for download errors

### Cold Start Timeout
Normal for Vercel serverless + ML models. Solutions:
- Upgrade to Vercel Pro (longer timeouts)
- Use cron job to ping backend every 5min
- Deploy to Railway instead (always-on)

---

## Alternative: Railway Deployment (Better for ML)

Railway is recommended for ML workloads (no cold starts, better for PyTorch):

```bash
npm i -g @railway/cli

cd backend
railway login
railway init
railway up

# Set env vars in Railway dashboard
# Always-on, no cold starts!
```

Free tier: $5 credit/month (~$15-20/month after)

---

## Need Help?

- **Full Guide**: See [`DEPLOYMENT.md`](DEPLOYMENT.md)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Issues**: Open a GitHub issue

---

## Environment Variables Reference

### Backend
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/military_surveillance
YOLO_WEIGHTS_URL=https://huggingface.co/YOUR_USER/military-surveillance-models/resolve/main/yolov8n_m.pt
VIT_WEIGHTS_URL=https://huggingface.co/YOUR_USER/military-surveillance-models/resolve/main/vit_classifier.pth
PYTHONUNBUFFERED=1
```

### Frontend
```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_live_...
VITE_API_BASE_URL=https://your-backend.vercel.app
```

---

## Cost Estimate

| Service | Free Tier | After Free |
|---------|-----------|------------|
| Vercel | 100GB/month | $20/month |
| MongoDB Atlas | 512MB | $9/month |
| Clerk | 10K MAU | $25/month |
| Hugging Face | Unlimited | Free |

**Total**: $0/month (free tier) → $54/month (production)
