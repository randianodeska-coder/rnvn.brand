import type { Metadata, Viewport } from "next";
import { Inter, Bebas_Neue, Syncopate } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["300", "400", "500", "600"],
});

const bebasNeue = Bebas_Neue({ 
  subsets: ["latin"],
  variable: "--font-bebas",
  weight: ["400"],
});

const syncopate = Syncopate({ 
  subsets: ["latin"],
  variable: "--font-syncopate",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "RNVN OFFICIAL — Tak Dikenal. Tak Tertandingi.",
  description: "Indonesian premium streetwear label. Limited drops, signature boxy fits, dan identitas streetwear sejati.",
  keywords: ["RNVN", "streetwear", "baju premium", "kaos oversize", "fashion Indonesia", "limited drop"],
};

// viewport-fit=cover enables safe-area-inset on Android & iOS
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "SB-Mid-client-c8o8D2qXq5pMh02m";
  const snapScriptSrc = clientKey.startsWith("SB-")
    ? "https://app.sandbox.midtrans.com/snap/snap.js"
    : "https://app.midtrans.com/snap/snap.js";

  return (
    <html lang="id">
      <body className={`${inter.variable} ${bebasNeue.variable} ${syncopate.variable} antialiased`}>
        <Script 
          src={snapScriptSrc} 
          data-client-key={clientKey}
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
