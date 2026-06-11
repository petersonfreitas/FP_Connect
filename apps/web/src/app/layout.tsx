import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FP Connect",
  description: "Portal do ecossistema SaaS FP WebTech",
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
