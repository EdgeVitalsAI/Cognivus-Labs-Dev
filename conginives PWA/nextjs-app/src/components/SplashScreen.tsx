'use client';

export default function SplashScreen() {
  return (
    <div className="fixed inset-0 bg-background-dark flex items-center justify-center z-50">
      <div className="text-center animate-fade-in-up">
        <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 logo-pulse shimmer">
          <i className="fas fa-heartbeat text-5xl text-white"></i>
        </div>
        <h1 className="text-3xl font-bold tracking-wider mb-2">COGNIVUSLABS</h1>
        <p className="text-text-secondary text-sm">Loading...</p>
      </div>
    </div>
  );
}
