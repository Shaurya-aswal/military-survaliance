import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { ReactNode, useEffect } from 'react';
import { useDetectionHistory } from '@/store/detectionHistory';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isSignedIn, isLoaded } = useAuth();
  const hydrate = useDetectionHistory((s) => s.hydrate);
  const hydrated = useDetectionHistory((s) => s.hydrated);

  // Re-hydrate from MongoDB every time a protected route mounts.
  // This ensures data survives logout → login cycles without a full page reload.
  useEffect(() => {
    if (isSignedIn) {
      hydrate();
    }
  }, [isSignedIn, hydrate]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(220,25%,6%)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-mono text-slate-400 uppercase tracking-wider">
            Verifying clearance...
          </p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
