import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SplitNIM — Split the bill. Pay your share.",
  description:
    "Create shared bills and settle every share directly with NIM inside Nimiq Pay.",
  icons: {
    icon: "/favicon-new.svg",
    shortcut: "/favicon-new.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
