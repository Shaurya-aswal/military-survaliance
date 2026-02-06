"""
Military Surveillance Backend
FastAPI server with YOLOv8 object detection + ViT classification
"""

import io
import os
import uuid
import time
import threading
from datetime import datetime
from pathlib import Path
from typing import Optional

import cv2
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
import torchvision.transforms as transforms
from fastapi import FastAPI, File, UploadFile, WebSocket, WebSocketDisconnect, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from PIL import Image
from pydantic import BaseModel
from ultralytics import YOLO
import base64

# ──────────────────────────────────────────────
# Config
# ──────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_DIR = BASE_DIR / "model"
YOLO_WEIGHTS = MODEL_DIR / "yolov8n m.pt"
VIT_WEIGHTS = MODEL_DIR / "vit_classifier.pth"

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"

# ViT class labels – loaded from checkpoint at runtime
VIT_CLASSES = []

# ──────────────────────────────────────────────
# Model loading
# ──────────────────────────────────────────────
print(f"[INFO] Using device: {DEVICE}")

# YOLOv8
yolo_model: Optional[YOLO] = None
if YOLO_WEIGHTS.exists():
    print(f"[INFO] Loading YOLOv8 weights from {YOLO_WEIGHTS}")
    yolo_model = YOLO(str(YOLO_WEIGHTS))
else:
    print(f"[WARN] YOLOv8 weights not found at {YOLO_WEIGHTS}, using default yolov8n")
    yolo_model = YOLO("yolov8n.pt")

# ViT classifier
vit_model = None
vit_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

if VIT_WEIGHTS.exists():
    print(f"[INFO] Loading ViT classifier from {VIT_WEIGHTS}")
    try:
        from torchvision.models import vit_b_16

        checkpoint = torch.load(str(VIT_WEIGHTS), map_location=DEVICE)

        # Support custom checkpoint format: {model_state_dict, classes, num_classes}
        if isinstance(checkpoint, dict) and "model_state_dict" in checkpoint:
            state_dict = checkpoint["model_state_dict"]
            if "classes" in checkpoint:
                VIT_CLASSES = checkpoint["classes"]
                print(f"[INFO] ViT classes from checkpoint: {VIT_CLASSES}")
            num_classes = checkpoint.get("num_classes", len(VIT_CLASSES))
        else:
            state_dict = checkpoint
            num_classes = len(VIT_CLASSES)

        vit_model = vit_b_16(weights=None)
        vit_model.heads.head = torch.nn.Linear(
            vit_model.heads.head.in_features, num_classes
        )
        vit_model.load_state_dict(state_dict)
        vit_model.to(DEVICE).eval()
        print(f"[INFO] ViT classifier loaded successfully ({num_classes} classes)")
    except Exception as e:
        print(f"[WARN] Could not load ViT classifier: {e}")
        vit_model = None
else:
    print(f"[WARN] ViT weights not found at {VIT_WEIGHTS}")

# ──────────────────────────────────────────────
# FastAPI app
# ──────────────────────────────────────────────
app = FastAPI(
    title="Military Surveillance API",
    description="Real-time object detection & classification for military surveillance",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────

class DetectionResult(BaseModel):
    id: str
    objectName: str
    status: str  # threat | verified | analyzing
    timeDetected: str
    confidenceScore: float
    location: Optional[str] = None
    bbox: Optional[list[float]] = None  # x1, y1, x2, y2
    vitLabel: Optional[str] = None
    vitConfidence: Optional[float] = None


class DetectionResponse(BaseModel):
    detections: list[DetectionResult]
    processingTimeMs: float
    imageWidth: int
    imageHeight: int


class CropInfo(BaseModel):
    id: str
    objectName: str
    yoloLabel: str
    yoloConfidence: float
    vitLabel: Optional[str] = None
    vitConfidence: Optional[float] = None
    status: str
    bbox: list[float]
    cropBase64: str  # base64-encoded JPEG thumbnail of the crop


class PipelineResponse(BaseModel):
    """Full two-stage pipeline result with annotated image + per-crop details."""
    detections: list[DetectionResult]
    crops: list[CropInfo]
    annotatedImageBase64: str  # base64-encoded annotated JPEG
    processingTimeMs: float
    yoloTimeMs: float
    vitTimeMs: float
    imageWidth: int
    imageHeight: int
    modelInfo: dict


# ──────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────

def classify_crop(crop_pil: Image.Image) -> tuple[str, float]:
    """Run ViT classification on a cropped region."""
    if vit_model is None:
        return "Unknown", 0.0
    tensor = vit_transform(crop_pil).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        logits = vit_model(tensor)
        probs = torch.softmax(logits, dim=1)
        conf, idx = probs.max(dim=1)
    return VIT_CLASSES[idx.item()], round(conf.item() * 100, 2)


def determine_status(confidence: float, class_name: str) -> str:
    """Simple heuristic to assign a threat status."""
    threat_keywords = {"uav", "drone", "unknown", "aircraft"}
    if any(kw in class_name.lower() for kw in threat_keywords) and confidence > 80:
        return "threat"
    if confidence > 85:
        return "verified"
    return "analyzing"


def run_detection(image_np: np.ndarray) -> DetectionResponse:
    """Run YOLOv8 + optional ViT on an image (BGR numpy array)."""
    start = time.time()
    results = yolo_model(image_np, verbose=False)[0]
    h, w = image_np.shape[:2]

    detections: list[DetectionResult] = []
    image_rgb = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(image_rgb)

    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        conf = round(float(box.conf[0]) * 100, 2)
        cls_id = int(box.cls[0])
        yolo_label = results.names.get(cls_id, "Unknown")

        # Crop & classify with ViT
        crop = pil_image.crop((int(x1), int(y1), int(x2), int(y2)))
        vit_label, vit_conf = classify_crop(crop)

        # Pick the best label
        best_label = vit_label if vit_model and vit_conf > conf else yolo_label
        best_conf = max(vit_conf, conf) if vit_model else conf

        status = determine_status(best_conf, best_label)

        detections.append(
            DetectionResult(
                id=str(uuid.uuid4())[:8],
                objectName=best_label,
                status=status,
                timeDetected=datetime.now().strftime("%H:%M:%S"),
                confidenceScore=best_conf,
                bbox=[round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                vitLabel=vit_label if vit_model else None,
                vitConfidence=vit_conf if vit_model else None,
            )
        )

    elapsed = round((time.time() - start) * 1000, 2)
    return DetectionResponse(
        detections=detections,
        processingTimeMs=elapsed,
        imageWidth=w,
        imageHeight=h,
    )


def draw_detections(image_np: np.ndarray, response: DetectionResponse) -> np.ndarray:
    """Draw bounding boxes on an image."""
    STATUS_COLORS = {
        "threat": (0, 0, 255),      # red
        "verified": (0, 200, 0),     # green
        "analyzing": (0, 200, 255),  # amber
    }
    annotated = image_np.copy()
    for det in response.detections:
        if det.bbox:
            x1, y1, x2, y2 = [int(v) for v in det.bbox]
            color = STATUS_COLORS.get(det.status, (200, 200, 200))
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            label = f"{det.objectName} {det.confidenceScore:.0f}%"
            cv2.putText(annotated, label, (x1, y1 - 8),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
    return annotated


# ──────────────────────────────────────────────
# Routes
# ──────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "service": "Military Surveillance API",
        "status": "operational",
        "models": {
            "yolo": "loaded" if yolo_model else "not loaded",
            "vit": "loaded" if vit_model else "not loaded",
        },
    }


@app.get("/health")
def health():
    return {"status": "ok", "device": DEVICE}


@app.post("/detect", response_model=DetectionResponse)
async def detect(file: UploadFile = File(...)):
    """Upload an image and get detection results (JSON)."""
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return run_detection(image)


@app.post("/detect/annotated")
async def detect_annotated(file: UploadFile = File(...)):
    """Upload an image and get back an annotated image with bounding boxes."""
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    response = run_detection(image)
    annotated = draw_detections(image, response)

    _, buffer = cv2.imencode(".jpg", annotated)
    return StreamingResponse(io.BytesIO(buffer.tobytes()), media_type="image/jpeg")


@app.post("/detect/pipeline", response_model=PipelineResponse)
async def detect_pipeline(file: UploadFile = File(...)):
    """
    Full two-stage pipeline:
      Stage 1 → YOLO detection (bounding boxes)
      Stage 2 → ViT classification on each crop
    Returns JSON with annotated image (base64), per-crop thumbnails, and timing.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Invalid image file")

    total_start = time.time()
    h, w = image.shape[:2]
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    pil_image = Image.fromarray(image_rgb)

    # ── Stage 1: YOLO Detection ──
    yolo_start = time.time()
    results = yolo_model(image, verbose=False)[0]
    yolo_elapsed = round((time.time() - yolo_start) * 1000, 2)

    # ── Stage 2: ViT Classification on each crop ──
    vit_start = time.time()
    detections: list[DetectionResult] = []
    crops: list[CropInfo] = []

    for box in results.boxes:
        x1, y1, x2, y2 = box.xyxy[0].tolist()
        yolo_conf = round(float(box.conf[0]) * 100, 2)
        cls_id = int(box.cls[0])
        yolo_label = results.names.get(cls_id, "Unknown")

        # Crop for ViT
        crop_pil = pil_image.crop((int(x1), int(y1), int(x2), int(y2)))
        vit_label, vit_conf = classify_crop(crop_pil)

        # Best label
        best_label = vit_label if vit_model and vit_conf > yolo_conf else yolo_label
        best_conf = max(vit_conf, yolo_conf) if vit_model else yolo_conf
        status = determine_status(best_conf, best_label)
        det_id = str(uuid.uuid4())[:8]

        # Encode crop as base64 thumbnail (max 128px)
        crop_thumb = crop_pil.copy()
        crop_thumb.thumbnail((128, 128))
        buf = io.BytesIO()
        crop_thumb.save(buf, format="JPEG", quality=80)
        crop_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        detections.append(
            DetectionResult(
                id=det_id,
                objectName=best_label,
                status=status,
                timeDetected=datetime.now().strftime("%H:%M:%S"),
                confidenceScore=best_conf,
                bbox=[round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                vitLabel=vit_label if vit_model else None,
                vitConfidence=vit_conf if vit_model else None,
            )
        )
        crops.append(
            CropInfo(
                id=det_id,
                objectName=best_label,
                yoloLabel=yolo_label,
                yoloConfidence=yolo_conf,
                vitLabel=vit_label if vit_model else None,
                vitConfidence=vit_conf if vit_model else None,
                status=status,
                bbox=[round(x1, 1), round(y1, 1), round(x2, 1), round(y2, 1)],
                cropBase64=crop_b64,
            )
        )

    vit_elapsed = round((time.time() - vit_start) * 1000, 2)

    # ── Draw annotated image ──
    det_resp = DetectionResponse(
        detections=detections, processingTimeMs=0, imageWidth=w, imageHeight=h
    )
    annotated = draw_detections(image, det_resp)
    _, ann_buf = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
    annotated_b64 = base64.b64encode(ann_buf.tobytes()).decode("utf-8")

    total_elapsed = round((time.time() - total_start) * 1000, 2)

    return PipelineResponse(
        detections=detections,
        crops=crops,
        annotatedImageBase64=annotated_b64,
        processingTimeMs=total_elapsed,
        yoloTimeMs=yolo_elapsed,
        vitTimeMs=vit_elapsed,
        imageWidth=w,
        imageHeight=h,
        modelInfo={
            "yolo": "loaded" if yolo_model else "not loaded",
            "vit": "loaded" if vit_model else "not loaded",
            "device": DEVICE,
            "vitClasses": VIT_CLASSES if vit_model else [],
        },
    )


# ──────────────────────────────────────────────
# WebSocket – live camera feed
# ──────────────────────────────────────────────

class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, data: dict):
        for ws in self.active:
            await ws.send_json(data)


manager = ConnectionManager()


@app.websocket("/ws/feed")
async def websocket_feed(websocket: WebSocket):
    """
    WebSocket endpoint for real-time detection.
    Client sends JPEG frames (bytes), server responds with detection JSON.
    """
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_bytes()
            nparr = np.frombuffer(data, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if image is None:
                await websocket.send_json({"error": "invalid frame"})
                continue
            response = run_detection(image)
            await websocket.send_json(response.model_dump())
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ──────────────────────────────────────────────
# Transfer Learning – Schemas
# ──────────────────────────────────────────────

class LayerInfo(BaseModel):
    name: str
    type: str
    parameters: int
    trainable: bool


class ModelArchResponse(BaseModel):
    architecture: str
    totalParams: int
    trainableParams: int
    frozenParams: int
    frozenPct: float
    trainablePct: float
    numClasses: int
    classes: list[str]
    device: str
    weightsPath: str
    weightsLoaded: bool
    headArchitecture: str
    layers: list[LayerInfo]


class ClassifyResponse(BaseModel):
    predictedClass: str
    confidence: float
    allProbabilities: dict[str, float]
    inferenceTimeMs: float
    modelUsed: str


class TransferLearningRequest(BaseModel):
    arch: str = "vit"
    freezeBase: bool = True


class TransferLearningResponse(BaseModel):
    architecture: str
    totalParams: int
    trainableParams: int
    frozenParams: int
    frozenPct: float
    numClasses: int
    classes: list[str]
    headArchitecture: str
    pretrainedWeightsLoaded: bool
    message: str


class TrainRequest(BaseModel):
    epochs: int = 20
    batchSize: int = 32
    learningRate: float = 3e-4
    unfreezeEpoch: int = 5
    valSplit: float = 0.2


class TrainStatusResponse(BaseModel):
    status: str  # idle | training | completed | failed
    currentEpoch: int
    totalEpochs: int
    trainLoss: float
    trainAcc: float
    valLoss: float
    valAcc: float
    bestAcc: float
    elapsedSec: float
    message: str


# ── Global training state ──
train_state = {
    "status": "idle",
    "current_epoch": 0,
    "total_epochs": 0,
    "train_loss": 0.0,
    "train_acc": 0.0,
    "val_loss": 0.0,
    "val_acc": 0.0,
    "best_acc": 0.0,
    "elapsed_sec": 0.0,
    "message": "No training in progress",
}
train_lock = threading.Lock()


# ──────────────────────────────────────────────
# Transfer Learning – Helpers
# ──────────────────────────────────────────────

def _count_params(model: nn.Module) -> tuple[int, int]:
    total = sum(p.numel() for p in model.parameters())
    trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
    return total, trainable


def _build_arch(arch: str, num_classes: int, freeze_base: bool = True) -> nn.Module:
    """Build a pretrained model with a custom classification head."""
    if arch == "vit":
        from torchvision.models import vit_b_16, ViT_B_16_Weights
        model = vit_b_16(weights=ViT_B_16_Weights.IMAGENET1K_V1)
        if freeze_base:
            for p in model.parameters():
                p.requires_grad = False
        in_f = model.heads.head.in_features
        model.heads.head = nn.Linear(in_f, num_classes)
        for p in model.heads.parameters():
            p.requires_grad = True
    elif arch == "resnet50":
        from torchvision.models import resnet50, ResNet50_Weights
        model = resnet50(weights=ResNet50_Weights.IMAGENET1K_V2)
        if freeze_base:
            for p in model.parameters():
                p.requires_grad = False
        in_f = model.fc.in_features
        model.fc = nn.Sequential(
            nn.Dropout(0.3), nn.Linear(in_f, 512),
            nn.ReLU(True), nn.Dropout(0.2), nn.Linear(512, num_classes),
        )
        for p in model.fc.parameters():
            p.requires_grad = True
    elif arch == "efficientnet":
        from torchvision.models import efficientnet_b0, EfficientNet_B0_Weights
        model = efficientnet_b0(weights=EfficientNet_B0_Weights.IMAGENET1K_V1)
        if freeze_base:
            for p in model.features.parameters():
                p.requires_grad = False
        in_f = model.classifier[1].in_features
        model.classifier = nn.Sequential(
            nn.Dropout(0.3), nn.Linear(in_f, 512),
            nn.ReLU(True), nn.Dropout(0.2), nn.Linear(512, num_classes),
        )
        for p in model.classifier.parameters():
            p.requires_grad = True
    else:
        raise ValueError(f"Unknown arch: {arch}")
    return model


def _get_head_repr(model: nn.Module, arch: str) -> str:
    if arch == "vit":
        return repr(model.heads)
    elif arch == "resnet50":
        return repr(model.fc)
    elif arch == "efficientnet":
        return repr(model.classifier)
    return "unknown"


# ──────────────────────────────────────────────
# Transfer Learning – Routes
# ──────────────────────────────────────────────

@app.get("/model/info", response_model=ModelArchResponse)
def model_info():
    """
    Return full architecture info for the currently loaded ViT model
    (pretrained from vit_classifier.pth).
    """
    if vit_model is None:
        raise HTTPException(status_code=503, detail="ViT model not loaded")

    total, trainable = _count_params(vit_model)
    frozen = total - trainable

    layers = []
    for name, param in vit_model.named_parameters():
        layers.append(LayerInfo(
            name=name,
            type=name.split(".")[0],
            parameters=param.numel(),
            trainable=param.requires_grad,
        ))

    return ModelArchResponse(
        architecture="ViT-B/16 (vit_b_16)",
        totalParams=total,
        trainableParams=trainable,
        frozenParams=frozen,
        frozenPct=round(frozen / total * 100, 2) if total else 0,
        trainablePct=round(trainable / total * 100, 2) if total else 0,
        numClasses=len(VIT_CLASSES),
        classes=VIT_CLASSES,
        device=DEVICE,
        weightsPath=str(VIT_WEIGHTS),
        weightsLoaded=True,
        headArchitecture=repr(vit_model.heads),
        layers=layers,
    )


@app.post("/model/classify", response_model=ClassifyResponse)
async def model_classify(file: UploadFile = File(...)):
    """
    Classify a single image using the pretrained vit_classifier.pth model.
    Returns predicted class, confidence, and full probability distribution.
    """
    if vit_model is None:
        raise HTTPException(status_code=503, detail="ViT model not loaded")

    contents = await file.read()
    pil_image = Image.open(io.BytesIO(contents)).convert("RGB")

    start = time.time()
    tensor = vit_transform(pil_image).unsqueeze(0).to(DEVICE)
    with torch.no_grad():
        logits = vit_model(tensor)
        probs = torch.softmax(logits, dim=1)[0]
    elapsed = round((time.time() - start) * 1000, 2)

    conf, idx = probs.max(dim=0)
    all_probs = {VIT_CLASSES[i]: round(probs[i].item() * 100, 2) for i in range(len(VIT_CLASSES))}

    return ClassifyResponse(
        predictedClass=VIT_CLASSES[idx.item()],
        confidence=round(conf.item() * 100, 2),
        allProbabilities=all_probs,
        inferenceTimeMs=elapsed,
        modelUsed="vit_classifier.pth",
    )


@app.post("/model/transfer-learning", response_model=TransferLearningResponse)
def transfer_learning_build(req: TransferLearningRequest):
    """
    Build a transfer-learning model for the given architecture, load the
    pretrained vit_classifier.pth weights (for ViT), freeze base layers,
    and return the modified architecture summary.
    """
    num_classes = len(VIT_CLASSES) if VIT_CLASSES else 10
    classes = VIT_CLASSES if VIT_CLASSES else [
        "aircraft", "artelary", "camo_soldier", "civilian_vehical",
        "mil_truck", "mil_vehical", "soldier", "tank", "warship", "weapons",
    ]

    model = _build_arch(req.arch, num_classes, freeze_base=req.freezeBase)

    # Load pretrained weights from vit_classifier.pth for ViT
    pretrained_loaded = False
    if req.arch == "vit" and VIT_WEIGHTS.exists():
        try:
            ckpt = torch.load(str(VIT_WEIGHTS), map_location="cpu")
            if isinstance(ckpt, dict) and "model_state_dict" in ckpt:
                model.load_state_dict(ckpt["model_state_dict"])
            else:
                model.load_state_dict(ckpt)
            pretrained_loaded = True
        except Exception as e:
            pretrained_loaded = False

    total, trainable = _count_params(model)
    frozen = total - trainable

    return TransferLearningResponse(
        architecture=req.arch.upper(),
        totalParams=total,
        trainableParams=trainable,
        frozenParams=frozen,
        frozenPct=round(frozen / total * 100, 2) if total else 0,
        numClasses=num_classes,
        classes=classes,
        headArchitecture=_get_head_repr(model, req.arch),
        pretrainedWeightsLoaded=pretrained_loaded,
        message=(
            f"✅ {req.arch.upper()} built with pretrained vit_classifier.pth weights. "
            f"Base {'frozen' if req.freezeBase else 'unfrozen'}. "
            f"{trainable:,} / {total:,} params trainable."
            if pretrained_loaded else
            f"✅ {req.arch.upper()} built with ImageNet weights (no local checkpoint). "
            f"{trainable:,} / {total:,} params trainable."
        ),
    )


@app.get("/model/train/status", response_model=TrainStatusResponse)
def train_status():
    """Get the current training status."""
    with train_lock:
        return TrainStatusResponse(
            status=train_state["status"],
            currentEpoch=train_state["current_epoch"],
            totalEpochs=train_state["total_epochs"],
            trainLoss=train_state["train_loss"],
            trainAcc=train_state["train_acc"],
            valLoss=train_state["val_loss"],
            valAcc=train_state["val_acc"],
            bestAcc=train_state["best_acc"],
            elapsedSec=train_state["elapsed_sec"],
            message=train_state["message"],
        )


@app.post("/model/retrain", response_model=TrainStatusResponse)
async def retrain_model(
    data_dir: str = Query(..., description="Path to ImageFolder dataset on server"),
    epochs: int = Query(default=20),
    batch_size: int = Query(default=32),
    lr: float = Query(default=3e-4),
    unfreeze_epoch: int = Query(default=5),
    val_split: float = Query(default=0.2),
):
    """
    Trigger background fine-tuning of the ViT model starting from the
    pretrained vit_classifier.pth weights.  Training runs in a background
    thread; poll GET /model/train/status for progress.
    """
    global vit_model, VIT_CLASSES

    with train_lock:
        if train_state["status"] == "training":
            raise HTTPException(status_code=409, detail="Training already in progress")

    data_path = Path(data_dir)
    if not data_path.exists():
        raise HTTPException(status_code=400, detail=f"Dataset path not found: {data_dir}")

    def _train():
        global vit_model, VIT_CLASSES
        from torch.utils.data import DataLoader, random_split
        from torchvision import datasets

        with train_lock:
            train_state.update({
                "status": "training", "current_epoch": 0,
                "total_epochs": epochs, "message": "Initialising...",
                "train_loss": 0, "train_acc": 0, "val_loss": 0, "val_acc": 0,
                "best_acc": 0, "elapsed_sec": 0,
            })

        try:
            device = torch.device(DEVICE)
            num_classes = len(VIT_CLASSES) if VIT_CLASSES else 10
            classes = VIT_CLASSES if VIT_CLASSES else [
                "aircraft", "artelary", "camo_soldier", "civilian_vehical",
                "mil_truck", "mil_vehical", "soldier", "tank", "warship", "weapons",
            ]

            # Build model & load pretrained weights
            model = _build_arch("vit", num_classes, freeze_base=True)
            if VIT_WEIGHTS.exists():
                ckpt = torch.load(str(VIT_WEIGHTS), map_location="cpu")
                sd = ckpt["model_state_dict"] if isinstance(ckpt, dict) and "model_state_dict" in ckpt else ckpt
                model.load_state_dict(sd)
            model.to(device)

            with train_lock:
                train_state["message"] = "Pretrained vit_classifier.pth loaded, preparing data..."

            # Dataset
            img_size = 224
            train_tf = transforms.Compose([
                transforms.Resize((img_size + 32, img_size + 32)),
                transforms.RandomCrop(img_size),
                transforms.RandomHorizontalFlip(),
                transforms.RandomRotation(15),
                transforms.ColorJitter(0.2, 0.2, 0.2),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ])
            val_tf = transforms.Compose([
                transforms.Resize((img_size, img_size)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
            ])

            if (data_path / "train").is_dir() and (data_path / "val").is_dir():
                train_ds = datasets.ImageFolder(str(data_path / "train"), transform=train_tf)
                val_ds = datasets.ImageFolder(str(data_path / "val"), transform=val_tf)
            else:
                full_ds = datasets.ImageFolder(str(data_path), transform=train_tf)
                val_sz = int(len(full_ds) * val_split)
                train_ds, val_ds = random_split(full_ds, [len(full_ds) - val_sz, val_sz])

            train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=2)
            val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=2)

            criterion = nn.CrossEntropyLoss(label_smoothing=0.1)
            optimizer = optim.AdamW(
                filter(lambda p: p.requires_grad, model.parameters()),
                lr=lr, weight_decay=1e-4,
            )
            scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
            best_acc = 0.0
            total_start = time.time()

            for epoch in range(epochs):
                # Unfreeze after warm-up
                if epoch == unfreeze_epoch:
                    for p in model.parameters():
                        p.requires_grad = True
                    optimizer = optim.AdamW(model.parameters(), lr=lr * 0.1, weight_decay=1e-4)
                    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs - epoch)

                # Train
                model.train()
                t_loss, t_correct, t_total = 0.0, 0, 0
                for imgs, labels in train_loader:
                    imgs, labels = imgs.to(device), labels.to(device)
                    optimizer.zero_grad()
                    out = model(imgs)
                    loss = criterion(out, labels)
                    loss.backward()
                    optimizer.step()
                    t_loss += loss.item() * imgs.size(0)
                    t_correct += out.argmax(1).eq(labels).sum().item()
                    t_total += labels.size(0)

                # Validate
                model.eval()
                v_loss, v_correct, v_total = 0.0, 0, 0
                with torch.no_grad():
                    for imgs, labels in val_loader:
                        imgs, labels = imgs.to(device), labels.to(device)
                        out = model(imgs)
                        loss = criterion(out, labels)
                        v_loss += loss.item() * imgs.size(0)
                        v_correct += out.argmax(1).eq(labels).sum().item()
                        v_total += labels.size(0)

                scheduler.step()
                tl = t_loss / t_total if t_total else 0
                ta = t_correct / t_total * 100 if t_total else 0
                vl = v_loss / v_total if v_total else 0
                va = v_correct / v_total * 100 if v_total else 0

                if va > best_acc:
                    best_acc = va
                    # Save in backend-compatible format
                    torch.save({
                        "model_state_dict": model.state_dict(),
                        "classes": classes,
                        "num_classes": num_classes,
                    }, str(VIT_WEIGHTS))

                with train_lock:
                    train_state.update({
                        "current_epoch": epoch + 1,
                        "train_loss": round(tl, 4),
                        "train_acc": round(ta, 2),
                        "val_loss": round(vl, 4),
                        "val_acc": round(va, 2),
                        "best_acc": round(best_acc, 2),
                        "elapsed_sec": round(time.time() - total_start, 1),
                        "message": f"Epoch {epoch + 1}/{epochs} — val_acc {va:.2f}%",
                    })

            # Hot-swap the running model
            model.eval()
            vit_model = model
            VIT_CLASSES = classes

            with train_lock:
                train_state.update({
                    "status": "completed",
                    "message": f"✅ Training complete! Best val accuracy: {best_acc:.2f}%. Model hot-swapped.",
                })

        except Exception as e:
            with train_lock:
                train_state.update({"status": "failed", "message": f"❌ {e}"})

    thread = threading.Thread(target=_train, daemon=True)
    thread.start()

    with train_lock:
        return TrainStatusResponse(
            status="training",
            currentEpoch=0,
            totalEpochs=epochs,
            trainLoss=0, trainAcc=0, valLoss=0, valAcc=0, bestAcc=0,
            elapsedSec=0,
            message="Training started in background. Poll GET /model/train/status for progress.",
        )


# ──────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
