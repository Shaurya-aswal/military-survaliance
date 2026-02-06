import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, AlertTriangle, User, Lock, Mail } from 'lucide-react';
import TacticalBackground from '@/components/TacticalBackground';

type AuthMode = 'login' | 'signup';

const Auth = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    callsign: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (!formData.email || !formData.password) {
      setError('SECURITY BREACH: All fields required');
      setIsLoading(false);
      return;
    }

    if (mode === 'signup') {
      if (formData.password !== formData.confirmPassword) {
        setError('AUTHENTICATION FAILED: Passwords do not match');
        setIsLoading(false);
        return;
      }
      if (formData.password.length < 8) {
        setError('SECURITY PROTOCOL: Minimum 8 characters required');
        setIsLoading(false);
        return;
      }
    }

    // Simulate authentication (replace with actual Supabase auth when Cloud is enabled)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    
    // For now, show a message that backend is needed
    setError('SYSTEM NOTICE: Backend authentication required. Connect to the backend API to proceed.');
  };

  const handleGuestAccess = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <TacticalBackground />

      {/* Main Auth Card */}
      <div className="w-full max-w-md animate-scale-in">
        {/* Status Badge */}
        <div className="flex justify-end mb-4">
          <div className="status-badge">
            <span className="status-dot status-dot-secure" />
            <span className="text-emerald-400">System Status: SECURE</span>
          </div>
        </div>

        {/* Glass Card */}
        <div className="glass-card-glow rounded-xl p-8 relative">
          {/* Corner Decorations */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-500/50 rounded-tl-xl" />
          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-500/50 rounded-tr-xl" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-500/50 rounded-bl-xl" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-500/50 rounded-br-xl" />

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <Shield className="w-8 h-8 text-emerald-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-100 font-tactical tracking-wider">
              COMMAND CENTER
            </h1>
            <p className="text-slate-400 text-sm mt-2 font-tactical">
              SECURITY CLEARANCE REQUIRED
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b border-slate-700 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`tactical-tab flex-1 ${mode === 'login' ? 'tactical-tab-active' : ''}`}
            >
              Officer Login
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`tactical-tab flex-1 ${mode === 'signup' ? 'tactical-tab-active' : ''}`}
            >
              New Recruit
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="block text-xs text-slate-400 uppercase tracking-wider font-tactical">
                  Callsign
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    name="callsign"
                    value={formData.callsign}
                    onChange={handleInputChange}
                    placeholder="Enter your callsign"
                    className="w-full pl-10 pr-4 py-3 rounded-lg tactical-input"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs text-slate-400 uppercase tracking-wider font-tactical">
                Secure Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="officer@command.mil"
                  className="w-full pl-10 pr-4 py-3 rounded-lg tactical-input"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs text-slate-400 uppercase tracking-wider font-tactical">
                Access Code
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-12 py-3 rounded-lg tactical-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="block text-xs text-slate-400 uppercase tracking-wider font-tactical">
                  Confirm Access Code
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg tactical-input"
                  />
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 animate-fade-in">
                <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <p className="text-rose-500 text-sm font-tactical">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 rounded-lg btn-authenticate font-tactical text-sm flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  AUTHENTICATE
                </>
              )}
            </button>
          </form>

          {/* Security Clearance Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-amber-500 text-xs font-tactical">
            <AlertTriangle className="w-3 h-3" />
            <span>SECURITY CLEARANCE: LEVEL 3 REQUIRED</span>
          </div>
        </div>

        {/* Guest Access Link */}
        <div className="mt-6 text-center">
          <button
            onClick={handleGuestAccess}
            className="scanline-link text-sm font-tactical"
          >
            Civilian / Guest Access →
          </button>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-600 text-xs font-tactical">
            ENCRYPTED CONNECTION • TLS 1.3 • MILITARY GRADE
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
