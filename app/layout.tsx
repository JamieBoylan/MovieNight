import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Movie Night",
  description: "Rate movies with your friends. Like Letterboxd, but for your group chat.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
