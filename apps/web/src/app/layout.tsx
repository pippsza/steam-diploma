import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Steam Games",
  description: "Steam-like game store — Diploma project",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

/* Root layout is a passthrough — each route group defines its own <html>/<body>.
   Payload admin renders its own <html> via RootLayout from @payloadcms/next,
   and the frontend route group wraps with <html>/<body> in its own layout. */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
