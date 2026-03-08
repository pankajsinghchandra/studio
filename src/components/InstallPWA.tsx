'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const REMINDER_INTERVAL = 5 * 60 * 1000; // 5 minutes

const InstallPWA = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const { toast } = useToast();

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      toast({
        title: 'Installation Success',
        description: 'Vidyalaya Notes has been installed on your device!',
      });
      setShowBanner(false);
    }
  };

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

  useEffect(() => {
    const intervalId = setInterval(() => {
      // Check if not installed and if the prompt is available
      if (installPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
        toast({
          title: 'Install Vidyalaya Notes?',
          description: 'Get a better experience by installing the app on your device.',
          duration: 10000, // Show toast for 10 seconds
          action: (
            <ToastAction altText="Install" onClick={handleInstallClick}>
              Install
            </ToastAction>
          ),
        });
      }
    }, REMINDER_INTERVAL);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, [installPrompt, toast]);


  const handleCloseBanner = () => {
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-4 inset-x-0 z-50 flex justify-center animate-in slide-in-from-bottom-10 duration-500 px-4">
        <div className="bg-background border rounded-lg shadow-lg flex items-center p-2 space-x-4 w-full max-w-lg mx-auto">
            <div className="flex-grow flex items-center gap-4">
               <div className="bg-primary/10 p-3 rounded-lg">
                  <Download className="h-6 w-6 text-primary" />
               </div>
               <div>
                  <p className="font-bold text-foreground">Install Vidyalaya Notes</p>
                  <p className="text-sm text-muted-foreground">For a better & faster experience.</p>
               </div>
            </div>
            <Button onClick={handleInstallClick} className="shrink-0">
                Install
            </Button>
            <Button variant="ghost" size="icon" onClick={handleCloseBanner} className="h-8 w-8 shrink-0 text-muted-foreground">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
            </Button>
        </div>
    </div>
  );
};

export default InstallPWA;
