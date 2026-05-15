import type { Metadata } from "next";

import { AppShell } from "@/compartido/componentes/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hagemsa Front DDD",
  description: "Base frontend organizada por modulos de negocio.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
