import "./globals.css";

export const metadata = {
  title: "Notion Stopwatch Widget",
  description: "A tiny persistent stopwatch for Notion embeds"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
