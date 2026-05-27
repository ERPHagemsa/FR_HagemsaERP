"use client"

import Link from "next/link"
import type { FormEvent } from "react"
import { useState } from "react"
import {
  Archive,
  Ban,
  CheckCircle2,
  Clock3,
  Database,
  FileDown,
  History,
  Plus,
  RotateCcw,
  Search,
  Settings2,
  SlidersHorizontal,
} from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import { Input } from "@/compartido/componentes/ui/input"
import { Separator } from "@/compartido/componentes/ui/separator"
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

import {
  useCatalogoConfiguracionGeneralQuery,
  useConfiguracionGeneralQuery,
  useEstadoBcConfiguracionGeneralQuery,
  useExportarConfiguracionGeneralQuery,
  useRegistrarConfiguracionGeneralMutation,
} from "../servicios/configuracion-general-queries"
import type {
  ConfiguracionGeneralResponse,
  ConsultarConfiguracionGeneralQuery,
  EstadoDatoMaestro,
  EstadoRegistro,
  TipoDatoMaestro,
} from "../tipos/configuracion-general"

const tipos: Array<{ value: "TODOS" | TipoDatoMaestro; label: string }> = [
  { value: "TODOS", label: "Tipo: todos" },
  { value: "CARGO", label: "Cargo" },
  { value: "SEDE", label: "Sede" },
  { value: "AREA", label: "Area" },
  { value: "CUENTA", label: "Cuenta" },
  { value: "CONTRATO", label: "Contrato" },
]

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

function nombreTipo(tipo: TipoDatoMaestro) {
  return tipo.charAt(0) + tipo.slice(1).toLowerCase()
}

function eventoPrincipal(dato: ConfiguracionGeneralResponse) {
  const base = nombreTipo(dato.tipoDatoMaestro)

  if (dato.estadoRegistro === "ANULADO") return `${base}Anulado`
  if (dato.estado === "INACTIVO") return `${base}Inhabilitado`
  if (dato.fechaModificacion) return `${base}Actualizado`
  return `${base}Habilitado`
}

function atributosTexto(atributos?: Record<string, unknown> | null) {
  if (!atributos || Object.keys(atributos).length === 0) return "-"

  return Object.entries(atributos)
    .map(([clave, valor]) => `${clave}: ${String(valor)}`)
    .join(" | ")
}

function construirAtributosDesdeFormulario(
  tipo: TipoDatoMaestro,
  formData: FormData,
): Record<string, unknown> {
  if (tipo === "CARGO") {
    return {
      familia: String(formData.get("familiaCargo") ?? "").trim(),
      nivel: String(formData.get("nivelCargo") ?? "").trim(),
      requiereLicencia: String(formData.get("requiereLicencia") ?? "NO"),
    }
  }

  if (tipo === "SEDE") {
    return {
      direccion: String(formData.get("direccionSede") ?? "").trim(),
      ciudad: String(formData.get("ciudadSede") ?? "").trim(),
      zona: String(formData.get("zonaSede") ?? "").trim(),
    }
  }

  if (tipo === "AREA") {
    return {
      sedeReferencia: String(formData.get("sedeReferencia") ?? "").trim(),
      responsable: String(formData.get("responsableArea") ?? "").trim(),
      clasificacion: String(formData.get("clasificacionArea") ?? "").trim(),
    }
  }

  if (tipo === "CUENTA") {
    return {
      tipoCuenta: String(formData.get("tipoCuenta") ?? "").trim(),
      clienteReferencia: String(formData.get("clienteReferencia") ?? "").trim(),
      centroCosto: String(formData.get("centroCosto") ?? "").trim(),
    }
  }

  return {
    tipoContrato: String(formData.get("tipoContrato") ?? "").trim(),
    cuentaReferencia: String(formData.get("cuentaReferencia") ?? "").trim(),
    vigencia: String(formData.get("vigenciaContrato") ?? "").trim(),
  }
}

function CamposEspecificosMaestro({ tipo }: { tipo: TipoDatoMaestro }) {
  if (tipo === "CARGO") {
    return (
      <>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="familiaCargo">Familia del cargo</label>
          <Input id="familiaCargo" name="familiaCargo" placeholder="Operaciones" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="nivelCargo">Nivel</label>
          <Input id="nivelCargo" name="nivelCargo" placeholder="Operativo" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="requiereLicencia">Requiere licencia</label>
          <Select name="requiereLicencia" defaultValue="SI">
            <SelectTrigger id="requiereLicencia" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SI">Si</SelectItem>
              <SelectItem value="NO">No</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </>
    )
  }

  if (tipo === "SEDE") {
    return (
      <>
        <div className="grid gap-2 md:col-span-2">
          <label className="text-sm font-medium" htmlFor="direccionSede">Direccion</label>
          <Input id="direccionSede" name="direccionSede" placeholder="Av. Principal 123" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="ciudadSede">Ciudad</label>
          <Input id="ciudadSede" name="ciudadSede" placeholder="Arequipa" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="zonaSede">Zona</label>
          <Input id="zonaSede" name="zonaSede" placeholder="Sur" />
        </div>
      </>
    )
  }

  if (tipo === "AREA") {
    return (
      <>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="sedeReferencia">Sede de referencia</label>
          <Input id="sedeReferencia" name="sedeReferencia" placeholder="AQP" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="responsableArea">Responsable</label>
          <Input id="responsableArea" name="responsableArea" placeholder="Jefatura de operaciones" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="clasificacionArea">Clasificacion</label>
          <Input id="clasificacionArea" name="clasificacionArea" placeholder="Operativa" />
        </div>
      </>
    )
  }

  if (tipo === "CUENTA") {
    return (
      <>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="tipoCuenta">Tipo de cuenta</label>
          <Input id="tipoCuenta" name="tipoCuenta" placeholder="Operativa" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="clienteReferencia">Cliente de referencia</label>
          <Input id="clienteReferencia" name="clienteReferencia" placeholder="Minera Sur" />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="centroCosto">Centro de costo</label>
          <Input id="centroCosto" name="centroCosto" placeholder="CC-OPER-001" />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="tipoContrato">Tipo de contrato</label>
        <Input id="tipoContrato" name="tipoContrato" placeholder="Servicio" />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="cuentaReferencia">Cuenta de referencia</label>
        <Input id="cuentaReferencia" name="cuentaReferencia" placeholder="CTA-MINERA-SUR" />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium" htmlFor="vigenciaContrato">Vigencia</label>
        <Input id="vigenciaContrato" name="vigenciaContrato" placeholder="2026" />
      </div>
    </>
  )
}

function EstadoDatoBadge({ dato }: { dato: ConfiguracionGeneralResponse }) {
  const esAnulado = dato.estadoRegistro === "ANULADO"
  const esActivo = dato.estado === "ACTIVO" && !esAnulado

  return (
    <Badge
      variant={esAnulado ? "destructive" : "outline"}
      className="h-6 gap-1.5 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {esActivo ? (
        <CheckCircle2 className="size-3.5 text-emerald-500" />
      ) : (
        <Ban className="size-3.5 text-destructive" />
      )}
      {esAnulado ? "ANULADO" : dato.estado}
    </Badge>
  )
}

function TipoBadge({ tipo }: { tipo: TipoDatoMaestro }) {
  return (
    <Badge
      variant="outline"
      className="h-6 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
    >
      {tipo}
    </Badge>
  )
}

function Dato({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
      <span className="break-words text-sm">{value || "-"}</span>
    </div>
  )
}

function MetricasMaestros({
  datos,
  total,
  historial,
  cargando,
}: {
  datos: ConfiguracionGeneralResponse[]
  total: number
  historial?: number
  cargando?: boolean
}) {
  const activosVigentes = datos.filter(
    (dato) => dato.estado === "ACTIVO" && dato.estadoRegistro === "VIGENTE",
  ).length
  const inactivos = datos.filter((dato) => dato.estado === "INACTIVO").length
  const anulados = datos.filter((dato) => dato.estadoRegistro === "ANULADO").length

  const metricas = [
    {
      etiqueta: "Datos maestros",
      valor: total || datos.length,
      detalle: "Cargo, Sede, Area, Cuenta y Contrato consultados.",
      icon: Database,
      contexto: "Maestro BC14",
    },
    {
      etiqueta: "Activos vigentes",
      valor: activosVigentes,
      detalle: "Disponibles para los bounded contexts consumidores.",
      icon: CheckCircle2,
      contexto: "Operativos",
    },
    {
      etiqueta: "Inactivos / anulados",
      valor: inactivos + anulados,
      detalle: `${inactivos} inactivos y ${anulados} anulados en la consulta.`,
      icon: Ban,
      contexto: "Seguimiento",
    },
    {
      etiqueta: "Historial",
      valor: historial ?? "-",
      detalle: "Auditoria propia de Configuracion General.",
      icon: History,
      contexto: "Append-only",
    },
  ]

  return (
    <section className="grid gap-3 md:grid-cols-4">
      {metricas.map((metrica) => (
        <Card key={metrica.etiqueta} className="overflow-hidden border-border bg-card text-card-foreground shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
            <div className="min-w-0">
              <CardDescription className="truncate text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {metrica.etiqueta}
              </CardDescription>
              <CardTitle className="mt-2 text-3xl font-semibold tabular-nums tracking-normal">
                {cargando ? "-" : metrica.valor}
              </CardTitle>
            </div>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border">
              <metrica.icon className="size-4" />
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-0">
            <p className="min-h-10 text-sm leading-5 text-muted-foreground">
              {metrica.detalle}
            </p>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
              <span className="text-xs text-muted-foreground">{metrica.contexto}</span>
              <Badge
                variant="outline"
                className="h-6 shrink-0 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
              >
                Control
              </Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}

function TablaDatosMaestros({
  datos,
  cargando,
  onSelect,
}: {
  datos: ConfiguracionGeneralResponse[]
  cargando?: boolean
  onSelect?: (dato: ConfiguracionGeneralResponse) => void
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
      <div className="px-4 py-10 text-center text-sm text-muted-foreground">
        No existen datos maestros para la consulta aplicada.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/70 hover:bg-muted/70">
            <TableHead>Tipo</TableHead>
            <TableHead>Codigo</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Registro</TableHead>
            <TableHead>Evento de dominio</TableHead>
            <TableHead>Modificacion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {datos.map((dato) => (
            <TableRow
              key={dato.id}
              className={onSelect ? "cursor-pointer border-border/80" : "border-border/80"}
              onClick={() => onSelect?.(dato)}
            >
              <TableCell>
                <TipoBadge tipo={dato.tipoDatoMaestro} />
              </TableCell>
              <TableCell className="font-mono text-xs">{dato.codigo}</TableCell>
              <TableCell>
                <div className="flex min-w-56 flex-col">
                  <span className="font-medium">{dato.nombre}</span>
                  <span className="text-xs text-muted-foreground">
                    {dato.descripcion || "Sin descripcion"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <EstadoDatoBadge dato={dato} />
              </TableCell>
              <TableCell>
                <Badge
                  variant={dato.estadoRegistro === "VIGENTE" ? "outline" : "destructive"}
                  className="h-6 rounded-full border-border bg-background px-2.5 text-[12px] font-medium text-foreground shadow-xs"
                >
                  {dato.estadoRegistro}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">{eventoPrincipal(dato)}</TableCell>
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

function FiltrosMaestros({
  query,
  setQuery,
  onExportar,
  exportando,
}: {
  query: ConsultarConfiguracionGeneralQuery
  setQuery: (query: ConsultarConfiguracionGeneralQuery) => void
  onExportar?: () => void
  exportando?: boolean
}) {
  function actualizar(
    key: keyof ConsultarConfiguracionGeneralQuery,
    value: string,
  ) {
    const siguiente = { ...query, page: 1 }

    if (value === "TODOS" || value === "") {
      delete siguiente[key]
    } else {
      Object.assign(siguiente, { [key]: value })
    }

    setQuery(siguiente)
  }

  return (
    <div className="flex flex-col gap-3 border-b border-border px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
      <form className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative lg:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query.nombre ?? query.codigo ?? ""}
            onChange={(event) => actualizar("nombre", event.target.value)}
            placeholder="Buscar codigo o nombre"
            className="pl-9"
          />
        </div>
        <Select
          value={query.tipoDatoMaestro ?? "TODOS"}
          onValueChange={(value) => actualizar("tipoDatoMaestro", value as TipoDatoMaestro | "TODOS")}
        >
          <SelectTrigger className="lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {tipos.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={query.estado ?? "TODOS"}
          onValueChange={(value) => actualizar("estado", value as EstadoDatoMaestro | "TODOS")}
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
          onValueChange={(value) => actualizar("estadoRegistro", value as EstadoRegistro | "TODOS")}
        >
          <SelectTrigger className="lg:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Registro: todos</SelectItem>
            <SelectItem value="VIGENTE">Vigente</SelectItem>
            <SelectItem value="ANULADO">Anulado</SelectItem>
          </SelectContent>
        </Select>
      </form>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/configuracion/nuevo">
            <Plus className="size-4" />
            Nuevo maestro
          </Link>
        </Button>
        <Button variant="outline" size="sm" onClick={onExportar} disabled={exportando}>
          <FileDown className="size-4" />
          {exportando ? "Exportando..." : "Exportar"}
        </Button>
      </div>
    </div>
  )
}

function ConteoPorTipo({ datos }: { datos: ConfiguracionGeneralResponse[] }) {
  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle>Distribucion</CardTitle>
        <CardDescription>Registros agrupados por dato maestro.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {tipos
          .filter((tipo) => tipo.value !== "TODOS")
          .map((tipo) => (
            <div key={tipo.value} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{tipo.label.replace("Tipo: ", "")}</span>
              <span className="font-medium tabular-nums">
                {datos.filter((dato) => dato.tipoDatoMaestro === tipo.value).length}
              </span>
            </div>
          ))}
      </CardContent>
    </Card>
  )
}

function FichaMaestro({ dato }: { dato?: ConfiguracionGeneralResponse }) {
  if (!dato) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Ficha del maestro</CardTitle>
          <CardDescription>Selecciona un registro de la tabla.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader>
        <CardTitle>Ficha del maestro</CardTitle>
        <CardDescription>Lectura del registro seleccionado por negocio.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 text-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
              {dato.tipoDatoMaestro}
            </p>
            <h3 className="text-lg font-semibold">{dato.nombre}</h3>
          </div>
          <EstadoDatoBadge dato={dato} />
        </div>
        <Separator />
        <div className="grid gap-3">
          <Dato label="Codigo" value={dato.codigo} />
          <Dato label="Descripcion" value={dato.descripcion} />
          <Dato label="Atributos" value={atributosTexto(dato.atributos)} />
          <Dato label="Creacion" value={formatearFecha(dato.fechaCreacion)} />
          <Dato label="Usuario creacion" value={dato.usuarioCreacion} />
          <Dato label="Ultimo evento" value={eventoPrincipal(dato)} />
          <Dato label="Modificacion" value={formatearFecha(dato.fechaModificacion)} />
          {dato.motivoInhabilitacion ? (
            <Dato label="Motivo inhabilitacion" value={dato.motivoInhabilitacion} />
          ) : null}
          {dato.motivoAnulacion ? <Dato label="Motivo anulacion" value={dato.motivoAnulacion} /> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export function ConfiguracionGeneralDashboardVista() {
  const query = useConfiguracionGeneralQuery({
    page: 1,
    pageSize: 6,
    sortBy: "fechaCreacion",
    sortOrder: "desc",
  })
  const estadoQuery = useEstadoBcConfiguracionGeneralQuery()
  const datos = query.data?.datos ?? []
  const total = query.data?.paginacion?.total ?? datos.length

  return (
    <>
      <SiteHeader
        title="CS-Configuración General"
        breadcrumbs={[{ title: "CS-Configuración General" }]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {query.error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>{obtenerMensajeError(query.error)}</AlertDescription>
            </Alert>
          ) : null}

          <MetricasMaestros datos={datos} total={total} cargando={query.isLoading} />

          <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Datos maestros recientes</h2>
                  <p className="text-sm text-muted-foreground">
                    Consulta real de Cargo, Sede, Area, Cuenta y Contrato.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href="/configuracion/listar">Ver listado</Link>
                </Button>
              </div>
              <TablaDatosMaestros datos={datos} cargando={query.isLoading} />
            </section>

            <aside className="flex flex-col gap-3">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Estado del BC</CardTitle>
                  <CardDescription>Respuesta de /configuracion-general/estado.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <Dato label="Bounded context" value={estadoQuery.data?.boundedContext} />
                  <Dato label="Agregado" value={estadoQuery.data?.agregado} />
                </CardContent>
              </Card>
              <ConteoPorTipo datos={datos} />
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Accesos rapidos</CardTitle>
                  <CardDescription>Operaciones frecuentes del modulo.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button asChild>
                    <Link href="/configuracion/nuevo">
                      <Plus className="size-4" />
                      Registrar maestro
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/configuracion/reportes">
                      <FileDown className="size-4" />
                      Ver reportes
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/configuracion/listar">
                      <Database className="size-4" />
                      Listar maestros
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </section>
        </div>
      </main>
    </>
  )
}

export function ConfiguracionGeneralListadoVista() {
  const [query, setQuery] = useState<ConsultarConfiguracionGeneralQuery>({
    page: 1,
    pageSize: 20,
    sortBy: "fechaCreacion",
    sortOrder: "desc",
  })
  const consulta = useConfiguracionGeneralQuery(query)
  const exportacion = useExportarConfiguracionGeneralQuery(query, false)
  const datos = consulta.data?.datos ?? []
  const total = consulta.data?.paginacion?.total ?? datos.length
  const [seleccionado, setSeleccionado] = useState<ConfiguracionGeneralResponse | undefined>()
  const seleccionActual = seleccionado && datos.some((dato) => dato.id === seleccionado.id)
    ? seleccionado
    : datos[0]

  async function exportar() {
    await exportacion.refetch()
  }

  return (
    <>
      <SiteHeader
        title="Listar datos maestros"
        breadcrumbs={[
          { title: "CS-Configuración General", href: "/configuracion" },
          { title: "Listar datos maestros" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {consulta.error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>{obtenerMensajeError(consulta.error)}</AlertDescription>
            </Alert>
          ) : null}

          {exportacion.data ? (
            <Alert>
              <AlertTitle>Exportacion consultada</AlertTitle>
              <AlertDescription>
                El endpoint devolvio {exportacion.data.datos.length} registros filtrados.
              </AlertDescription>
            </Alert>
          ) : null}

          <MetricasMaestros datos={datos} total={total} cargando={consulta.isLoading} />

          <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <h2 className="text-base font-semibold">Maestro de Configuracion General</h2>
                <p className="text-sm text-muted-foreground">
                  Consulta paginada de /configuracion-general con filtros del backend.
                </p>
              </div>
              <FiltrosMaestros
                query={query}
                setQuery={setQuery}
                onExportar={() => void exportar()}
                exportando={exportacion.isFetching}
              />
              <TablaDatosMaestros
                datos={datos}
                cargando={consulta.isLoading}
                onSelect={setSeleccionado}
              />
            </section>

            <aside className="flex flex-col gap-3">
              <FichaMaestro dato={seleccionActual} />
              <ConteoPorTipo datos={datos} />
            </aside>
          </section>
        </div>
      </main>
    </>
  )
}

export function ConfiguracionGeneralNuevoVista() {
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tipoNuevo, setTipoNuevo] = useState<TipoDatoMaestro>("CARGO")
  const registrarMutation = useRegistrarConfiguracionGeneralMutation()

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensaje(null)
    setError(null)

    const formData = new FormData(event.currentTarget)
    const atributos = construirAtributosDesdeFormulario(tipoNuevo, formData)

    try {
      const creado = await registrarMutation.mutateAsync({
        tipoDatoMaestro: tipoNuevo,
        codigo: String(formData.get("codigo") ?? "").trim(),
        nombre: String(formData.get("nombre") ?? "").trim(),
        descripcion: String(formData.get("descripcion") ?? "").trim(),
        atributos,
        usuarioId: String(formData.get("usuarioId") ?? "admin").trim(),
      })
      event.currentTarget.reset()
      setTipoNuevo("CARGO")
      setMensaje(`${creado.tipoDatoMaestro} ${creado.codigo} fue registrado.`)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <>
      <SiteHeader
        title="Nuevo dato maestro"
        breadcrumbs={[
          { title: "CS-Configuración General", href: "/configuracion" },
          { title: "Nuevo dato maestro" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {mensaje ? (
            <Alert>
              <AlertTitle>Registro completado</AlertTitle>
              <AlertDescription>{mensaje}</AlertDescription>
            </Alert>
          ) : null}
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo registrar</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <form
              className="rounded-lg border border-border bg-card text-card-foreground shadow-sm"
              onSubmit={(event) => void registrar(event)}
            >
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-lg font-semibold">Registrar y habilitar maestro</h2>
                <p className="text-sm text-muted-foreground">
                  POST /configuracion-general crea el agregado y registra historial REGISTRO.
                </p>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="tipoDatoMaestro">Tipo de dato maestro</label>
                  <Select
                    value={tipoNuevo}
                    onValueChange={(value) => setTipoNuevo(value as TipoDatoMaestro)}
                  >
                    <SelectTrigger id="tipoDatoMaestro" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CARGO">Cargo</SelectItem>
                      <SelectItem value="SEDE">Sede</SelectItem>
                      <SelectItem value="AREA">Area</SelectItem>
                      <SelectItem value="CUENTA">Cuenta</SelectItem>
                      <SelectItem value="CONTRATO">Contrato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="codigo">Codigo</label>
                  <Input id="codigo" name="codigo" placeholder="CARGO-001" required />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <label className="text-sm font-medium" htmlFor="nombre">Nombre</label>
                  <Input id="nombre" name="nombre" placeholder="Conductor" required />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <label className="text-sm font-medium" htmlFor="descripcion">Descripcion</label>
                  <Textarea id="descripcion" name="descripcion" placeholder="Cargo operativo" />
                </div>
                <div className="md:col-span-2">
                  <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <h3 className="text-sm font-semibold">Datos especificos de {nombreTipo(tipoNuevo)}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Estos campos se guardan en atributos del maestro, pero se capturan con lenguaje de negocio.
                    </p>
                  </div>
                </div>
                <CamposEspecificosMaestro tipo={tipoNuevo} />
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="usuarioId">Usuario</label>
                  <Input id="usuarioId" name="usuarioId" defaultValue="admin" required />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium" htmlFor="estadoInicial">Estado inicial</label>
                  <Input id="estadoInicial" value="ACTIVO + VIGENTE" readOnly />
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4">
                <Button type="button" variant="outline">Cancelar</Button>
                <Button type="submit" disabled={registrarMutation.isPending}>
                  <CheckCircle2 className="size-4" />
                  {registrarMutation.isPending ? "Registrando..." : "Registrar y habilitar"}
                </Button>
              </div>
            </form>

            <aside className="flex flex-col gap-3">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Reglas de negocio</CardTitle>
                  <CardDescription>Validaciones esperadas del backend.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <Dato label="Identidad" value="tipoDatoMaestro + codigo" />
                  <Dato label="Nombre unico" value="tipoDatoMaestro + nombre" />
                  <Dato label="Datos especificos" value="Se capturan segun Cargo, Sede, Area, Cuenta o Contrato" />
                  <Dato label="Estado operativo" value="Solo ACTIVO + VIGENTE se consume" />
                  <Dato label="Historial" value="REGISTRO con datos_nuevos" />
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Evento resultante</CardTitle>
                  <CardDescription>Hecho de dominio en tiempo pasado.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium">
                    CargoHabilitado / SedeHabilitada / AreaHabilitada
                  </div>
                </CardContent>
              </Card>
            </aside>
          </section>
        </div>
      </main>
    </>
  )
}

export function ConfiguracionGeneralReportesVista() {
  const [query] = useState<ConsultarConfiguracionGeneralQuery>({
    page: 1,
    pageSize: 50,
    sortBy: "fechaCreacion",
    sortOrder: "desc",
  })
  const catalogo = useCatalogoConfiguracionGeneralQuery(query)
  const exportacion = useExportarConfiguracionGeneralQuery(query, true)
  const datos = exportacion.data?.datos ?? catalogo.data?.datos ?? []
  const total = exportacion.data?.paginacion?.total ?? datos.length
  const eventos = [
    {
      titulo: "Habilitados",
      icon: CheckCircle2,
      eventos: ["CargoHabilitado", "SedeHabilitada", "AreaHabilitada", "CuentaHabilitada", "ContratoHabilitado"],
    },
    {
      titulo: "Actualizados",
      icon: SlidersHorizontal,
      eventos: ["CargoActualizado", "SedeActualizada", "AreaActualizada", "CuentaActualizada", "ContratoActualizado"],
    },
    {
      titulo: "Inhabilitados",
      icon: Archive,
      eventos: ["CargoInhabilitado", "SedeInhabilitada", "AreaInhabilitada", "CuentaInhabilitada", "ContratoInhabilitado"],
    },
  ]

  return (
    <>
      <SiteHeader
        title="Reportes y eventos"
        breadcrumbs={[
          { title: "CS-Configuración General", href: "/configuracion" },
          { title: "Reportes y eventos" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {exportacion.error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>{obtenerMensajeError(exportacion.error)}</AlertDescription>
            </Alert>
          ) : null}

          <MetricasMaestros datos={datos} total={total} cargando={exportacion.isLoading} />

          <section className="grid gap-3 md:grid-cols-3">
            {eventos.map((grupo) => (
              <Card key={grupo.titulo} className="border-border shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <CardTitle>{grupo.titulo}</CardTitle>
                      <CardDescription>Eventos de dominio publicados por BC14.</CardDescription>
                    </div>
                    <span className="flex size-9 items-center justify-center rounded-md bg-background text-primary ring-1 ring-border">
                      <grupo.icon className="size-4" />
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  {grupo.eventos.map((evento) => (
                    <div key={evento} className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm">
                      <Clock3 className="size-4 text-muted-foreground" />
                      <span className="font-medium">{evento}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
            <section className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm">
              <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-base font-semibold">Exportacion filtrada</h2>
                  <p className="text-sm text-muted-foreground">
                    GET /configuracion-general/exportar devuelve DTO paginado filtrado.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => void exportacion.refetch()}>
                  <FileDown className="size-4" />
                  Refrescar exportacion
                </Button>
              </div>
              <TablaDatosMaestros datos={datos} cargando={exportacion.isLoading} />
            </section>

            <aside className="flex flex-col gap-3">
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Catalogo operativo</CardTitle>
                  <CardDescription>GET /catalogo fuerza ACTIVO + VIGENTE.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <Dato label="Registros catalogo" value={String(catalogo.data?.datos.length ?? 0)} />
                  <Dato label="Filtro interno" value="estado ACTIVO + estadoRegistro VIGENTE" />
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Reactivacion y anulacion</CardTitle>
                  <CardDescription>Estados complementarios del maestro.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm">
                  <div className="rounded-md border border-border bg-background p-3">
                    <div className="flex items-center gap-2 font-medium">
                      <RotateCcw className="size-4 text-primary" />
                      Reactivacion
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      PATCH /:id/reactivar recupera un INACTIVO no anulado.
                    </p>
                  </div>
                  <div className="rounded-md border border-border bg-background p-3">
                    <div className="flex items-center gap-2 font-medium">
                      <Settings2 className="size-4 text-primary" />
                      Anulacion
                    </div>
                    <p className="mt-1 text-muted-foreground">
                      PATCH /:id/anular marca estadoRegistro ANULADO.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-border shadow-sm">
                <CardHeader>
                  <CardTitle>Campos base</CardTitle>
                  <CardDescription>Alineados al backend actual.</CardDescription>
                  <CardAction>
                    <Badge variant="outline">API</Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm text-muted-foreground">
                  <span>tipoDatoMaestro</span>
                  <span>codigo, nombre, descripcion</span>
                  <span>atributos, estado, estadoRegistro</span>
                  <span>fechaCreacion, usuarioCreacion</span>
                </CardContent>
              </Card>
            </aside>
          </section>
        </div>
      </main>
    </>
  )
}
