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
import { Spinner } from "@/compartido/componentes/ui/spinner"
import { cn } from "@/compartido/utilidades/utils"
import {
  ArchiveRestore,
  ArchiveX,
  ArrowLeft,
  BriefcaseBusiness,
  CheckCircle2,
  CircleX,
  Pencil,
  TrendingUp,
} from "lucide-react"

import {
  useAprobarSocioDeNegocioMutation,
  useDarDeBajaSocioDeNegocioMutation,
  useModificarSocioDeNegocioMutation,
  useReactivarSocioDeNegocioMutation,
  useRechazarSocioDeNegocioMutation,
  useSocioDeNegocioQuery,
} from "../servicios/socio-negocios-queries"
import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import { EstadoSincronizacionSapBadge } from "../componentes/estado-sincronizacion-sap-badge"
import { AsignacionesPersonalSeccion } from "../componentes/asignaciones-personal-seccion"
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"
import type {
  ModificarSocioDeNegocioRequest,
  SocioDeNegocioResponse,
} from "../tipos/socio-negocio"
import {
  puedeGestionarAsignacionesPersonal,
  puedeResolverAprobacionSocio,
} from "../tipos/socio-negocio"

function formatearFecha(fecha?: string | Date | null) {
  if (!fecha) return "-"

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha))
}

function obtenerMensajeError(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes("El personal debe estar aprobado, activo y con registro activo")) {
      return "Para guardar una asignacion, primero aprueba el personal y verifica que este activo y no anulado."
    }
    return error.message
  }

  return "No se pudo completar la operacion."
}

function obtenerTextoFormulario(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

function conservarSoloDigitos(event: FormEvent<HTMLInputElement>, maxLength: number) {
  event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, maxLength)
}

function DatoVer({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  return (
    <div className="min-w-0 bg-card p-4">
      <dt className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 break-words font-medium">{value || "-"}</dd>
    </div>
  )
}

function EstadoAprobacionBadge({
  estado,
  procesando,
}: {
  estado: SocioDeNegocioResponse["estadoAprobacion"]
  procesando?: boolean
}) {
  if (procesando) {
    return (
      <Badge variant="secondary" className="bg-background text-muted-foreground">
        <Spinner data-icon="inline-start" />
        Actualizando
      </Badge>
    )
  }

  if (estado === "APROBADO") {
    return <Badge variant="outline">Aprobado</Badge>
  }

  if (estado === "PENDIENTE_APROBACION") {
    return <Badge variant="secondary">Pendiente</Badge>
  }

  return (
    <Badge variant="outline" className="border-destructive/20 text-destructive">
      No aprobado
    </Badge>
  )
}

function EstadoResumen({
  socio,
  aprobacionProcesando,
}: {
  socio: SocioDeNegocioResponse
  aprobacionProcesando?: boolean
}) {
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
      <EstadoAprobacionBadge
        estado={socio.estadoAprobacion}
        procesando={aprobacionProcesando}
      />
      <EstadoSincronizacionSapBadge
        estado={socio.estadoSincronizacionSap}
        ultimoError={socio.ultimoErrorSincronizacionSap}
      />
      <Badge variant="outline">{socio.origen}</Badge>
    </div>
  )
}

export function SocioNegocioDetalleVista({ id }: { id: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const socioQuery = useSocioDeNegocioQuery(id)
  const socio = socioQuery.data
  const { usuario } = useSesion()
  const usuarioId = usuario?.nombreUsuario ?? ""
  const [motivo, setMotivo] = useState("")
  const [dialogoEstadoAbierto, setDialogoEstadoAbierto] = useState(false)
  const [dialogoRechazoAbierto, setDialogoRechazoAbierto] = useState(false)
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
  const aprobarMutation = useAprobarSocioDeNegocioMutation(id, {
    onSuccess: () => void socioQuery.refetch(),
  })
  const rechazarMutation = useRechazarSocioDeNegocioMutation(id, {
    onSuccess: () => void socioQuery.refetch(),
  })
  const reactivarMutation = useReactivarSocioDeNegocioMutation(id)
  const aprobacionProcesando =
    aprobarMutation.isPending || rechazarMutation.isPending

  const puedeDarBaja =
    socio?.estado === "ACTIVO" &&
    socio.estadoRegistro === "ACTIVO" &&
    socio.estadoAprobacion === "APROBADO"
  const puedeGestionarAsignaciones =
    socio ? puedeGestionarAsignacionesPersonal(socio) : false
  const puedeResolverAprobacion =
    socio ? puedeResolverAprobacionSocio(socio) : false
  const registroAnulado = socio?.estadoRegistro === "ANULADO"
  const modoEdicion =
    searchParams.get("modo") === "editar" && socio?.estadoRegistro !== "ANULADO"
  const formEditarId = `editar-socio-${id}`

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
          ? `${socio.razonSocial} fue anulado.`
          : `${socio.razonSocial} fue dado de baja.`,
      )
      setMotivo("")
      setDialogoEstadoAbierto(false)
      setAccionEstado(null)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  async function aprobar() {
    if (!socio || !puedeResolverAprobacion) return
    try {
      setError(null)
      await aprobarMutation.mutateAsync({ usuarioId })
      setMensaje(`${socio.razonSocial} fue aprobado.`)
    } catch (err) {
      setError(obtenerMensajeError(err))
    }
  }

  async function rechazar() {
    if (!socio || !motivo.trim() || !puedeResolverAprobacion) return
    try {
      setError(null)
      await rechazarMutation.mutateAsync({ usuarioId, motivo: motivo.trim() })
      setMensaje(`${socio.razonSocial} fue rechazado.`)
      setMotivo("")
      setDialogoRechazoAbierto(false)
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
      setMensaje(`${socio.razonSocial} fue editado.`)
      router.replace(`/socio-negocios/${id}`)
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
          { title: "Listar", href: "/socio-negocios/listar" },
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
                    {socio.razonSocial}
                  </span>
                }
                description={`${socio.codigoInternoSap || "Sin codigo SAP"} · Documento ${socio.numeroDocumento}`}
                meta={<EstadoResumen socio={socio} aprobacionProcesando={aprobacionProcesando} />}
                actions={
                  <>
                    {modoEdicion ? (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => router.replace(`/socio-negocios/${id}`)}
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
                    ) : (
                      <>
                        <Button asChild variant="outline" size="sm">
                          <Link href="/socio-negocios/listar">
                            <ArrowLeft data-icon="inline-start" />
                            Volver al listado
                          </Link>
                        </Button>
                        {!registroAnulado ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/socio-negocios/${id}?modo=editar`}>
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
                        {puedeResolverAprobacion ? (
                          <>
                            <Button
                              size="sm"
                              disabled={aprobarMutation.isPending}
                              onClick={() => void aprobar()}
                            >
                              <CheckCircle2 data-icon="inline-start" />
                              Aprobar
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={rechazarMutation.isPending}
                              onClick={() => setDialogoRechazoAbierto(true)}
                            >
                              <CircleX data-icon="inline-start" />
                              Rechazar
                            </Button>
                          </>
                        ) : null}
                        {!registroAnulado && !puedeResolverAprobacion ? (
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
                      <DatoVer label="Codigo SAP" value={socio.codigoInternoSap || "-"} />
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
                      <FieldLabel htmlFor={`razonSocial-${id}`}>Razon social</FieldLabel>
                      <Input
                        id={`razonSocial-${id}`}
                        name="razonSocial"
                        defaultValue={socio.razonSocial}
                        required
                      />
                    </Field>
                    <Field className="md:col-span-2">
                      <FieldLabel htmlFor={`nombreComercial-${id}`}>Nombre comercial</FieldLabel>
                      <Input
                        id={`nombreComercial-${id}`}
                        name="nombreComercial"
                        defaultValue={socio.nombreComercial}
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
              ) : (
                <>
                  <section className="overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground">
                    <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
                      <h2 className="text-base font-semibold">Informacion del socio</h2>
                      <p className="text-sm leading-5 text-muted-foreground">
                        Identidad, contacto y trazabilidad del registro.
                      </p>
                    </div>
                    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-border bg-border text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <DatoVer label="Nombre comercial" value={socio.nombreComercial} />
                    <DatoVer label="Tipo" value={socio.tipo} />
                    <DatoVer label="Aprobacion" value={socio.estadoAprobacion} />
                    <DatoVer label="Origen" value={socio.origen} />
                    <DatoVer label="Sincronizacion SAP" value={socio.estadoSincronizacionSap} />
                    <DatoVer label="Fecha sincronizacion SAP" value={formatearFecha(socio.fechaSincronizacionSap)} />
                    <DatoVer label="Ultimo error SAP" value={socio.ultimoErrorSincronizacionSap} />
                    <DatoVer label="Registro anterior" value={socio.registroAnteriorId} />
                    <DatoVer label="Motivo nuevo registro" value={socio.motivoNuevoRegistro} />
                    <DatoVer label="Direccion" value={socio.direccion} />
                    <DatoVer label="Contacto" value={socio.contacto} />
                    <DatoVer label="Correo" value={socio.correo} />
                    <DatoVer label="Celular" value={socio.numeroCelular} />
                    <DatoVer label="Creacion" value={formatearFecha(socio.fechaCreacion)} />
                    <DatoVer label="Usuario creacion" value={socio.usuarioCreacion} />
                    <DatoVer label="Fecha aprobacion" value={formatearFecha(socio.fechaAprobacion)} />
                    <DatoVer label="Usuario aprobacion" value={socio.usuarioAprobacion} />
                    <DatoVer label="Fecha rechazo" value={formatearFecha(socio.fechaRechazo)} />
                    <DatoVer label="Motivo rechazo" value={socio.motivoRechazo} />
                    <DatoVer label="Fecha baja" value={formatearFecha(socio.fechaBaja)} />
                    <DatoVer label="Motivo baja" value={socio.motivoBaja} />
                    <DatoVer label="ID" value={socio.id} />
                    </dl>
                  </section>

                  {puedeGestionarAsignaciones ? (
                    <AsignacionesPersonalSeccion
                      personalId={socio.id}
                      titulo="Asignaciones del registro actual"
                      descripcion={`Se consultan con el id actual del personal #${socio.id}.`}
                      vacioTitulo="Sin asignacion vigente"
                      vacioDescripcion="Este registro actual todavia no tiene asignaciones."
                    />
                  ) : socio.tipo === "PERSONAL" ? (
                    <Alert>
                      <AlertTitle>Asignaciones pendientes de aprobacion</AlertTitle>
                      <AlertDescription>
                        Primero aprueba el personal y verifica que este activo y no anulado.
                        Luego podras gestionar sus asignaciones.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </>
              )}

              {!puedeDarBaja && !registroAnulado ? (
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
              <p className="font-medium">{socio?.razonSocial}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {socio?.codigoInternoSap || "Sin codigo SAP"} · {socio?.numeroDocumento}
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

      <AlertDialog
        open={dialogoRechazoAbierto}
        onOpenChange={(open) => {
          setDialogoRechazoAbierto(open)
          if (!open) setMotivo("")
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rechazar socio pendiente</AlertDialogTitle>
            <AlertDialogDescription>
              El motivo quedara registrado en la auditoria del socio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Field>
            <FieldLabel htmlFor={`motivo-rechazo-${id}`}>Motivo</FieldLabel>
            <Textarea
              id={`motivo-rechazo-${id}`}
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder="Registro creado por error"
              disabled={rechazarMutation.isPending}
            />
          </Field>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rechazarMutation.isPending}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={!motivo.trim() || rechazarMutation.isPending}
              onClick={(event) => {
                event.preventDefault()
                void rechazar()
              }}
            >
              {rechazarMutation.isPending ? "Procesando..." : "Rechazar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
