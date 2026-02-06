import { motion } from "framer-motion";
import { Plane, Satellite, Radio, Brain, Shield, Crosshair } from "lucide-react";

const capabilities = [
  {
    icon: Plane,
    title: "YOLOv8 Object Detection",
    subtitle: "Real-Time Detection",
    description: "Ultralytics YOLOv8 model detects military objects — soldiers, tanks, aircraft, drones — with bounding boxes, confidence scores, and class labels in milliseconds.",
    stats: { label: "Model", value: "YOLOv8" },
    accent: "primary",
  },
  {
    icon: Satellite,
    title: "Vision Transformer (ViT)",
    subtitle: "Fine-Grained Classification",
    description: "A fine-tuned ViT-B/16 classifier refines each YOLO crop into 10 military-specific classes, boosting accuracy on ambiguous detections.",
    stats: { label: "Classes", value: "10" },
    accent: "primary",
  },
  {
    icon: Radio,
    title: "Geolocation Mapping",
    subtitle: "OpenLayers Tactical Map",
    description: "Every analysis is tagged with the device's GPS coordinates and plotted on a dark tactical map. Color-coded markers show threat vs verified status at a glance.",
    stats: { label: "Map", value: "Live" },
    accent: "accent",
  },
  {
    icon: Brain,
    title: "Transfer Learning",
    subtitle: "Custom Model Training",
    description: "Upload your own labeled dataset and retrain ViT, ResNet-50, or EfficientNet directly from the dashboard. Hot-swap the running model with zero downtime.",
    stats: { label: "Architectures", value: "3" },
    accent: "accent",
  },
];

const CapabilitiesGrid = () => {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 tactical-grid opacity-10" />
      
      <div className="container mx-auto px-6">
        {/* Section header */}
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-border bg-secondary/50 mb-4">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Core Capabilities
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            System Capabilities
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A two-stage AI pipeline backed by FastAPI, MongoDB, and a React dashboard with real-time analytics.
          </p>
        </motion.div>
        
        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl mx-auto">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              className="group relative glass-card rounded-lg p-6 border-glow cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              {/* Scan line on hover */}
              <div className="absolute inset-0 rounded-lg overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity">
                <motion.div 
                  className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
                  animate={{ top: ["0%", "100%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
              </div>
              
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${cap.accent === 'accent' ? 'bg-accent/10' : 'bg-primary/10'}`}>
                  <cap.icon className={`w-6 h-6 ${cap.accent === 'accent' ? 'text-accent' : 'text-primary'}`} />
                </div>
                <div className="text-right">
                  <div className={`text-2xl font-mono font-bold ${cap.accent === 'accent' ? 'text-accent' : 'text-primary'}`}>
                    {cap.stats.value}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">
                    {cap.stats.label}
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                  {cap.subtitle}
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {cap.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {cap.description}
                </p>
              </div>
              
              {/* Corner target indicators */}
              <div className="absolute top-2 left-2 w-4 h-4 border-l border-t border-transparent group-hover:border-primary/50 transition-colors" />
              <div className="absolute top-2 right-2 w-4 h-4 border-r border-t border-transparent group-hover:border-primary/50 transition-colors" />
              <div className="absolute bottom-2 left-2 w-4 h-4 border-l border-b border-transparent group-hover:border-primary/50 transition-colors" />
              <div className="absolute bottom-2 right-2 w-4 h-4 border-r border-b border-transparent group-hover:border-primary/50 transition-colors" />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CapabilitiesGrid;
