import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'pwa-install-dismissed';
const DISMISS_DAYS = 3;

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Don't show if dismissed recently
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedAt = Number(dismissed);
      const daysPassed = (Date.now() - dismissedAt) / (1000 * 60 * 60 * 24);
      if (daysPassed < DISMISS_DAYS) return;
    }

    // iOS detection — Safari doesn't fire beforeinstallprompt
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    if (ios) {
      setIsIOS(true);
      setShow(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
    } else {
      setInstalling(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6 flex justify-center">
      <div className="w-full max-w-md bg-[#121822] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-[#00c076] via-[#00e676] to-[#00c076]" />

        <div className="p-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            <img
              src="/branding/arglogo1.png"
              alt="Alpha Rise Global"
              className="w-14 h-14 rounded-2xl border border-white/10 shrink-0 object-cover"
            />
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-white">Install Alpha Rise Global</h2>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                Get the full app experience — faster access, offline support, and instant notifications.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-500 hover:text-white text-lg leading-none shrink-0 cursor-pointer mt-0.5"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>

          {/* Features */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            {[
              { icon: '⚡', label: 'Fast Access' },
              { icon: '🔔', label: 'Notifications' },
              { icon: '📱', label: 'App Feel' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1 bg-white/5 rounded-2xl py-2.5 px-2 border border-white/5">
                <span className="text-lg">{icon}</span>
                <span className="text-[10px] text-slate-400 font-medium">{label}</span>
              </div>
            ))}
          </div>

          {/* iOS instructions */}
          {isIOS ? (
            <div className="mt-4 bg-[#0e1520] border border-white/10 rounded-2xl p-3.5 space-y-2">
              <p className="text-xs font-bold text-white">To install on iOS:</p>
              <div className="space-y-1.5">
                {[
                  { step: '1', text: 'Tap the Share button in Safari' },
                  { step: '2', text: 'Scroll down and tap "Add to Home Screen"' },
                  { step: '3', text: 'Tap "Add" to confirm' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-2.5 text-xs text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-[#00c076]/20 text-[#00e676] text-[10px] font-bold flex items-center justify-center shrink-0">
                      {step}
                    </span>
                    {text}
                  </div>
                ))}
              </div>
              <button
                onClick={handleDismiss}
                className="w-full mt-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          ) : (
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-400 border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
              >
                Not now
              </button>
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-[#00c076] hover:bg-[#00a865] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {installing ? 'Installing...' : 'Install App'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
