"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, FileDown, Plus, Search } from "lucide-react"

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
import { Label } from "@/compartido/componentes/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet"
import { Separator } from "@/compartido/componentes/ui/separator"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"
import { formatearFechaDeTimestamp } from "@/modulos/comercial/utilidades/formato-fecha"
import {
  BuscarClienteBc01Panel,
  type ClienteElegido,
} from "../../solicitudes-cliente/componentes/buscar-cliente-bc01-panel"

import {
  useCrearTarifarioManualMutation,
  useTarifariosQuery,
} from "../servicios/tarifarios-queries"
import { SelectorCotizacionGanada } from "./selector-cotizacion-ganada"
import {
  etiquetaTipoOrigen,
  MONEDAS,
  TIPOS_ORIGEN_TARIFA,
  type EstadoTarifario,
  type FiltrosTarifarios,
  type Moneda,
  type TipoOrigenTarifa,
} from "../tipos/tarifarios.tipos"

function BadgeEstado({ estado }: { estado: EstadoTarifario }) {
  return (
    <Badge variant={estado === "VIGENTE" ? "default" : "secondary"}>
      {estado === "VIGENTE" ? "Vigente" : "Anulado"}
    </Badge>
  )
}


// ── Sheet: crear tarifario manual ──
function SheetCrearManual({
  abierto,
  onCerrar,
}: {
  abierto: boolean
  onCerrar: () => void
}) {
  const router = useRouter()
  const [moneda, setMoneda] = useState<Moneda>("PEN")
  // El cliente se elige del maestro de BC-01, no se escribe: antes habia que
  // pegar a mano su uuid, que nadie conoce de memoria.
  const [cliente, setCliente] = useState<ClienteElegido | null>(null)
  const [vigenciaInicio, setVigenciaInicio] = useState("")
  const [vigenciaFin, setVigenciaFin] = useState("")
  const [error, setError] = useState<string | null>(null)

  const crear = useCrearTarifarioManualMutation({
    onSuccess: () => setError(null),
    onError: (err) => setError(extraerMensajeError(err)),
  })

  async function handleConfirmar() {
    setError(null)
    const resultado = await crear
      .mutateAsync({
        moneda,
        // publicId (uuid) y no el id entero: es el identificador estable de
        // BC-01, el mismo que la solicitud de cliente guarda como origen.
        idClienteExterno: cliente?.publicId,
        nombreClienteExterno: cliente?.nombre,
        vigenciaInicio: vigenciaInicio || undefined,
        vigenciaFin: vigenciaFin || undefined,
        tarifas: [],
      })
      .catch(() => null)
    if (resultado) {
      onCerrar()
      router.push(`/comercial/tarifarios/${resultado.id}`)
    }
  }

  return (
    <Sheet open={abierto} onOpenChange={(o) => !o && onCerrar()}>
      <SheetContent
        side="right"
        className="w-full gap-0 data-[side=right]:sm:max-w-md"
      >
        <SheetHeader className="border-b border-border">
          <SheetTitle>Nuevo tarifario manual</SheetTitle>
          <SheetDescription>
            Crea el tarifario vacio; luego le agregas las tarifas en el detalle.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo crear</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <Label>Moneda</Label>
            <Select value={moneda} onValueChange={(v) => setMoneda(v as Moneda)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONEDAS.map((m) => (
                  <SelectItem key={m.valor} value={m.valor}>
                    {m.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Cliente (opcional)</Label>
            <BuscarClienteBc01Panel
              valor={cliente}
              onElegir={setCliente}
              onQuitar={() => setCliente(null)}
              ayuda="Busca el cliente en Socio de Negocio por razon social o documento."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vig-ini">Vigencia inicio (opcional)</Label>
              <Input
                id="vig-ini"
                type="date"
                value={vigenciaInicio}
                onChange={(e) => setVigenciaInicio(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="vig-fin">Vigencia fin (opcional)</Label>
              <Input
                id="vig-fin"
                type="date"
                value={vigenciaFin}
                onChange={(e) => setVigenciaFin(e.target.value)}
              />
            </div>
          </div>
        </div>

        <Separator />
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button variant="outline" disabled={crear.isPending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button onClick={handleConfirmar} disabled={crear.isPending}>
            {crear.isPending ? "Creando..." : "Crear"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

interface Props {
  filtros: FiltrosTarifarios
  onFiltrosChange: (f: Partial<FiltrosTarifarios>) => void
}

export function TarifariosListado({ filtros, onFiltrosChange }: Props) {
  const router = useRouter()
  const consulta = useTarifariosQuery(filtros)
  const filas = consulta.data?.data ?? []
  const total = consulta.data?.total ?? 0
  const pagina = consulta.data?.pagina ?? filtros.pagina ?? 1
  const porPagina = consulta.data?.porPagina ?? filtros.porPagina ?? 10
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))

  const [clienteLocal, setClienteLocal] = useState(filtros.idClienteExterno ?? "")
  const [estadoLocal, setEstadoLocal] = useState<string>(filtros.estado ?? "TODOS")
  const [origenLocal, setOrigenLocal] = useState<string>(filtros.tipoOrigen ?? "TODOS")

  const [crearAbierto, setCrearAbierto] = useState(false)
  const [generarAbierto, setGenerarAbierto] = useState(false)

  function aplicarFiltros() {
    onFiltrosChange({
      idClienteExterno: clienteLocal.trim() || undefined,
      estado: estadoLocal === "TODOS" ? undefined : (estadoLocal as EstadoTarifario),
      tipoOrigen:
        origenLocal === "TODOS" ? undefined : (origenLocal as TipoOrigenTarifa),
      pagina: 1,
    })
  }

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Tarifarios</CardTitle>
            <CardDescription>
              {total} {total === 1 ? "tarifario" : "tarifarios"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setGenerarAbierto(true)}>
              <FileDown />
              Desde cotizacion
            </Button>
            <Button onClick={() => setCrearAbierto(true)}>
              <Plus />
              Nuevo manual
            </Button>
          </div>
        </div>
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
          <div className="grid min-w-40 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Origen</span>
            <Select value={origenLocal} onValueChange={setOrigenLocal}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                {TIPOS_ORIGEN_TARIFA.map((t) => (
                  <SelectItem key={t.valor} value={t.valor}>
                    {t.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid min-w-36 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Estado</span>
            <Select value={estadoLocal} onValueChange={setEstadoLocal}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                <SelectItem value="VIGENTE">Vigente</SelectItem>
                <SelectItem value="ANULADO">Anulado</SelectItem>
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
                <TableHead>Origen</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Moneda</TableHead>
                <TableHead className="text-center">Tarifas</TableHead>
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
                    No hay tarifarios para los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filas.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/comercial/tarifarios/${item.id}`)}
                  >
                    <TableCell className="text-sm">
                      <Badge variant="outline">{etiquetaTipoOrigen(item.tipoOrigen)}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {item.nombreClienteExterno ?? item.idClienteExterno ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">{item.moneda}</TableCell>
                    <TableCell className="text-center text-sm">
                      {item.cantidadTarifas}
                    </TableCell>
                    <TableCell>
                      <BadgeEstado estado={item.estado} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatearFechaDeTimestamp(item.fechaCreacion, { compacta: true })}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          aria-label="Ver"
                          onClick={() => router.push(`/comercial/tarifarios/${item.id}`)}
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

      <SheetCrearManual abierto={crearAbierto} onCerrar={() => setCrearAbierto(false)} />
      <SelectorCotizacionGanada
        abierto={generarAbierto}
        onCerrar={() => setGenerarAbierto(false)}
      />
    </Card>
  )
}
