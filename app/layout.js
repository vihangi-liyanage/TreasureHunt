import "./globals.css";

export const metadata = {
  title: "TreasureHunt",
  description: "A cinematic three-world 2D platform adventure.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
