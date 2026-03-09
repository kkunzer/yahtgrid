import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YahtzGrid — Daily Dice Puzzle",
  description:
    "A daily puzzle game where you place dice rolls into a scoring grid. Score as high as you can — same puzzle for everyone, every day.",
  openGraph: {
    title: "YahtzGrid — Daily Dice Puzzle",
    description: "Beat par! Place your daily dice rolls for the highest score.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "YahtzGrid — Daily Dice Puzzle",
    description: "Beat par! Place your daily dice rolls for the highest score.",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
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
