"use client"

import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/compartido/componentes/ui/dialog"
import { Empty } from "@/compartido/componentes/ui/empty"
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

import { useEventosAuditoria } from "../ganchos/use-eventos-auditoria"
import {
  TIPOS_EVENTO_AUTH,
  type EventoAuditoriaResponse,
  type ListarEventosAuditoriaQuery,
} from "../tipos/administracion.tipos"

const LIMIT_PAGINA = 20

// Cuales eventos son "alarmantes" o "neutrales", para colorear el badge.
function variantePorTipo(
  tipo: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (
    tipo === "login_fallido" ||
    tipo === "credencial_bloqueada" ||
    tipo === "token_reusado" ||
    tipo === "cuenta_suspendida" ||
    tipo === "sesion_revocada_admin" ||
    tipo === "asignacion_revocada"
  ) {
    return "destructive"
  }
  if (tipo === "login_exitoso" || tipo === "cuenta_creada") {
    return "default"
  }
  return "secondary"
}

interface PropsDialogMetadata {
  evento: EventoAuditoriaResponse
}

function DialogMetadata({ evento }: PropsDialogMetadata) {
  const metadataTexto = useMemo(
    () => JSON.stringify(evento.metadata, null, 2),
    [evento.metadata],
  )
  const sinMetadata = Object.keys(evento.metadata).length === 0

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={sinMetadata}>
          <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          Detalle
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalle del evento</DialogTitle>
          <DialogDescription>
            <span className="font-mono">{evento.tipo}</span> —{" "}
            {new Date(evento.ocurridoEn).toLocaleString("es-PE")}
          </DialogDescription>
        </DialogHeader>
        <pre className="max-h-[60vh] overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
          {metadataTexto}
        </pre>
      </DialogContent>
    </Dialog>
  )
}

export function AuditoriaVista() {
  const [tipo, setTipo] = useState<string>("todos")
  const [cuentaId, setCuentaId] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  // `pagina` es 1-based — coincide con el paginador del backend.
  const [pagina, setPagina] = useState(1)

  const query = useMemo<ListarEventosAuditoriaQuery>(
    () => ({
      tipo: tipo === "todos" ? undefined : tipo,
      cuentaId: cuentaId.trim() || undefined,
      desde: desde ? new Date(desde).toISOString() : undefined,
      hasta: hasta ? new Date(hasta).toISOString() : undefined,
      pagina,
      limite: LIMIT_PAGINA,
    }),
    [tipo, cuentaId, desde, hasta, pagina],
  )

  const { data, isLoading, isError, error } = useEventosAuditoria(query)

  function aplicarFiltros<T>(setter: (v: T) => void) {
    return (valor: T) => {
      setter(valor)
      setPagina(1)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Auditoria</CardTitle>
          <CardDescription>
            Eventos de seguridad y administracion registrados por el sistema
            (append-only). Util para investigar incidentes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Select
              value={tipo}
              onValueChange={(v) => aplicarFiltros<string>(setTipo)(v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {TIPOS_EVENTO_AUTH.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="ID de cuenta (UUID)"
              value={cuentaId}
              onChange={(e) =>
                aplicarFiltros<string>(setCuentaId)(e.target.value)
              }
            />

            <Input
              type="datetime-local"
              value={desde}
              onChange={(e) => aplicarFiltros<string>(setDesde)(e.target.value)}
              aria-label="Desde"
            />

            <Input
              type="datetime-local"
              value={hasta}
              onChange={(e) => aplicarFiltros<string>(setHasta)(e.target.value)}
              aria-label="Hasta"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-8 text-center text-destructive"
                  >
                    {error instanceof Error
                      ? error.message
                      : "No se pudieron cargar los eventos."}
                  </TableCell>
                </TableRow>
              ) : data?.datos && data.datos.length > 0 ? (
                data.datos.map((evento) => (
                  <TableRow key={evento.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(evento.ocurridoEn).toLocaleString("es-PE")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={variantePorTipo(evento.tipo)}
                        className="font-mono"
                      >
                        {evento.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {evento.cuentaId
                        ? `${evento.cuentaId.slice(0, 8)}…`
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {evento.ipAddress ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DialogMetadata evento={evento} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Empty>
                      No hay eventos que coincidan con los filtros.
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data && data.paginacion.totalPaginas > 1 ? (
            <div className="flex items-center justify-between gap-2 pt-2">
              <p className="text-sm text-muted-foreground">
                Pagina {data.paginacion.pagina} de{" "}
                {data.paginacion.totalPaginas} ({data.paginacion.total} eventos)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={!data.paginacion.tieneAnterior}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina((p) => p + 1)}
                  disabled={!data.paginacion.tieneSiguiente}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
