# Model Management Guide

## ⚠️ Why Models Are NOT in GitHub

Your model files are **intentionally excluded** from the Git repository because:

1. **GitHub Limits**: 100MB max file size, your models are 3GB+
2. **Git Performance**: Large binary files slow down clone/push/pull operations
3. **Repository Bloat**: Git tracks every version of binary files, making repo huge
4. **Best Practice**: Models belong in specialized storage (Hugging Face, S3, etc.)

## Current Status

✅ Models are properly excluded via `.gitignore`:
```
model/*.pt
model/*.pth
```

✅ Your GitHub repository is clean and fast (no large files)

## How to Share Models with Your Team

### Option 1: Hugging Face Hub (RECOMMENDED) ⭐

**Pros**: Free, versioning, fast CDN, ML-focused, public/private repos

**Setup**:
```bash
# 1. Install Hugging Face CLI
pip install huggingface-hub

# 2. Login (one-time)
huggingface-cli login

# 3. Create a repository on https://huggingface.co/new

# 4. Upload models
huggingface-cli upload your-username/military-surveillance-models \
  model/vit_classifier.pth vit_classifier.pth

huggingface-cli upload your-username/military-surveillance-models \
  "model/yolov8n m.pt" yolov8n_m.pt
```

**Download** (for team members):
```bash
# In your project
huggingface-cli download your-username/military-surveillance-models \
  --local-dir model/
```

**Update `download_models.py`**:
```python
from huggingface_hub import hf_hub_download

hf_hub_download(
    repo_id="your-username/military-surveillance-models",
    filename="vit_classifier.pth",
    local_dir="model/"
)
```

---

### Option 2: Google Drive

**Pros**: Free 15GB storage, easy sharing

**Upload**:
1. Upload models to Google Drive
2. Right-click → Share → Get link
3. Make sure "Anyone with the link can view" is enabled
4. Copy the file ID from URL: `https://drive.google.com/file/d/FILE_ID/view`

**Download** (automated):
```bash
# Install gdown
pip install gdown

# Download via script
gdown https://drive.google.com/uc?id=FILE_ID -O model/vit_classifier.pth
```

**Update `download_models.py`**:
```python
import gdown

# ViT Classifier
gdown.download(
    "https://drive.google.com/uc?id=YOUR_FILE_ID",
    "model/vit_classifier.pth",
    quiet=False
)

# YOLOv8
gdown.download(
    "https://drive.google.com/uc?id=YOUR_FILE_ID",
    "model/yolov8n m.pt",
    quiet=False
)
```

---

### Option 3: AWS S3 / Cloud Storage

**Pros**: Scalable, fast, programmatic access

**Upload to S3**:
```bash
# Configure AWS CLI first
aws configure

# Upload models
aws s3 cp model/vit_classifier.pth s3://your-bucket/models/vit_classifier.pth --acl public-read
aws s3 cp "model/yolov8n m.pt" s3://your-bucket/models/yolov8n_m.pt --acl public-read

# Get public URL
aws s3 presign s3://your-bucket/models/vit_classifier.pth --expires-in 604800
```

**Update `download_models.py`**:
```python
import boto3

s3 = boto3.client('s3')
s3.download_file('your-bucket', 'models/vit_classifier.pth', 'model/vit_classifier.pth')
```

---

### Option 4: Git LFS (NOT Recommended for 3GB files)

**Why avoid**: Still has size limits, requires special setup for all collaborators

**Only if necessary**:
```bash
# Install Git LFS
git lfs install

# Track model files
git lfs track "model/*.pt"
git lfs track "model/*.pth"

# Commit and push
git add .gitattributes model/
git commit -m "Add models via Git LFS"
git push
```

**Costs**: Free tier only supports 1GB storage, 1GB bandwidth/month

---

## Deployment Strategies

### For Vercel/Netlify (Serverless)
❌ **Cannot deploy with models** (250MB limit)

**Solution**: Download on startup
```python
# In api/index.py
@app.on_event("startup")
async def startup():
    if not Path("model/vit_classifier.pth").exists():
        download_models()
```

⚠️ **Issue**: Cold starts will be very slow (3GB download)

**Better**: Deploy database-only API (current approach)

### For Railway/Render/Heroku
✅ **Can include models** (supports larger deployments)

**Add to `Dockerfile`**:
```dockerfile
# Download models during build
RUN python download_models.py
```

### For Docker
✅ **Include models in image**

```dockerfile
# Copy models
COPY model/ /app/model/

# Or download during build
RUN python download_models.py
```

---

## Quick Start for New Team Members

1. **Clone the repository** (no models, fast!):
   ```bash
   git clone https://github.com/Shaurya-aswal/military-survaliance.git
   cd military-survaliance
   ```

2. **Download models**:
   ```bash
   # Option A: Automated (if configured)
   cd backend
   python download_models.py
   
   # Option B: From Hugging Face
   huggingface-cli download your-username/military-surveillance-models --local-dir model/
   
   # Option C: From shared drive
   # Download manually from Google Drive link
   ```

3. **Verify**:
   ```bash
   ls -lh model/
   # Should see:
   # vit_classifier.pth  (~2.8GB)
   # yolov8n m.pt        (~165MB)
   ```

---

## Creating a Model Registry

For professional projects, consider setting up a model registry:

### DVC (Data Version Control)
```bash
# Install DVC
pip install dvc

# Initialize
dvc init

# Add remote storage
dvc remote add -d storage s3://your-bucket/models

# Track models
dvc add model/vit_classifier.pth
git add model/vit_classifier.pth.dvc

# Push to remote
dvc push
```

Team members can then:
```bash
git pull
dvc pull  # Downloads models from S3
```

### MLflow Model Registry
```python
import mlflow

# Log model
mlflow.pytorch.log_model(model, "vit_classifier")

# Load model
model = mlflow.pytorch.load_model("models:/vit_classifier/production")
```

---

## Summary

| Method | Free Tier | Max Size | Speed | Recommended |
|--------|-----------|----------|-------|-------------|
| Hugging Face | ✅ Unlimited | Unlimited | ⚡ Fast | ⭐⭐⭐⭐⭐ |
| Google Drive | ✅ 15GB | 15GB | 🐌 Medium | ⭐⭐⭐⭐ |
| AWS S3 | ❌ 5GB/month | Unlimited | ⚡⚡ Very Fast | ⭐⭐⭐ |
| Git LFS | ❌ 1GB | Varies | 🐌 Slow | ⭐ |
| Git (regular) | ❌ 100MB limit | 100MB | ❌ Fails | ❌ |

## Action Plan

**Choose ONE and execute**:

### 🏆 RECOMMENDED: Hugging Face
```bash
# 1. Create account: https://huggingface.co/join
# 2. Run these commands:
pip install huggingface-hub
huggingface-cli login
huggingface-cli upload your-username/military-surveillance-models model/ --repo-type model
```

Then share repository link with your team: `https://huggingface.co/your-username/military-surveillance-models`

---

## Need Help?

- Hugging Face setup issues: Check [HF documentation](https://huggingface.co/docs/hub/models-uploading)
- Google Drive API: Check [gdown docs](https://github.com/wkentaro/gdown)
- AWS S3: Check [boto3 docs](https://boto3.amazonaws.com/v1/documentation/api/latest/guide/s3.html)

**Remember**: Never commit large model files to Git! Your current setup is correct. ✅
