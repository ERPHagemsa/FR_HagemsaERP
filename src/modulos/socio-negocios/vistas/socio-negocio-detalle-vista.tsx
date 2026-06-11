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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { cn } from "@/compartido/utilidades/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArchiveArrowDownIcon,
  ArrowLeft01Icon,
  ChartUpIcon,
  Edit02Icon,
} from "@hugeicons/core-free-icons"

import {
  useDarDeBajaSocioDeNegocioMutation,
  useModificarSocioDeNegocioMutation,
  useSocioDeNegocioQuery,
} from "../servicios/socio-negocios-queries"
import { SocioNegocioPageHeader } from "../componentes/socio-negocio-page-header"
import { condicionesLaborales } from "../tipos/socio-negocio"
import type {
  CondicionLaboral,
  ModificarSocioDeNegocioRequest,
  SocioDeNegocioResponse,
} from "../tipos/socio-negocio"

function formatearFecha(fecha?: string | Date | null) {
  if (!fecha) return "-"

  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(fecha))
}

function obtenerMensajeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operacion."
}

function obtenerTextoFormulario(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

function etiquetaCondicionLaboral(condicion?: CondicionLaboral | null) {
  return (
    condicionesLaborales.find((item) => item.valor === condicion)?.etiqueta ??
    condicion ??
    "-"
  )
}

function DatoVer({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  return (
    <div className="min-w-0 rounded-lg bg-muted/35 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words">{value || "-"}</dd>
    </div>
  )
}

function EstadoResumen({ socio }: { socio: SocioDeNegocioResponse }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <span
          className={cn(
            "size-1.5 bg-emerald-500",
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
    </div>
  )
}

export function SocioNegocioDetalleVista({ id }: { id: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const socioQuery = useSocioDeNegocioQuery(id)
  const socio = socioQuery.data
  const [motivo, setMotivo] = useState("")
  const [dialogoBajaAbierto, setDialogoBajaAbierto] = useState(false)
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

  const puedeDarBaja =
    socio?.estado === "ACTIVO" && socio.estadoRegistro === "ACTIVO"
  const modoEdicion =
    searchParams.get("modo") === "editar" && socio?.estadoRegistro !== "ANULADO"
  const formEditarId = `editar-socio-${id}`

  async function darDeBaja() {
    if (!motivo.trim() || !socio) return

    try {
      setError(null)
      setMensaje(null)
      await bajaMutation.mutateAsync({
        motivo: motivo.trim(),
        usuarioId: "admin",
        estadoRegistro: "ACTIVO",
      })
      setMensaje(`${socio.razonSocial} fue dado de baja.`)
      setMotivo("")
      setDialogoBajaAbierto(false)
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
      usuarioId: "admin",
    }

    if (socio.tipo === "PERSONAL") {
      payload.condicionLaboral = obtenerTextoFormulario(
        formData,
        "condicionLaboral",
      ) as CondicionLaboral
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
        <div className="flex w-full flex-col gap-6">
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
              <AlertTitle>No se pudo dar de baja</AlertTitle>
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
                meta={<EstadoResumen socio={socio} />}
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
                        <Button variant="outline" size="sm" onClick={() => router.back()}>
                          <HugeiconsIcon
                            data-icon="inline-start"
                            icon={ArrowLeft01Icon}
                            strokeWidth={2}
                          />
                          Volver
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/socio-negocios/${id}?modo=editar`}>
                            <HugeiconsIcon
                              data-icon="inline-start"
                              icon={Edit02Icon}
                              strokeWidth={2}
                            />
                            Editar
                          </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/socio-negocios/historial/${id}`}>
                            <HugeiconsIcon
                              data-icon="inline-start"
                              icon={ChartUpIcon}
                              strokeWidth={2}
                            />
                            Auditar
                          </Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={!puedeDarBaja || bajaMutation.isPending}
                          onClick={() => setDialogoBajaAbierto(true)}
                        >
                          <HugeiconsIcon
                            data-icon="inline-start"
                            icon={ArchiveArrowDownIcon}
                            strokeWidth={2}
                          />
                          Dar de baja
                        </Button>
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
                  <section className="rounded-xl bg-muted/30 p-4">
                    <h2 className="text-base font-semibold">Datos que no se modifican</h2>
                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                      <DatoVer label="Tipo" value={socio.tipo} />
                      <DatoVer label="Documento" value={socio.numeroDocumento} />
                      <DatoVer label="Codigo SAP" value={socio.codigoInternoSap || "-"} />
                    </div>
                  </section>

                  <section className="grid gap-4 rounded-xl bg-card p-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <h2 className="text-base font-semibold">Datos editables</h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Actualiza solo la informacion operativa del socio.
                      </p>
                    </div>
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
                      />
                    </Field>
                    {socio.tipo === "PERSONAL" ? (
                      <Field>
                        <FieldLabel htmlFor={`condicionLaboral-${id}`}>
                          Condicion laboral
                        </FieldLabel>
                        <Select
                          name="condicionLaboral"
                          defaultValue={socio.condicionLaboral ?? "LABORANDO"}
                        >
                          <SelectTrigger id={`condicionLaboral-${id}`} className="w-full">
                            <SelectValue placeholder="Selecciona condicion" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {condicionesLaborales.map((condicion) => (
                                <SelectItem key={condicion.valor} value={condicion.valor}>
                                  {condicion.etiqueta}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </Field>
                    ) : null}
                  </section>
                </form>
              ) : (
                <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                  <DatoVer label="Nombre comercial" value={socio.nombreComercial} />
                  <DatoVer label="Tipo" value={socio.tipo} />
                  {socio.tipo === "PERSONAL" ? (
                    <DatoVer
                      label="Condicion laboral"
                      value={etiquetaCondicionLaboral(socio.condicionLaboral)}
                    />
                  ) : null}
                  <DatoVer label="Count" value={socio.count} />
                  <DatoVer label="Direccion" value={socio.direccion} />
                  <DatoVer label="Contacto" value={socio.contacto} />
                  <DatoVer label="Correo" value={socio.correo} />
                  <DatoVer label="Celular" value={socio.numeroCelular} />
                  <DatoVer label="Departamento" value={socio.areaNombre || socio.area} />
                  <DatoVer label="Cargo" value={socio.cargoNombre || socio.cargo} />
                  <DatoVer label="Cuenta" value={socio.cuentaNombre || socio.cuenta} />
                  <DatoVer label="Creacion" value={formatearFecha(socio.fechaCreacion)} />
                  <DatoVer label="Usuario creacion" value={socio.usuarioCreacion} />
                  <DatoVer label="Fecha baja" value={formatearFecha(socio.fechaBaja)} />
                  <DatoVer label="Motivo baja" value={socio.motivoBaja} />
                  <DatoVer label="ID" value={socio.id} />
                </dl>
              )}

              {!puedeDarBaja ? (
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
        open={dialogoBajaAbierto}
        onOpenChange={(open) => {
          setDialogoBajaAbierto(open)
          if (!open) setMotivo("")
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dar de baja socio</AlertDialogTitle>
            <AlertDialogDescription>
              Tenga en cuenta que esta informacion no se podra recuperar.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-muted/40 p-3">
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
                placeholder="Dejo de operar"
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
                void darDeBaja()
              }}
            >
              {bajaMutation.isPending ? "Procesando..." : "Dar de baja"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
