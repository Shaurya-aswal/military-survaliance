import { motion } from "framer-motion";
import { Lock, Server, Activity, Wifi, Shield, Database, Cpu, Globe } from "lucide-react";
import { useEffect, useState } from "react";

const TelemetryCard = ({ 
  icon: Icon, 
  label, 
  value, 
  unit,
  status,
  delay = 0 
}: { 
  icon: React.ElementType;
  label: string;
  value: string;
  unit?: string;
  status: "online" | "active" | "secure";
  delay?: number;
}) => {
  const [displayValue, setDisplayValue] = useState("---");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  const statusColors = {
    online: "text-primary bg-primary/20",
    active: "text-accent bg-accent/20",
    secure: "text-primary bg-primary/20",
  };
  
  return (
    <motion.div 
      className="glass-card rounded-lg p-5 border-glow"
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-2 rounded bg-secondary">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${statusColors[status]}`}>
          {status}
        </span>
      </div>
      <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider mb-1">
        {label}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-mono font-bold text-foreground data-flicker">
          {displayValue}
        </span>
        {unit && (
          <span className="text-sm text-muted-foreground font-mono">
            {unit}
          </span>
        )}
      </div>
    </motion.div>
  );
};

const EncryptionMeter = () => {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, 50);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <motion.div 
      className="glass-card rounded-lg p-5 border-glow col-span-2"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-primary/20">
            <Lock className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">AES-256 Encryption</div>
            <div className="text-xs text-muted-foreground font-mono">Active Key Rotation</div>
          </div>
        </div>
        <span className="px-2 py-1 rounded text-xs font-mono uppercase bg-primary/20 text-primary">
          Secure
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="text-muted-foreground">Encryption Cycle</span>
          <span className="text-primary">{progress}%</span>
        </div>
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
          <span>KEY_ID: 0x7F3A</span>
          <span>NEXT ROTATION: 04:32:17</span>
        </div>
      </div>
    </motion.div>
  );
};

const TechSection = () => {
  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-background via-midnight to-background">
      {/* Grid background */}
      <div className="absolute inset-0 tactical-grid opacity-5" />
      
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
            <Cpu className="w-4 h-4 text-primary" />
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              System Telemetry
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Command Center Dashboard
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Real-time operational metrics from our global surveillance network.
          </p>
        </motion.div>
        
        {/* Dashboard grid */}
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          <TelemetryCard
            icon={Server}
            label="System Uptime"
            value="99.97"
            unit="%"
            status="online"
            delay={0.1}
          />
          <TelemetryCard
            icon={Activity}
            label="Active Feeds"
            value="2,847"
            status="active"
            delay={0.2}
          />
          <TelemetryCard
            icon={Globe}
            label="Nodes Online"
            value="128"
            status="online"
            delay={0.3}
          />
          <TelemetryCard
            icon={Database}
            label="Data Processed"
            value="4.7"
            unit="PB"
            status="active"
            delay={0.4}
          />
          
          <EncryptionMeter />
          
          <TelemetryCard
            icon={Wifi}
            label="Latency"
            value="12"
            unit="ms"
            status="online"
            delay={0.5}
          />
          <TelemetryCard
            icon={Shield}
            label="Threats Blocked"
            value="47.2K"
            status="secure"
            delay={0.6}
          />
        </div>
      </div>
    </section>
  );
};

export default TechSection;
