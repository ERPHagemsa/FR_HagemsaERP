"use client"

import Link from "next/link"
import type { FormEvent } from "react"
import { useState } from "react"
import {
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Database,
  MapPin,
  Network,
  ShieldCheck,
} from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import { Input } from "@/compartido/componentes/ui/input"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"

import {
  CamposMaestro,
  construirPayloadRegistro,
} from "./campos-maestro"
import {
  useListarPorTipoQuery,
  useRegistrarPorTipoMutation,
} from "../servicios/configuracion-general-queries"
import type {
  ConsultarConfiguracionGeneralQuery,
  TipoDatoMaestro,
} from "../tipos/configuracion-general"

type RegistroModulo = {
  dependencia: string
  icon: typeof Database
  orden: number
  tipo: TipoDatoMaestro
}

const modulosRegistro: RegistroModulo[] = [
  {
    orden: 1,
    tipo: "UBICACION",
    icon: MapPin,
    dependencia: "Punto fisico o logistico.",
  },
  {
    orden: 2,
    tipo: "SEDE",
    icon: Building2,
    dependencia: "Centro de trabajo vinculado a una ubicacion.",
  },
  {
    orden: 3,
    tipo: "AREA",
    icon: Network,
    dependencia: "Gerencia o area dentro de una sede.",
  },
  {
    orden: 4,
    tipo: "ALMACEN",
    icon: Building2,
    dependencia: "Almacen vinculado a ubicacion y sede.",
  },
  {
    orden: 5,
    tipo: "REGIMEN",
    icon: CalendarClock,
    dependencia: "Regimen de trabajo y descanso.",
  },
  {
    orden: 6,
    tipo: "CUENTA",
    icon: BriefcaseBusiness,
    dependencia: "Cuenta comercial.",
  },
  {
    orden: 7,
    tipo: "CONTRATO",
    icon: ClipboardList,
    dependencia: "Contrato asociado opcionalmente a una cuenta.",
  },
  {
    orden: 8,
    tipo: "CARGO",
    icon: ShieldCheck,
    dependencia: "Puesto de trabajo y a quien reporta.",
  },
]

const rutasRegistroConfiguracion: Record<TipoDatoMaestro, string> = {
  UBICACION: "ubicacion",
  SEDE: "sede",
  AREA: "area",
  ALMACEN: "almacen",
  REGIMEN: "regimen",
  CUENTA: "cuenta",
  CONTRATO: "contrato",
  CARGO: "cargo",
}

// Ruta de la pantalla (seccion) de cada tipo, para volver tras crear/cancelar.
const rutaListadoPorTipo: Record<TipoDatoMaestro, string> = {
  UBICACION: "/configuracion/ubicaciones",
  SEDE: "/configuracion/sedes-areas",
  AREA: "/configuracion/sedes-areas",
  ALMACEN: "/configuracion/almacenes",
  REGIMEN: "/configuracion/regimenes",
  CUENTA: "/configuracion/cuentas-contratos",
  CONTRATO: "/configuracion/cuentas-contratos",
  CARGO: "/configuracion/cargos",
}

const detalleFormularioMaestro: Record<
  TipoDatoMaestro,
  {
    alcance: string
    descripcion: string
    seccion: string
    titulo: string
  }
> = {
  UBICACION: {
    titulo: "Configurar ubicacion",
    descripcion: "Registra un punto fisico o logistico para usarlo luego en sedes.",
    alcance: "Base fisica",
    seccion: "Direccion y referencia",
  },
  SEDE: {
    titulo: "Configurar sede",
    descripcion: "Crea una sede de trabajo y enlazala con una ubicacion existente.",
    alcance: "Organizacion",
    seccion: "Ubicacion de la sede",
  },
  AREA: {
    titulo: "Configurar area",
    descripcion: "Define una gerencia o un area dentro de una sede.",
    alcance: "Organizacion",
    seccion: "Sede y gerencia",
  },
  ALMACEN: {
    titulo: "Configurar almacen",
    descripcion: "Registra un almacen fisico o temporal vinculado a ubicacion y sede.",
    alcance: "Logistica",
    seccion: "Ubicacion y sede",
  },
  REGIMEN: {
    titulo: "Configurar regimen",
    descripcion: "Define dias de trabajo, descanso y horas por dia.",
    alcance: "Operaciones",
    seccion: "Patron de trabajo",
  },
  CUENTA: {
    titulo: "Configurar cuenta",
    descripcion: "Crea una cuenta comercial.",
    alcance: "Comercial",
    seccion: "Datos de la cuenta",
  },
  CONTRATO: {
    titulo: "Configurar contrato",
    descripcion: "Registra un contrato e indica la cuenta o contrato del que depende.",
    alcance: "Comercial",
    seccion: "Cuenta o contrato principal",
  },
  CARGO: {
    titulo: "Configurar cargo",
    descripcion: "Registra un puesto de trabajo e indica a quien reporta si aplica.",
    alcance: "Cargos",
    seccion: "A quien reporta",
  },
}

function etiquetaTipo(tipo: TipoDatoMaestro) {
  return tipo.charAt(0) + tipo.slice(1).toLowerCase()
}

function rutaRegistroConfiguracion(tipo: TipoDatoMaestro) {
  return `/configuracion/nuevo/${rutasRegistroConfiguracion[tipo]}`
}

function obtenerTipoDesdeRuta(slug?: string | string[]) {
  const valor = Array.isArray(slug) ? slug[0] : slug
  const tipo = Object.entries(rutasRegistroConfiguracion).find(([, ruta]) => ruta === valor)?.[0]

  return tipo as TipoDatoMaestro | undefined
}

function obtenerModulo(tipo: TipoDatoMaestro) {
  return modulosRegistro.find((modulo) => modulo.tipo === tipo) ?? modulosRegistro[0]
}

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operacion."
}

function ejemplosFormulario(tipo: TipoDatoMaestro) {
  const ejemplos = {
    CARGO: {
      nombre: "Conductor",
      descripcion: "Cargo operativo de transporte.",
    },
    UBICACION: {
      nombre: "Base Lima",
      descripcion: "Ubicacion operativa principal.",
    },
    SEDE: {
      nombre: "Sede Lima",
      descripcion: "Sede administrativa Lima.",
    },
    AREA: {
      nombre: "Gerencia de Operaciones",
      descripcion: "Area responsable de operaciones.",
    },
    ALMACEN: {
      nombre: "Almacen Central",
      descripcion: "Almacen principal de operaciones.",
    },
    REGIMEN: {
      nombre: "14x7",
      descripcion: "14 dias trabajo y 7 descanso.",
    },
    CUENTA: {
      nombre: "Cuenta Antamina",
      descripcion: "Cuenta comercial minera.",
    },
    CONTRATO: {
      nombre: "Contrato Transporte 2026",
      descripcion: "Contrato anual de transporte.",
    },
  } satisfies Record<TipoDatoMaestro, Record<"nombre" | "descripcion", string>>

  return ejemplos[tipo]
}

// Mismas secciones que el menu/listado: sedes y areas juntas, cuentas y
// contratos juntas. La navegacion del registro las refleja para mantener una
// estructura coherente con el resto de Configuracion General.
const seccionesRegistro: Array<{ titulo: string; tipos: TipoDatoMaestro[] }> = [
  { titulo: "Ubicaciones", tipos: ["UBICACION"] },
  { titulo: "Sedes y areas", tipos: ["SEDE", "AREA"] },
  { titulo: "Logistica", tipos: ["ALMACEN"] },
  { titulo: "Regimenes", tipos: ["REGIMEN"] },
  { titulo: "Cuentas y contratos", tipos: ["CUENTA", "CONTRATO"] },
  { titulo: "Cargos", tipos: ["CARGO"] },
]

function NavegacionRegistroConfiguracion({ tipoActivo }: { tipoActivo: TipoDatoMaestro }) {
  return (
    <section className="rounded-lg border border-border bg-card p-3 shadow-sm">
      <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Que quieres registrar
      </p>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {seccionesRegistro.map((seccion) => (
          <div
            key={seccion.titulo}
            className="rounded-md border border-border/70 bg-background p-2"
          >
            <p className="mb-1.5 px-1 text-xs font-medium text-muted-foreground">
              {seccion.titulo}
            </p>
            <div className="flex flex-wrap gap-2">
              {seccion.tipos.map((tipo) => {
                const activo = tipo === tipoActivo
                const Icon = modulosRegistro.find((modulo) => modulo.tipo === tipo)?.icon ?? MapPin

                return (
                  <Button
                    key={tipo}
                    asChild
                    variant={activo ? "default" : "outline"}
                    size="sm"
                  >
                    <Link href={rutaRegistroConfiguracion(tipo)}>
                      <Icon data-icon="inline-start" />
                      {etiquetaTipo(tipo)}
                    </Link>
                  </Button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function ConfiguracionGeneralRegistroRutaVista({ slug }: { slug?: string | string[] }) {
  const tipo = obtenerTipoDesdeRuta(slug)

  if (!tipo) {
    return <ConfiguracionGeneralRegistroVista tipoInicial="UBICACION" />
  }

  return <ConfiguracionGeneralRegistroVista tipoInicial={tipo} />
}

export function ConfiguracionGeneralRegistroVista({ tipoInicial }: { tipoInicial: TipoDatoMaestro }) {
  const { usuario } = useSesion()
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const tipoNuevo = tipoInicial
  const detalleFormulario = detalleFormularioMaestro[tipoNuevo]
  const moduloFormulario = obtenerModulo(tipoNuevo)
  const IconoFormulario = moduloFormulario.icon
  const formId = `agregar-configuracion-${rutasRegistroConfiguracion[tipoNuevo]}`
  const [nombreNuevo, setNombreNuevo] = useState("")
  const ejemplos = ejemplosFormulario(tipoNuevo)
  const tieneNodoPadre = ["SEDE", "AREA", "ALMACEN", "CONTRATO", "CARGO"].includes(tipoNuevo)

  const queryCatalogo: ConsultarConfiguracionGeneralQuery = {
    estado: "ACTIVO",
    estadoRegistro: "ACTIVO",
    page: 1,
    pageSize: 100,
    sortBy: "nombre",
    sortOrder: "asc",
  }
  // Cargamos solo los catalogos que el tipo en curso necesita como dependencia.
  const ubicacionesQuery = useListarPorTipoQuery(
    "UBICACION",
    queryCatalogo,
    tipoNuevo === "SEDE" || tipoNuevo === "ALMACEN",
  )
  const cargosQuery = useListarPorTipoQuery("CARGO", queryCatalogo, tipoNuevo === "CARGO")
  const sedesQuery = useListarPorTipoQuery(
    "SEDE",
    queryCatalogo,
    tipoNuevo === "AREA" || tipoNuevo === "ALMACEN",
  )
  const areasQuery = useListarPorTipoQuery(
    "AREA",
    queryCatalogo,
    tipoNuevo === "AREA" || tipoNuevo === "CARGO",
  )
  const cuentasQuery = useListarPorTipoQuery("CUENTA", queryCatalogo, tipoNuevo === "CONTRATO")
  const contratosQuery = useListarPorTipoQuery("CONTRATO", queryCatalogo, tipoNuevo === "CONTRATO")
  const registrarMutation = useRegistrarPorTipoMutation(tipoNuevo)
  const ubicaciones = ubicacionesQuery.data?.datos ?? []
  const cargos = cargosQuery.data?.datos ?? []
  const sedes = sedesQuery.data?.datos ?? []
  const areas = areasQuery.data?.datos ?? []
  const cuentas = cuentasQuery.data?.datos ?? []
  const contratos = contratosQuery.data?.datos ?? []
  const bloqueoDependencia =
    tipoNuevo === "SEDE" && ubicaciones.length === 0
      ? {
          mensaje: "Primero registra una ubicacion para crear una sede.",
          accion: "Registrar ubicacion",
          tipoDestino: "UBICACION" as TipoDatoMaestro,
        }
        : tipoNuevo === "AREA" && sedes.length === 0
        ? {
            mensaje: "Primero registra una sede para crear areas.",
            accion: "Registrar sede",
            tipoDestino: "SEDE" as TipoDatoMaestro,
          }
        : tipoNuevo === "ALMACEN" && (ubicaciones.length === 0 || sedes.length === 0)
          ? {
              mensaje: "Primero registra una ubicacion y una sede para crear almacenes.",
              accion: ubicaciones.length === 0 ? "Registrar ubicacion" : "Registrar sede",
              tipoDestino: ubicaciones.length === 0 ? "UBICACION" as TipoDatoMaestro : "SEDE" as TipoDatoMaestro,
            }
          : tipoNuevo === "CONTRATO" && cuentas.length === 0 && contratos.length === 0
          ? {
              mensaje: "Primero registra una cuenta o contrato principal para crear contratos.",
              accion: "Registrar cuenta",
              tipoDestino: "CUENTA" as TipoDatoMaestro,
            }
        : null

  async function registrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMensaje(null)
    setError(null)

    const form = event.currentTarget
    const formData = new FormData(form)
    const ubicacionId = String(formData.get("ubicacionId") ?? "").trim()
    const sedeId = String(formData.get("sedeId") ?? "").trim()
    const areaId = String(formData.get("areaId") ?? "").trim()
    const contratoPadreId = String(formData.get("contratoPadreId") ?? "").trim()
    const pais = String(formData.get("pais") ?? "").trim()

    if (tipoNuevo === "AREA" && !sedeId) {
      setError("Selecciona la sede a la que pertenece el area.")
      return
    }

    if (tipoNuevo === "CARGO" && !areaId) {
      setError("Selecciona el area a la que pertenece el cargo.")
      return
    }

    if (tipoNuevo === "UBICACION" && (!pais || !nombreNuevo.trim())) {
      setError("Completa el nombre y pais de la ubicacion.")
      return
    }

    if (tipoNuevo === "CONTRATO" && !contratoPadreId) {
      setError("Selecciona la cuenta o contrato principal.")
      return
    }

    if (tipoNuevo === "SEDE" && !ubicacionId) {
      setError("Selecciona la ubicacion de la sede.")
      return
    }

    if (tipoNuevo === "ALMACEN" && (!ubicacionId || !sedeId)) {
      setError("Selecciona la ubicacion y sede del almacen.")
      return
    }

    try {
      const creado = await registrarMutation.mutateAsync(
        construirPayloadRegistro(tipoNuevo, formData, {
          nombre: nombreNuevo.trim(),
          descripcion: String(formData.get("descripcion") ?? "").trim() || null,
          usuarioCreacion: usuario?.email ?? "admin",
        }),
      )
      form.reset()
      setNombreNuevo("")
      setMensaje(
        `${etiquetaTipo(tipoNuevo)} "${creado.nombre || nombreNuevo.trim()}" fue registrado correctamente.`,
      )
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <>
      <SiteHeader
        title="Nueva configuracion"
        breadcrumbs={[
          { title: "CS-Configuracion General", href: "/configuracion" },
          { title: "Nueva configuracion", href: "/configuracion/nuevo/ubicacion" },
          { title: etiquetaTipo(tipoNuevo) },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold tracking-normal">Registrar configuracion</h1>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button asChild variant="outline" className="sm:w-auto">
                <Link href={rutaListadoPorTipo[tipoNuevo]}>Cancelar</Link>
              </Button>
              <Button
                type="submit"
                form={formId}
                className="sm:w-auto"
                disabled={registrarMutation.isPending || Boolean(bloqueoDependencia)}
              >
                <CheckCircle2 data-icon="inline-start" />
                {registrarMutation.isPending ? "Agregando..." : "Agregar configuracion"}
              </Button>
            </div>
          </section>

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

          <NavegacionRegistroConfiguracion tipoActivo={tipoNuevo} />

          {bloqueoDependencia ? (
            <Alert>
              <AlertTitle>Falta una configuracion previa</AlertTitle>
              <AlertDescription className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <span>{bloqueoDependencia.mensaje}</span>
                <Button asChild size="sm" variant="outline">
                  <Link href={rutaRegistroConfiguracion(bloqueoDependencia.tipoDestino)}>
                    {bloqueoDependencia.accion}
                  </Link>
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          <form
            id={formId}
            className="w-full min-w-0 overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm"
            onSubmit={(event) => void registrar(event)}
          >
            <div className="border-b border-border px-5 py-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                    <IconoFormulario />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold leading-7">{detalleFormulario.titulo}</h2>
                      <Badge variant="secondary">{detalleFormulario.alcance}</Badge>
                    </div>
                    <p className="mt-1 max-w-3xl text-sm leading-5 text-muted-foreground">
                      {detalleFormulario.descripcion}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="w-fit rounded-full">
                  Activo al guardar
                </Badge>
              </div>
            </div>

            <div className="flex w-full flex-col p-5 md:p-8">
              {tieneNodoPadre ? (
                <>
                  <Card size="sm">
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Donde se ubica</Badge>
                        <CardTitle>Selecciona a que pertenece</CardTitle>
                      </div>
                      <CardDescription>{detalleFormulario.seccion}</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2">
                      <CamposMaestro
                        tipo={tipoNuevo}
                        catalogos={{ areas, cargos, contratos, cuentas, sedes, ubicaciones }}
                        seccion="relacion"
                      />
                    </CardContent>
                    <CardFooter className="border-t">
                      <Badge variant="secondary">
                        {tipoNuevo === "CARGO"
                          ? "Puede ser raiz"
                          : "Relacion requerida"}
                      </Badge>
                    </CardFooter>
                  </Card>

                  <div className="ml-8 h-10 border-l-2 border-primary md:ml-14" />
                </>
              ) : null}

              <div className={tieneNodoPadre ? "relative ml-8 md:ml-14" : "relative"}>
                {tieneNodoPadre ? (
                  <span className="absolute -left-8 top-0 h-8 w-8 rounded-bl-lg border-b-2 border-l-2 border-primary md:-left-14 md:w-14" />
                ) : null}
                <Card className="ring-2 ring-primary" size="sm">
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge>Nuevo registro</Badge>
                      <CardTitle>
                        {nombreNuevo.trim() || `Nuevo ${etiquetaTipo(tipoNuevo).toLowerCase()}`}
                      </CardTitle>
                    </div>
                    <CardDescription>Codigo generado automaticamente</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-2 md:col-span-2">
                      <label className="text-sm font-medium" htmlFor="nombre">Nombre</label>
                      <Input
                        id="nombre"
                        name="nombre"
                        value={nombreNuevo}
                        placeholder={ejemplos.nombre}
                        onChange={(event) => setNombreNuevo(event.target.value)}
                        required
                      />
                    </div>
                    <div className="grid gap-2 md:col-span-2">
                      <label className="text-sm font-medium" htmlFor="descripcion">Descripcion</label>
                      <Textarea
                        id="descripcion"
                        name="descripcion"
                        placeholder={ejemplos.descripcion}
                      />
                    </div>
                    <CamposMaestro
                      tipo={tipoNuevo}
                      catalogos={{ areas, cargos, contratos, cuentas, sedes, ubicaciones }}
                      seccion="detalle"
                    />
                  </CardContent>
                  <CardFooter className="flex flex-wrap gap-2 border-t">
                    <Badge variant="outline">Estado activo</Badge>
                    <Badge variant="outline">Codigo automatico</Badge>
                  </CardFooter>
                </Card>
              </div>
            </div>

          </form>
        </div>
      </main>
    </>
  )
}
