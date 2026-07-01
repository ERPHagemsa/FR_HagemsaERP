"use client"

import { type FormEvent, useState } from "react"
import {
  ArchiveRestore,
  Ban,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
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
import { Input } from "@/compartido/componentes/ui/input"
import { Textarea } from "@/compartido/componentes/ui/textarea"
import { useSesion } from "@/modulos/autenticacion/ganchos/use-sesion"

import { CamposMaestro, construirPayloadModificacion } from "../campos-maestro"
import {
  useAnularConfiguracionGeneralMutation,
  useInhabilitarConfiguracionGeneralMutation,
  useModificarPorTipoMutation,
  useReactivarConfiguracionGeneralMutation,
} from "../../servicios/configuracion-general-queries"
import type { ConfiguracionGeneralResponse } from "../../tipos/configuracion-general"
import {
  DatoFicha,
  formatearFecha,
  obtenerMensajeError,
  referenciaTexto,
  textoEstado,
  useCatalogosParaTipo,
} from "./utilidades"

type AccionMaestro = "inhabilitar" | "reactivar" | "anular" | null

export function AccionesConfiguracion({
  dato,
  onActualizado,
  onError,
  onMensaje,
}: {
  dato: ConfiguracionGeneralResponse
  onActualizado: () => void
  onError: (mensaje: string) => void
  onMensaje: (mensaje: string) => void
}) {
  const { usuario } = useSesion()
  const modificarMutation = useModificarPorTipoMutation(dato.tipoDatoMaestro, dato.id, {
    onSuccess: onActualizado,
  })
  const inhabilitarMutation = useInhabilitarConfiguracionGeneralMutation(dato.id, dato.tipoDatoMaestro, {
    onSuccess: onActualizado,
  })
  const reactivarMutation = useReactivarConfiguracionGeneralMutation(dato.id, dato.tipoDatoMaestro, {
    onSuccess: onActualizado,
  })
  const anularMutation = useAnularConfiguracionGeneralMutation(dato.id, dato.tipoDatoMaestro, {
    onSuccess: onActualizado,
  })
  const [fichaAbierta, setFichaAbierta] = useState(false)
  const [modificarAbierto, setModificarAbierto] = useState(false)
  const catalogos = useCatalogosParaTipo(dato.tipoDatoMaestro, modificarAbierto)
  const [accion, setAccion] = useState<AccionMaestro>(null)
  const [motivo, setMotivo] = useState("")
  const procesando =
    modificarMutation.isPending ||
    inhabilitarMutation.isPending ||
    reactivarMutation.isPending ||
    anularMutation.isPending
  const anulado = dato.estadoRegistro === "ANULADO"
  const puedeModificar = !anulado
  const puedeInhabilitar = dato.estado === "ACTIVO" && !anulado
  const puedeReactivar = dato.estado === "INACTIVO" && !anulado
  const puedeAnular = !anulado
  const usuarioActual = usuario?.email ?? "admin"

  function abrirAccion(nuevaAccion: Exclude<AccionMaestro, null>) {
    setMotivo(nuevaAccion === "anular" ? "Registro creado por error" : "")
    setAccion(nuevaAccion)
  }

  async function confirmarAccion() {
    try {
      if (accion === "inhabilitar") {
        await inhabilitarMutation.mutateAsync({
          motivo: motivo.trim(),
          usuarioModificacion: usuarioActual,
        })
        onMensaje(`${dato.nombre} fue inhabilitado.`)
      }

      if (accion === "reactivar") {
        await reactivarMutation.mutateAsync({ usuarioModificacion: usuarioActual })
        onMensaje(`${dato.nombre} fue reactivado.`)
      }

      if (accion === "anular") {
        await anularMutation.mutateAsync({
          motivo: motivo.trim(),
          usuarioModificacion: usuarioActual,
        })
        onMensaje(`${dato.nombre} fue borrado.`)
      }

      setAccion(null)
    } catch (error) {
      onError(obtenerMensajeError(error))
    }
  }

  async function modificarDato(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const nombre = String(formData.get("nombre") ?? "").trim()
    const descripcion = String(formData.get("descripcion") ?? "").trim()

    try {
      await modificarMutation.mutateAsync(
        construirPayloadModificacion(dato.tipoDatoMaestro, formData, {
          nombre,
          descripcion: descripcion || null,
          usuarioModificacion: usuarioActual,
        }),
      )
      setModificarAbierto(false)
      onMensaje(`${dato.nombre} fue modificado.`)
    } catch (error) {
      onError(obtenerMensajeError(error))
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Acciones" disabled={procesando}>
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuItem onSelect={() => setFichaAbierta(true)}>
              <Eye className="size-4" />
              Ver
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!puedeModificar || procesando}
              onSelect={() => setModificarAbierto(true)}
            >
              <Pencil className="size-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              disabled={!puedeInhabilitar || procesando}
              onSelect={() => abrirAccion("inhabilitar")}
            >
              <Ban className="size-4" />
              Inhabilitar
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!puedeReactivar || procesando}
              onSelect={() => abrirAccion("reactivar")}
            >
              <ArchiveRestore className="size-4" />
              Reactivar
            </DropdownMenuItem>
            <DropdownMenuItem
              disabled={!puedeAnular || procesando}
              onSelect={() => abrirAccion("anular")}
            >
              <Trash2 className="size-4" />
              Borrar
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={fichaAbierta} onOpenChange={(open) => !open && setFichaAbierta(false)}>
        <AlertDialogContent className="max-w-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Detalle del registro</AlertDialogTitle>
            <AlertDialogDescription>
              Informacion actual de {dato.nombre}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-3 md:grid-cols-3">
            <DatoFicha label="Codigo" value={dato.codigo} />
            <DatoFicha label="Nombre" value={dato.nombre} />
            <DatoFicha label="Estado" value={textoEstado(dato)} />
            <FichaEspecifica dato={dato} />
            <DatoFicha label="Creado el" value={formatearFecha(dato.fechaCreacion)} />
            <DatoFicha label="Ultima modificacion" value={formatearFecha(dato.fechaModificacion)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setFichaAbierta(false)}>
              Cerrar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={modificarAbierto}
        onOpenChange={(open) => !open && setModificarAbierto(false)}
      >
        <AlertDialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <form onSubmit={(event) => void modificarDato(event)}>
            <AlertDialogHeader>
              <AlertDialogTitle>Editar {dato.tipoDatoMaestro.toLowerCase()}</AlertDialogTitle>
              <AlertDialogDescription>
                Actualiza los datos de {dato.nombre}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-3 py-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor={`nombre-${dato.id}`}>Nombre</label>
                <Input id={`nombre-${dato.id}`} name="nombre" defaultValue={dato.nombre} required />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-medium" htmlFor={`descripcion-${dato.id}`}>
                  Descripcion
                </label>
                <Textarea
                  id={`descripcion-${dato.id}`}
                  name="descripcion"
                  defaultValue={dato.descripcion ?? ""}
                  placeholder="Descripcion"
                />
              </div>
              <div className="grid gap-3 border-t border-border pt-3 md:grid-cols-2">
                <CamposMaestro
                  tipo={dato.tipoDatoMaestro}
                  catalogos={catalogos}
                  valoresIniciales={dato}
                  esEdicion
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={modificarMutation.isPending}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction type="submit" disabled={modificarMutation.isPending}>
                {modificarMutation.isPending ? "Guardando..." : "Guardar"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={accion !== null} onOpenChange={(open) => !open && setAccion(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {accion === "inhabilitar"
                ? "Inhabilitar registro"
                : accion === "anular"
                  ? "Borrar registro"
                  : "Reactivar registro"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {accion === "reactivar"
                ? "El registro volvera a estar disponible para usarse."
                : accion === "anular"
                  ? "Tenga en cuenta que esta informacion no se podra recuperar. Ingresa el motivo para registrar la accion en auditoria."
                  : "Ingresa el motivo para registrar la accion en auditoria."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {accion === "inhabilitar" || accion === "anular" ? (
            <Textarea
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              placeholder={accion === "anular" ? "Motivo de borrado" : "Motivo de inhabilitacion"}
              required
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant={accion === "anular" ? "destructive" : "default"}
              disabled={procesando || ((accion === "inhabilitar" || accion === "anular") && !motivo.trim())}
              onClick={() => void confirmarAccion()}
            >
              {procesando
                ? "Procesando..."
                : accion === "anular"
                  ? "Borrar"
                  : accion === "inhabilitar"
                    ? "Inhabilitar"
                    : "Reactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Resumen del campo propio del tipo, dentro de la ficha de detalle.
function FichaEspecifica({ dato }: { dato: ConfiguracionGeneralResponse }) {
  switch (dato.tipoDatoMaestro) {
    case "CARGO":
      return <DatoFicha label="Reporta a" value={referenciaTexto(dato.cargoSuperiorNombre, dato.cargoSuperiorId)} />
    case "UBICACION":
      return (
        <DatoFicha
          label="Lugar"
          value={[dato.tipoUbicacion, dato.distrito, dato.provincia, dato.departamento]
            .filter(Boolean)
            .join(" / ")}
        />
      )
    case "SEDE":
      return <DatoFicha label="Ubicacion" value={referenciaTexto(dato.ubicacionNombre, dato.ubicacionId)} />
    case "AREA":
      return <DatoFicha label="Sede" value={referenciaTexto(dato.sedeNombre, dato.sedeId)} />
    case "ALMACEN":
      return (
        <DatoFicha
          label="Almacen"
          value={`${dato.esTemporal ? "Temporal" : "Fijo"} · ${referenciaTexto(dato.ubicacionNombre, dato.ubicacionId)}`}
        />
      )
    case "CUENTA":
      return <DatoFicha label="Tipo" value="Cuenta" />
    default:
      return <DatoFicha label="Pertenece a" value={referenciaTexto(dato.contratoPadreNombre, dato.contratoPadreId)} />
  }
}
