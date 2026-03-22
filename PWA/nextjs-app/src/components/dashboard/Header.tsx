'use client';

interface HeaderProps {
    onBack: () => void;
    onRefresh: () => void;
    isRefreshing: boolean;
}

export default function Header({ onBack, onRefresh, isRefreshing }: HeaderProps) {
    return (
        <header className="sticky top-0 z-50 bg-background-dark/80 backdrop-blur-xl border-b border-white/[0.04]">
            <div className="flex items-center justify-between px-5 py-3">
                {/* Back Button */}
                <button
                    onClick={onBack}
                    className="group w-10 h-10 bg-white/[0.05] rounded-xl flex items-center justify-center text-white/70 text-sm
                     hover:bg-primary/15 hover:text-white
                     active:scale-95 transition-all duration-200"
                    aria-label="Go back"
                >
                    <i className="fas fa-arrow-left"></i>
                </button>

                {/* Title */}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent-green shadow-glow-green"></div>
                    <h1 className="text-base font-semibold text-white/90 tracking-tight">Patient Dashboard</h1>
                </div>

                {/* Refresh Button */}
                <button
                    onClick={onRefresh}
                    disabled={isRefreshing}
                    className="group w-10 h-10 bg-white/[0.05] rounded-xl flex items-center justify-center text-white/70 text-sm
                     hover:bg-primary/15 hover:text-white
                     active:scale-95 transition-all duration-200 disabled:opacity-50"
                    aria-label="Refresh vitals"
                >
                    <i className={`fas fa-sync-alt transition-transform duration-300 ${isRefreshing ? 'animate-rotate' : 'group-hover:rotate-90'
                        }`}></i>
                </button>
            </div>
        </header>
    );
}
