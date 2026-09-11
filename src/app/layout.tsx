import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BackgroundImage } from "@/components/BackgroundImage";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
});

export const metadata: Metadata = {
  title: "AsKul — Asisten Kuliah",
  description: "Dashboard produktivitas pribadi untuk mahasiswa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakarta.variable}>
      <body className="antialiased">
        <BackgroundImage />
        {children}
      </body>
    </html>
  );
}