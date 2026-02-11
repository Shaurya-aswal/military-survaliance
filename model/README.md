# Military Surveillance Models

This directory contains the machine learning models for image and video analysis.

## Model Files

- `yolov8n m.pt` (165MB) - YOLOv8 object detection model
- `vit_classifier.pth` (~2.8GB) - Vision Transformer classifier for military asset classification

## 🚨 Important: Models NOT Included in Git Repository

Due to GitHub's file size limitations (100MB max), model files are **excluded from version control** via `.gitignore`.

## Download Options

### Option 1: Download Pre-trained Models (Recommended)

Run the automated download script:

```bash
cd backend
python download_models.py
```

This will download:
1. YOLOv8 nano model from Ultralytics
2. ViT classifier (if hosted on cloud storage)

### Option 2: Manual Download

#### YOLOv8 Model
```bash
pip install ultralytics
python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"
mv yolov8n.pt model/yolov8n\ m.pt
```

#### ViT Classifier
If you have access to the trained model, place it in:
```
model/vit_classifier.pth
```

### Option 3: Train Your Own Models

#### Train ViT Classifier
```bash
cd backend
python train_classifier.py
```

**Note**: Training requires:
- GPU with CUDA support (recommended)
- Military vehicle dataset
- ~4-6 hours training time

## Model Architecture

### YOLOv8 (Object Detection)
- **Purpose**: Real-time object detection
- **Classes**: Standard COCO dataset (80 classes)
- **Input**: 640x640 images
- **Framework**: Ultralytics

### ViT Classifier (Classification)
- **Purpose**: Military asset classification
- **Classes**: 10 categories
  1. Combat Tank
  2. Armored Vehicle
  3. Military Aircraft
  4. Naval Vessel
  5. Artillery System
  6. Infantry Unit
  7. Support Vehicle
  8. Communication Equipment
  9. Surveillance Drone
  10. Civilian Vehicle
- **Architecture**: Vision Transformer (ViT-B/16)
- **Framework**: PyTorch + timm

## File Structure

```
model/
├── README.md           # This file
├── yolov8n m.pt       # YOLOv8 detection model
└── vit_classifier.pth # ViT classification model
```

## Alternative Hosting Solutions

If you need to share models with your team:

### Hugging Face Hub (Recommended)
```bash
# Install huggingface_hub
pip install huggingface-hub

# Upload model
huggingface-cli upload your-username/military-surveillance model/vit_classifier.pth

# Download model
huggingface-cli download your-username/military-surveillance vit_classifier.pth --local-dir model/
```

### Google Drive / Dropbox
1. Upload models to cloud storage
2. Generate shareable links
3. Update `download_models.py` with direct download URLs

### AWS S3 / Cloud Storage
```bash
# Upload to S3
aws s3 cp model/vit_classifier.pth s3://your-bucket/models/

# Download from S3
aws s3 cp s3://your-bucket/models/vit_classifier.pth model/
```

## Deployment Notes

For production deployments:

- **Vercel/Netlify**: Cannot host large models (250MB limit)
- **Railway/Render**: Can host models up to 8GB
- **Docker**: Include models in container
- **Cloud Functions**: Load from cloud storage on cold start

## Troubleshooting

### "Model file not found" Error
```bash
# Verify files exist
ls -lh model/

# Expected output:
# -rw-r--r--  165M  yolov8n m.pt
# -rw-r--r--  2.8G  vit_classifier.pth
```

### Slow Model Loading
- Use SSD storage for faster I/O
- Consider model quantization to reduce size
- Cache models in memory after first load

## Security Notice

⚠️ **Do NOT commit model files to GitHub:**
- Exceeds file size limits (100MB)
- Increases repository size dramatically
- Slows down clone/push/pull operations
- May contain proprietary training data

Models are automatically excluded via `.gitignore`.

## Support

For model-related issues:
- Check `backend/main.py` for model loading code
- Verify PyTorch/CUDA installation
- Ensure sufficient disk space (4GB+ required)
