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
import { PaginationControls } from "@/modulos/socio-negocios/componentes/pagination-controls"

import {
  useConfiguracionGeneralQuery,
  useExportarConfiguracionGeneralQuery,
  useJerarquiaUbicacionesQuery,
  useListarPorTipoQuery,
} from "../servicios/configuracion-general-queries"
import type {
  ConsultarConfiguracionGeneralQuery,
  EstadoDatoMaestro,
  EstadoRegistro,
  UbicacionJerarquiaResponse,
} from "../tipos/configuracion-general"
import { aplanarDesdeJerarquia, esTipoDesdeJerarquia } from "./configuracion-general-listados/jerarquia"
import {
  actualizarQuery,
  detalleListado,
  esTipoJerarquico,
  limpiarQuery,
  obtenerMensajeError,
  type TipoListado,
} from "./configuracion-general-listados/utilidades"
import {
  TablaListadoConfiguracion,
  VistaJerarquicaConfiguracion,
} from "./configuracion-general-listados/vistas-listado"

export function ConfiguracionGeneralListadoPorTipoVista({
  tipo,
  ocultarEncabezado = false,
}: {
  tipo: TipoListado
  // Cuando la pantalla ya muestra el titulo (pagina dedicada por tipo), evitamos
  // repetirlo aqui y solo dejamos un contador compacto.
  ocultarEncabezado?: boolean
}) {
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

  // Para un tipo concreto usamos su recurso dedicado; los arboles que cuelgan de
  // la ubicacion (sede/area/almacen) usan el endpoint /ubicaciones/jerarquia; y
  // "TODOS" sigue con la consulta generica (filtrando por tipoDatoMaestro).
  const esTodos = tipo === "TODOS"
  const desdeJerarquia = esTipoDesdeJerarquia(tipo)
  const consultaTipo = useListarPorTipoQuery(
    esTodos || desdeJerarquia ? "UBICACION" : tipo,
    query,
    !esTodos && !desdeJerarquia,
  )
  const consultaTodos = useConfiguracionGeneralQuery(query, esTodos)
  const consultaJerarquia = useJerarquiaUbicacionesQuery(query, desdeJerarquia)
  const consulta = esTodos
    ? consultaTodos
    : desdeJerarquia
      ? consultaJerarquia
      : consultaTipo

  const exportacion = useExportarConfiguracionGeneralQuery(
    esTodos ? query : { ...query, tipoDatoMaestro: tipo },
    false,
  )
  const datosCrudos = consulta.data?.datos ?? []
  const datos = desdeJerarquia
    ? aplanarDesdeJerarquia(tipo, datosCrudos as UbicacionJerarquiaResponse[])
    : datosCrudos
  const metaPaginacion = consulta.data?.paginacion
  const total = desdeJerarquia
    ? datos.length
    : (metaPaginacion?.total ?? datos.length)

  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      {ocultarEncabezado ? (
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="text-sm font-medium text-muted-foreground">Registros</span>
          <Badge variant="outline" className="w-fit">
            {total} {total === 1 ? "registro" : "registros"}
          </Badge>
        </div>
      ) : (
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{detalle.titulo}</h2>
            <p className="text-sm text-muted-foreground">{detalle.descripcion}</p>
          </div>
          <Badge variant="outline" className="w-fit">
            {total} registros
          </Badge>
        </div>
      )}

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
            placeholder={
              desdeJerarquia
                ? "Buscar ubicacion por nombre"
                : "Buscar por codigo o nombre"
            }
            className="pl-9"
          />
        </div>
        <div className="relative lg:w-40">
          <Input
            value={query.codigo ?? ""}
            onChange={(event) => setQuery((actual) => actualizarQuery(actual, "codigo", event.target.value))}
            placeholder={desdeJerarquia ? "Codigo de ubicacion" : "Codigo"}
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
