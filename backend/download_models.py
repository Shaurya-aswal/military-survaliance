"""
Model downloader for deployment environments with size limits.
Downloads models from Hugging Face Hub on deployment.
"""
import os
from pathlib import Path

def download_from_huggingface():
    """Download models from Hugging Face Hub."""
    try:
        from huggingface_hub import hf_hub_download
    except ImportError:
        print("❌ huggingface-hub not installed. Install with: pip install huggingface-hub")
        return False
    
    MODEL_DIR = Path("model")
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    
    # Configuration - set via environment variable or use default
    REPO_ID = os.getenv("HF_MODEL_REPO", "Shaurya-aswal/military-surveillance-models")
    
    models = [
        "vit_classifier.pth",
        "yolov8n m.pt"
    ]
    
    print("=" * 60)
    print("📥 Downloading models from Hugging Face Hub")
    print(f"📦 Repository: {REPO_ID}")
    print("=" * 60)
    
    success = True
    for model_name in models:
        dest = MODEL_DIR / model_name
        
        if dest.exists():
            size_mb = dest.stat().st_size / 1024 / 1024
            print(f"✅ {model_name} already exists ({size_mb:.1f} MB)")
            continue
        
        print(f"\n📥 Downloading {model_name}...")
        try:
            downloaded_path = hf_hub_download(
                repo_id=REPO_ID,
                filename=model_name,
                local_dir=str(MODEL_DIR),
                local_dir_use_symlinks=False
            )
            size_mb = Path(downloaded_path).stat().st_size / 1024 / 1024
            print(f"✅ Downloaded {model_name} ({size_mb:.1f} MB)")
        except Exception as e:
            print(f"❌ Failed to download {model_name}: {e}")
            print(f"   Make sure the repository exists: https://huggingface.co/{REPO_ID}")
            success = False
    
    print("\n" + "=" * 60)
    if success:
        print("✅ All models downloaded successfully!")
    else:
        print("⚠️  Some models failed to download")
    print("=" * 60)
    
    return success

def main():
    """Download all required model files."""
    # Try Hugging Face first (recommended)
    if download_from_huggingface():
        return
    
    # Fallback: Direct URLs (if you host elsewhere)
    print("\n💡 Alternative: Set up direct download URLs")
    print("   Set HF_MODEL_REPO environment variable to your Hugging Face repo")
    print("   Example: export HF_MODEL_REPO='your-username/your-model-repo'")

if __name__ == "__main__":
    main()
