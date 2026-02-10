"""
Model downloader for deployment environments with size limits.
Run this before the main app starts to fetch models from external storage.
"""
import os
import urllib.request
from pathlib import Path

def download_file(url: str, dest: Path):
    """Download a file with progress reporting."""
    if dest.exists():
        print(f"✓ {dest.name} already exists, skipping download")
        return
    
    print(f"Downloading {dest.name} from {url}...")
    dest.parent.mkdir(parents=True, exist_ok=True)
    
    def progress_hook(block_num, block_size, total_size):
        downloaded = block_num * block_size
        percent = min(downloaded / total_size * 100, 100) if total_size > 0 else 0
        print(f"\r  Progress: {percent:.1f}%", end="", flush=True)
    
    try:
        urllib.request.urlretrieve(url, dest, reporthook=progress_hook)
        print(f"\n✓ Downloaded {dest.name} ({dest.stat().st_size / 1024 / 1024:.1f} MB)")
    except Exception as e:
        print(f"\n✗ Failed to download {dest.name}: {e}")
        if dest.exists():
            dest.unlink()
        raise

def main():
    """Download all required model files."""
    MODEL_DIR = Path("model")
    
    # Configure your model hosting URLs here
    # Example: Hugging Face, AWS S3, Google Cloud Storage, etc.
    MODELS = {
        "yolov8n_m.pt": os.getenv(
            "YOLO_WEIGHTS_URL",
            "https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt"  # Public fallback
        ),
        "vit_classifier.pth": os.getenv(
            "VIT_WEIGHTS_URL",
            ""  # You must set this via environment variable
        ),
    }
    
    for filename, url in MODELS.items():
        if not url:
            print(f"⚠ Warning: No URL configured for {filename}")
            print(f"   Set {filename.upper().replace('.', '_').replace(' ', '_')}_URL environment variable")
            continue
        
        dest = MODEL_DIR / filename
        try:
            download_file(url, dest)
        except Exception as e:
            print(f"Error downloading {filename}: {e}")
            # Continue anyway - the app will catch missing models

if __name__ == "__main__":
    main()
