'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      // Only show banner if not already installed (in standalone mode)
      if (!window.matchMedia('(display-mode: standalone)').matches) {
          setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      toast({
        title: 'Installation Success',
        description: 'Vidyalaya Notes has been installed on your device!',
      });
    }
    setShowBanner(false);
    // Defer clearing the prompt to allow for re-prompting if dismissed.
    // Some browsers might not allow this, but it's a good practice.
    setTimeout(() => setInstallPrompt(null), 1000);
  };

  const handleClose = () => {
    setShowBanner(false);
  };

  if (!showBanner || !installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center animate-in slide-in-from-bottom-10 duration-500 px-4">
        <div className="bg-background border rounded-lg shadow-lg flex items-center p-2 space-x-2 w-full max-w-md mx-auto">
            <Button onClick={handleInstallClick} className="flex-grow h-auto px-4 py-2">
                <Download className="h-4 w-4 mr-2" />
                Install App
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8 shrink-0">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </Button>
        </div>
    </div>
  );
};

export default InstallPWA;
