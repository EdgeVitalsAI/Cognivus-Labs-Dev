'use client';

export default function SplashScreen() {
    return (
        <div className="fixed inset-0 bg-background-dark flex items-center justify-center z-50">
            {/* Ambient glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/[0.08] rounded-full blur-3xl" />

            <div className="text-center animate-fade-in-up relative z-10">
                <div className="w-20 h-20 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-5 logo-pulse shadow-glow-primary">
                    <i className="fas fa-heartbeat text-4xl text-white"></i>
                </div>
                <h1 className="text-2xl font-bold tracking-[0.2em] mb-2 text-white">COGNIVUSLABS</h1>
                <div className="flex items-center justify-center gap-2 mt-3">
                    <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                    <p className="text-text-muted text-xs">Loading...</p>
                    <div className="w-1 h-1 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
            </div>
        </div>
    );
}
