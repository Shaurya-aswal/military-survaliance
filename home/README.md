# Military Surveillance

AI-powered military object detection using YOLOv8 and Vision Transformer (ViT) with geolocated threat mapping.

## Tech Stack

- **Backend**: FastAPI, YOLOv8, ViT-B/16, MongoDB, Motor
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui, Zustand
- **Auth**: Clerk
- **Map**: OpenLayers with CartoDB Dark Matter tiles

## Getting Started

```sh
# Clone the repository
git clone https://github.com/Shaurya-aswal/military-survaliance.git
cd military-survaliance

# Install frontend dependencies
cd home && npm install && cd ..

# Install backend dependencies
cd backend && pip install -r requirements.txt && cd ..

# Start everything
npm run dev:all
```

## Project Structure

- `home/` — Vite + React + TypeScript unified app (auth + dashboard)
- `backend/` — FastAPI server with YOLOv8 + ViT detection pipeline
- `model/` — Trained model weights

## Author

Built by [Shaurya](https://github.com/Shaurya-aswal)
