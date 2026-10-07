import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Nexo — conversas que aproximam",
  description: "Uma rede social minimalista para boas conversas.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
