#!/usr/bin/env python3
"""
Upload models to Hugging Face Hub
Run this once to upload your models, then they can be downloaded on deployment
"""

from huggingface_hub import HfApi, create_repo, login
import os
from pathlib import Path

def main():
    print("=" * 60)
    print("🚀 Upload Models to Hugging Face Hub")
    print("=" * 60)
    
    # Configuration
    REPO_ID = "Shaurya-aswal/military-surveillance-models"  # Change username if needed
    MODEL_DIR = Path("model")
    
    # Models to upload
    models = [
        "vit_classifier.pth",
        "yolov8n m.pt",
        "README.md"
    ]
    
    print("\n📋 Models to upload:")
    for model in models:
        model_path = MODEL_DIR / model
        if model_path.exists():
            size_mb = model_path.stat().st_size / 1024 / 1024
            print(f"  ✅ {model} ({size_mb:.1f} MB)")
        else:
            print(f"  ❌ {model} (NOT FOUND)")
    
    # Step 1: Login
    print("\n" + "=" * 60)
    print("📝 STEP 1: Login to Hugging Face")
    print("=" * 60)
    print("\nIf you don't have a token:")
    print("1. Go to: https://huggingface.co/settings/tokens")
    print("2. Click 'New token'")
    print("3. Name: 'military-surveillance-upload'")
    print("4. Role: 'Write' (to upload models)")
    print("5. Copy the token\n")
    
    token = input("Paste your Hugging Face token (or press Enter if already logged in): ").strip()
    
    if token:
        try:
            login(token=token, add_to_git_credential=True)
            print("✅ Logged in successfully!")
        except Exception as e:
            print(f"❌ Login failed: {e}")
            return
    else:
        print("ℹ️  Using existing credentials...")
    
    # Step 2: Create repository
    print("\n" + "=" * 60)
    print("📦 STEP 2: Create Repository")
    print("=" * 60)
    print(f"Repository: {REPO_ID}")
    
    api = HfApi()
    
    try:
        create_repo(
            repo_id=REPO_ID,
            repo_type="model",
            exist_ok=True,  # Don't fail if repo exists
            private=True    # Change to False for public
        )
        print(f"✅ Repository created/verified: https://huggingface.co/{REPO_ID}")
    except Exception as e:
        print(f"ℹ️  Repository may already exist: {e}")
    
    # Step 3: Upload models
    print("\n" + "=" * 60)
    print("📤 STEP 3: Upload Models")
    print("=" * 60)
    
    for model in models:
        model_path = MODEL_DIR / model
        
        if not model_path.exists():
            print(f"⏭️  Skipping {model} (not found)")
            continue
        
        print(f"\n📤 Uploading {model}...")
        try:
            api.upload_file(
                path_or_fileobj=str(model_path),
                path_in_repo=model,
                repo_id=REPO_ID,
                repo_type="model",
            )
            print(f"✅ Uploaded {model}")
        except Exception as e:
            print(f"❌ Failed to upload {model}: {e}")
    
    # Step 4: Success!
    print("\n" + "=" * 60)
    print("🎉 UPLOAD COMPLETE!")
    print("=" * 60)
    print(f"\n📦 Your models are now hosted at:")
    print(f"   https://huggingface.co/{REPO_ID}")
    print(f"\n🔗 Share this repository with your team!")
    print(f"\n📥 To download models on deployment:")
    print(f"   huggingface-cli download {REPO_ID} --local-dir model/")
    
    print("\n✅ Next steps:")
    print("   1. The download_models.py script has been updated")
    print("   2. Models will auto-download on backend startup")
    print("   3. Deploy to Railway/Render for ML inference support")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    main()
