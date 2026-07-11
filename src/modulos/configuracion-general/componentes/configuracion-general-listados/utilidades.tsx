"use client"

import { type ReactNode } from "react"
import { Building2, Layers, MapPin } from "lucide-react"

import { Badge } from "@/compartido/componentes/ui/badge"
import { cn } from "@/compartido/utilidades/utils"

import type { CatalogosMaestro } from "../campos-maestro"
import { useListarPorTipoQuery } from "../../servicios/configuracion-general-queries"
import type {
  ConfiguracionGeneralResponse,
  ConsultarConfiguracionGeneralQuery,
  TipoDatoMaestro,
} from "../../tipos/configuracion-general"

export type TipoListado = TipoDatoMaestro | "TODOS"
export type TipoJerarquico = "AREA" | "CARGO" | "CONTRATO" | "SEDE"

export function esTipoJerarquico(tipo: TipoListado): tipo is TipoJerarquico {
  return (
    tipo === "AREA" ||
    tipo === "CARGO" ||
    tipo === "CONTRATO" ||
    tipo === "SEDE"
  )
}

export const detalleListado: Record<TipoListado, { descripcion: string; titulo: string }> = {
  TODOS: {
    titulo: "Todas las configuraciones",
    descripcion: "Vista general de maestros de configuracion.",
  },
  UBICACION: {
    titulo: "Ubicaciones",
    descripcion: "Lugares registrados donde la empresa opera (plantas, minas, puertos, etc.).",
  },
  SEDE: {
    titulo: "Sedes",
    descripcion: "Centros de trabajo que pertenecen a cada ubicacion.",
  },
  AREA: {
    titulo: "Areas",
    descripcion: "Gerencias y areas que pertenecen a cada sede.",
  },
  ALMACEN: {
    titulo: "Almacenes",
    descripcion: "Almacenes fisicos o temporales vinculados a ubicaciones y sedes.",
  },
  REGIMEN: {
    titulo: "Regimenes",
    descripcion: "Regimenes de trabajo y descanso usados por operaciones.",
  },
  CUENTA: {
    titulo: "Cuentas",
    descripcion: "Cuentas de la empresa de las que pueden depender contratos.",
  },
  CONTRATO: {
    titulo: "Contratos",
    descripcion: "Contratos que pertenecen a una cuenta o a otro contrato.",
  },
  CARGO: {
    titulo: "Cargos",
    descripcion: "Puestos de trabajo y a quien reporta cada uno.",
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
  REGIMEN: [],
  CUENTA: [],
  CONTRATO: ["CUENTA", "CONTRATO"],
  CARGO: ["CARGO", "AREA"],
}

export function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operacion."
}

export function formatearFecha(fecha?: string | null) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(valor)
}

export function formatearDia(fecha?: string | null) {
  if (!fecha) return "-"
  const valor = new Date(fecha)
  if (Number.isNaN(valor.getTime())) return fecha
  return new Intl.DateTimeFormat("es-PE", { dateStyle: "short" }).format(valor)
}

export function textoEstado(dato: ConfiguracionGeneralResponse) {
  if (dato.estadoRegistro === "ANULADO") return "Anulado"
  if (dato.estado === "INACTIVO") return "Inactivo"
  return "Activo"
}

export function varianteEstado(dato: ConfiguracionGeneralResponse) {
  if (dato.estadoRegistro === "ANULADO") return "destructive"
  if (dato.estado === "INACTIVO") return "secondary"
  return "outline"
}

export function referenciaTexto(nombre?: string | null, id?: number | null) {
  if (nombre) return nombre
  return id == null ? "-" : String(id)
}

export interface ColumnaTipo {
  header: string
  className?: string
  render: (dato: ConfiguracionGeneralResponse) => ReactNode
}

// Columnas propias de cada tipo: cada maestro muestra SOLO sus campos, sin la
// columna generica "detalle especifico" que aplastaba toda la jerarquia.
export const columnasPorTipo: Record<TipoListado, ColumnaTipo[]> = {
  TODOS: [
    {
      header: "Tipo",
      render: (dato) => (
        <Badge variant="secondary">
          {dato.tipoDatoMaestro.charAt(0) + dato.tipoDatoMaestro.slice(1).toLowerCase()}
        </Badge>
      ),
    },
  ],
  CARGO: [
    {
      header: "Area",
      render: (dato) => referenciaTexto(dato.areaNombre, dato.areaId),
    },
    {
      header: "Reporta a",
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
      // El padre puede ser cualquier area (jerarquia recursiva), no solo cuando el
      // nivel es AREA. Sin padre = area raiz.
      header: "Area superior",
      render: (dato) => referenciaTexto(dato.gerenciaNombre, dato.gerenciaId),
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
      header: "Temporal",
      render: (dato) => (dato.esTemporal ? "Si" : "No"),
    },
  ],
  REGIMEN: [
    {
      header: "Codigo regimen",
      render: (dato) => dato.regimenCodigo ?? "-",
    },
    {
      header: "Trabajo / descanso",
      render: (dato) => `${dato.diasTrabajo ?? "-"} / ${dato.diasDescanso ?? "-"}`,
    },
    {
      header: "Horas dia",
      className: "text-right",
      render: (dato) => <span className="tabular-nums">{dato.horasPorDia ?? "-"}</span>,
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
      header: "Pertenece a",
      render: (dato) => referenciaTexto(dato.contratoPadreNombre, dato.contratoPadreId),
    },
  ],
}

export function actualizarQuery(
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

export function limpiarQuery(query: ConsultarConfiguracionGeneralQuery) {
  return Object.fromEntries(
    Object.entries(query).filter(([, value]) => {
      if (value === undefined || value === null) return false
      if (typeof value === "string") return value.trim() !== ""
      return true
    }),
  ) as ConsultarConfiguracionGeneralQuery
}

export function obtenerClaseFila(dato: ConfiguracionGeneralResponse) {
  const inactivo = dato.estado === "INACTIVO"
  const anulado = dato.estadoRegistro === "ANULADO"

  return cn(
    "border-border/80",
    inactivo && !anulado && "bg-muted/45 hover:bg-muted/65",
    anulado &&
      "border-l-4 border-l-destructive bg-destructive/5 text-muted-foreground hover:bg-destructive/10",
  )
}

export function obtenerClaseContenido(dato: ConfiguracionGeneralResponse) {
  return dato.estadoRegistro === "ANULADO"
    ? "line-through decoration-destructive/70 decoration-2"
    : undefined
}

export function DatoFicha({
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
export function useCatalogosParaTipo(tipo: TipoListado, enabled: boolean): CatalogosMaestro {
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

// Icono que acompana a cada cabecera de grupo (contenedor), segun lo que agrupa.
export function IconoGrupo({ etiqueta, className }: { etiqueta: string; className?: string }) {
  const valor = etiqueta.toLowerCase()
  if (valor.includes("ubicacion")) return <MapPin className={className} />
  if (valor.includes("sede")) return <Building2 className={className} />
  return <Layers className={className} />
}
