import { motion } from "framer-motion";
import { Shield, CheckCircle } from "lucide-react";

const certifications = [
  { name: "PyTorch", label: "Deep Learning Framework" },
  { name: "Ultralytics", label: "YOLOv8 Engine" },
  { name: "Hugging Face", label: "ViT Pretrained Weights" },
  { name: "OpenLayers", label: "Tactical Map Rendering" },
  { name: "Clerk", label: "Authentication & Auth" },
];

const TrustStrip = () => {
  return (
    <section className="relative py-16 border-y border-border bg-secondary/30">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="text-sm font-mono text-muted-foreground uppercase tracking-wider">
              Powered By
            </span>
          </div>
          <p className="text-foreground font-medium">
            Built with industry-leading open-source technologies
          </p>
        </motion.div>
        
        <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
          {certifications.map((cert, i) => (
            <motion.div
              key={cert.name}
              className="flex items-center gap-2 px-4 py-2 rounded border border-border bg-card/50"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <CheckCircle className="w-4 h-4 text-primary" />
              <div className="text-left">
                <div className="text-sm font-semibold text-foreground">{cert.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono uppercase">{cert.label}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustStrip;
