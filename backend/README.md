---
title: Military Surveillance Backend
emoji: 🎖️
colorFrom: red
colorTo: blue
sdk: docker
pinned: false
license: mit
app_port: 7860
---

# Military Surveillance Backend

FastAPI backend with YOLOv8 object detection and ViT classification for military asset analysis.

## Features

- 🎯 **Object Detection**: YOLOv8 for real-time detection
- 🧠 **Classification**: Vision Transformer for military asset classification
- 📹 **Video Analysis**: Frame-by-frame video processing
- 🗄️ **Database**: MongoDB integration for persistence
- 🔒 **Authentication**: Clerk integration

## Models

- **YOLOv8**: `model/yolov8n m.pt` (6.5 MB)
- **ViT Classifier**: `model/vit_classifier.pth` (343 MB)

Models are automatically downloaded via Git LFS when the Space is built.

## API Endpoints

### Health Check
```bash
GET /health
```

### Image Analysis
```bash
POST /detect/pipeline
Content-Type: multipart/form-data
Body: image file
```

### Video Analysis
```bash
POST /detect/video
Content-Type: multipart/form-data
Body: video file
```

### Database Endpoints
- `GET /db/analyses` - Get all analyses
- `POST /db/analyses` - Save analysis
- `DELETE /db/analyses` - Clear all analyses
- `GET /db/activity-logs` - Get activity logs
- `POST /db/activity-logs` - Save activity log

## Environment Variables

Set these in Hugging Face Spaces settings:

```bash
MONGO_URL=mongodb+srv://...
CLERK_PUBLISHABLE_KEY=pk_...
```

## Local Development

```bash
# Install dependencies
pip install -r requirements-hf.txt

# Run server
uvicorn main:app --host 0.0.0.0 --port 7860
```

## Deployment

This Space uses Docker with:
- Python 3.11
- PyTorch CPU-only (optimized for size)
- OpenCV headless
- Non-root user (UID 1000)
- Port 7860 (Hugging Face standard)

## Repository

Source code: [https://github.com/Shaurya-aswal/military-survaliance](https://github.com/Shaurya-aswal/military-survaliance)
