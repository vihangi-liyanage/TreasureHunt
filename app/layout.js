import "./globals.css";
import { AudioController } from "@/components/audio/audio-controller";

export const metadata = {
  title: "TreasureHunt",
  description: "A cinematic three-world fantasy platform adventure.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><AudioController />{children}</body>
    </html>
  );
}
