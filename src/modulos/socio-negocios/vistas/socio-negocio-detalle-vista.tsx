"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { SiteHeader } from "@/compartido/componentes/site-header"
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
  Field,
  FieldDescription,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { cn } from "@/compartido/utilidades/utils"
import {
  ArchiveRestore,
  ArchiveX,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarRange,
  CheckCircle2,
  CircleX,
  GitBranch,
  Pencil,
  TrendingUp,
} from "lucide-react"

import {
  useAprobarSocioDeNegocioMutation,
  useDarDeBajaSocioDeNegocioMutation,
  useModificarSocioDeNegocioMutation,
  useReactivarSocioDeNegocioMutation,
  useReemplazarSocioDeNegocioMutation,
  useSocioDeNegocioQuery,
} from "../servicios/socio-negocios-queries"
import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import { EstadoSincronizacionSapBadge } from "../componentes/estado-sincronizacion-sap-badge"
import { DatoVer } from "../componentes/socio-negocio-detalle-dato"
import { SocioNegocioDetalleCliente } from "../componentes/socio-negocio-detalle-cliente"
import { SocioNegocioDetalleProveedor } from "../componentes/socio-negocio-detalle-proveedor"
import { SocioNegocioDetallePersonal } from "../componentes/socio-negocio-detalle-personal"
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"
import {
  puedeGestionarAsignacionesPersonal,
  puedeResolverAprobacionSocio,
} from "../tipos/socio-negocio"
import type {
  ModificarSocioDeNegocioRequest,
  ReemplazarSocioDeNegocioRequest,
  SocioDeNegocioResponse,
  TipoSocioDeNegocio,
} from "../tipos/socio-negocio"

function obtenerMensajeError(error: unknown) {
  if (error instanceof Error) return error.message
  return "No se pudo completar la operacion."
}

function obtenerTextoFormulario(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

function obtenerTipoDesdeUrl(tipo: string | null): TipoSocioDeNegocio | undefined {
  if (tipo === "CLIENTE" || tipo === "PROVEEDOR" || tipo === "PERSONAL") {
    return tipo
  }

  return undefined
}

function obtenerNombreSocio(socio: SocioDeNegocioResponse) {
  if (socio.tipo === "PERSONAL") {
    return (
      socio.nombreCompleto ||
      [socio.primerNombre, socio.segundoNombre, socio.apellidoPaterno, socio.apellidoMaterno]
        .filter(Boolean)
        .join(" ") ||
      socio.numeroDocumento
    )
  }

  return socio.razonSocial || socio.nombreComercial || socio.numeroDocumento
}

function conservarSoloDigitos(event: FormEvent<HTMLInputElement>, maxLength: number) {
  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, maxLength)
}

function EstadoResumen({ socio }: { socio: SocioDeNegocioResponse }) {
  const aplicaSap = socio.tipo !== "PERSONAL"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <span
          className={cn(
            "size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400",
            socio.estado === "INACTIVO" && "bg-destructive",
          )}
        />
        {socio.estado}
      </span>
      <span className="text-sm text-muted-foreground">·</span>
      <span className="text-sm text-muted-foreground">{socio.tipo}</span>
      <Badge
        variant={socio.estadoRegistro === "ANULADO" ? "destructive" : "outline"}
        className="h-6 rounded-full px-2.5 text-[12px] font-medium shadow-xs"
      >
        {socio.estadoRegistro}
      </Badge>
      <Badge
        variant="outline"
        className="h-6 rounded-full px-2.5 text-[12px] font-medium shadow-xs"
      >
        {socio.estadoAprobacion === "APROBADO"
          ? "Aprobado"
          : socio.estadoAprobacion === "PENDIENTE_APROBACION"
            ? "Pendiente"
            : "No aprobado"}
      </Badge>
      {aplicaSap && socio.estadoSincronizacionSap ? (
        <EstadoSincronizacionSapBadge
          estado={socio.estadoSincronizacionSap}
          ultimoError={socio.ultimoErrorSincronizacionSap}
        />
      ) : null}
      <Badge variant="outline">{socio.origen}</Badge>
    </div>
  )
}

export function SocioNegocioDetalleVista({ id }: { id: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tipoDetalle = obtenerTipoDesdeUrl(searchParams.get("tipo"))
  const socioQuery = useSocioDeNegocioQuery(id, tipoDetalle)
  const socio = socioQuery.data
  const { usuario } = useSesion()
  const usuarioId = usuario?.nombreUsuario ?? ""

  // Al volver, regresamos a la lista del tipo que se esta viendo (personal,
  // clientes o proveedores). Si aun no se conoce el tipo, cae al listado general.
  const tipoEfectivo = socio?.tipo ?? tipoDetalle
  const listado =
    tipoEfectivo === "PERSONAL"
      ? { href: "/socio-negocios/personal", titulo: "Personal" }
      : tipoEfectivo === "CLIENTE"
        ? { href: "/socio-negocios/clientes", titulo: "Clientes" }
        : tipoEfectivo === "PROVEEDOR"
          ? { href: "/socio-negocios/proveedores", titulo: "Proveedores" }
          : { href: "/socio-negocios/listar", titulo: "Listar" }
  const [motivo, setMotivo] = useState("")
  const [dialogoEstadoAbierto, setDialogoEstadoAbierto] = useState(false)
  const [accionEstado, setAccionEstado] = useState<"baja" | "anular" | null>(null)
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bajaMutation = useDarDeBajaSocioDeNegocioMutation(id, {
    onSuccess: () => {
      void socioQuery.refetch()
    },
  })
  const modificarMutation = useModificarSocioDeNegocioMutation(id, {
    onSuccess: () => {
      void socioQuery.refetch()
    },
  })
  const reemplazarMutation = useReemplazarSocioDeNegocioMutation(id)
  const reactivarMutation = useReactivarSocioDeNegocioMutation(id)
  const aprobarMutation = useAprobarSocioDeNegocioMutation(id, {
    onSuccess: () => void socioQuery.refetch(),
  })
  const puedeDarBaja =
    socio?.estado === "ACTIVO" && socio.estadoRegistro === "ACTIVO"
  // Aprobar solo mientras el socio esta pendiente de aprobacion.
  const puedeResolverAprobacion = socio
    ? puedeResolverAprobacionSocio(socio)
    : false
  // Gestionar asignaciones solo cuando el personal ya esta APROBADO. Mientras
  // este pendiente, en su lugar se ofrece Aprobar aqui mismo (no hay que entrar
  // a otra ventana para aprobar).
  const puedeGestionarAsignaciones = socio
    ? puedeGestionarAsignacionesPersonal(socio) &&
      socio.estadoAprobacion === "APROBADO"
    : false
  const registroAnulado = socio?.estadoRegistro === "ANULADO"
  const modoEdicion =
    searchParams.get("modo") === "editar" && socio?.estadoRegistro !== "ANULADO"
  const modoReemplazo =
    searchParams.get("modo") === "reemplazar" && socio?.estadoRegistro !== "ANULADO"
  const formEditarId = `editar-socio-${id}`
  const formReemplazoId = `reemplazar-socio-${id}`

  function abrirDialogoEstado(accion: "baja" | "anular") {
    setAccionEstado(accion)
    setMotivo("")
    setDialogoEstadoAbierto(true)
  }

  async function ejecutarCambioEstado() {
    if (!motivo.trim() || !socio) return

    try {
      setError(null)
      setMensaje(null)
      await bajaMutation.mutateAsync({
        motivo: motivo.trim(),
        usuarioId,
        estadoRegistro: accionEstado === "anular" ? "ANULADO" : "ACTIVO",
      })
      setMensaje(
        accionEstado === "anular"
          ? `${obtenerNombreSocio(socio)} fue anulado.`
          : `${obtenerNombreSocio(socio)} fue dado de baja.`,
      )
      setMotivo("")
      setDialogoEstadoAbierto(false)
      setAccionEstado(null)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  async function reactivar() {
    if (!socio) return
    try {
      setError(null)
      const nuevo = await reactivarMutation.mutateAsync({ usuarioId })
      router.push(`/socio-negocios/${nuevo.id}`)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  async function aprobar() {
    if (!socio) return
    try {
      setError(null)
      setMensaje(null)
      await aprobarMutation.mutateAsync({ usuarioId })
      setMensaje(`${obtenerNombreSocio(socio)} fue aprobado.`)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  async function guardarCambios(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!socio) return

    const formData = new FormData(event.currentTarget)
    const payload: ModificarSocioDeNegocioRequest = {
      razonSocial: obtenerTextoFormulario(formData, "razonSocial"),
      nombreComercial: obtenerTextoFormulario(formData, "nombreComercial"),
      direccion: obtenerTextoFormulario(formData, "direccion"),
      contacto: obtenerTextoFormulario(formData, "contacto"),
      correo: obtenerTextoFormulario(formData, "correo"),
      numeroCelular: obtenerTextoFormulario(formData, "numeroCelular"),
      usuarioId,
    }

    try {
      setError(null)
      setMensaje(null)
      await modificarMutation.mutateAsync(payload)
      setMensaje(`${obtenerNombreSocio(socio)} fue editado.`)
      router.replace(`/socio-negocios/${id}?tipo=${socio.tipo}`)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  async function reemplazar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!socio) return

    const formData = new FormData(event.currentTarget)
    const payload: ReemplazarSocioDeNegocioRequest = {
      tipo: socio.tipo,
      numeroDocumento: obtenerTextoFormulario(formData, "numeroDocumento"),
      razonSocial: obtenerTextoFormulario(formData, "razonSocial"),
      nombreComercial: obtenerTextoFormulario(formData, "nombreComercial"),
      direccion: obtenerTextoFormulario(formData, "direccion"),
      contacto: obtenerTextoFormulario(formData, "contacto"),
      correo: obtenerTextoFormulario(formData, "correo"),
      numeroCelular: obtenerTextoFormulario(formData, "numeroCelular"),
      usuarioId,
      motivo: obtenerTextoFormulario(formData, "motivo"),
    }

    try {
      setError(null)
      setMensaje(null)
      const nuevo = await reemplazarMutation.mutateAsync(payload)
      router.push(`/socio-negocios/${nuevo.id}?tipo=${nuevo.tipo}`)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  return (
    <>
      <SiteHeader
        title="Ver socio de negocio"
        breadcrumbs={[
          { title: "Socio de Negocio", href: "/socio-negocios" },
          { title: listado.titulo, href: listado.href },
          { title: "Ver" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-5">
          {socioQuery.isLoading ? (
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-lg" />
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <div className="rounded-lg border p-5">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="mt-3 h-5 w-3/4" />
                <Skeleton className="mt-3 h-5 w-1/2" />
              </div>
            </div>
          ) : null}

          {socioQuery.error ? (
            <Alert variant="destructive">
              <AlertTitle>Error de API</AlertTitle>
              <AlertDescription>{obtenerMensajeError(socioQuery.error)}</AlertDescription>
            </Alert>
          ) : null}

          {mensaje ? (
            <Alert>
              <AlertTitle>Operacion completada</AlertTitle>
              <AlertDescription>{mensaje}</AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo completar la accion</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {socio ? (
            <>
              <SocioNegocioPageHeader
                title={
                  <span
                    className={cn(
                      socio.estadoRegistro === "ANULADO" &&
                        "text-muted-foreground line-through",
                    )}
                  >
                    {obtenerNombreSocio(socio)}
                  </span>
                }
                description={
                  socio.tipo === "PERSONAL"
                    ? `Documento ${socio.numeroDocumento}`
                    : `${socio.codigoInternoSap || "Sin codigo SAP"} · Documento ${socio.numeroDocumento}`
                }
                meta={<EstadoResumen socio={socio} />}
                actions={
                  <>
                    {modoEdicion ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => router.replace(`/socio-negocios/${id}?tipo=${socio.tipo}`)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          form={formEditarId}
                          size="sm"
                          disabled={modificarMutation.isPending}
                        >
                          {modificarMutation.isPending ? "Guardando..." : "Guardar cambios"}
                        </Button>
                      </>
                    ) : modoReemplazo ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => router.replace(`/socio-negocios/${id}?tipo=${socio.tipo}`)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          form={formReemplazoId}
                          size="sm"
                          disabled={reemplazarMutation.isPending}
                        >
                          {reemplazarMutation.isPending ? "Reemplazando..." : "Reemplazar registro"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button asChild variant="outline" size="sm">
                          <Link href={listado.href}>
                            <ArrowLeft data-icon="inline-start" />
                            Volver al listado
                          </Link>
                        </Button>
                        {!registroAnulado ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/socio-negocios/${id}?tipo=${socio.tipo}&modo=editar`}>
                              <Pencil data-icon="inline-start" />
                              Editar datos
                            </Link>
                          </Button>
                        ) : null}
                        {puedeGestionarAsignaciones ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/socio-negocios/${id}/asignaciones`}>
                              <BriefcaseBusiness data-icon="inline-start" />
                              Gestionar asignaciones
                            </Link>
                          </Button>
                        ) : null}
                        {puedeGestionarAsignaciones ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/socio-negocios/${id}/disponibilidad`}>
                              <CalendarRange data-icon="inline-start" />
                              Disponibilidad
                            </Link>
                          </Button>
                        ) : null}
                        {puedeResolverAprobacion ? (
                          <Button
                            size="sm"
                            disabled={aprobarMutation.isPending}
                            onClick={() => void aprobar()}
                          >
                            <CheckCircle2 data-icon="inline-start" />
                            Aprobar
                          </Button>
                        ) : null}
                        {!registroAnulado ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={bajaMutation.isPending}
                            onClick={() => abrirDialogoEstado("anular")}
                          >
                            <CircleX data-icon="inline-start" />
                            Anular
                          </Button>
                        ) : null}
                        {socio.estado === "INACTIVO" && socio.estadoRegistro === "ACTIVO" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={reactivarMutation.isPending}
                            onClick={() => void reactivar()}
                          >
                            <ArchiveRestore data-icon="inline-start" />
                            Reactivar
                          </Button>
                        ) : null}
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/socio-negocios/historial/${id}`}>
                            <TrendingUp data-icon="inline-start" />
                            Auditar
                          </Link>
                        </Button>
                        {socio.tipo === "PERSONAL" ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/socio-negocios/${id}/linea-historica`}>
                              <GitBranch data-icon="inline-start" />
                              Línea histórica
                            </Link>
                          </Button>
                        ) : null}
                        {!registroAnulado ? (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={!puedeDarBaja || bajaMutation.isPending}
                            onClick={() => abrirDialogoEstado("baja")}
                          >
                            <ArchiveX data-icon="inline-start" />
                            Dar de baja
                          </Button>
                        ) : null}
                      </>
                    )}
                  </>
                }
              />

              {modoEdicion ? (
                <form
                  id={formEditarId}
                  className="grid gap-5"
                  onSubmit={(event) => void guardarCambios(event)}
                >
                  <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
                    <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
                    <h2 className="text-base font-semibold">Datos que no se modifican</h2>
                    </div>
                    <div className="grid gap-3 px-5 py-5 text-sm md:grid-cols-3">
                      <DatoVer label="Tipo" value={socio.tipo} />
                      <DatoVer label="Documento" value={socio.numeroDocumento} />
                      {socio.tipo !== "PERSONAL" ? (
                        <DatoVer label="Codigo SAP" value={socio.codigoInternoSap || "-"} />
                      ) : null}
                    </div>
                  </section>

                  <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
                    <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
                      <h2 className="text-base font-semibold">Editar datos del socio</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Actualiza nombres, direccion y contacto. El documento y el ID no cambiaran.
                      </p>
                    </div>
                    <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
                    <Field className="md:col-span-2">
                      <FieldLabel htmlFor={`razonSocial-${id}`}>
                        {socio.tipo === "PERSONAL" ? "Nombre completo" : "Razon social"}
                      </FieldLabel>
                      <Input
                        id={`razonSocial-${id}`}
                        name="razonSocial"
                        defaultValue={obtenerNombreSocio(socio)}
                        required
                      />
                    </Field>
                    <Field className="md:col-span-2">
                      <FieldLabel htmlFor={`nombreComercial-${id}`}>
                        {socio.tipo === "PERSONAL" ? "Nombre para mostrar" : "Nombre comercial"}
                      </FieldLabel>
                      <Input
                        id={`nombreComercial-${id}`}
                        name="nombreComercial"
                        defaultValue={socio.nombreComercial || obtenerNombreSocio(socio)}
                        required
                      />
                    </Field>
                    <Field className="md:col-span-2">
                      <FieldLabel htmlFor={`direccion-${id}`}>Direccion</FieldLabel>
                      <Input
                        id={`direccion-${id}`}
                        name="direccion"
                        defaultValue={socio.direccion}
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`contacto-${id}`}>Contacto</FieldLabel>
                      <Input
                        id={`contacto-${id}`}
                        name="contacto"
                        defaultValue={socio.contacto}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`correo-${id}`}>Correo</FieldLabel>
                      <Input
                        id={`correo-${id}`}
                        name="correo"
                        type="email"
                        defaultValue={socio.correo}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor={`numeroCelular-${id}`}>Celular</FieldLabel>
                      <Input
                        id={`numeroCelular-${id}`}
                        name="numeroCelular"
                        defaultValue={socio.numeroCelular}
                        inputMode="numeric"
                        maxLength={9}
                        minLength={9}
                        pattern="[0-9]{9}"
                        title="Ingresa un celular de 9 digitos."
                        onInput={(event) => conservarSoloDigitos(event, 9)}
                      />
                      <FieldDescription>Solo numeros. Debe tener 9 digitos.</FieldDescription>
                    </Field>
                    </div>
                  </section>
                </form>
              ) : modoReemplazo ? (
                <form
                  id={formReemplazoId}
                  className="grid gap-5"
                  onSubmit={(event) => void reemplazar(event)}
                >
                  <Alert>
                    <AlertTitle>Reemplazo de registro</AlertTitle>
                    <AlertDescription>
                      El reemplazo anula este registro y crea uno nuevo corregido enlazado al
                      anterior. Verifica los datos antes de confirmar.
                    </AlertDescription>
                  </Alert>

                  <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
                    <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
                      <h2 className="text-base font-semibold">Datos del nuevo registro</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Corrige cualquier dato, incluido el documento. El tipo ({socio.tipo}) se
                        conserva.
                      </p>
                    </div>
                    <div className="grid gap-4 px-5 py-5 md:grid-cols-2">
                      <Field>
                        <FieldLabel htmlFor={`numeroDocumento-${id}`}>Documento</FieldLabel>
                        <Input
                          id={`numeroDocumento-${id}`}
                          name="numeroDocumento"
                          defaultValue={socio.numeroDocumento}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`reemplazo-razonSocial-${id}`}>
                          {socio.tipo === "PERSONAL" ? "Nombre completo" : "Razon social"}
                        </FieldLabel>
                        <Input
                          id={`reemplazo-razonSocial-${id}`}
                          name="razonSocial"
                          defaultValue={obtenerNombreSocio(socio)}
                          required
                        />
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor={`reemplazo-nombreComercial-${id}`}>
                          {socio.tipo === "PERSONAL" ? "Nombre para mostrar" : "Nombre comercial"}
                        </FieldLabel>
                        <Input
                          id={`reemplazo-nombreComercial-${id}`}
                          name="nombreComercial"
                          defaultValue={socio.nombreComercial || obtenerNombreSocio(socio)}
                          required
                        />
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor={`reemplazo-direccion-${id}`}>Direccion</FieldLabel>
                        <Input
                          id={`reemplazo-direccion-${id}`}
                          name="direccion"
                          defaultValue={socio.direccion}
                          required
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`reemplazo-contacto-${id}`}>Contacto</FieldLabel>
                        <Input
                          id={`reemplazo-contacto-${id}`}
                          name="contacto"
                          defaultValue={socio.contacto}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`reemplazo-correo-${id}`}>Correo</FieldLabel>
                        <Input
                          id={`reemplazo-correo-${id}`}
                          name="correo"
                          type="email"
                          defaultValue={socio.correo}
                        />
                      </Field>
                      <Field>
                        <FieldLabel htmlFor={`reemplazo-numeroCelular-${id}`}>Celular</FieldLabel>
                        <Input
                          id={`reemplazo-numeroCelular-${id}`}
                          name="numeroCelular"
                          defaultValue={socio.numeroCelular}
                          inputMode="numeric"
                          maxLength={9}
                          minLength={9}
                          pattern="[0-9]{9}"
                          title="Ingresa un celular de 9 digitos."
                          onInput={(event) => conservarSoloDigitos(event, 9)}
                        />
                        <FieldDescription>Solo numeros. Debe tener 9 digitos.</FieldDescription>
                      </Field>
                      <Field className="md:col-span-2">
                        <FieldLabel htmlFor={`reemplazo-motivo-${id}`}>Motivo del reemplazo</FieldLabel>
                        <Textarea
                          id={`reemplazo-motivo-${id}`}
                          name="motivo"
                          placeholder="Documento registrado incorrectamente"
                          required
                        />
                        <FieldDescription>
                          El motivo queda registrado en la auditoria del socio.
                        </FieldDescription>
                      </Field>
                    </div>
                  </section>
                </form>
              ) : (
                <>
                  {socio.tipo === "PERSONAL" ? (
                    <SocioNegocioDetallePersonal socio={socio} />
                  ) : socio.tipo === "PROVEEDOR" ? (
                    <SocioNegocioDetalleProveedor socio={socio} />
                  ) : (
                    <SocioNegocioDetalleCliente socio={socio} />
                  )}

                  {!puedeGestionarAsignaciones && socio.tipo === "PERSONAL" ? (
                    <Alert>
                      <AlertTitle>Asignaciones no disponibles</AlertTitle>
                      <AlertDescription>
                        El personal debe estar activo y con registro vigente para gestionar sus
                        asignaciones.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </>
              )}

              {!modoEdicion && !modoReemplazo && !puedeDarBaja && !registroAnulado ? (
                <Alert>
                  <AlertTitle>Baja no disponible</AlertTitle>
                  <AlertDescription>
                    Este socio no esta disponible para dar de baja.
                  </AlertDescription>
                </Alert>
              ) : null}

            </>
          ) : null}
        </div>
      </main>

      <AlertDialog
        open={dialogoEstadoAbierto}
        onOpenChange={(open) => {
          setDialogoEstadoAbierto(open)
          if (!open) {
            setMotivo("")
            setAccionEstado(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accionEstado === "anular" ? "Anular socio" : "Dar de baja socio"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tenga en cuenta que esta informacion no se podra recuperar.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="font-medium">{socio ? obtenerNombreSocio(socio) : ""}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {socio?.tipo === "PERSONAL"
                  ? socio?.numeroDocumento
                  : `${socio?.codigoInternoSap || "Sin codigo SAP"} · ${socio?.numeroDocumento}`}
              </p>
            </div>

            <Field>
              <FieldLabel htmlFor={`motivo-baja-${id}`}>Motivo</FieldLabel>
              <Textarea
                id={`motivo-baja-${id}`}
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                placeholder={
                  accionEstado === "anular"
                    ? "Registro creado por error"
                    : "Dejo de operar"
                }
                disabled={bajaMutation.isPending}
              />
              <FieldDescription>
                El motivo quedara asociado al movimiento del socio.
              </FieldDescription>
            </Field>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={bajaMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!motivo.trim() || bajaMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                void ejecutarCambioEstado()
              }}
            >
              {bajaMutation.isPending
                ? "Procesando..."
                : accionEstado === "anular"
                  ? "Anular"
                  : "Dar de baja"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </>
  )
}
