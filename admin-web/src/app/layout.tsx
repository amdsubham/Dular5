import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dular Admin Panel",
  description: "Admin panel for Dular app management",
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
