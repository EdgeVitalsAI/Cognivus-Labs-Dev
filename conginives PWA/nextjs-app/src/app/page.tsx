'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';
import LoginPage from '@/components/LoginPage';
import InstallPrompt from '@/components/InstallPrompt';

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Hide splash after 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    // Register service worker
    // NOTE: Registering a cache-heavy SW during `next dev` can serve stale bundles
    // and cause hard-to-debug runtime errors. Only enable it in production.
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(console.error);
    }

    // Handle install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt after delay
      const dismissed = localStorage.getItem('installPromptDismissed');
      if (!dismissed || Date.now() - parseInt(dismissed) > 86400000) {
        setTimeout(() => setShowInstallPrompt(true), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismissInstall = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  return (
    <main className="app-container">
      <LoginPage />
      
      {showInstallPrompt && (
        <InstallPrompt 
          onInstall={handleInstall} 
          onDismiss={handleDismissInstall} 
        />
      )}
    </main>
  );
}
