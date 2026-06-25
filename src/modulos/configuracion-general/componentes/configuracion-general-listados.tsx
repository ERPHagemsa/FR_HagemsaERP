"use client"

import { type FormEvent, type ReactNode, useState } from "react"
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
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
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
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"
import { PaginationControls } from "@/modulos/socio-negocios/componentes/pagination-controls"

import {
  CamposMaestro,
  construirPayloadModificacion,
  type CatalogosMaestro,
} from "./campos-maestro"
import {
  useAnularConfiguracionGeneralMutation,
  useConfiguracionGeneralQuery,
  useExportarConfiguracionGeneralQuery,
  useInhabilitarConfiguracionGeneralMutation,
  useListarPorTipoQuery,
  useModificarPorTipoMutation,
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
type TipoJerarquico = "ALMACEN" | "AREA" | "CARGO" | "CONTRATO" | "SEDE"

function esTipoJerarquico(tipo: TipoListado): tipo is TipoJerarquico {
  return (
    tipo === "ALMACEN" ||
    tipo === "AREA" ||
    tipo === "CARGO" ||
    tipo === "CONTRATO" ||
    tipo === "SEDE"
  )
}

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
    descripcion: "Cuentas comerciales y su nivel en la jerarquia.",
  },
  CONTRATO: {
    titulo: "Contratos",
    descripcion: "Contratos comerciales, su nivel y su cuenta o contrato padre.",
  },
  CARGO: {
    titulo: "Cargos",
    descripcion: "Puestos de trabajo y jerarquias de cargo.",
  },
  REGIMEN: {
    titulo: "Regimenes",
    descripcion: "Regimenes laborales con su ciclo de trabajo/descanso y jornada.",
  },
}

// Catalogos que cada tipo necesita exclusivamente para alimentar el formulario
// de edicion. Los nombres relacionados ya llegan en la respuesta del backend.
const catalogosRequeridos: Record<TipoListado, TipoDatoMaestro[]> = {
  TODOS: [],
  UBICACION: [],
  SEDE: ["UBICACION"],
  AREA: ["SEDE", "AREA"],
  ALMACEN: ["UBICACION", "SEDE"],
  CUENTA: [],
  CONTRATO: ["CUENTA", "CONTRATO"],
  CARGO: ["CARGO"],
  REGIMEN: [],
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

function formatearDia(fecha?: string | null) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "short" }).format(valor)
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

function referenciaTexto(nombre?: string | null, id?: number | null) {
  if (nombre) return nombre
  return id == null ? "-" : String(id)
}

interface ColumnaTipo {
  header: string
  className?: string
  render: (dato: ConfiguracionGeneralResponse) => ReactNode
}

// Columnas propias de cada tipo: cada maestro muestra SOLO sus campos, sin la
// columna generica "detalle especifico" que aplastaba toda la jerarquia.
const columnasPorTipo: Record<TipoListado, ColumnaTipo[]> = {
  TODOS: [
    {
      header: "Tipo",
      render: (dato) => <Badge variant="secondary">{dato.tipoDatoMaestro}</Badge>,
    },
  ],
  CARGO: [
    {
      header: "Cargo superior",
      render: (dato) => referenciaTexto(dato.cargoSuperiorNombre, dato.cargoSuperiorId),
    },
  ],
  UBICACION: [
    {
      header: "Tipo",
      render: (dato) => (dato.tipoUbicacion ? <Badge variant="outline">{dato.tipoUbicacion}</Badge> : "-"),
    },
    {
      header: "Ubicacion",
      render: (dato) => {
        const ubigeo = [dato.distrito, dato.provincia, dato.departamento]
          .filter(Boolean)
          .join(", ")
        return (
          <div className="flex min-w-44 flex-col">
            <span>{ubigeo || dato.pais || "-"}</span>
            {dato.direccion ? (
              <span className="text-xs text-muted-foreground">{dato.direccion}</span>
            ) : null}
          </div>
        )
      },
    },
  ],
  SEDE: [
    {
      header: "Ubicacion",
      render: (dato) => referenciaTexto(dato.ubicacionNombre, dato.ubicacionId),
    },
  ],
  AREA: [
    {
      header: "Nivel",
      render: (dato) => (dato.nivelArea ? <Badge variant="outline">{dato.nivelArea}</Badge> : "-"),
    },
    {
      header: "Sede",
      render: (dato) => referenciaTexto(dato.sedeNombre, dato.sedeId),
    },
    {
      header: "Gerencia",
      render: (dato) =>
        dato.nivelArea === "AREA"
          ? referenciaTexto(dato.gerenciaNombre, dato.gerenciaId)
          : "-",
    },
  ],
  ALMACEN: [
    {
      header: "Ubicacion",
      render: (dato) => referenciaTexto(dato.ubicacionNombre, dato.ubicacionId),
    },
    {
      header: "Sede",
      render: (dato) => referenciaTexto(dato.sedeNombre, dato.sedeId),
    },
    {
      header: "Modalidad",
      render: (dato) => (
        <Badge variant={dato.esTemporal ? "secondary" : "outline"}>
          {dato.esTemporal ? "Temporal" : "Fijo"}
        </Badge>
      ),
    },
    {
      header: "Vigencia",
      render: (dato) =>
        dato.esTemporal
          ? `${formatearDia(dato.fechaInicio)} - ${formatearDia(dato.fechaFin)}`
          : "-",
    },
  ],
  CUENTA: [
    {
      header: "Nivel",
      className: "text-right",
      render: (dato) => (
        <span className="tabular-nums">{dato.nivelCuentaContrato ?? "-"}</span>
      ),
    },
  ],
  CONTRATO: [
    {
      header: "Nivel",
      className: "text-right",
      render: (dato) => (
        <span className="tabular-nums">{dato.nivelCuentaContrato ?? "-"}</span>
      ),
    },
    {
      header: "Padre",
      render: (dato) => referenciaTexto(dato.contratoPadreNombre, dato.contratoPadreId),
    },
  ],
  REGIMEN: [
    {
      header: "Codigo",
      render: (dato) => dato.regimenCodigo ?? "-",
    },
    {
      header: "Ciclo (T/D)",
      className: "text-right",
      render: (dato) => (
        <span className="tabular-nums">
          {dato.diasTrabajo ?? "-"} / {dato.diasDescanso ?? "-"}
        </span>
      ),
    },
    {
      header: "Horas/dia",
      className: "text-right",
      render: (dato) => <span className="tabular-nums">{dato.horasPorDia ?? "-"}</span>,
    },
  ],
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

// Carga, para un tipo de listado, solo los catalogos que necesita para resolver
// referencias y alimentar el formulario de edicion.
function useCatalogosParaTipo(tipo: TipoListado, enabled: boolean): CatalogosMaestro {
  const requeridos = catalogosRequeridos[tipo]
  const queryCatalogo: ConsultarConfiguracionGeneralQuery = {
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  }

  const ubicacionesQuery = useListarPorTipoQuery("UBICACION", queryCatalogo, enabled && requeridos.includes("UBICACION"))
  const sedesQuery = useListarPorTipoQuery("SEDE", queryCatalogo, enabled && requeridos.includes("SEDE"))
  const areasQuery = useListarPorTipoQuery("AREA", queryCatalogo, enabled && requeridos.includes("AREA"))
  const cargosQuery = useListarPorTipoQuery("CARGO", queryCatalogo, enabled && requeridos.includes("CARGO"))
  const cuentasQuery = useListarPorTipoQuery("CUENTA", queryCatalogo, enabled && requeridos.includes("CUENTA"))
  const contratosQuery = useListarPorTipoQuery("CONTRATO", queryCatalogo, enabled && requeridos.includes("CONTRATO"))

  const ubicaciones = ubicacionesQuery.data?.datos ?? []
  const sedes = sedesQuery.data?.datos ?? []
  const areas = areasQuery.data?.datos ?? []
  const cargos = cargosQuery.data?.datos ?? []
  const cuentas = cuentasQuery.data?.datos ?? []
  const contratos = contratosQuery.data?.datos ?? []

  return { ubicaciones, sedes, areas, cargos, cuentas, contratos }
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
  const { usuario } = useSesion()
  const modificarMutation = useModificarPorTipoMutation(dato.tipoDatoMaestro, dato.id, {
    onSuccess: onActualizado,
  })
  const inhabilitarMutation = useInhabilitarConfiguracionGeneralMutation(dato.id, dato.tipoDatoMaestro, {
    onSuccess: onActualizado,
  })
  const reactivarMutation = useReactivarConfiguracionGeneralMutation(dato.id, dato.tipoDatoMaestro, {
    onSuccess: onActualizado,
  })
  const anularMutation = useAnularConfiguracionGeneralMutation(dato.id, dato.tipoDatoMaestro, {
    onSuccess: onActualizado,
  })
  const [fichaAbierta, setFichaAbierta] = useState(false)
  const [modificarAbierto, setModificarAbierto] = useState(false)
  const catalogos = useCatalogosParaTipo(dato.tipoDatoMaestro, modificarAbierto)
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
  const usuarioActual = usuario?.email ?? "admin"

  function abrirAccion(nuevaAccion: Exclude<AccionMaestro, null>) {
    setMotivo(nuevaAccion === "anular" ? "Registro creado por error" : "")
    setAccion(nuevaAccion)
  }

  async function confirmarAccion() {
    try {
      if (accion === "inhabilitar") {
        await inhabilitarMutation.mutateAsync({
          motivo: motivo.trim(),
          usuarioModificacion: usuarioActual,
        })
        onMensaje(`${dato.nombre} fue inhabilitado.`)
      }

      if (accion === "reactivar") {
        await reactivarMutation.mutateAsync({ usuarioModificacion: usuarioActual })
        onMensaje(`${dato.nombre} fue reactivado.`)
      }

      if (accion === "anular") {
        await anularMutation.mutateAsync({
          motivo: motivo.trim(),
          usuarioModificacion: usuarioActual,
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
      await modificarMutation.mutateAsync(
        construirPayloadModificacion(dato.tipoDatoMaestro, formData, {
          nombre,
          descripcion: descripcion || null,
          usuarioModificacion: usuarioActual,
        }),
      )
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
              Datos vigentes del registro #{dato.id}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 md:grid-cols-3">
            <DatoFicha label="ID" value={dato.id} />
            <DatoFicha label="Tipo" value={dato.tipoDatoMaestro} />
            <DatoFicha label="Codigo" value={dato.codigo} />
            <DatoFicha label="Nombre" value={dato.nombre} />
            <DatoFicha label="Estado" value={textoEstado(dato)} />
            <DatoFicha label="Registro" value={dato.estadoRegistro} />
            <FichaEspecifica dato={dato} />
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
        <AlertDialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <form onSubmit={(event) => void modificarDato(event)}>
            <AlertDialogHeader>
              <AlertDialogTitle>Editar {dato.tipoDatoMaestro.toLowerCase()}</AlertDialogTitle>
              <AlertDialogDescription>
                Actualiza los datos del registro #{dato.id}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-3 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor={`nombre-${dato.id}`}>Nombre</label>
                <Input id={`nombre-${dato.id}`} name="nombre" defaultValue={dato.nombre} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor={`descripcion-${dato.id}`}>
                  Descripcion
                </label>
                <Textarea
                  id={`descripcion-${dato.id}`}
                  name="descripcion"
                  defaultValue={dato.descripcion ?? ""}
                  placeholder="Descripcion"
                />
              </div>
              <div className="grid gap-3 border-t border-border pt-3 md:grid-cols-2">
                <CamposMaestro
                  tipo={dato.tipoDatoMaestro}
                  catalogos={catalogos}
                  valoresIniciales={dato}
                  esEdicion
                />
              </div>
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

// Resumen del campo propio del tipo, dentro de la ficha de detalle.
function FichaEspecifica({ dato }: { dato: ConfiguracionGeneralResponse }) {
  switch (dato.tipoDatoMaestro) {
    case "CARGO":
      return <DatoFicha label="Cargo superior" value={referenciaTexto(dato.cargoSuperiorNombre, dato.cargoSuperiorId)} />
    case "UBICACION":
      return (
        <DatoFicha
          label="Ubicacion"
          value={[dato.tipoUbicacion, dato.distrito, dato.provincia, dato.departamento]
            .filter(Boolean)
            .join(" / ")}
        />
      )
    case "SEDE":
      return <DatoFicha label="Ubicacion" value={referenciaTexto(dato.ubicacionNombre, dato.ubicacionId)} />
    case "AREA":
      return <DatoFicha label="Nivel / sede" value={`${dato.nivelArea ?? "-"} · ${referenciaTexto(dato.sedeNombre, dato.sedeId)}`} />
    case "ALMACEN":
      return (
        <DatoFicha
          label="Almacen"
          value={`${dato.esTemporal ? "Temporal" : "Fijo"} · ${referenciaTexto(dato.ubicacionNombre, dato.ubicacionId)}`}
        />
      )
    case "CUENTA":
      return <DatoFicha label="Nivel" value={dato.nivelCuentaContrato ?? "-"} />
    default:
      return <DatoFicha label="Nivel / padre" value={`${dato.nivelCuentaContrato ?? "-"} · ${referenciaTexto(dato.contratoPadreNombre, dato.contratoPadreId)}`} />
  }
}

interface NodoJerarquia {
  clave: string
  titulo: string
  descripcion: string
  etiqueta: string
  dato?: ConfiguracionGeneralResponse
  hijos: NodoJerarquia[]
}

function ordenarPorNombre(
  datos: ConfiguracionGeneralResponse[],
): ConfiguracionGeneralResponse[] {
  return [...datos].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"))
}

function construirJerarquiaCargos(
  datos: ConfiguracionGeneralResponse[],
): NodoJerarquia[] {
  const mapa = new Map(datos.map((dato) => [dato.id, dato]))
  const hijosPorPadre = new Map<number, ConfiguracionGeneralResponse[]>()

  datos.forEach((dato) => {
    if (dato.cargoSuperiorId == null || !mapa.has(dato.cargoSuperiorId)) return
    const hijos = hijosPorPadre.get(dato.cargoSuperiorId) ?? []
    hijos.push(dato)
    hijosPorPadre.set(dato.cargoSuperiorId, hijos)
  })

  const visitados = new Set<number>()
  const crearNodo = (
    dato: ConfiguracionGeneralResponse,
    ruta: Set<number>,
  ): NodoJerarquia => {
    visitados.add(dato.id)
    const siguienteRuta = new Set(ruta).add(dato.id)
    const hijos = ordenarPorNombre(hijosPorPadre.get(dato.id) ?? [])
      .filter((hijo) => !siguienteRuta.has(hijo.id))
      .map((hijo) => crearNodo(hijo, siguienteRuta))

    return {
      clave: `cargo-${dato.id}`,
      titulo: dato.nombre,
      descripcion: dato.descripcion || dato.codigo,
      etiqueta: dato.cargoSuperiorId == null ? "Cargo raiz" : "Reporta a cargo superior",
      dato,
      hijos,
    }
  }

  const raices = ordenarPorNombre(
    datos.filter(
      (dato) => dato.cargoSuperiorId == null || !mapa.has(dato.cargoSuperiorId),
    ),
  ).map((dato) => crearNodo(dato, new Set()))

  ordenarPorNombre(datos)
    .filter((dato) => !visitados.has(dato.id))
    .forEach((dato) => raices.push(crearNodo(dato, new Set())))

  return raices
}

function construirJerarquiaAreas(
  datos: ConfiguracionGeneralResponse[],
): NodoJerarquia[] {
  const gruposSede = new Map<string, ConfiguracionGeneralResponse[]>()

  datos.forEach((dato) => {
    const clave = `${dato.sedeId ?? "sin-sede"}:${dato.sedeNombre ?? "Sin sede"}`
    const grupo = gruposSede.get(clave) ?? []
    grupo.push(dato)
    gruposSede.set(clave, grupo)
  })

  return [...gruposSede.entries()]
    .sort(([, a], [, b]) =>
      (a[0]?.sedeNombre ?? "Sin sede").localeCompare(
        b[0]?.sedeNombre ?? "Sin sede",
        "es",
      ),
    )
    .map(([claveSede, grupo]) => {
      const gerencias = ordenarPorNombre(
        grupo.filter((dato) => dato.nivelArea === "GERENCIA"),
      )
      const areas = ordenarPorNombre(
        grupo.filter((dato) => dato.nivelArea !== "GERENCIA"),
      )
      const idsGerencia = new Set(gerencias.map((gerencia) => gerencia.id))
      const nodosGerencia = gerencias.map((gerencia) => ({
        clave: `area-${gerencia.id}`,
        titulo: gerencia.nombre,
        descripcion: gerencia.descripcion || gerencia.codigo,
        etiqueta: "Gerencia",
        dato: gerencia,
        hijos: areas
          .filter((area) => area.gerenciaId === gerencia.id)
          .map((area) => ({
            clave: `area-${area.id}`,
            titulo: area.nombre,
            descripcion: area.descripcion || area.codigo,
            etiqueta: "Area",
            dato: area,
            hijos: [],
          })),
      }))
      const areasSinGerencia = areas
        .filter(
          (area) => area.gerenciaId == null || !idsGerencia.has(area.gerenciaId),
        )
        .map((area) => ({
          clave: `area-${area.id}`,
          titulo: area.nombre,
          descripcion: area.descripcion || area.codigo,
          etiqueta: area.gerenciaNombre
            ? `Area de ${area.gerenciaNombre}`
            : "Area sin gerencia",
          dato: area,
          hijos: [],
        }))

      return {
        clave: `sede-${claveSede}`,
        titulo: grupo[0]?.sedeNombre || "Sin sede asignada",
        descripcion: "Estructura organizacional de la sede",
        etiqueta: "Sede",
        hijos: [...nodosGerencia, ...areasSinGerencia],
      }
    })
}

function construirJerarquiaSedes(
  datos: ConfiguracionGeneralResponse[],
): NodoJerarquia[] {
  const gruposUbicacion = new Map<string, ConfiguracionGeneralResponse[]>()

  datos.forEach((dato) => {
    const clave = `${dato.ubicacionId ?? "sin-ubicacion"}:${dato.ubicacionNombre ?? "Sin ubicacion"}`
    const grupo = gruposUbicacion.get(clave) ?? []
    grupo.push(dato)
    gruposUbicacion.set(clave, grupo)
  })

  return [...gruposUbicacion.entries()]
    .sort(([, a], [, b]) =>
      (a[0]?.ubicacionNombre ?? "Sin ubicacion").localeCompare(
        b[0]?.ubicacionNombre ?? "Sin ubicacion",
        "es",
      ),
    )
    .map(([clave, grupo]) => ({
      clave: `ubicacion-${clave}`,
      titulo: grupo[0]?.ubicacionNombre || "Sin ubicacion asignada",
      descripcion: "Ubicacion fisica",
      etiqueta: "Ubicacion",
      hijos: ordenarPorNombre(grupo).map((sede) => ({
        clave: `sede-${sede.id}`,
        titulo: sede.nombre,
        descripcion: sede.descripcion || sede.codigo,
        etiqueta: "Sede",
        dato: sede,
        hijos: [],
      })),
    }))
}

function construirJerarquiaAlmacenes(
  datos: ConfiguracionGeneralResponse[],
): NodoJerarquia[] {
  const gruposUbicacion = new Map<string, ConfiguracionGeneralResponse[]>()

  datos.forEach((dato) => {
    const clave = `${dato.ubicacionId ?? "sin-ubicacion"}:${dato.ubicacionNombre ?? "Sin ubicacion"}`
    const grupo = gruposUbicacion.get(clave) ?? []
    grupo.push(dato)
    gruposUbicacion.set(clave, grupo)
  })

  return [...gruposUbicacion.entries()]
    .sort(([, a], [, b]) =>
      (a[0]?.ubicacionNombre ?? "Sin ubicacion").localeCompare(
        b[0]?.ubicacionNombre ?? "Sin ubicacion",
        "es",
      ),
    )
    .map(([claveUbicacion, grupo]) => {
      const gruposSede = new Map<string, ConfiguracionGeneralResponse[]>()
      const sinSede: ConfiguracionGeneralResponse[] = []

      grupo.forEach((almacen) => {
        if (almacen.sedeId == null) {
          sinSede.push(almacen)
          return
        }
        const claveSede = `${almacen.sedeId}:${almacen.sedeNombre ?? "Sin nombre"}`
        const almacenes = gruposSede.get(claveSede) ?? []
        almacenes.push(almacen)
        gruposSede.set(claveSede, almacenes)
      })

      const crearNodoAlmacen = (almacen: ConfiguracionGeneralResponse): NodoJerarquia => ({
        clave: `almacen-${almacen.id}`,
        titulo: almacen.nombre,
        descripcion: almacen.descripcion || almacen.codigo,
        etiqueta: almacen.esTemporal ? "Almacen temporal" : "Almacen fijo",
        dato: almacen,
        hijos: [],
      })
      const sedes = [...gruposSede.entries()]
        .sort(([, a], [, b]) =>
          (a[0]?.sedeNombre ?? "Sin sede").localeCompare(
            b[0]?.sedeNombre ?? "Sin sede",
            "es",
          ),
        )
        .map(([claveSede, almacenes]) => ({
          clave: `sede-almacen-${claveSede}`,
          titulo: almacenes[0]?.sedeNombre || "Sin sede asignada",
          descripcion: "Sede operativa",
          etiqueta: "Sede",
          hijos: ordenarPorNombre(almacenes).map(crearNodoAlmacen),
        }))

      return {
        clave: `ubicacion-almacen-${claveUbicacion}`,
        titulo: grupo[0]?.ubicacionNombre || "Sin ubicacion asignada",
        descripcion: "Ubicacion de almacenamiento",
        etiqueta: "Ubicacion",
        hijos: [
          ...sedes,
          ...ordenarPorNombre(sinSede).map(crearNodoAlmacen),
        ],
      }
    })
}

function construirJerarquiaContratos(
  datos: ConfiguracionGeneralResponse[],
): NodoJerarquia[] {
  const mapa = new Map(datos.map((dato) => [dato.id, dato]))
  const hijosPorPadre = new Map<number, ConfiguracionGeneralResponse[]>()
  const raices: ConfiguracionGeneralResponse[] = []

  datos.forEach((dato) => {
    const padre = dato.contratoPadreId == null ? undefined : mapa.get(dato.contratoPadreId)
    const nivel = dato.nivelCuentaContrato ?? 2
    const padreEsContrato =
      nivel > 2 &&
      padre != null &&
      (padre.nivelCuentaContrato ?? 0) < nivel

    if (!padreEsContrato || !padre) {
      raices.push(dato)
      return
    }

    const hijos = hijosPorPadre.get(padre.id) ?? []
    hijos.push(dato)
    hijosPorPadre.set(padre.id, hijos)
  })

  const crearNodo = (dato: ConfiguracionGeneralResponse): NodoJerarquia => ({
    clave: `contrato-${dato.id}`,
    titulo: dato.nombre,
    descripcion: dato.descripcion || dato.codigo,
    etiqueta: `Contrato · nivel ${dato.nivelCuentaContrato ?? "-"}`,
    dato,
    hijos: ordenarPorNombre(hijosPorPadre.get(dato.id) ?? []).map(crearNodo),
  })
  const gruposRaiz = new Map<string, ConfiguracionGeneralResponse[]>()

  raices.forEach((dato) => {
    const clave = `${dato.contratoPadreId ?? "sin-padre"}:${dato.contratoPadreNombre ?? "Sin padre"}`
    const grupo = gruposRaiz.get(clave) ?? []
    grupo.push(dato)
    gruposRaiz.set(clave, grupo)
  })

  return [...gruposRaiz.entries()]
    .sort(([, a], [, b]) =>
      (a[0]?.contratoPadreNombre ?? "Sin padre").localeCompare(
        b[0]?.contratoPadreNombre ?? "Sin padre",
        "es",
      ),
    )
    .map(([clave, grupo]) => ({
      clave: `padre-${clave}`,
      titulo: grupo[0]?.contratoPadreNombre || "Sin padre asignado",
      descripcion: "Origen de la relacion contractual",
      etiqueta: "Cuenta o contrato padre",
      hijos: ordenarPorNombre(grupo).map(crearNodo),
    }))
}

function construirJerarquia(
  tipo: TipoJerarquico,
  datos: ConfiguracionGeneralResponse[],
) {
  if (tipo === "CARGO") return construirJerarquiaCargos(datos)
  if (tipo === "AREA") return construirJerarquiaAreas(datos)
  if (tipo === "SEDE") return construirJerarquiaSedes(datos)
  if (tipo === "ALMACEN") return construirJerarquiaAlmacenes(datos)
  return construirJerarquiaContratos(datos)
}

function NodoJerarquiaCard({
  nodo,
  profundidad,
  onActualizado,
  onError,
  onMensaje,
}: {
  nodo: NodoJerarquia
  profundidad: number
  onActualizado: () => void
  onError: (mensaje: string) => void
  onMensaje: (mensaje: string) => void
}) {
  return (
    <div className={cn("relative", profundidad > 0 && "pl-6 md:pl-10")}>
      {profundidad > 0 ? (
        <span className="absolute left-0 top-0 h-8 w-5 rounded-bl-lg border-b border-l border-border md:w-9" />
      ) : null}
      <Card size="sm">
        <CardHeader>
          <CardTitle className={cn(nodo.dato && obtenerClaseContenido(nodo.dato))}>
            {nodo.titulo}
          </CardTitle>
          <CardDescription>{nodo.descripcion}</CardDescription>
          {nodo.dato ? (
            <CardAction>
              <AccionesConfiguracion
                dato={nodo.dato}
                onActualizado={onActualizado}
                onError={onError}
                onMensaje={onMensaje}
              />
            </CardAction>
          ) : null}
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant={nodo.dato ? "outline" : "secondary"}>
            {nodo.etiqueta}
          </Badge>
          {nodo.dato ? (
            <>
              <Badge variant={varianteEstado(nodo.dato)}>
                {textoEstado(nodo.dato)}
              </Badge>
              <Badge variant="outline">{nodo.dato.codigo}</Badge>
            </>
          ) : null}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          {nodo.hijos.length === 0
            ? "Sin elementos dependientes"
            : `${nodo.hijos.length} ${nodo.hijos.length === 1 ? "dependencia" : "dependencias"}`}
        </CardFooter>
      </Card>
      {nodo.hijos.length > 0 ? (
        <div className="mt-3 flex flex-col gap-3 border-l border-border pl-0">
          {nodo.hijos.map((hijo) => (
            <NodoJerarquiaCard
              key={hijo.clave}
              nodo={hijo}
              profundidad={profundidad + 1}
              onActualizado={onActualizado}
              onError={onError}
              onMensaje={onMensaje}
            />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function VistaJerarquicaConfiguracion({
  cargando,
  datos,
  tipo,
  onActualizado,
  onError,
  onMensaje,
}: {
  cargando?: boolean
  datos: ConfiguracionGeneralResponse[]
  tipo: TipoJerarquico
  onActualizado: () => void
  onError: (mensaje: string) => void
  onMensaje: (mensaje: string) => void
}) {
  if (cargando) {
    return (
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="ml-10 h-28 w-[calc(100%-2.5rem)]" />
        <Skeleton className="ml-20 h-28 w-[calc(100%-5rem)]" />
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

  const nodos = construirJerarquia(tipo, datos)

  return (
    <div className="flex flex-col gap-5 p-4 md:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">Vista jerarquica</Badge>
        <span className="text-sm text-muted-foreground">
          Lee la estructura de arriba hacia abajo: cada tarjeta indentada depende de la anterior.
        </span>
      </div>
      <div className="flex flex-col gap-5">
        {nodos.map((nodo) => (
          <NodoJerarquiaCard
            key={nodo.clave}
            nodo={nodo}
            profundidad={0}
            onActualizado={onActualizado}
            onError={onError}
            onMensaje={onMensaje}
          />
        ))}
      </div>
    </div>
  )
}

function TablaListadoConfiguracion({
  cargando,
  datos,
  tipo,
  onActualizado,
  onError,
  onMensaje,
}: {
  cargando?: boolean
  datos: ConfiguracionGeneralResponse[]
  tipo: TipoListado
  onActualizado: () => void
  onError: (mensaje: string) => void
  onMensaje: (mensaje: string) => void
}) {
  const columnas = columnasPorTipo[tipo]

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
            <TableHead className="w-16 text-right">#</TableHead>
            <TableHead>Codigo</TableHead>
            <TableHead>Nombre</TableHead>
            {columnas.map((columna) => (
              <TableHead key={columna.header} className={columna.className}>
                {columna.header}
              </TableHead>
            ))}
            <TableHead>Estado</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead>Actualizacion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datos.map((dato) => {
            const claseContenido = obtenerClaseContenido(dato)

            return (
              <TableRow
                key={`${dato.tipoDatoMaestro}-${dato.id}`}
                className={obtenerClaseFila(dato)}
              >
                <TableCell>
                  <AccionesConfiguracion
                    dato={dato}
                    onActualizado={onActualizado}
                    onError={onError}
                    onMensaje={onMensaje}
                  />
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">
                  <span className={claseContenido}>{dato.id}</span>
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
                {columnas.map((columna) => (
                  <TableCell key={columna.header} className={columna.className}>
                    <span className={claseContenido}>{columna.render(dato)}</span>
                  </TableCell>
                ))}
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
  const jerarquico = esTipoJerarquico(tipo)
  const filtrosBase = limpiarQuery({
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
  })
  const [query, setQuery] = useState<ConsultarConfiguracionGeneralQuery>({
    ...filtrosBase,
    page: 1,
    pageSize: jerarquico ? 100 : 20,
    sortBy: "id",
    sortOrder: "desc",
  })
  const [mensajeOperacion, setMensajeOperacion] = useState<string | null>(null)
  const [errorOperacion, setErrorOperacion] = useState<string | null>(null)

  // Para un tipo concreto usamos su recurso dedicado; "TODOS" sigue con la
  // consulta generica (filtrando por tipoDatoMaestro cuando aplique).
  const esTodos = tipo === "TODOS"
  const consultaTipo = useListarPorTipoQuery(
    esTodos ? "UBICACION" : tipo,
    query,
    !esTodos,
  )
  const consultaTodos = useConfiguracionGeneralQuery(query, esTodos)
  const consulta = esTodos ? consultaTodos : consultaTipo

  const exportacion = useExportarConfiguracionGeneralQuery(
    esTodos ? query : { ...query, tipoDatoMaestro: tipo },
    false,
  )
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
              sortBy: "id",
              sortOrder: "desc",
            })
          }
        >
          Limpiar
        </Button>
      </div>

      {jerarquico ? (
        <VistaJerarquicaConfiguracion
          datos={datos}
          tipo={tipo}
          cargando={consulta.isLoading}
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
      ) : (
        <TablaListadoConfiguracion
          datos={datos}
          tipo={tipo}
          cargando={consulta.isLoading}
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
      )}
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

export function ConfiguracionGeneralRegimenesListarVista() {
  return <ConfiguracionGeneralListadoPorTipoVista tipo="REGIMEN" />
}
