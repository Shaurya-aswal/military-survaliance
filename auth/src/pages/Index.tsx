import { useNavigate } from 'react-router-dom';
import { Shield, Radar, Lock } from 'lucide-react';
import TacticalBackground from '@/components/TacticalBackground';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <TacticalBackground />

      <div className="text-center animate-fade-in">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 mb-8 animate-pulse-glow">
          <Radar className="w-12 h-12 text-emerald-400" />
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-slate-100 font-tactical tracking-wider mb-4">
          COMMAND CENTER
        </h1>
        <p className="text-slate-400 text-lg mb-8 font-tactical max-w-md mx-auto">
          TACTICAL OPERATIONS INTERFACE
        </p>

        {/* Status Bar */}
        <div className="flex items-center justify-center gap-6 mb-12">
          <div className="status-badge">
            <span className="status-dot status-dot-secure" />
            <span className="text-emerald-400">ONLINE</span>
          </div>
          <div className="status-badge">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span className="text-slate-400">SECURE</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => navigate('/auth')}
            className="px-8 py-4 rounded-lg btn-authenticate font-tactical text-sm inline-flex items-center justify-center gap-2"
          >
            <Shield className="w-4 h-4" />
            ACCESS COMMAND CENTER
          </button>
        </div>

        {/* Footer */}
        <div className="mt-16">
          <p className="text-slate-600 text-xs font-tactical">
            © 2026 COMMAND CENTER • ALL RIGHTS RESERVED
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
