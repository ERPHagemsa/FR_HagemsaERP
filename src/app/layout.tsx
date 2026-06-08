import type { Metadata } from "next";

import { EnvDebugLogger } from "@/compartido/componentes/env-debug-logger";
import { ThemeProvider } from "@/compartido/componentes/theme-provider";
import { Toaster } from "@/compartido/componentes/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hagemsa Front DDD",
  description: "Base frontend organizada por modulos de negocio.",
  // ERP privado: nunca debe indexarse en buscadores. Emite
  // <meta name="robots" content="noindex, nofollow"> en todas las paginas.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
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
