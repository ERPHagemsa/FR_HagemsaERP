"use client"

import { useState } from "react"
import { FileDown, Search } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
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

import {
  useConfiguracionGeneralQuery,
  useExportarConfiguracionGeneralQuery,
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

function detalleEspecifico(dato: ConfiguracionGeneralResponse) {
  if (dato.tipoDatoMaestro === "UBICACION") return dato.direccion || dato.tipoUbicacion || "-"
  if (dato.tipoDatoMaestro === "SEDE") return dato.ubicacionId || "-"
  if (dato.tipoDatoMaestro === "AREA") return dato.nivelArea || dato.sedeId || "-"
  if (dato.tipoDatoMaestro === "ALMACEN") return dato.esTemporal ? "Temporal" : "Fijo"
  if (dato.tipoDatoMaestro === "CUENTA") return `Nivel ${dato.nivelCuentaContrato ?? 1}`
  if (dato.tipoDatoMaestro === "CONTRATO") return `Nivel ${dato.nivelCuentaContrato ?? "-"}`
  return dato.cargoSuperiorId || "-"
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

function TablaListadoConfiguracion({
  cargando,
  datos,
  mostrarTipo,
}: {
  cargando?: boolean
  datos: ConfiguracionGeneralResponse[]
  mostrarTipo: boolean
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
            {mostrarTipo ? <TableHead>Tipo</TableHead> : null}
            <TableHead>Codigo</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Detalle</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Actualizacion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datos.map((dato) => (
            <TableRow key={dato.id}>
              {mostrarTipo ? (
                <TableCell>
                  <Badge variant="secondary">{dato.tipoDatoMaestro}</Badge>
                </TableCell>
              ) : null}
              <TableCell className="font-mono text-xs">{dato.codigo}</TableCell>
              <TableCell>
                <div className="flex min-w-56 flex-col">
                  <span className="font-medium">{dato.nombre}</span>
                  <span className="text-xs text-muted-foreground">{dato.descripcion || "Sin descripcion"}</span>
                </div>
              </TableCell>
              <TableCell>{detalleEspecifico(dato)}</TableCell>
              <TableCell>
                <Badge variant={dato.estadoRegistro === "ANULADO" ? "destructive" : "outline"}>
                  {textoEstado(dato)}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex min-w-40 flex-col">
                  <span>{formatearFecha(dato.fechaModificacion || dato.fechaCreacion)}</span>
                  <span className="text-xs text-muted-foreground">
                    {dato.usuarioModificacion || dato.usuarioCreacion}
                  </span>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function ConfiguracionGeneralListadoPorTipoVista({ tipo }: { tipo: TipoListado }) {
  const detalle = detalleListado[tipo]
  const [query, setQuery] = useState<ConsultarConfiguracionGeneralQuery>({
    ...(tipo === "TODOS" ? {} : { tipoDatoMaestro: tipo }),
    page: 1,
    pageSize: 20,
    sortBy: "fechaCreacion",
    sortOrder: "desc",
  })
  const consulta = useConfiguracionGeneralQuery(query)
  const exportacion = useExportarConfiguracionGeneralQuery(query, false)
  const datos = consulta.data?.datos ?? []
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

      {exportacion.data ? (
        <div className="p-4 pb-0">
          <Alert>
            <AlertTitle>Exportacion consultada</AlertTitle>
            <AlertDescription>
              Se encontraron {exportacion.data.datos.length} registros para exportar.
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
      </div>

      <TablaListadoConfiguracion
        datos={datos}
        cargando={consulta.isLoading}
        mostrarTipo={tipo === "TODOS"}
      />
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
