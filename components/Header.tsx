"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePathname, useRouter } from "next/navigation";

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
  const pageTitle = isAdminPage ? "Admin" : "Movies";
  const adminButtonLabel = isAdminPage ? "Home" : "Admin";
  const adminButtonLink = isAdminPage ? "/" : "/admin";

  return (
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-4xl font-black bg-gradient-to-r from-black via-black to-primary dark:from-white dark:to-primarylight bg-clip-text text-transparent">
        Critical Mess Podcast <span>{pageTitle}</span>
      </h1>

      <div className="flex gap-2 items-center">
        {loading ? (
          <p>Checking authentication...</p>
        ) : (
          <>
            {user && (
              <button
                onClick={() => router.push(adminButtonLink)}
                className="px-4 py-2 rounded transition-colors bg-secondary hover:bg-secondary/70"
              >
                {adminButtonLabel}
              </button>
            )}
            {user && (
              <button
                onClick={logout}
                className="px-4 py-2 rounded transition-colors bg-secondary hover:bg-secondary/70"
              >
                Logout
              </button>
            )}
          </>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
};

export default Header;
