import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import SmoothScrolling from "@/components/SmoothScrolling";
import Navigation from "@/components/Navigation";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://miteshshah.xyz"),
  title: "Mitesh Shah | The Architect",
  description: "Engineer of order out of chaos. Building flawless digital experiences and enterprise IT operations.",
  openGraph: {
    title: "Mitesh Shah | The Architect",
    description: "Engineer of order out of chaos. Building flawless digital experiences and enterprise IT operations.",
    url: "https://miteshshah.xyz",
    siteName: "Mitesh Shah Portfolio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mitesh Shah | The Architect",
    description: "Building flawless digital experiences and enterprise IT operations.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${outfit.variable}`}>
        <SmoothScrolling>
          {children}
        </SmoothScrolling>
        {/* Root Viewport Centered Floating Navigation Pill Bar */}
        <Navigation />
      </body>
    </html>
  );
}
