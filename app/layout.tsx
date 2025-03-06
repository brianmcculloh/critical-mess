import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import "./globals.css";
import { Rubik } from "next/font/google";
import Header from "@/components/Header";

const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-rubik",
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
  title: "The Critical Mess Hall",
  description: "The official companion app for the Critical Mess Podcast",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <html lang="en" className={rubik.variable}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased font-sans relative`}
        >
          <div
            className="fixed top-0 left-0 pointer-events-none -z-10 w-[240px] h-[240px] 
              bg-[linear-gradient(135deg,#6a3253_0%,#6a3253_10%,#b92638_10%,#b92638_20%,#ce3b45_20%,#ce3b45_30%,#d5693f_30%,#d5693f_40%,#ebb533_40%,#ebb533_50%,#ffffff_50%,#ffffff_100%)]
              dark:bg-[linear-gradient(135deg,#6a3253_0%,#6a3253_10%,#b92638_10%,#b92638_20%,#ce3b45_20%,#ce3b45_30%,#d5693f_30%,#d5693f_40%,#ebb533_40%,#ebb533_50%,hsl(20,14.3%,4.1%)_50%,hsl(20,14.3%,4.1%)_100%)]"
          />

          {/* COLORS REVERSED
          <div
            className="fixed top-0 left-0 pointer-events-none -z-10 w-[250px] h-[250px] 
            bg-[linear-gradient(135deg,#ebb533_0%,#ebb533_10%,#d5693f_10%,#d5693f_20%,#ce3b45_20%,#ce3b45_30%,#b92638_30%,#b92638_40%,#6a3253_40%,#6a3253_50%,#ffffff_50%,#ffffff_100%)]
            dark:bg-[linear-gradient(135deg,#ebb533_0%,#ebb533_10%,#d5693f_10%,#d5693f_20%,#ce3b45_20%,#ce3b45_30%,#b92638_30%,#b92638_40%,#6a3253_40%,#6a3253_50%,hsl(20,14.3%,4.1%)_50%,hsl(20,14.3%,4.1%)_100%)]"
          /> */}

          <ThemeProvider>
            <div className="container mx-auto max-w-[1600px] py-3 px-4 lg:py-6 lg:px-8">
              <Header />
              {children}
            </div>
          </ThemeProvider>
        </body>
      </html>
    </AuthProvider>
  );
}
