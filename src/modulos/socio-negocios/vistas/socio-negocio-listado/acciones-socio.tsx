"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArchiveRestore,
  ArchiveX,
  BriefcaseBusiness,
  CheckCircle2,
  CircleX,
  Eye,
  Loader2,
  MoreVertical,
  Pencil,
  TrendingUp,
} from "lucide-react"

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
import { Button } from "@/compartido/componentes/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu"
import { Field, FieldDescription, FieldLabel } from "@/compartido/componentes/ui/field"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"

import {
  useAprobarSocioDeNegocioMutation,
  useDarDeBajaSocioDeNegocioMutation,
  useReactivarSocioDeNegocioMutation,
} from "../../servicios/socio-negocios-queries"
import type { SocioDeNegocioResponse } from "../../tipos/socio-negocio"
import {
  puedeGestionarAsignacionesPersonal,
  puedeResolverAprobacionSocio,
} from "../../tipos/socio-negocio"
import { type ErrorOperacion, obtenerErrorOperacion } from "./utilidades"

type AccionesSocioProps = {
  socio: SocioDeNegocioResponse
  onActualizado: () => void
  onMensaje: (mensaje: string) => void
  onError: (error: ErrorOperacion) => void
}

export function AccionesSocio({
  socio,
  onActualizado,
  onMensaje,
  onError,
}: AccionesSocioProps) {
  const { usuario } = useSesion()
  const usuarioId = usuario?.nombreUsuario ?? ""
  const bajaMutation = useDarDeBajaSocioDeNegocioMutation(socio.id, {
    onSuccess: onActualizado,
  })
  const reactivarMutation = useReactivarSocioDeNegocioMutation(socio.id, {
    onSuccess: onActualizado,
  })
  const aprobarMutation = useAprobarSocioDeNegocioMutation(socio.id, {
    onSuccess: onActualizado,
  })
  const [accion, setAccion] = useState<"anular" | "reactivar" | null>(null)
  const [motivo, setMotivo] = useState("")
  const procesando =
    bajaMutation.isPending ||
    reactivarMutation.isPending ||
    aprobarMutation.isPending
  const registroAnulado = socio.estadoRegistro === "ANULADO"
  const puedeReactivar =
    socio.estado === "INACTIVO" && socio.estadoRegistro === "ACTIVO"
  const puedeGestionarAsignaciones = puedeGestionarAsignacionesPersonal(socio)
  const puedeResolverAprobacion = puedeResolverAprobacionSocio(socio)
  const requiereMotivo = accion === "anular"

  function abrirAccion(nuevaAccion: "anular" | "reactivar") {
    setMotivo(
      nuevaAccion === "anular"
        ? "Documento registrado incorrectamente"
        : "",
    )
    setAccion(nuevaAccion)
  }

  async function aprobar() {
    try {
      await aprobarMutation.mutateAsync({ usuarioId })
      onMensaje(`${socio.razonSocial} fue aprobado.`)
    } catch (error) {
      onError(obtenerErrorOperacion(error))
    }
  }

  async function confirmarAccion() {
    try {
      if (accion === "anular") {
        await bajaMutation.mutateAsync({
          motivo: motivo.trim(),
          usuarioId,
          estadoRegistro: "ANULADO",
        })
        onMensaje(`${socio.razonSocial} fue anulado.`)
      }

      if (accion === "reactivar") {
        await reactivarMutation.mutateAsync({ usuarioId })
        onMensaje(`Se creo un nuevo registro para ${socio.razonSocial}.`)
      }

      setAccion(null)
    } catch (error) {
      onError(obtenerErrorOperacion(error))
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Acciones" disabled={procesando}>
            {procesando ? (
              <Loader2 className="animate-spin" />
            ) : (
              <MoreVertical />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link href={`/socio-negocios/${socio.id}`}>
                <Eye data-icon="inline-start" />
                Ver
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/socio-negocios/historial/${socio.id}`}>
                <TrendingUp data-icon="inline-start" />
                Auditar
              </Link>
            </DropdownMenuItem>
            {puedeGestionarAsignaciones ? (
              <DropdownMenuItem asChild disabled={procesando}>
                <Link href={`/socio-negocios/${socio.id}/asignaciones`}>
                  <BriefcaseBusiness data-icon="inline-start" />
                  Asignaciones
                </Link>
              </DropdownMenuItem>
            ) : null}
            {!registroAnulado ? (
              <>
                <DropdownMenuItem asChild disabled={procesando}>
                  <Link href={`/socio-negocios/${socio.id}?modo=editar`}>
                    <Pencil data-icon="inline-start" />
                    Editar datos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  asChild
                  disabled={
                    socio.estado !== "ACTIVO" ||
                    socio.estadoRegistro !== "ACTIVO" ||
                    procesando
                  }
                >
                  <Link href={`/socio-negocios/${socio.id}`}>
                    <ArchiveX data-icon="inline-start" />
                    Dar de baja
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {puedeResolverAprobacion ? (
                  <DropdownMenuItem
                    disabled={procesando}
                    onSelect={() => void aprobar()}
                  >
                    <CheckCircle2 data-icon="inline-start" />
                    Aprobar
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  disabled={procesando}
                  onSelect={() => abrirAccion("anular")}
                >
                  <CircleX data-icon="inline-start" />
                  Anular
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!puedeReactivar || procesando}
                  onSelect={() => abrirAccion("reactivar")}
                >
                  <ArchiveRestore data-icon="inline-start" />
                  Reactivar
                </DropdownMenuItem>
              </>
            ) : null}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={accion !== null} onOpenChange={(open) => !open && setAccion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accion === "anular" ? "Anular socio" : "Reactivar socio"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {accion === "reactivar"
                ? `Confirma la reactivacion de ${socio.razonSocial}.`
                : "El motivo quedara registrado en la auditoria del socio."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="font-medium">{socio.razonSocial}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {socio.codigoInternoSap} · {socio.numeroDocumento}
              </p>
            </div>

            {requiereMotivo ? (
              <Field>
                <FieldLabel htmlFor={`motivo-${socio.id}`}>Motivo</FieldLabel>
                <Textarea
                  id={`motivo-${socio.id}`}
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  placeholder="Registro creado por error"
                  disabled={procesando}
                />
                <FieldDescription>
                  Este motivo quedara asociado al movimiento del socio.
                </FieldDescription>
              </Field>
            ) : null}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={accion === "anular" ? "destructive" : "default"}
              disabled={procesando || (requiereMotivo && !motivo.trim())}
              onClick={(event) => {
                event.preventDefault()
                void confirmarAccion()
              }}
            >
              {procesando ? "Procesando..." : accion === "anular" ? "Anular" : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
