import { motion } from "framer-motion";
import { Shield, Crosshair, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import TopographicBackground from "./TopographicBackground";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <TopographicBackground />
      
      {/* Main content */}
      <div className="relative z-10 container mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status indicator */}
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-mono text-primary uppercase tracking-wider">
              Systems Operational
            </span>
          </motion.div>
          
          {/* Main headline */}
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <span className="text-foreground">Detect. Classify.</span>
            <br />
            <span className="text-primary">Neutralize Threats.</span>
          </motion.h1>
          
          {/* Subheadline */}
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            AI-powered military object detection using YOLOv8 and Vision Transformer.
            Real-time image analysis with geolocated threat mapping.
          </motion.p>
          
          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Button variant="hero" size="xl" onClick={() => navigate('/auth')}>
              <Lock className="w-5 h-5 mr-2" />
              Request Secure Briefing
            </Button>
            <Button variant="outline" size="xl">
              <Crosshair className="w-5 h-5 mr-2" />
              View Capabilities
            </Button>
          </motion.div>
          
          {/* Stats row */}
          <motion.div 
            className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-border"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            {[
              { label: "Detection Pipeline", value: "YOLO + ViT" },
              { label: "Object Classes", value: "10" },
              { label: "Stack", value: "FastAPI + React" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-bold font-mono text-primary">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          Scroll to explore
        </span>
        <motion.div 
          className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div 
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
