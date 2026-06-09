"use client"

import { type FormEvent, useState } from "react"
import {
  ArchiveRestore,
  Ban,
  Eye,
  FileDown,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu"
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
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { cn } from "@/compartido/utilidades/utils"
import { PaginationControls } from "@/modulos/socio-negocios/componentes/pagination-controls"

import {
  useConfiguracionGeneralQuery,
  useAnularConfiguracionGeneralMutation,
  useExportarConfiguracionGeneralQuery,
  useInhabilitarConfiguracionGeneralMutation,
  useModificarConfiguracionGeneralMutation,
  useReactivarConfiguracionGeneralMutation,
} from "../servicios/configuracion-general-queries"
import type {
  ConfiguracionGeneralResponse,
  ConsultarConfiguracionGeneralQuery,
  EstadoDatoMaestro,
  EstadoRegistro,
  TipoDatoMaestro,
} from "../tipos/configuracion-general"

type TipoListado = TipoDatoMaestro | "TODOS"

const detalleListado: Record<TipoListado, { descripcion: string; titulo: string }> = {
  TODOS: {
    titulo: "Todas las configuraciones",
    descripcion: "Vista general de ubicaciones, sedes, areas, almacenes, cargos, cuentas y contratos.",
  },
  UBICACION: {
    titulo: "Ubicaciones",
    descripcion: "Puntos fisicos o logisticos registrados para sedes y almacenes.",
  },
  SEDE: {
    titulo: "Sedes",
    descripcion: "Centros de trabajo vinculados a ubicaciones.",
  },
  AREA: {
    titulo: "Areas",
    descripcion: "Gerencias y areas organizadas por sede.",
  },
  ALMACEN: {
    titulo: "Almacenes",
    descripcion: "Almacenes fijos o temporales usados por operaciones.",
  },
  CUENTA: {
    titulo: "Cuentas",
    descripcion: "Cuentas comerciales disponibles para contratos.",
  },
  CONTRATO: {
    titulo: "Contratos",
    descripcion: "Contratos comerciales y sus relaciones con cuentas.",
  },
  CARGO: {
    titulo: "Cargos",
    descripcion: "Puestos de trabajo y jerarquias de cargo.",
  },
}

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operacion."
}

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor)
}

function textoEstado(dato: ConfiguracionGeneralResponse) {
  if (dato.estadoRegistro === "ANULADO") return "Anulado"
  if (dato.estado === "INACTIVO") return "Inactivo"
  return "Activo"
}

function varianteEstado(dato: ConfiguracionGeneralResponse) {
  if (dato.estadoRegistro === "ANULADO") return "destructive"
  if (dato.estado === "INACTIVO") return "secondary"
  return "outline"
}

function detalleEspecifico(dato: ConfiguracionGeneralResponse) {
  if (dato.tipoDatoMaestro === "UBICACION") return dato.direccion || dato.tipoUbicacion || "-"
  if (dato.tipoDatoMaestro === "SEDE") return dato.ubicacionId || "-"
  if (dato.tipoDatoMaestro === "AREA") return dato.nivelArea || dato.sedeId || "-"
  if (dato.tipoDatoMaestro === "ALMACEN") return dato.esTemporal ? "Temporal" : "Fijo"
  if (dato.tipoDatoMaestro === "CUENTA") return `Nivel ${dato.nivelCuentaContrato ?? 1}`
  if (dato.tipoDatoMaestro === "CONTRATO") return `Nivel ${dato.nivelCuentaContrato ?? "-"}`
  return dato.cargoSuperiorId || "-"
}

function formatearCount(count?: number | null) {
  return typeof count === "number" ? String(count) : "-"
}

function actualizarQuery(
  query: ConsultarConfiguracionGeneralQuery,
  key: keyof ConsultarConfiguracionGeneralQuery,
  value: string,
) {
  const siguiente = { ...query, page: 1 }

  if (value === "TODOS" || value === "") {
    delete siguiente[key]
  } else {
    Object.assign(siguiente, { [key]: value })
  }

  return siguiente
}

function limpiarQuery(query: ConsultarConfiguracionGeneralQuery) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => {
      if (value === undefined || value === null) return false
      if (typeof value === "string") return value.trim() !== ""
      return true
    }),
  ) as ConsultarConfiguracionGeneralQuery
}

function obtenerClaseFila(dato: ConfiguracionGeneralResponse) {
  const inactivo = dato.estado === "INACTIVO"
  const anulado = dato.estadoRegistro === "ANULADO"

  return cn(
    "border-border/80",
    inactivo && !anulado && "bg-muted/45 hover:bg-muted/65",
    anulado &&
      "border-l-4 border-l-destructive bg-destructive/5 text-muted-foreground hover:bg-destructive/10",
  )
}

function obtenerClaseContenido(dato: ConfiguracionGeneralResponse) {
  return dato.estadoRegistro === "ANULADO"
    ? "line-through decoration-destructive/70 decoration-2"
    : undefined
}

function DatoFicha({
  label,
  value,
}: {
  label: string
  value?: string | number | boolean | null
}) {
  return (
    <div className="min-w-0 rounded-md border border-border bg-background p-3">
      <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium">{String(value ?? "-")}</p>
    </div>
  )
}

type AccionMaestro = "inhabilitar" | "reactivar" | "anular" | null

function AccionesConfiguracion({
  dato,
  onActualizado,
  onError,
  onMensaje,
}: {
  dato: ConfiguracionGeneralResponse
  onActualizado: () => void
  onError: (mensaje: string) => void
  onMensaje: (mensaje: string) => void
}) {
  const modificarMutation = useModificarConfiguracionGeneralMutation(dato.id, {
    onSuccess: onActualizado,
  })
  const inhabilitarMutation = useInhabilitarConfiguracionGeneralMutation(dato.id, {
    onSuccess: onActualizado,
  })
  const reactivarMutation = useReactivarConfiguracionGeneralMutation(dato.id, {
    onSuccess: onActualizado,
  })
  const anularMutation = useAnularConfiguracionGeneralMutation(dato.id, {
    onSuccess: onActualizado,
  })
  const [fichaAbierta, setFichaAbierta] = useState(false)
  const [modificarAbierto, setModificarAbierto] = useState(false)
  const [accion, setAccion] = useState<AccionMaestro>(null)
  const [motivo, setMotivo] = useState("")
  const procesando =
    modificarMutation.isPending ||
    inhabilitarMutation.isPending ||
    reactivarMutation.isPending ||
    anularMutation.isPending
  const anulado = dato.estadoRegistro === "ANULADO"
  const puedeModificar = !anulado
  const puedeInhabilitar = dato.estado === "ACTIVO" && !anulado
  const puedeReactivar = dato.estado === "INACTIVO" && !anulado
  const puedeAnular = !anulado

  function abrirAccion(nuevaAccion: Exclude<AccionMaestro, null>) {
    setMotivo(nuevaAccion === "anular" ? "Registro creado por error" : "")
    setAccion(nuevaAccion)
  }

  async function confirmarAccion() {
    try {
      if (accion === "inhabilitar") {
        await inhabilitarMutation.mutateAsync({
          motivo: motivo.trim(),
          usuarioModificacion: "admin",
        })
        onMensaje(`${dato.nombre} fue inhabilitado.`)
      }

      if (accion === "reactivar") {
        await reactivarMutation.mutateAsync({ usuarioModificacion: "admin" })
        onMensaje(`${dato.nombre} fue reactivado.`)
      }

      if (accion === "anular") {
        await anularMutation.mutateAsync({
          motivo: motivo.trim(),
          usuarioModificacion: "admin",
        })
        onMensaje(`${dato.nombre} fue borrado.`)
      }

      setAccion(null)
    } catch (error) {
      onError(obtenerMensajeError(error))
    }
  }

  async function modificarDato(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nombre = String(formData.get("nombre") ?? "").trim()
    const descripcion = String(formData.get("descripcion") ?? "").trim()

    try {
      await modificarMutation.mutateAsync({
        nombre,
        descripcion: descripcion || null,
        usuarioModificacion: "admin",
      })
      setModificarAbierto(false)
      onMensaje(`${dato.nombre} fue modificado.`)
    } catch (error) {
      onError(obtenerMensajeError(error))
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Acciones" disabled={procesando}>
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setFichaAbierta(true)}>
              <Eye className="size-4" />
              Ver
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!puedeModificar || procesando}
              onSelect={() => setModificarAbierto(true)}
            >
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!puedeInhabilitar || procesando}
              onSelect={() => abrirAccion("inhabilitar")}
            >
              <Ban className="size-4" />
              Inhabilitar
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!puedeReactivar || procesando}
              onSelect={() => abrirAccion("reactivar")}
            >
              <ArchiveRestore className="size-4" />
              Reactivar
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!puedeAnular || procesando}
              onSelect={() => abrirAccion("anular")}
            >
              <Trash2 className="size-4" />
              Borrar
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={fichaAbierta} onOpenChange={(open) => !open && setFichaAbierta(false)}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Ficha del maestro</AlertDialogTitle>
            <AlertDialogDescription>
              Datos vigentes del registro #{dato.count}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 md:grid-cols-3">
            <DatoFicha label="Count" value={dato.count} />
            <DatoFicha label="Tipo" value={dato.tipoDatoMaestro} />
            <DatoFicha label="Codigo" value={dato.codigo} />
            <DatoFicha label="Nombre" value={dato.nombre} />
            <DatoFicha label="Estado" value={textoEstado(dato)} />
            <DatoFicha label="Registro" value={dato.estadoRegistro} />
            <DatoFicha label="Detalle" value={detalleEspecifico(dato)} />
            <DatoFicha label="Creacion" value={formatearFecha(dato.fechaCreacion)} />
            <DatoFicha label="Modificacion" value={formatearFecha(dato.fechaModificacion)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setFichaAbierta(false)}>
              Cerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={modificarAbierto}
        onOpenChange={(open) => !open && setModificarAbierto(false)}
      >
        <AlertDialogContent>
          <form onSubmit={(event) => void modificarDato(event)}>
            <AlertDialogHeader>
              <AlertDialogTitle>Editar maestro</AlertDialogTitle>
              <AlertDialogDescription>
                Actualiza nombre y descripcion del registro #{dato.count}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-3 py-4">
              <Input name="nombre" defaultValue={dato.nombre} required />
              <Textarea
                name="descripcion"
                defaultValue={dato.descripcion ?? ""}
                placeholder="Descripcion"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={modificarMutation.isPending}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction type="submit" disabled={modificarMutation.isPending}>
                {modificarMutation.isPending ? "Guardando..." : "Guardar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={accion !== null} onOpenChange={(open) => !open && setAccion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accion === "inhabilitar"
                ? "Inhabilitar maestro"
                : accion === "anular"
                  ? "Borrar maestro"
                  : "Reactivar maestro"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {accion === "reactivar"
                ? "El registro volvera a estar disponible para consumo."
                : accion === "anular"
                  ? "Tenga en cuenta que esta informacion no se podra recuperar. Ingresa el motivo para registrar la accion en auditoria."
                  : "Ingresa el motivo para registrar la accion en auditoria."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {accion === "inhabilitar" || accion === "anular" ? (
            <Textarea
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder={accion === "anular" ? "Motivo de borrado" : "Motivo de inhabilitacion"}
              required
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={accion === "anular" ? "destructive" : "default"}
              disabled={procesando || ((accion === "inhabilitar" || accion === "anular") && !motivo.trim())}
              onClick={() => void confirmarAccion()}
            >
              {procesando
                ? "Procesando..."
                : accion === "anular"
                  ? "Borrar"
                  : accion === "inhabilitar"
                    ? "Inhabilitar"
                    : "Reactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function TablaListadoConfiguracion({
  cargando,
  datos,
  mostrarTipo,
  onActualizado,
  onError,
  onMensaje,
}: {
  cargando?: boolean
  datos: ConfiguracionGeneralResponse[]
  mostrarTipo: boolean
  onActualizado: () => void
  onError: (mensaje: string) => void
  onMensaje: (mensaje: string) => void
}) {
  if (cargando) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    )
  }

  if (datos.length === 0) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        No existen registros para la consulta aplicada.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">Acciones</TableHead>
            {mostrarTipo ? <TableHead>Tipo</TableHead> : null}
            <TableHead className="w-16 text-right">#</TableHead>
            <TableHead>Codigo</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Detalle</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead>Actualizacion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datos.map((dato) => {
            const claseContenido = obtenerClaseContenido(dato)

            return (
              <TableRow key={dato.id} className={obtenerClaseFila(dato)}>
                <TableCell>
                  <AccionesConfiguracion
                    dato={dato}
                    onActualizado={onActualizado}
                    onError={onError}
                    onMensaje={onMensaje}
                  />
                </TableCell>
                {mostrarTipo ? (
                  <TableCell>
                    <Badge variant="secondary">{dato.tipoDatoMaestro}</Badge>
                  </TableCell>
                ) : null}
                <TableCell className="text-right font-medium tabular-nums">
                  <span className={claseContenido}>{formatearCount(dato.count)}</span>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  <span className={claseContenido}>{dato.codigo}</span>
                </TableCell>
                <TableCell>
                  <div className="flex min-w-56 flex-col">
                    <span className={cn("font-medium", claseContenido)}>{dato.nombre}</span>
                    <span className="text-xs text-muted-foreground">{dato.descripcion || "Sin descripcion"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={claseContenido}>{detalleEspecifico(dato)}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={varianteEstado(dato)}>{textoEstado(dato)}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={dato.estadoRegistro === "ANULADO" ? "destructive" : "outline"}>
                    {dato.estadoRegistro === "ANULADO" ? "Anulado" : "Vigente"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex min-w-40 flex-col">
                    <span className={claseContenido}>
                      {formatearFecha(dato.fechaModificacion || dato.fechaCreacion)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {dato.usuarioModificacion || dato.usuarioCreacion}
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export function ConfiguracionGeneralListadoPorTipoVista({ tipo }: { tipo: TipoListado }) {
  const detalle = detalleListado[tipo]
  const filtrosBase = limpiarQuery({
    ...(tipo === "TODOS" ? {} : { tipoDatoMaestro: tipo }),
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
  })
  const [query, setQuery] = useState<ConsultarConfiguracionGeneralQuery>({
    ...filtrosBase,
    page: 1,
    pageSize: 20,
    sortBy: "count",
    sortOrder: "desc",
  })
  const [mensajeOperacion, setMensajeOperacion] = useState<string | null>(null)
  const [errorOperacion, setErrorOperacion] = useState<string | null>(null)
  const consulta = useConfiguracionGeneralQuery(query)
  const exportacion = useExportarConfiguracionGeneralQuery(query, false)
  const datos = consulta.data?.datos ?? []
  const metaPaginacion = consulta.data?.paginacion
  const total = consulta.data?.paginacion?.total ?? datos.length

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{detalle.titulo}</h2>
          <p className="text-sm text-muted-foreground">{detalle.descripcion}</p>
        </div>
        <Badge variant="outline" className="w-fit">
          {total} registros
        </Badge>
      </div>

      {consulta.error ? (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar la informacion</AlertTitle>
            <AlertDescription>{obtenerMensajeError(consulta.error)}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {errorOperacion ? (
        <div className="p-4 pb-0">
          <Alert variant="destructive">
            <AlertTitle>No se pudo completar la operacion</AlertTitle>
            <AlertDescription>{errorOperacion}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {mensajeOperacion ? (
        <div className="p-4 pb-0">
          <Alert>
            <AlertTitle>Operacion completada</AlertTitle>
            <AlertDescription>{mensajeOperacion}</AlertDescription>
          </Alert>
        </div>
      ) : null}

      {exportacion.data ? (
        <div className="p-4 pb-0">
          <Alert>
            <AlertTitle>Exportacion consultada</AlertTitle>
            <AlertDescription>
              Se encontraron {exportacion.data.paginacion?.total ?? exportacion.data.datos.length} registros para exportar.
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query.nombre ?? ""}
            onChange={(event) => setQuery((actual) => actualizarQuery(actual, "nombre", event.target.value))}
            placeholder="Buscar por codigo o nombre"
            className="pl-9"
          />
        </div>
        <div className="relative lg:w-40">
          <Input
            value={query.codigo ?? ""}
            onChange={(event) => setQuery((actual) => actualizarQuery(actual, "codigo", event.target.value))}
            placeholder="Codigo"
          />
        </div>
        <Select
          value={query.estado ?? "TODOS"}
          onValueChange={(value) =>
            setQuery((actual) => actualizarQuery(actual, "estado", value as EstadoDatoMaestro | "TODOS"))
          }
        >
          <SelectTrigger className="lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Estado: todos</SelectItem>
            <SelectItem value="ACTIVO">Activo</SelectItem>
            <SelectItem value="INACTIVO">Inactivo</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={query.estadoRegistro ?? "TODOS"}
          onValueChange={(value) =>
            setQuery((actual) => actualizarQuery(actual, "estadoRegistro", value as EstadoRegistro | "TODOS"))
          }
        >
          <SelectTrigger className="lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Registro: todos</SelectItem>
            <SelectItem value="ACTIVO">Vigente</SelectItem>
            <SelectItem value="ANULADO">Anulado</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => void exportacion.refetch()} disabled={exportacion.isFetching}>
          <FileDown className="size-4" />
          {exportacion.isFetching ? "Exportando..." : "Exportar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setQuery({
              ...filtrosBase,
              page: 1,
              pageSize: query.pageSize ?? 20,
              sortBy: "count",
              sortOrder: "desc",
            })
          }
        >
          Limpiar
        </Button>
      </div>

      <TablaListadoConfiguracion
        datos={datos}
        cargando={consulta.isLoading}
        mostrarTipo={tipo === "TODOS"}
        onActualizado={() => void consulta.refetch()}
        onMensaje={(mensaje) => {
          setErrorOperacion(null)
          setMensajeOperacion(mensaje)
        }}
        onError={(mensaje) => {
          setMensajeOperacion(null)
          setErrorOperacion(mensaje)
        }}
      />
      {datos.length > 0 && metaPaginacion ? (
        <PaginationControls
          meta={metaPaginacion}
          registrosPorPagina={query.pageSize ?? 20}
          onPageChange={(page) =>
            setQuery((actual) => ({ ...actual, page }))
          }
          onPageSizeChange={(pageSize) =>
            setQuery((actual) => ({ ...actual, page: 1, pageSize }))
          }
        />
      ) : null}
    </section>
  )
}

export function ConfiguracionGeneralUbicacionesListarVista() {
  return <ConfiguracionGeneralListadoPorTipoVista tipo="UBICACION" />
}

export function ConfiguracionGeneralSedesListarVista() {
  return <ConfiguracionGeneralListadoPorTipoVista tipo="SEDE" />
}

export function ConfiguracionGeneralAreasListarVista() {
  return <ConfiguracionGeneralListadoPorTipoVista tipo="AREA" />
}

export function ConfiguracionGeneralAlmacenesListarVista() {
  return <ConfiguracionGeneralListadoPorTipoVista tipo="ALMACEN" />
}

export function ConfiguracionGeneralCuentasListarVista() {
  return <ConfiguracionGeneralListadoPorTipoVista tipo="CUENTA" />
}

export function ConfiguracionGeneralContratosListarVista() {
  return <ConfiguracionGeneralListadoPorTipoVista tipo="CONTRATO" />
}

export function ConfiguracionGeneralCargosListarVista() {
  return <ConfiguracionGeneralListadoPorTipoVista tipo="CARGO" />
}
