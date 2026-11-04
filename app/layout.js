import "./globals.css";

export const metadata = {
  title: "TreasureHunt",
  description: "A cinematic three-world fantasy platform adventure.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
