import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cutout",
  description: "Локальный MVP для удаления фона с изображений"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
