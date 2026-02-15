'use client';

interface HeaderProps {
  onBack: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export default function Header({ onBack, onRefresh, isRefreshing }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-4 bg-background-dark sticky top-0 z-50 border-b border-white/5">
      <button
        onClick={onBack}
        className="w-11 h-11 bg-transparent rounded-xl flex items-center justify-center text-white text-lg hover:bg-background-card transition-all"
      >
        <i className="fas fa-arrow-left"></i>
      </button>
      
      <h1 className="text-lg font-semibold">Patient Dashboard</h1>
      
      <button
        onClick={onRefresh}
        className="w-11 h-11 bg-transparent rounded-xl flex items-center justify-center text-white text-lg hover:bg-background-card transition-all"
      >
        <i className={`fas fa-sync-alt ${isRefreshing ? 'rotating' : ''}`}></i>
      </button>
    </header>
  );
}
