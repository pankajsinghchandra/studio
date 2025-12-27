'use client';

import { cn } from "@/lib/utils";
import { Loader } from "lucide-react";

export default function LoadingOverlay({ isLoading }: { isLoading: boolean }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm transition-opacity",
        isLoading ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
    >
      <Loader className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
