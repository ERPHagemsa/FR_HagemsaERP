"use client"

import { useMemo, useState } from "react"
import { Eye } from "lucide-react"

import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
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
import { cn } from "@/compartido/utilidades/utils"

import { PiePaginacion } from "../componentes/paginacion-tabla"
import { useEventosAuditoria } from "../ganchos/use-eventos-auditoria"
import {
  TIPOS_EVENTO_AUTH,
  type EventoAuditoriaResponse,
  type ListarEventosAuditoriaQuery,
} from "../tipos/administracion.tipos"

const LIMIT_PAGINA = 20
const COLUMNAS = 5

// Tinte del badge por severidad del evento. Tintes suaves con variantes dark:
// explicitas para que el tono cambie de verdad entre tema claro y oscuro.
function clasePorTipo(tipo: string): string {
  if (
    tipo === "login_fallido" ||
    tipo === "credencial_bloqueada" ||
    tipo === "token_reusado" ||
    tipo === "cuenta_suspendida" ||
    tipo === "sesion_revocada_admin" ||
    tipo === "asignacion_revocada"
  ) {
    return "bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400"
  }
  if (tipo === "login_exitoso" || tipo === "cuenta_creada") {
    return "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
  }
  return "bg-muted text-muted-foreground"
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
        <Button variant="ghost" size="sm" disabled={sinMetadata} className="rounded-md">
          <Eye />
          Detalle
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md max-w-2xl">
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
  const [limite, setLimite] = useState(LIMIT_PAGINA)

  const query = useMemo<ListarEventosAuditoriaQuery>(
    () => ({
      tipo: tipo === "todos" ? undefined : tipo,
      cuentaId: cuentaId.trim() || undefined,
      desde: desde ? new Date(desde).toISOString() : undefined,
      hasta: hasta ? new Date(hasta).toISOString() : undefined,
      pagina,
      limite,
    }),
    [tipo, cuentaId, desde, hasta, pagina, limite],
  )

  const { data, isLoading, isError, error } = useEventosAuditoria(query)

  function aplicarFiltro<T>(setter: (v: T) => void) {
    return (valor: T) => {
      setter(valor)
      setPagina(1)
    }
  }

  const total = data?.paginacion.total ?? 0

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabecera */}
      <div className="space-y-1">
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-semibold tracking-tight">Auditoría</h1>
          {data ? (
            <Badge variant="secondary" className="rounded-md tabular-nums">
              {total}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Eventos de seguridad y administración registrados por el sistema
          (append-only). Útil para investigar incidentes.
        </p>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select
          value={tipo}
          onValueChange={(v) => aplicarFiltro<string>(setTipo)(v)}
        >
          <SelectTrigger className="rounded-md w-full">
            <SelectValue placeholder="Tipo de evento" />
          </SelectTrigger>
          <SelectContent className="rounded-md">
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {TIPOS_EVENTO_AUTH.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          className="rounded-md"
          placeholder="ID de cuenta (UUID)"
          value={cuentaId}
          onChange={(e) => aplicarFiltro<string>(setCuentaId)(e.target.value)}
        />

        <Input
          className="rounded-md"
          type="datetime-local"
          value={desde}
          onChange={(e) => aplicarFiltro<string>(setDesde)(e.target.value)}
          aria-label="Desde"
        />

        <Input
          className="rounded-md"
          type="datetime-local"
          value={hasta}
          onChange={(e) => aplicarFiltro<string>(setHasta)(e.target.value)}
          aria-label="Hasta"
        />
      </div>

      {/* Tabla */}
      <div className="overflow-hidden border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>IP</TableHead>
                <TableHead className="w-24 text-right">Detalle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent [&>td]:py-1.5">
                    <TableCell>
                      <Skeleton className="rounded-md h-4 w-36" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="rounded-md h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="rounded-md h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="rounded-md h-4 w-20" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={COLUMNAS}
                    className="py-12 text-center text-sm text-destructive"
                  >
                    {error instanceof Error
                      ? error.message
                      : "No se pudieron cargar los eventos."}
                  </TableCell>
                </TableRow>
              ) : data && data.datos.length > 0 ? (
                data.datos.map((evento) => (
                  <TableRow key={evento.id} className="[&>td]:py-1.5">
                    <TableCell className="text-muted-foreground tabular-nums">
                      {new Date(evento.ocurridoEn).toLocaleString("es-PE")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "rounded-md font-mono font-normal",
                          clasePorTipo(evento.tipo),
                        )}
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
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLUMNAS} className="py-12">
                    <Empty className="gap-2">
                      <Eye className="size-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        No hay eventos que coincidan con los filtros.
                      </p>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pie: rango + paginacion */}
        {data && total > 0 ? (
          <PiePaginacion
            pagina={pagina}
            limite={limite}
            total={total}
            onPagina={setPagina}
            onLimite={(l) => {
              setLimite(l)
              setPagina(1)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
