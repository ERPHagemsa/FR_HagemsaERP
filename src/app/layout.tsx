import type { Metadata } from "next";

import { AppShell } from "@/compartido/componentes/app-shell";
import { ThemeProvider } from "@/compartido/componentes/theme-provider";
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
<<<<<<< Updated upstream
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        "h-full antialiased",
        "font-sans",
        figtree.variable,
        manropeHeading.variable
      )}
    >
=======
    <html lang="es" className="h-full antialiased font-sans">
>>>>>>> Stashed changes
      <body className="min-h-full">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
