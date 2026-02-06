import { motion } from "framer-motion";
import { Lock, Mail, Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Footer = () => {
  const navigate = useNavigate();
  
  return (
    <footer className="relative py-16 bg-gradient-to-t from-secondary to-background border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded bg-primary/20">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground tracking-tight">
                MILITARY<span className="text-primary">SURVEILLANCE</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              AI-powered military object detection and classification system using
              YOLOv8 + Vision Transformer with real-time geolocation mapping.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Lock className="w-3 h-3 text-primary" />
              <span>Clerk-Authenticated Dashboard</span>
            </div>
          </motion.div>
          
          {/* Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Tech Stack
            </h4>
            <div className="space-y-2 text-sm text-muted-foreground font-mono">
              <p>FastAPI · Python · PyTorch</p>
              <p>React · TypeScript · Vite</p>
              <p>MongoDB · Zustand · Tailwind</p>
              <p>OpenLayers · Clerk Auth</p>
              <p>YOLOv8 · ViT-B/16</p>
            </div>
          </motion.div>
          
          {/* Quick links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Quick Access
            </h4>
            <div className="space-y-3">
              <Button variant="tactical" className="w-full" onClick={() => navigate('/auth')}>
                <Lock className="w-4 h-4 mr-2" />
                Sign In to Dashboard
              </Button>
              <a
                href="https://github.com/Shaurya-aswal/military-survaliance"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded border border-border bg-secondary/50 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors font-mono"
              >
                <ExternalLink className="w-4 h-4" />
                View on GitHub
              </a>
            </div>
          </motion.div>
        </div>
        
        {/* Disclaimer */}
        <div className="pt-8 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center font-mono leading-relaxed max-w-4xl mx-auto">
            This is an academic / portfolio project demonstrating AI-based military object detection.
            It is not affiliated with any government or defense organization. All data shown is generated
            from user-uploaded images processed by open-source machine learning models.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Military Surveillance Project</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span>Built by Shaurya</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
