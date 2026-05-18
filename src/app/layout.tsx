import type { Metadata } from "next";

import { AppShell } from "@/compartido/componentes/app-shell";
import { ThemeProvider } from "@/compartido/componentes/theme-provider";
import "./globals.css";
import { Figtree, Manrope } from "next/font/google";
import { cn } from "@/compartido/utilidades/utils";

const manropeHeading = Manrope({subsets:['latin'],variable:'--font-heading'});

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

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
      className={cn(
        "h-full antialiased",
        "font-sans",
        figtree.variable,
        manropeHeading.variable
      )}
    >
      <body className="min-h-full">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
