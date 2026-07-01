"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, FileCheck2, Search } from "lucide-react"

import { extraerMensajeError } from "@/compartido/api/formato-error"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import { Input } from "@/compartido/componentes/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"

import { useContratosQuery } from "../servicios/contratos-queries"
import {
  type EstadoContrato,
  type FiltrosContratos,
} from "../tipos/contratos.tipos"

function BadgeEstado({ estado }: { estado: EstadoContrato }) {
  return (
    <Badge variant={estado === "ACTIVO" ? "default" : "secondary"}>
      {estado === "ACTIVO" ? "Activo" : "Vencido"}
    </Badge>
  )
}

function formatearFecha(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-PE")
}

// Vigencia es fecha-solo (medianoche UTC): se formatea en UTC para no correrla un
// dia por la zona horaria local.
function formatearFechaVigencia(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-PE", { timeZone: "UTC" })
}

interface Props {
  filtros: FiltrosContratos
  onFiltrosChange: (f: Partial<FiltrosContratos>) => void
}

export function ContratosListado({ filtros, onFiltrosChange }: Props) {
  const router = useRouter()
  const consulta = useContratosQuery(filtros)
  const filas = consulta.data?.data ?? []
  const total = consulta.data?.total ?? 0
  const pagina = consulta.data?.pagina ?? filtros.pagina ?? 1
  const porPagina = consulta.data?.porPagina ?? filtros.porPagina ?? 10
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))

  const [clienteLocal, setClienteLocal] = useState(filtros.idClienteExterno ?? "")
  const [estadoLocal, setEstadoLocal] = useState<string>(filtros.estado ?? "TODOS")

  function aplicarFiltros() {
    onFiltrosChange({
      idClienteExterno: clienteLocal.trim() || undefined,
      estado: estadoLocal === "TODOS" ? undefined : (estadoLocal as EstadoContrato),
      pagina: 1,
    })
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Contratos</CardTitle>
            <CardDescription>
              {total} {total === 1 ? "contrato" : "contratos"}
            </CardDescription>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Un contrato nace de un tarifario. Para crear uno, abre el tarifario del
          cliente y usa “Crear contrato”.
        </p>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-5">
        {consulta.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar la informacion</AlertTitle>
            <AlertDescription>{extraerMensajeError(consulta.error)}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-56 flex-1 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Cliente</span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Id de cliente..."
                value={clienteLocal}
                onChange={(e) => setClienteLocal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && aplicarFiltros()}
              />
            </div>
          </div>
          <div className="grid min-w-36 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Estado</span>
            <Select value={estadoLocal} onValueChange={setEstadoLocal}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="ACTIVO">Activo</SelectItem>
                <SelectItem value="VENCIDO">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={aplicarFiltros}>
            Buscar
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <Table className="w-full [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead className="text-center">PDF</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="text-center">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consulta.isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filas.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-28 text-center text-muted-foreground"
                  >
                    No hay contratos para los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filas.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/comercial/contratos/${item.id}`)}
                  >
                    <TableCell className="text-sm font-medium">
                      {item.codigoContrato ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.nombreClienteExterno ?? item.idClienteExterno}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatearFechaVigencia(item.vigenciaInicio)}
                      {" → "}
                      {formatearFechaVigencia(item.vigenciaFin)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.tienePdf ? (
                        <FileCheck2 className="mx-auto size-4 text-emerald-600" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <BadgeEstado estado={item.estado} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatearFecha(item.fechaCreacion)}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          aria-label="Ver"
                          onClick={() => router.push(`/comercial/contratos/${item.id}`)}
                        >
                          <Eye />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <div>{total > 0 ? `${total} registros` : "Sin resultados"}</div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagina <= 1}
              onClick={() => onFiltrosChange({ pagina: pagina - 1 })}
            >
              Anterior
            </Button>
            <span className="min-w-20 text-center">
              {pagina} / {totalPaginas}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={pagina >= totalPaginas}
              onClick={() => onFiltrosChange({ pagina: pagina + 1 })}
            >
              Siguiente
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
