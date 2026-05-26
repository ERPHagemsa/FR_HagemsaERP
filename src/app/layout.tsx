import type { Metadata } from "next";

import { EnvDebugLogger } from "@/compartido/componentes/env-debug-logger";
import { ThemeProvider } from "@/compartido/componentes/theme-provider";
import { Toaster } from "@/compartido/componentes/ui/sonner";
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
    <html
      lang="es"
      suppressHydrationWarning
      className="h-full antialiased font-sans"
    >
      <body className="min-h-full">
        <ThemeProvider>
          <EnvDebugLogger />
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
