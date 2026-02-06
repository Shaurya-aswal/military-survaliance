#!/usr/bin/env python3
"""
Military Surveillance – Transfer Learning Classifier
=====================================================
Train a state-of-the-art pretrained model (ViT-B/16, ResNet-50, or
EfficientNet-B0) to classify 10 military object classes using transfer
learning.

Checkpoint format is fully compatible with the FastAPI backend
(`backend/main.py`), which expects:
    {
        "model_state_dict": ...,
        "classes": [...],
        "num_classes": int,
    }

Usage
-----
    python train_classifier.py --arch vit       # Vision Transformer B/16
    python train_classifier.py --arch resnet50   # ResNet-50
    python train_classifier.py --arch efficientnet  # EfficientNet-B0

    # Customise hyper-parameters
    python train_classifier.py --arch vit --epochs 25 --lr 1e-4 --batch-size 16

    # Resume from an existing checkpoint
    python train_classifier.py --arch vit --resume ../model/vit_classifier.pth
"""

from __future__ import annotations

import argparse
import os
import time
from pathlib import Path
from typing import Optional

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from torchvision import datasets, transforms

# ──────────────────────────────────────────────
# Target classes  (must match backend VIT_CLASSES)
# ──────────────────────────────────────────────
CLASSES = [
    "aircraft",
    "artelary",
    "camo_soldier",
    "civilian_vehical",
    "mil_truck",
    "mil_vehical",
    "soldier",
    "tank",
    "warship",
    "weapons",
]
NUM_CLASSES = len(CLASSES)

# ──────────────────────────────────────────────
# Architecture builders
# ──────────────────────────────────────────────

def build_vit(num_classes: int, freeze_base: bool = True) -> nn.Module:
    """
    Vision Transformer B/16 – the same architecture used by the surveillance
    backend for ViT classification.

    Head is a single nn.Linear(768, num_classes) to stay compatible with
    the pretrained checkpoint at ``model/vit_classifier.pth``.
    """
    from torchvision.models import vit_b_16, ViT_B_16_Weights

    weights = ViT_B_16_Weights.IMAGENET1K_V1
    model = vit_b_16(weights=weights)

    # ── Freeze encoder blocks ──
    if freeze_base:
        for param in model.parameters():
            param.requires_grad = False

    # ── Replace classification head ──
    # Single Linear layer – matches the existing vit_classifier.pth checkpoint
    in_features = model.heads.head.in_features  # 768
    model.heads.head = nn.Linear(in_features, num_classes)

    # Unfreeze the new head
    for param in model.heads.parameters():
        param.requires_grad = True

    return model


def build_resnet50(num_classes: int, freeze_base: bool = True) -> nn.Module:
    """
    ResNet-50 pretrained on ImageNet-1K.
    """
    from torchvision.models import resnet50, ResNet50_Weights

    weights = ResNet50_Weights.IMAGENET1K_V2
    model = resnet50(weights=weights)

    # ── Freeze all conv / bn layers ──
    if freeze_base:
        for param in model.parameters():
            param.requires_grad = False

    # ── Replace final FC ──
    in_features = model.fc.in_features  # 2048
    model.fc = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 512),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.2),
        nn.Linear(512, num_classes),
    )
    for param in model.fc.parameters():
        param.requires_grad = True

    return model


def build_efficientnet(num_classes: int, freeze_base: bool = True) -> nn.Module:
    """
    EfficientNet-B0 pretrained on ImageNet-1K.
    """
    from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights

    weights = EfficientNet_B0_Weights.IMAGENET1K_V1
    model = efficientnet_b0(weights=weights)

    # ── Freeze feature extractor ──
    if freeze_base:
        for param in model.features.parameters():
            param.requires_grad = False

    # ── Replace classifier head ──
    in_features = model.classifier[1].in_features  # 1280
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, 512),
        nn.ReLU(inplace=True),
        nn.Dropout(p=0.2),
        nn.Linear(512, num_classes),
    )
    for param in model.classifier.parameters():
        param.requires_grad = True

    return model


ARCH_BUILDERS = {
    "vit": build_vit,
    "resnet50": build_resnet50,
    "efficientnet": build_efficientnet,
}

# ──────────────────────────────────────────────
# Data transforms
# ──────────────────────────────────────────────

def get_transforms(img_size: int = 224):
    """Training + validation transforms with standard ImageNet normalisation."""
    train_tf = transforms.Compose([
        transforms.Resize((img_size + 32, img_size + 32)),
        transforms.RandomCrop(img_size),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    val_tf = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])
    return train_tf, val_tf


# ──────────────────────────────────────────────
# Training loop
# ──────────────────────────────────────────────

def train_one_epoch(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    optimizer: optim.Optimizer,
    device: torch.device,
) -> tuple[float, float]:
    model.train()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)

        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += preds.eq(labels).sum().item()
        total += labels.size(0)

    epoch_loss = running_loss / total
    epoch_acc = correct / total * 100
    return epoch_loss, epoch_acc


@torch.no_grad()
def evaluate(
    model: nn.Module,
    loader: DataLoader,
    criterion: nn.Module,
    device: torch.device,
) -> tuple[float, float]:
    model.eval()
    running_loss = 0.0
    correct = 0
    total = 0

    for images, labels in loader:
        images, labels = images.to(device), labels.to(device)
        outputs = model(images)
        loss = criterion(outputs, labels)

        running_loss += loss.item() * images.size(0)
        _, preds = outputs.max(1)
        correct += preds.eq(labels).sum().item()
        total += labels.size(0)

    epoch_loss = running_loss / total
    epoch_acc = correct / total * 100
    return epoch_loss, epoch_acc


# ──────────────────────────────────────────────
# Checkpoint helpers (backend-compatible format)
# ──────────────────────────────────────────────

def save_checkpoint(
    model: nn.Module,
    classes: list[str],
    path: str | Path,
    *,
    epoch: int = 0,
    optimizer: Optional[optim.Optimizer] = None,
    best_acc: float = 0.0,
    arch: str = "vit",
) -> None:
    """
    Save in the format expected by `backend/main.py`:
        { model_state_dict, classes, num_classes }
    Plus optional training metadata for resuming.
    """
    payload = {
        "model_state_dict": model.state_dict(),
        "classes": classes,
        "num_classes": len(classes),
        # Extra metadata (ignored by backend, useful for resuming)
        "epoch": epoch,
        "best_acc": best_acc,
        "arch": arch,
    }
    if optimizer is not None:
        payload["optimizer_state_dict"] = optimizer.state_dict()
    torch.save(payload, str(path))
    print(f"[SAVE] Checkpoint → {path}")


def load_checkpoint(
    path: str | Path,
    model: nn.Module,
    optimizer: Optional[optim.Optimizer] = None,
) -> dict:
    """Load a previously saved checkpoint and return the metadata dict."""
    ckpt = torch.load(str(path), map_location="cpu")
    model.load_state_dict(ckpt["model_state_dict"])
    if optimizer and "optimizer_state_dict" in ckpt:
        optimizer.load_state_dict(ckpt["optimizer_state_dict"])
    print(f"[LOAD] Resumed from {path}  (epoch {ckpt.get('epoch', '?')}, "
          f"best_acc {ckpt.get('best_acc', '?'):.2f}%)")
    return ckpt


# ──────────────────────────────────────────────
# Summary helpers
# ──────────────────────────────────────────────

def count_parameters(model: nn.Module) -> tuple[int, int]:
    """Return (total_params, trainable_params)."""
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    return total, trainable


def print_model_summary(model: nn.Module, arch: str) -> None:
    total, trainable = count_parameters(model)
    frozen = total - trainable
    print("\n" + "=" * 60)
    print(f"  Architecture : {arch.upper()}")
    print(f"  Classes      : {NUM_CLASSES}  {CLASSES}")
    print(f"  Total params : {total:,}")
    print(f"  Frozen       : {frozen:,}  ({frozen/total*100:.1f}%)")
    print(f"  Trainable    : {trainable:,}  ({trainable/total*100:.1f}%)")
    print("=" * 60 + "\n")


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Transfer-Learning trainer for military surveillance classifier",
    )
    parser.add_argument(
        "--arch",
        type=str,
        default="vit",
        choices=list(ARCH_BUILDERS.keys()),
        help="Backbone architecture (default: vit)",
    )
    parser.add_argument("--data-dir", type=str, default=None,
                        help="Path to ImageFolder dataset (train/val or single dir for auto-split)")
    parser.add_argument("--epochs", type=int, default=20,
                        help="Number of training epochs (default: 20)")
    parser.add_argument("--batch-size", type=int, default=32,
                        help="Batch size (default: 32)")
    parser.add_argument("--lr", type=float, default=3e-4,
                        help="Learning rate (default: 3e-4)")
    parser.add_argument("--img-size", type=int, default=224,
                        help="Input image size (default: 224)")
    parser.add_argument("--val-split", type=float, default=0.2,
                        help="Validation split ratio when using a single data dir (default: 0.2)")
    parser.add_argument("--resume", type=str, default=None,
                        help="Path to checkpoint to resume training from")
    parser.add_argument("--output", type=str, default=None,
                        help="Output checkpoint path (default: ../model/<arch>_classifier.pth)")
    parser.add_argument("--unfreeze-epoch", type=int, default=5,
                        help="Epoch at which to unfreeze all layers for fine-tuning (default: 5)")
    parser.add_argument("--no-freeze", action="store_true",
                        help="Do not freeze base layers (full fine-tuning from the start)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Build the model and print summary, but skip training")
    args = parser.parse_args()

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[INFO] Device: {device}")

    # ── Build model ──
    freeze_base = not args.no_freeze
    builder = ARCH_BUILDERS[args.arch]
    model: nn.Module = builder(NUM_CLASSES, freeze_base=freeze_base)
    model.to(device)

    print_model_summary(model, args.arch)

    # ── Dry-run: just show architecture and exit ──
    if args.dry_run:
        print("[DRY-RUN] Model architecture (head only):")
        if args.arch == "vit":
            print(model.heads)
        elif args.arch == "resnet50":
            print(model.fc)
        elif args.arch == "efficientnet":
            print(model.classifier)
        print("\n[DRY-RUN] Full model repr saved to model_summary.txt")
        with open("model_summary.txt", "w") as f:
            f.write(repr(model))
        return

    # ── Dataset ──
    if args.data_dir is None:
        print("[ERROR] --data-dir is required for training.")
        print("        Expected: an ImageFolder layout with one subfolder per class:")
        print("          data/")
        for cls in CLASSES:
            print(f"            {cls}/")
        print("            ...")
        return

    train_tf, val_tf = get_transforms(args.img_size)
    data_path = Path(args.data_dir)

    # Check if there's already a train/val split
    if (data_path / "train").is_dir() and (data_path / "val").is_dir():
        print(f"[INFO] Using existing train/val split in {data_path}")
        train_ds = datasets.ImageFolder(str(data_path / "train"), transform=train_tf)
        val_ds = datasets.ImageFolder(str(data_path / "val"), transform=val_tf)
    else:
        print(f"[INFO] Auto-splitting {data_path} ({1 - args.val_split:.0%} train / "
              f"{args.val_split:.0%} val)")
        full_ds = datasets.ImageFolder(str(data_path), transform=train_tf)
        val_size = int(len(full_ds) * args.val_split)
        train_size = len(full_ds) - val_size
        train_ds, val_ds = random_split(full_ds, [train_size, val_size])

    print(f"[INFO] Train samples: {len(train_ds):,}  |  Val samples: {len(val_ds):,}")

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True,
                              num_workers=4, pin_memory=True)
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False,
                            num_workers=4, pin_memory=True)

    # ── Optimizer & scheduler ──
    criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
    optimizer = optim.AdamW(
        filter(lambda p: p.requires_grad, model.parameters()),
        lr=args.lr,
        weight_decay=1e-4,
    )
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=args.epochs)

    # ── Resume ──
    start_epoch = 0
    best_acc = 0.0
    if args.resume:
        ckpt = load_checkpoint(args.resume, model, optimizer)
        start_epoch = ckpt.get("epoch", 0)
        best_acc = ckpt.get("best_acc", 0.0)

    # ── Output path ──
    output_dir = Path(__file__).resolve().parent.parent / "model"
    output_dir.mkdir(exist_ok=True)
    output_path = Path(args.output) if args.output else output_dir / f"{args.arch}_classifier.pth"

    # ── Training ──
    print(f"\n{'─' * 60}")
    print(f"  Training {args.arch.upper()} for {args.epochs} epochs")
    print(f"  LR={args.lr}  Batch={args.batch_size}  ImgSize={args.img_size}")
    if freeze_base:
        print(f"  Base frozen until epoch {args.unfreeze_epoch} → then full fine-tuning")
    print(f"{'─' * 60}\n")

    for epoch in range(start_epoch, args.epochs):
        epoch_start = time.time()

        # ── Unfreeze all layers after warm-up ──
        if freeze_base and epoch == args.unfreeze_epoch:
            print(f"\n[UNFREEZE] Epoch {epoch}: unfreezing all layers for fine-tuning")
            for param in model.parameters():
                param.requires_grad = True
            # Rebuild optimizer with all params and a lower LR
            optimizer = optim.AdamW(model.parameters(), lr=args.lr * 0.1, weight_decay=1e-4)
            scheduler = optim.lr_scheduler.CosineAnnealingLR(
                optimizer, T_max=args.epochs - epoch
            )
            total, trainable = count_parameters(model)
            print(f"           Trainable params: {trainable:,} / {total:,}\n")

        train_loss, train_acc = train_one_epoch(model, train_loader, criterion, optimizer, device)
        val_loss, val_acc = evaluate(model, val_loader, criterion, device)
        scheduler.step()

        elapsed = time.time() - epoch_start
        lr_now = scheduler.get_last_lr()[0]

        print(
            f"Epoch [{epoch + 1:3d}/{args.epochs}]  "
            f"Train Loss: {train_loss:.4f}  Acc: {train_acc:6.2f}%  |  "
            f"Val Loss: {val_loss:.4f}  Acc: {val_acc:6.2f}%  |  "
            f"LR: {lr_now:.2e}  Time: {elapsed:.1f}s"
        )

        # ── Save best model ──
        if val_acc > best_acc:
            best_acc = val_acc
            save_checkpoint(
                model, CLASSES, output_path,
                epoch=epoch + 1,
                optimizer=optimizer,
                best_acc=best_acc,
                arch=args.arch,
            )

    print(f"\n{'=' * 60}")
    print(f"  Training complete!  Best val accuracy: {best_acc:.2f}%")
    print(f"  Checkpoint saved to: {output_path}")
    print(f"{'=' * 60}\n")


if __name__ == "__main__":
    main()
