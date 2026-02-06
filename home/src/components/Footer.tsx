import { motion } from "framer-motion";
import { Lock, Mail, Shield, MapPin, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Footer = () => {
  const [email, setEmail] = useState("");
  
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
                SENTINEL<span className="text-primary">DEFENSE</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Advanced surveillance and intelligence solutions for defense agencies, 
              government entities, and allied nations.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <Lock className="w-3 h-3 text-primary" />
              <span>End-to-End Encrypted Communications</span>
            </div>
          </motion.div>
          
          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Secure Contact
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Mail className="w-4 h-4 text-primary" />
                <span className="font-mono">secure@sentinel-defense.gov</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Phone className="w-4 h-4 text-primary" />
                <span className="font-mono">+1 (202) XXX-XXXX</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Arlington, VA | London, UK | Tel Aviv, IL</span>
              </div>
            </div>
          </motion.div>
          
          {/* Secure briefing form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Request Briefing
            </h4>
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter secure email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-secondary border border-border rounded text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              </div>
              <Button variant="tactical" className="w-full">
                <Lock className="w-4 h-4 mr-2" />
                Submit Encrypted Request
              </Button>
            </div>
          </motion.div>
        </div>
        
        {/* Disclaimer */}
        <div className="pt-8 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center font-mono leading-relaxed max-w-4xl mx-auto">
            CLASSIFICATION: UNCLASSIFIED // FOR OFFICIAL USE ONLY. This website and its contents are 
            intended solely for authorized government personnel and approved contractors with valid security 
            clearances. Unauthorized access, use, or disclosure may result in civil and criminal penalties 
            under 18 U.S.C. § 1030 and other applicable laws. All communications are monitored and recorded.
          </p>
          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} Sentinel Defense Systems</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span>Privacy Policy</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span>Terms of Service</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground" />
            <span>Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
