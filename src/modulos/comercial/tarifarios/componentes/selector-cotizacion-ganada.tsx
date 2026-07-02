"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"

import { extraerMensajeError } from "@/compartido/api/formato-error"
import { useConsulta } from "@/compartido/api/use-consulta"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert"
import { Button } from "@/compartido/componentes/ui/button"
import { Input } from "@/compartido/componentes/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"
import { listarCotizaciones } from "@/modulos/comercial/cotizaciones/servicios/cotizaciones-api"
import type { FiltrosCotizaciones } from "@/modulos/comercial/cotizaciones/tipos/cotizaciones.tipos"

import { useGenerarDesdeCotizacionMutation } from "../servicios/tarifarios-queries"

function formatearFecha(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-PE")
}

interface Props {
  abierto: boolean
  onCerrar: () => void
}

// Picker de cotizaciones GANADAS para generar un tarifario a partir de una.
export function SelectorCotizacionGanada({ abierto, onCerrar }: Props) {
  const router = useRouter()

  const [empresa, setEmpresa] = useState("")
  const [numero, setNumero] = useState("")
  const [filtros, setFiltros] = useState<FiltrosCotizaciones>({
    estado: "GANADA",
    pagina: 1,
    porPagina: 8,
  })
  const [error, setError] = useState<string | null>(null)
  const [generandoId, setGenerandoId] = useState<string | null>(null)

  const consulta = useConsulta(
    () => listarCotizaciones(filtros),
    [JSON.stringify(filtros)],
    { enabled: abierto },
  )
  const filas = consulta.data?.data ?? []
  const total = consulta.data?.total ?? 0
  const pagina = consulta.data?.pagina ?? filtros.pagina ?? 1
  const porPagina = consulta.data?.porPagina ?? filtros.porPagina ?? 8
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))

  const generar = useGenerarDesdeCotizacionMutation({
    onError: (err) => setError(extraerMensajeError(err)),
  })

  function aplicarFiltros() {
    const num = numero.trim() ? Number(numero.trim()) : undefined
    setFiltros((f) => ({
      ...f,
      busqueda: empresa.trim() || undefined,
      numeroCotizacion: num && !isNaN(num) ? num : undefined,
      pagina: 1,
    }))
  }

  function cambiarPagina(nueva: number) {
    setFiltros((f) => ({ ...f, pagina: nueva }))
  }

  async function handleSeleccionar(id: string) {
    setError(null)
    setGenerandoId(id)
    const resultado = await generar.mutateAsync(id).catch(() => null)
    setGenerandoId(null)
    if (resultado) {
      onCerrar()
      router.push(`/comercial/tarifarios/${resultado.id}`)
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <SheetContent
        side="right"
        className="w-full gap-0 data-[side=right]:sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>Generar desde cotizacion ganada</SheetTitle>
          <SheetDescription>
            Selecciona una cotizacion ganada para crear su tarifario.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo generar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {/* Filtros */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid min-w-48 flex-1 gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Empresa solicitante
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Razon social..."
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
                />
              </div>
            </div>
            <div className="grid min-w-28 gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                Codigo (N°)
              </span>
              <Input
                type="number"
                min={1}
                placeholder="Ej. 42"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
              />
            </div>
            <Button type="button" onClick={aplicarFiltros}>
              Buscar
            </Button>
          </div>

          {/* Tabla */}
          <div className="overflow-hidden rounded-xl border border-border">
            <Table className="w-full [&_td]:px-2 [&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead>Codigo</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="text-center">Accion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={5}>
                        <Skeleton className="h-7 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : filas.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No hay cotizaciones ganadas para los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filas.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono text-sm">
                        {item.codigoCotizacion ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">{item.origenNombre}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatearFecha(item.fechaCreacion)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {item.montoTotal != null
                          ? `${item.moneda ?? ""} ${item.montoTotal.toLocaleString("es-PE")}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={generar.isPending}
                          onClick={() => handleSeleccionar(item.id)}
                        >
                          {generandoId === item.id ? "Generando..." : "Generar"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginacion */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{total > 0 ? `${total} cotizaciones` : "Sin resultados"}</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagina <= 1}
                onClick={() => cambiarPagina(pagina - 1)}
              >
                Anterior
              </Button>
              <span className="min-w-16 text-center">
                {pagina} / {totalPaginas}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagina >= totalPaginas}
                onClick={() => cambiarPagina(pagina + 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
