import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fine Bearing Review Tracker",
  description: "Track Google Reviews, QR scans, and employee performance for Fine Bearing & Oil Seal Store.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-brand-gray-light text-brand-black antialiased">
        {children}
      </body>
    </html>
  );
}
