"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import {
  Avatar,
  AvatarFallback,
} from "@/compartido/componentes/ui/avatar"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { cn } from "@/compartido/utilidades/utils"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArchiveArrowDownIcon,
  ArrowLeft01Icon,
  ChartUpIcon,
} from "@hugeicons/core-free-icons"

import {
  useDarDeBajaSocioDeNegocioMutation,
  useSocioDeNegocioQuery,
} from "../servicios/socio-negocios-queries"
import type { SocioDeNegocioResponse } from "../tipos/socio-negocio"

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

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "SN"
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase()
}

function DatoVer({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  return (
    <div>
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

  const puedeDarBaja =
    socio?.estado === "ACTIVO" && socio.estadoRegistro === "ACTIVO"

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
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <Avatar size="lg" className="rounded-lg after:rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary/10 font-medium text-primary">
                      {iniciales(socio.razonSocial)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h1
                        className={cn(
                          "break-words text-2xl font-semibold tracking-tight",
                          socio.estadoRegistro === "ANULADO" &&
                            "text-muted-foreground line-through",
                        )}
                      >
                        {socio.razonSocial}
                      </h1>
                      <EstadoResumen socio={socio} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {socio.codigoInternoSap || "Sin codigo SAP"} · {socio.numeroDocumento}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => router.back()}>
                    <HugeiconsIcon
                      data-icon="inline-start"
                      icon={ArrowLeft01Icon}
                      strokeWidth={2}
                    />
                    Volver
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/socio-negocios/historial/${id}`}>
                      <HugeiconsIcon data-icon="inline-start" icon={ChartUpIcon} strokeWidth={2} />
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
                </div>
              </div>

              <dl className="grid grid-cols-1 gap-x-8 gap-y-4 rounded-lg border p-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <DatoVer label="Nombre comercial" value={socio.nombreComercial} />
                <DatoVer label="Tipo" value={socio.tipo} />
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
