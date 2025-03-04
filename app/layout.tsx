import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import { Rubik } from "next/font/google";
import Header from "@/components/Header";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"], // Choose the weights you need
  variable: "--font-rubik", // Set a CSS variable for easy use in Tailwind
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Critical Mess Hall",
  description: "Companion app to the Critical Mess Podcast",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <html lang="en" className={rubik.variable}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans`}
        >
          <ThemeProvider>
            <div className="container mx-auto max-w-[1600px] px-4">
              <div className="p-6">
                <Header />
                {children}
              </div>
            </div>
          </ThemeProvider>
        </body>
      </html>
    </AuthProvider>
  );
}