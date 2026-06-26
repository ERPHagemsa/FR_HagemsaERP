import * as React from "react";

// Contenedor estandar de las vistas de listado del modulo Comercial.
// Fuente unica del estilo de pagina: ancho completo dentro del area de trabajo
// (sin max-w) y sin Card envolvente. El contenido propio de cada pantalla
// (KPIs, filtros, tabla) entra como children.
export function PaginaListado({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="flex w-full flex-col gap-5">{children}</div>
    </main>
  );
}
