"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Lock, LogOut, House, Settings } from "lucide-react";

const Header: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setLoading(false); // Simulate authentication check
  }, []);

  // Determine page-specific title.
  const isAdminPage = pathname === "/admin";
  const pageTitle = isAdminPage ? "Hot Pocket Admin Panel" : "The Mess Hall";

  // Handler functions.
  const handleLogin = () => router.push("/login");
  const handleAdmin = () => router.push("/admin");
  const handleHome = () => router.push("/");

  return (
    <div className="flex justify-between items-center mb-2 xs:mb-4">
      <div className="flex gap-4">
        <h1 className="flex items-center text-2xl font-black dark:drop-shadow-lg">
          <span className="mr-2 dark:drop-shadow-lg">
            <svg
              version="1.1"
              id="Layer_1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
              x="0px"
              y="0px"
              viewBox="0 0 172.7 90.5"
              xmlSpace="preserve"
              className="h-8 w-auto fill-black dark:fill-white dark:drop-shadow-lg"
            >
              <g>
                <path
                  className="st10"
                  d="M2.3,67.7V22.9c0-13.5,7.3-20.6,21-20.6H51c13.7,0,21,7.1,21,20.6c0,1.1,0,1.4-0.1,1.9l-23.3,2.8v-0.8
                     c0-3.4-1.2-4.6-4.7-4.6H30.4c-3.5,0-4.7,1.2-4.7,4.6v37.1c0,3.4,1.2,4.6,4.7,4.6h13.5c3.5,0,4.7-1.2,4.7-4.6V63l23.3,2.8
                     c0.1,0.5,0.1,0.8,0.1,1.9c0,13.5-7.3,20.6-21,20.6H23.2C9.5,88.3,2.3,81.1,2.3,67.7z"
                />
                <path
                  className="st10"
                  d="M170.5,3.4v83.7H147V42.4l-16.4,26.1h-8.1l-16.4-26.1v44.7H82.8V3.4h22.6l21.3,33.8l21.2-33.8H170.5z"
                />
              </g>
            </svg>
          </span>
          <span className="dark:drop-shadow-lg hidden xs:block">{pageTitle}</span>
        </h1>
      </div>

      <div className="flex gap-2 items-center">
        {loading ? (
          <p>Checking authentication...</p>
        ) : (
          <TooltipProvider delayDuration={0}>
            {/* If no user is logged in, show Login button */}
            {!user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleLogin}
                    className="transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white"
                  >
                    <Lock className="transform w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-black">
                  <span>Login</span>
                </TooltipContent>
              </Tooltip>
            )}

            {user && user.isAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => {
                      if (pathname === "/admin") {
                        router.push("/");
                      } else {
                        router.push("/admin");
                      }
                    }}
                    className="transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white"
                  >
                    {pathname === "/admin" ? (
                      <House className="transform w-5 h-5" />
                    ) : (
                      <Settings className="transform w-5 h-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="bg-black">
                  <span>{pathname === "/admin" ? "Home" : "Admin Panel"}</span>
                </TooltipContent>
              </Tooltip>
            )}

            {/* If user is logged in (regardless of admin status), show Logout */}
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

            {/* Podcast Homepage Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => (window.location.href = "https://criticalmesspodcast.com")}
                  className="transition-colors bg-secondary hover:bg-secondary/70 text-black dark:text-white [&_svg]:size-5"
                >
                  <svg
                    version="1.1"
                    id="Layer_1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink"
                    x="0px"
                    y="0px"
                    viewBox="0 0 172.7 90.5"
                    xmlSpace="preserve"
                    className="fill-black dark:fill-white dark:drop-shadow-lg"
                  >
                    <g>
                      <path
                        className="st10"
                        d="M2.3,67.7V22.9c0-13.5,7.3-20.6,21-20.6H51c13.7,0,21,7.1,21,20.6c0,1.1,0,1.4-0.1,1.9l-23.3,2.8v-0.8
                          c0-3.4-1.2-4.6-4.7-4.6H30.4c-3.5,0-4.7,1.2-4.7,4.6v37.1c0,3.4,1.2,4.6,4.7,4.6h13.5c3.5,0,4.7-1.2,4.7-4.6V63l23.3,2.8
                          c0.1,0.5,0.1,0.8,0.1,1.9c0,13.5-7.3,20.6-21,20.6H23.2C9.5,88.3,2.3,81.1,2.3,67.7z"
                      />
                      <path
                        className="st10"
                        d="M170.5,3.4v83.7H147V42.4l-16.4,26.1h-8.1l-16.4-26.1v44.7H82.8V3.4h22.6l21.3,33.8l21.2-33.8H170.5z"
                      />
                    </g>
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-black">
                <span>Podcast homepage</span>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Header;
