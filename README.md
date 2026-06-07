# 🎖️ Military Surveillance System

A comprehensive AI-powered surveillance system for military asset detection and classification using YOLOv8 and Vision Transformer (ViT).

## 🌟 Features

- **🎯 Real-time Object Detection**: YOLOv8-based detection for military assets
- **🧠 Advanced Classification**: Vision Transformer (ViT) for 10 military asset classes
- **📹 Video Analysis**: Frame-by-frame video processing with tracking
- **🗺️ Threat Mapping**: Interactive map with threat indicators
- **📊 Analytics Dashboard**: Real-time statistics and activity logs
- **🔒 Secure Authentication**: Clerk-based authentication system
- **☁️ Cloud Database**: MongoDB Atlas for data persistence

## 📋 Military Asset Classes

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

## 🏗️ Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React + Vite  │─────▶│  FastAPI Backend │─────▶│  MongoDB Atlas  │
│    Frontend     │      │   (Python 3.11)  │      │    Database     │
└─────────────────┘      └──────────────────┘      └─────────────────┘
                                  │
                          ┌───────┴───────┐
                          │               │
                     ┌────▼────┐    ┌─────▼─────┐
                     │ YOLOv8  │    │    ViT    │
                     │Detection│    │Classifier │
                     └─────────┘    └───────────┘
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Git LFS** (for model files)

### 1. Clone Repository

```bash
# Install Git LFS first
brew install git-lfs  # macOS
git lfs install

# Clone repository (models download automatically)
git clone https://github.com/Shaurya-aswal/military-survaliance.git
cd military-survaliance
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
pip install -r requirements-full.txt

# Set environment variables
export MONGO_URL="your_mongodb_connection_string"
export CLERK_PUBLISHABLE_KEY="your_clerk_key"

# Run server
python main.py
```

Server runs at: `http://localhost:8000`

### 3. Frontend Setup

```bash
cd home

# Install dependencies
npm install

# Set environment variables
# Create .env.local file:
echo "VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key" >> .env.local
echo "VITE_API_BASE_URL=http://localhost:8000" >> .env.local

# Run development server
npm run dev
```

Frontend runs at: `http://localhost:5173`

## 📦 Project Structure

```
military-survaliance/
├── backend/                # FastAPI backend
│   ├── main.py            # Main server file
│   ├── Dockerfile         # Docker configuration
│   ├── requirements-full.txt  # Full dependencies
│   └── requirements-hf.txt    # Hugging Face optimized
├── home/                  # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   └── lib/           # Utilities
│   └── public/
├── model/                 # ML models (Git LFS)
│   ├── yolov8n m.pt      # YOLOv8 weights (6.5 MB)
│   └── vit_classifier.pth # ViT weights (343 MB)
└── docs/                  # Documentation
```

## 🌐 Deployment

### Option 1: Hugging Face Spaces (Recommended) ⭐

**Pros**: Free, automatic Git LFS support, easy setup

```bash
# See docs/HF_SPACES_DEPLOY.md for detailed instructions
```

**Deploy at**: https://huggingface.co/new-space

### Option 2: Railway

**Pros**: $5/month free credit, supports Git LFS

```bash
# See docs/RAILWAY_DEPLOY_STEPS.md for instructions
railway init
railway up
```

### Option 3: Vercel (Frontend Only)

**Note**: Vercel has 250MB limit, use for frontend + database-only API

```bash
cd home
vercel --prod
```

## 🔑 Environment Variables

### Backend

```bash
MONGO_URL=mongodb+srv://...
CLERK_PUBLISHABLE_KEY=pk_...
PORT=8000  # Optional
```

### Frontend

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_...
VITE_API_BASE_URL=https://your-backend-url.com
```

## 📊 API Endpoints

### Health Check
```http
GET /health
```

### Image Analysis
```http
POST /detect/pipeline
Content-Type: multipart/form-data

image: file
```

### Video Analysis
```http
POST /detect/video
Content-Type: multipart/form-data

video: file
```

### Database Operations
```http
GET    /db/analyses           # Get all analyses
POST   /db/analyses           # Save analysis
DELETE /db/analyses           # Clear all
GET    /db/activity-logs      # Get activity logs
POST   /db/activity-logs      # Save activity log
```

## 🤖 Model Information

### YOLOv8 (Object Detection)
- **Size**: 6.5 MB
- **Format**: PyTorch (.pt)
- **Purpose**: Real-time object detection
- **Classes**: 80 COCO dataset classes

### ViT Classifier (Classification)
- **Size**: 343 MB
- **Format**: PyTorch (.pth)
- **Architecture**: Vision Transformer (ViT-B/16)
- **Purpose**: Military asset classification
- **Classes**: 10 military asset categories

**Models are tracked via Git LFS** - automatically downloaded when cloning.

## 🛠️ Tech Stack

### Frontend
- **React 18** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **Shadcn/ui** - UI components
- **React Router** - Navigation
- **Clerk** - Authentication
- **Leaflet** - Interactive maps

### Backend
- **FastAPI** - Web framework
- **PyTorch** - Deep learning
- **Ultralytics YOLOv8** - Object detection
- **Transformers** - ViT model
- **OpenCV** - Image processing
- **Motor** - Async MongoDB driver

### Database
- **MongoDB Atlas** - Cloud database

### Deployment
- **Docker** - Containerization
- **Hugging Face Spaces** - ML deployment
- **Vercel** - Frontend hosting
- **Git LFS** - Large file storage

## 🎨 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Detection Analysis
![Detection](docs/screenshots/detection.png)

### Threat Map
![Map](docs/screenshots/map.png)

## 📚 Documentation

Detailed guides available in `/docs`:

- **[HF_SPACES_DEPLOY.md](docs/HF_SPACES_DEPLOY.md)** - Hugging Face deployment
- **[RAILWAY_DEPLOY_STEPS.md](docs/RAILWAY_DEPLOY_STEPS.md)** - Railway deployment
- **[MODEL_MANAGEMENT.md](docs/MODEL_MANAGEMENT.md)** - Model hosting options
- **[GIT_LFS_SUCCESS.md](docs/GIT_LFS_SUCCESS.md)** - Git LFS setup guide
- **[FINAL_STATUS.md](docs/FINAL_STATUS.md)** - Project status

## 🐛 Troubleshooting

### Models Not Found
```bash
# Ensure Git LFS is installed and initialized
git lfs install
git lfs pull
```

### OpenCV Errors (Docker)
```dockerfile
# Add to Dockerfile:
RUN apt-get install -y libgl1 libglib2.0-0
```

### Port Already in Use
```bash
# Backend: Change PORT in .env or:
uvicorn main:app --port 8001

# Frontend: Update vite.config.ts:
server: { port: 5174 }
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/AmazingFeature`
3. Commit changes: `git commit -m 'Add AmazingFeature'`
4. Push to branch: `git push origin feature/AmazingFeature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Shaurya Aswal** - [@Shaurya-aswal](https://github.com/Shaurya-aswal)

## 🙏 Acknowledgments

- **YOLOv8** by Ultralytics
- **Vision Transformer** by Google Research
- **Shadcn/ui** for beautiful UI components
- **Clerk** for authentication
- **MongoDB** for database services

## 📈 Project Status

- ✅ Core detection & classification
- ✅ Frontend dashboard
- ✅ Database integration
- ✅ Authentication system
- ✅ Video analysis
- ✅ Deployment configurations
- 🚧 Real-time streaming (in progress)
- 🚧 Mobile app (planned)

## 🔗 Links

- **Live Demo**: Coming Soon
- **GitHub**: [https://github.com/Shaurya-aswal/military-survaliance](https://github.com/Shaurya-aswal/military-survaliance)
- **Documentation**: [/docs](docs/)

## 📞 Support

For issues and questions:
- Open an [issue](https://github.com/Shaurya-aswal/military-survaliance/issues)
- Email: shaurya.aswal12@gmail.com

---

**Made with ❤️ for military surveillance and defense applications**
