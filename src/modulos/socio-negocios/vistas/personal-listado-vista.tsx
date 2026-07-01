"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Download, Plus, Search } from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/compartido/componentes/ui/empty"
import { Field } from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/compartido/componentes/ui/input-group"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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

import { PaginationControls } from "../componentes/pagination-controls"
import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import {
  AccionesSocio,
  EstadoAprobacionBadge,
  EstadoRegistroBadge,
  EstadoSocioBadge,
  type ErrorOperacion,
  descargarReporte,
  formatearFecha,
  limpiarFiltros,
  obtenerClaseContenidoSocio,
  obtenerClaseFilaSocio,
  obtenerMensajeError,
  obtenerValorFiltro,
} from "../componentes/socio-listado-comun"
import {
  useExportarSociosDeNegocioQuery,
  usePersonalSociosDeNegocioQuery,
} from "../servicios/socio-negocios-queries"
import { useOpcionesConfiguracionGeneralAsignacionQuery } from "../servicios/asignaciones-personal-queries"
import { puedeGestionarAsignacionesPersonal } from "../tipos/socio-negocio"
import type {
  AsignacionPersonalResumen,
  ConsultarPersonalQuery,
  PersonalListadoResponse,
  ReporteSociosDeNegocioResponse,
} from "../tipos/socio-negocio"

function nombreCompletoPersonal(personal: PersonalListadoResponse) {
  if (personal.nombreCompleto) return personal.nombreCompleto
  const partes = [
    personal.primerNombre,
    personal.segundoNombre,
    personal.apellidoPaterno,
    personal.apellidoMaterno,
  ].filter(Boolean)
  return partes.length > 0 ? partes.join(" ") : "Sin nombre"
}

function asignacionVigente(
  personal: PersonalListadoResponse,
): AsignacionPersonalResumen | undefined {
  return personal.asignaciones?.find((asignacion) => asignacion.estado === "VIGENTE")
}

function ResumenAsignacion({ personal }: { personal: PersonalListadoResponse }) {
  const asignacion = asignacionVigente(personal)

  if (!asignacion) {
    const tieneHistorial = (personal.asignaciones?.length ?? 0) > 0
    return (
      <div className="flex min-w-44 flex-col gap-1">
        <Badge variant="outline" className="w-fit text-[11px]">
          Sin asignacion vigente
        </Badge>
        <span className="text-xs text-muted-foreground">
          {tieneHistorial ? "Tiene historial" : "Pendiente de configurar"}
        </span>
      </div>
    )
  }

  const relacion = (asignacion.cuentasContratos ?? []).filter(
    (item) => item.estado === "VIGENTE" || !item.estado,
  )
  const cuentas = relacion.filter((item) => item.tipo === "CUENTA")
  const contrato = relacion.find((item) => item.tipo === "CONTRATO")
  const cargoSede = [asignacion.cargoNombre, asignacion.sedeNombre].filter(Boolean).join(" · ")

  return (
    <div className="flex min-w-52 flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={asignacion.estado === "VIGENTE" ? "secondary" : "outline"} className="text-[11px]">
          {asignacion.estado === "VIGENTE" ? "Vigente" : asignacion.estado}
        </Badge>
        <span className="text-sm font-medium">{cargoSede || "Cargo sin definir"}</span>
      </div>
      <div className="flex flex-wrap gap-1">
        {cuentas.map((cuenta) => (
          <Badge key={cuenta.id} variant="outline" className="text-[11px]">
            {cuenta.configuracionCodigo || cuenta.configuracionNombre || "Cuenta"}
          </Badge>
        ))}
        {contrato ? (
          <Badge variant="secondary" className="text-[11px]">
            {contrato.configuracionCodigo || contrato.configuracionNombre || "Contrato"}
          </Badge>
        ) : null}
        {cuentas.length === 0 && !contrato ? (
          <span className="text-xs text-muted-foreground">Sin cuenta ni contrato</span>
        ) : null}
      </div>
    </div>
  )
}

function AccionAsignacionPersonal({ personal }: { personal: PersonalListadoResponse }) {
  const puedeAsignaciones = puedeGestionarAsignacionesPersonal(personal)
  if (!puedeAsignaciones) {
    return <span className="text-xs text-muted-foreground">No disponible</span>
  }

  const asignacion = asignacionVigente(personal)
  return (
    <Button asChild size="sm" variant={asignacion ? "outline" : "default"} className="whitespace-nowrap">
      <Link href={`/socio-negocios/${personal.id}/asignaciones`}>
        {asignacion ? "Ver configuracion" : "Crear asignacion"}
      </Link>
    </Button>
  )
}

export function PersonalListadoVista() {
  const [reporteGenerado, setReporteGenerado] = useState<string | null>(null)
  const [mensajeOperacion, setMensajeOperacion] = useState<string | null>(null)
  const [errorOperacion, setErrorOperacion] = useState<ErrorOperacion | null>(null)
  const [paginaActual, setPaginaActual] = useState(1)
  const [registrosPorPagina, setRegistrosPorPagina] = useState(20)

  const filtrosBase: ConsultarPersonalQuery = useMemo(
    () => ({ estado: "ACTIVO", estadoRegistro: "ACTIVO", sortBy: "fechaCreacion", sortOrder: "desc" }),
    [],
  )
  const [filtrosFormulario, setFiltrosFormulario] = useState<ConsultarPersonalQuery>(() =>
    limpiarFiltros({ ...filtrosBase }),
  )
  const [filtrosAplicados, setFiltrosAplicados] = useState<ConsultarPersonalQuery>(
    () => filtrosFormulario,
  )

  const filtrosConPaginacion = useMemo(
    () => ({ ...filtrosAplicados, page: paginaActual, pageSize: registrosPorPagina }),
    [filtrosAplicados, paginaActual, registrosPorPagina],
  )

  const opcionesConfiguracionQuery = useOpcionesConfiguracionGeneralAsignacionQuery({
    tiposDatoMaestro: ["CUENTA", "CONTRATO"],
  })
  // Opciones del filtro cuenta/contrato entregadas por BC-01, sin depender directo de Configuracion General.
  const opcionesCuentasContratos = useMemo(() => {
    const opciones = opcionesConfiguracionQuery.data ?? []
    const cuentas = opciones.filter((opcion) => opcion.tipoDatoMaestro === "CUENTA")
    const contratos = opciones.filter((opcion) => opcion.tipoDatoMaestro === "CONTRATO")
    return cuentas.map((cuenta) => ({
      cuenta,
      contratos: contratos.filter((contrato) => contrato.contratoPadreId === cuenta.id),
    }))
  }, [opcionesConfiguracionQuery.data])

  const personalQuery = usePersonalSociosDeNegocioQuery(filtrosConPaginacion)
  const exportacionExcelQuery = useExportarSociosDeNegocioQuery(
    { ...filtrosAplicados, tipo: "PERSONAL", formato: "EXCEL" },
    false,
  )
  const exportacionPdfQuery = useExportarSociosDeNegocioQuery(
    { ...filtrosAplicados, tipo: "PERSONAL", formato: "PDF" },
    false,
  )

  const personal = useMemo(
    () => (Array.isArray(personalQuery.data?.datos) ? personalQuery.data.datos : []),
    [personalQuery.data],
  )
  const metaPaginacion = personalQuery.data?.paginacion
  const cargando = personalQuery.isLoading
  const error = personalQuery.error ? obtenerMensajeError(personalQuery.error) : null

  function actualizarFiltro<K extends keyof ConsultarPersonalQuery>(
    key: K,
    value: ConsultarPersonalQuery[K] | "TODOS",
  ) {
    setFiltrosFormulario((actual) => {
      const siguiente = { ...actual }
      if (value === "TODOS" || value === "") {
        delete siguiente[key]
      } else {
        siguiente[key] = value as ConsultarPersonalQuery[K]
      }
      return limpiarFiltros(siguiente)
    })
  }

  function aplicarFiltros() {
    setPaginaActual(1)
    setFiltrosAplicados(limpiarFiltros({ ...filtrosFormulario }))
  }

  function limpiarBusqueda() {
    const base = limpiarFiltros({ ...filtrosBase })
    setPaginaActual(1)
    setFiltrosFormulario(base)
    setFiltrosAplicados(base)
  }

  async function exportar(formato: ReporteSociosDeNegocioResponse["formato"]) {
    setReporteGenerado(null)
    const resultado =
      formato === "PDF" ? await exportacionPdfQuery.refetch() : await exportacionExcelQuery.refetch()
    const reporte = resultado.data?.datos[0]
    if (reporte) {
      descargarReporte(reporte)
      setReporteGenerado(`${reporte.nombreArchivo} descargado en formato ${reporte.formato}.`)
    }
  }

  return (
    <>
      <SiteHeader
        title="Listado de personal"
        breadcrumbs={[{ title: "Socio de Negocio", href: "/socio-negocios" }, { title: "Personal" }]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <SocioNegocioPageHeader
            title="Listado de personal"
            description="Listado de personal con su asignacion vigente (cargo, sede, cuenta y contrato)."
            meta={
              metaPaginacion ? (
                <Badge variant="secondary">{metaPaginacion.total} registros</Badge>
              ) : null
            }
            actions={
              <Button asChild className="w-full sm:w-auto">
                <Link href="/socio-negocios/nuevo?tipo=PERSONAL">
                  <Plus data-icon="inline-start" />
                  Nuevo personal
                </Link>
              </Button>
            }
          />

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {reporteGenerado ? (
            <Alert>
              <AlertTitle>Reporte generado</AlertTitle>
              <AlertDescription>{reporteGenerado}</AlertDescription>
            </Alert>
          ) : null}

          {mensajeOperacion ? (
            <Alert>
              <AlertTitle>Operacion completada</AlertTitle>
              <AlertDescription>{mensajeOperacion}</AlertDescription>
            </Alert>
          ) : null}

          <section className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card text-card-foreground">
              <div className="flex flex-col gap-3 border-b border-border/40 bg-card px-4 py-4">
                <form
                  className="grid gap-3 md:grid-cols-2 xl:grid-cols-6"
                  onSubmit={(event) => {
                    event.preventDefault()
                    aplicarFiltros()
                  }}
                >
                  <Field className="md:col-span-2 xl:col-span-2">
                    <InputGroup>
                      <InputGroupAddon>
                        <Search />
                      </InputGroupAddon>
                      <InputGroupInput
                        aria-label="Buscar por apellido paterno"
                        value={obtenerValorFiltro(filtrosFormulario, "apellidoPaterno")}
                        placeholder="Buscar por apellido paterno"
                        onChange={(event) => actualizarFiltro("apellidoPaterno", event.target.value)}
                      />
                    </InputGroup>
                  </Field>
                  <Field>
                    <Input
                      aria-label="Filtrar por primer nombre"
                      value={obtenerValorFiltro(filtrosFormulario, "primerNombre")}
                      placeholder="Primer nombre"
                      onChange={(event) => actualizarFiltro("primerNombre", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <Input
                      aria-label="Filtrar por apellido materno"
                      value={obtenerValorFiltro(filtrosFormulario, "apellidoMaterno")}
                      placeholder="Apellido materno"
                      onChange={(event) => actualizarFiltro("apellidoMaterno", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <Input
                      aria-label="Filtrar por DNI"
                      value={obtenerValorFiltro(filtrosFormulario, "numeroDocumento")}
                      placeholder="DNI"
                      onChange={(event) => actualizarFiltro("numeroDocumento", event.target.value)}
                    />
                  </Field>
                  <Field>
                    <Select
                      value={filtrosFormulario.estado ?? "TODOS"}
                      onValueChange={(value) =>
                        actualizarFiltro("estado", value as ConsultarPersonalQuery["estado"] | "TODOS")
                      }
                    >
                      <SelectTrigger className="w-full" aria-label="Filtrar por estado">
                        <SelectValue placeholder="Estado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="TODOS">Estado: todos</SelectItem>
                          <SelectItem value="ACTIVO">Activo</SelectItem>
                          <SelectItem value="INACTIVO">Inactivo</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <Select
                      value={filtrosFormulario.estadoRegistro ?? "ACTIVO"}
                      onValueChange={(value) =>
                        actualizarFiltro(
                          "estadoRegistro",
                          value as ConsultarPersonalQuery["estadoRegistro"],
                        )
                      }
                    >
                      <SelectTrigger className="w-full" aria-label="Filtrar por estado de registro">
                        <SelectValue placeholder="Registro" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="ACTIVO">Vigentes</SelectItem>
                          <SelectItem value="ANULADO">Anulados</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <Select
                      value={filtrosFormulario.origen ?? "TODOS"}
                      onValueChange={(value) =>
                        actualizarFiltro("origen", value as ConsultarPersonalQuery["origen"] | "TODOS")
                      }
                    >
                      <SelectTrigger className="w-full" aria-label="Filtrar por origen">
                        <SelectValue placeholder="Origen" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="TODOS">Origen: todos</SelectItem>
                          <SelectItem value="MANUAL">Manual</SelectItem>
                          <SelectItem value="COMERCIAL">Comercial</SelectItem>
                          <SelectItem value="SAP">SAP</SelectItem>
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field className="md:col-span-2 xl:col-span-2">
                    <Select
                      value={filtrosFormulario.configuracionCodigo ?? "TODOS"}
                      onValueChange={(value) =>
                        actualizarFiltro(
                          "configuracionCodigo",
                          value as ConsultarPersonalQuery["configuracionCodigo"] | "TODOS",
                        )
                      }
                    >
                      <SelectTrigger className="w-full" aria-label="Filtrar por cuenta o contrato">
                        <SelectValue placeholder="Cuenta / contrato" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="TODOS">Cuenta/contrato: todos</SelectItem>
                        </SelectGroup>
                        {opcionesCuentasContratos.map(({ cuenta, contratos }) => (
                          <SelectGroup key={cuenta.id}>
                            <SelectLabel>
                              {cuenta.codigo} - {cuenta.nombre}
                            </SelectLabel>
                            <SelectItem value={cuenta.codigo}>
                              Cuenta: {cuenta.codigo}
                            </SelectItem>
                            {contratos.map((contrato) => (
                              <SelectItem key={contrato.id} value={contrato.codigo}>
                                ↳ {contrato.codigo} - {contrato.nombre}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <div className="flex flex-wrap gap-2 md:col-span-2 xl:col-span-2">
                    <Button type="submit" size="sm" disabled={personalQuery.isFetching}>
                      <Search data-icon="inline-start" />
                      {personalQuery.isFetching ? "Consultando..." : "Aplicar"}
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={limpiarBusqueda}>
                      Limpiar
                    </Button>
                  </div>
                </form>
                <div className="flex flex-wrap items-center gap-2 border-t border-border/40 pt-3">
                  <span className="mr-auto text-sm text-muted-foreground">
                    Exporta el resultado filtrado para reportes o revision interna.
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exportacionExcelQuery.isFetching}
                    onClick={() => void exportar("EXCEL")}
                  >
                    <Download data-icon="inline-start" />
                    {exportacionExcelQuery.isFetching ? "Descargando..." : "Excel"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={exportacionPdfQuery.isFetching}
                    onClick={() => void exportar("PDF")}
                  >
                    <Download data-icon="inline-start" />
                    {exportacionPdfQuery.isFetching ? "Descargando..." : "PDF"}
                  </Button>
                </div>
              </div>

              {cargando ? (
                <div className="flex flex-col gap-3 p-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : personal.length === 0 ? (
                <Empty className="py-12">
                  <EmptyHeader>
                    <EmptyTitle>Sin personal</EmptyTitle>
                    <EmptyDescription>
                      No existen registros para el filtro aplicado. Limpia la busqueda o registra
                      personal nuevo si corresponde.
                    </EmptyDescription>
                  </EmptyHeader>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={limpiarBusqueda}>
                      Limpiar busqueda
                    </Button>
                    <Button asChild size="sm">
                      <Link href="/socio-negocios/nuevo?tipo=PERSONAL">
                        <Plus data-icon="inline-start" />
                        Nuevo personal
                      </Link>
                    </Button>
                  </div>
                </Empty>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/40 bg-muted/30 hover:bg-muted/30">
                        <TableHead className="w-10">Acciones</TableHead>
                        <TableHead className="text-right">ID</TableHead>
                        <TableHead>Nombre completo</TableHead>
                        <TableHead>Documento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Registro</TableHead>
                        <TableHead>Aprobacion</TableHead>
                        <TableHead>Asignacion</TableHead>
                        <TableHead>Disponibilidad</TableHead>
                        <TableHead>Accion</TableHead>
                        <TableHead>Creacion</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {personal.map((empleado) => {
                        const claseContenido = obtenerClaseContenidoSocio(empleado)
                        const inactivo = empleado.estado === "INACTIVO"
                        const anulado = empleado.estadoRegistro === "ANULADO"
                        const nombre = nombreCompletoPersonal(empleado)
                        return (
                          <TableRow key={empleado.id} className={obtenerClaseFilaSocio(empleado)}>
                            <TableCell>
                              <AccionesSocio
                                socio={empleado}
                                nombre={nombre}
                                onActualizado={() => void personalQuery.refetch()}
                                onMensaje={(mensaje) => {
                                  setErrorOperacion(null)
                                  setMensajeOperacion(mensaje)
                                }}
                                onError={(err) => {
                                  setMensajeOperacion(null)
                                  setErrorOperacion(err)
                                }}
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium tabular-nums">
                              <span className={claseContenido}>{empleado.id}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex min-w-48 items-center gap-2">
                                {inactivo || anulado ? (
                                  <span
                                    className={cn(
                                      "size-2 shrink-0 rounded-full",
                                      anulado ? "bg-destructive" : "bg-destructive/60",
                                    )}
                                    aria-hidden
                                    title={anulado ? "Registro anulado" : "Personal inactivo"}
                                  />
                                ) : null}
                                <span className={cn("font-medium", claseContenido)}>{nombre}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={claseContenido}>{empleado.numeroDocumento}</span>
                            </TableCell>
                            <TableCell>
                              <span className={claseContenido}>
                                <EstadoSocioBadge estado={empleado.estado} />
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className={claseContenido}>
                                <EstadoRegistroBadge estadoRegistro={empleado.estadoRegistro} />
                              </span>
                            </TableCell>
                            <TableCell>
                              <EstadoAprobacionBadge estado={empleado.estadoAprobacion} />
                            </TableCell>
                            <TableCell>
                              <ResumenAsignacion personal={empleado} />
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-[11px]">
                                {asignacionVigente(empleado) ? "Disponible" : "-"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <AccionAsignacionPersonal personal={empleado} />
                            </TableCell>
                            <TableCell>
                              <span className={claseContenido}>
                                {formatearFecha(empleado.fechaCreacion)}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}

              {personal.length > 0 && metaPaginacion ? (
                <PaginationControls
                  meta={metaPaginacion}
                  registrosPorPagina={registrosPorPagina}
                  onPageChange={setPaginaActual}
                  onPageSizeChange={(pageSize) => {
                    setRegistrosPorPagina(pageSize)
                    setPaginaActual(1)
                  }}
                />
              ) : null}
            </div>
          </section>
        </div>
      </main>

      <AlertDialog
        open={errorOperacion !== null}
        onOpenChange={(open) => !open && setErrorOperacion(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{errorOperacion?.titulo}</AlertDialogTitle>
            <AlertDialogDescription>{errorOperacion?.descripcion}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorOperacion(null)}>Entendido</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
