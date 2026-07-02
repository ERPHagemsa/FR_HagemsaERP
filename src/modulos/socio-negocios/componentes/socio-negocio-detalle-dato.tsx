import type { ReactNode } from "react"

/** Formatea una fecha ISO al formato local es-PE; devuelve "-" cuando no hay valor. */
export function formatearFecha(fecha?: string | Date | null) {
  if (!fecha) return "-"

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha))
}

/** Celda etiqueta/valor usada en las cuadrículas de detalle del socio. */
export function DatoVer({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  return (
    <div className="min-w-0 bg-card p-4">
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 break-words font-medium">{value || "-"}</dd>
    </div>
  )
}

/**
 * Contenedor de una sección de detalle: encabezado con título/descripción y una
 * cuadrícula `<dl>` con las celdas {@link DatoVer} que reciba como `children`.
 */
export function SeccionDetalle({
  titulo,
  descripcion,
  children,
}: {
  titulo: string
  descripcion: string
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
      <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">{titulo}</h2>
        <p className="text-sm leading-5 text-muted-foreground">{descripcion}</p>
      </div>
      <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border text-sm sm:grid-cols-2 lg:grid-cols-3">
        {children}
      </dl>
    </section>
  )
}
