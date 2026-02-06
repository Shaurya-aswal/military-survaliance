import { motion } from "framer-motion";
import { Shield, Menu, X, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const navLinks = [
  { label: "Capabilities", href: "#capabilities" },
  { label: "Technology", href: "#technology" },
  { label: "Compliance", href: "#compliance" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  
  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-primary/20">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight">
              MILITARY<span className="text-primary">SURVEILLANCE</span>
            </span>
          </div>
          
          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium uppercase tracking-wider"
              >
                {link.label}
              </a>
            ))}
          </div>
          
          {/* CTA */}
          <div className="hidden md:block">
            <Button variant="tactical" size="sm" onClick={() => navigate('/auth')}>
              <Lock className="w-4 h-4 mr-2" />
              Secure Access
            </Button>
          </div>
          
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
        
        {/* Mobile menu */}
        {isOpen && (
          <motion.div 
            className="md:hidden py-4 border-t border-border"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium uppercase tracking-wider"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Button variant="tactical" size="sm" className="w-full mt-2" onClick={() => { setIsOpen(false); navigate('/auth'); }}>
                <Lock className="w-4 h-4 mr-2" />
                Secure Access
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
