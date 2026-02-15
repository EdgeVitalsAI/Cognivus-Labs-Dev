'use client';

interface InstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export default function InstallPrompt({ onInstall, onDismiss }: InstallPromptProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background-card p-5 rounded-t-2xl shadow-2xl z-50 animate-slide-up">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-2xl text-white">
          <i className="fas fa-download"></i>
        </div>
        
        <div className="flex-1 min-w-[150px]">
          <h4 className="text-base font-semibold mb-1">Install CognivusLabs</h4>
          <p className="text-sm text-text-secondary">
            Add to your home screen for quick access
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onInstall}
            className="py-3 px-6 bg-primary rounded-lg text-white text-sm font-semibold hover:bg-primary-dark transition-all"
          >
            Install
          </button>
          <button
            onClick={onDismiss}
            className="py-3 px-4 bg-transparent text-text-secondary text-sm hover:text-white transition-all"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
