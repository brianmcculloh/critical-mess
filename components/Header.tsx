"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Lock, LogOut, House, ArrowLeft } from "lucide-react";

const Header: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setLoading(false); // Simulate authentication check
  }, []);

  // Determine page-specific values
  const isAdminPage = pathname === "/admin";
  const isInsightsPage = pathname === "/insights";
  const isTopHundredPage = pathname === "/tophundred";
  const pageTitle = isAdminPage ? "Nip Talk" : isInsightsPage ? "Critical Mess Insights" : isTopHundredPage ? "CM Top 100" : "Critical Mess Hall";
  const adminButtonLabel = isAdminPage ? <House className="transform w-5 h-5" /> : <Lock className="transform w-5 h-5" />;
  const adminButtonLink = isAdminPage ? "/" : "/admin";
  const adminButtonTooltip = isAdminPage ? "Home" : "Admin Panel";

  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex gap-4">
        <h1 className="text-2xl font-black bg-gradient-to-r from-black via-black to-primary dark:from-white dark:to-primarylight bg-clip-text text-transparent">
          <span>{pageTitle}</span>
        </h1>
        {(isInsightsPage || isTopHundredPage) && (
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => router.push("/")}
                  className="transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white"
                >
                  <ArrowLeft className="transform w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-black">
                <span>Back to homepage</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <div className="flex gap-2 items-center">
        {loading ? (
          <p>Checking authentication...</p>
        ) : (
          <>
            <TooltipProvider delayDuration={0}>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => router.push(adminButtonLink)}
                    className="transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white"
                  >
                    {adminButtonLabel}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-black">
                  <span>{adminButtonTooltip}</span>
                </TooltipContent>
              </Tooltip>
              
              {user && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={logout}
                      className="transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white"
                    >
                      <LogOut className="transform w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black">
                    <span>Logout</span>
                  </TooltipContent>
                </Tooltip>
                
              )}
            </TooltipProvider>
          </>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Header;
