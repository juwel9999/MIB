import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MangaShelf",
  description: "Your personal manga reading library"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
