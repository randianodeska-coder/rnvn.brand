import type { Metadata } from "next";
import { Inter, Bebas_Neue, Syncopate } from "next/font/google";
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
  title: "RNVN - OFFICIAL",
  description: "Tak Dikenal. Tak Tertandingi. Indonesian premium streetwear label.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${bebasNeue.variable} ${syncopate.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
