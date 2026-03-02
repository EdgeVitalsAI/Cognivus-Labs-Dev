'use client';

interface HeaderProps {
  onBack: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function Header({ onBack, onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="gradient-header sticky top-0 z-50 border-b border-white/[0.06]">
      <div className="flex items-center justify-between px-5 py-4">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="group w-11 h-11 bg-white/[0.06] rounded-2xl flex items-center justify-center text-white/80 text-base
                     hover:bg-primary/20 hover:text-primary-light hover:shadow-glow-primary
                     active:scale-95 transition-all duration-300"
          aria-label="Go back"
        >
          <i className="fas fa-arrow-left group-hover:-translate-x-0.5 transition-transform duration-300"></i>
        </button>
        
        {/* Title */}
        <div className="flex items-center gap-2.5">
          <div className="status-dot status-dot-green"></div>
          <h1 className="text-lg font-semibold tracking-tight gradient-text">Patient Dashboard</h1>
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="group w-11 h-11 bg-white/[0.06] rounded-2xl flex items-center justify-center text-white/80 text-base
                     hover:bg-primary/20 hover:text-primary-light hover:shadow-glow-primary
                     active:scale-95 transition-all duration-300 disabled:opacity-50"
          aria-label="Refresh vitals"
        >
          <i className={`fas fa-sync-alt transition-transform duration-300 ${
            isRefreshing ? 'animate-rotate' : 'group-hover:rotate-45'
          }`}></i>
        </button>
      </div>
    </header>
  );
}
