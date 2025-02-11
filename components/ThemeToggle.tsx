"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flickering by waiting until the component is mounted
  if (!mounted) {
    return <div className="p-2 rounded-lg bg-secondary transition hover:bg-secondary/50" />;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg bg-secondary transition hover:bg-secondary/50"
          >
            {resolvedTheme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </TooltipTrigger>
        <TooltipContent className="bg-black">
          <span>{resolvedTheme === 'dark' ? 'Lights On' : 'Lights Off'}</span>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
  );
}
