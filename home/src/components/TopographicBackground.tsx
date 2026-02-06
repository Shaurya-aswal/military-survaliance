import { motion } from "framer-motion";

const TopographicBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Base gradient */}
      <div className="absolute inset-0 topo-bg" />
      
      {/* Tactical grid */}
      <div className="absolute inset-0 tactical-grid opacity-30" />
      
      {/* Animated topographic lines */}
      <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(150 100% 45%)" stopOpacity="0" />
            <stop offset="50%" stopColor="hsl(150 100% 45%)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="hsl(150 100% 45%)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Contour lines */}
        {[...Array(8)].map((_, i) => (
          <motion.ellipse
            key={i}
            cx="500"
            cy="300"
            rx={100 + i * 60}
            ry={50 + i * 35}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ 
              opacity: [0.1, 0.3, 0.1],
              scale: [0.95, 1.02, 0.95]
            }}
            transition={{ 
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.3,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Secondary contour group */}
        {[...Array(5)].map((_, i) => (
          <motion.ellipse
            key={`secondary-${i}`}
            cx="750"
            cy="150"
            rx={40 + i * 35}
            ry={25 + i * 20}
            fill="none"
            stroke="hsl(38 100% 55%)"
            strokeWidth="0.5"
            opacity="0.15"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{ 
              duration: 5 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut"
            }}
          />
        ))}
      </svg>
      
      {/* Scanning line effect */}
      <motion.div 
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
        initial={{ top: 0, opacity: 0 }}
        animate={{ 
          top: ["0%", "100%"],
          opacity: [0, 0.5, 0]
        }}
        transition={{ 
          duration: 6,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      
      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-32 h-32 border-l-2 border-t-2 border-primary/20" />
      <div className="absolute top-0 right-0 w-32 h-32 border-r-2 border-t-2 border-primary/20" />
      <div className="absolute bottom-0 left-0 w-32 h-32 border-l-2 border-b-2 border-primary/20" />
      <div className="absolute bottom-0 right-0 w-32 h-32 border-r-2 border-b-2 border-primary/20" />
      
      {/* Data points */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`point-${i}`}
          className="absolute w-1 h-1 rounded-full bg-primary/50"
          style={{
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            opacity: [0.2, 0.8, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
};

export default TopographicBackground;
