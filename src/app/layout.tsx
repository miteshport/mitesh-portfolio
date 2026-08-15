import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import SmoothScrolling from "@/components/SmoothScrolling";
import { SoundroomProvider } from "@/context/SoundroomContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#020204",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://miteshshah.xyz"),
  title: "Mitesh Shah | The Architect",
  description: "Engineer of order out of chaos. Building flawless digital experiences and enterprise IT operations.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mitesh Pass",
  },
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
        <SoundroomProvider>
          <SmoothScrolling>
            {children}
          </SmoothScrolling>
        </SoundroomProvider>
      </body>
    </html>
  );
}
