"use client"

import { useState } from "react"
import { Link2 } from "lucide-react"
import { toast } from "sonner"

import { extraerMensajeError } from "@/compartido/api"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/compartido/componentes/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/compartido/componentes/ui/field"

import { useVincularSocio } from "../ganchos/use-mutaciones-cuenta"
import { SocioPicker, type SocioSeleccionado } from "./socio-picker"

interface Props {
  cuentaId: string
  onActualizado?: () => unknown
}

function DialogAsignarSocio({ cuentaId, onActualizado }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [socio, setSocio] = useState<SocioSeleccionado | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mutation = useVincularSocio(cuentaId, { onSuccess: onActualizado })

  function abrir(siguiente: boolean) {
    if (siguiente) {
      setSocio(null)
      setError(null)
    }
    setAbierto(siguiente)
  }

  async function confirmar() {
    if (!socio) {
      setError("Selecciona un socio de negocio.")
      return
    }
    setError(null)
    try {
      await mutation.mutateAsync({
        socioExternoId: socio.socioExternoId,
        tipoSocio: "empleado",
        socioSnapshot: socio.datos as unknown as Record<string, unknown>,
      })
      toast.success("Socio vinculado")
      setAbierto(false)
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo vincular el socio.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-md">
          <Link2 />
          Asignar socio
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
        <DialogHeader>
          <DialogTitle>Asignar socio de negocio</DialogTitle>
          <DialogDescription>
            Busca al socio en BC01 por DNI y vinculalo a esta cuenta. El vinculo
            es 1:1: no se puede si la cuenta ya tiene socio o el socio ya esta
            vinculado a otra cuenta.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel>Socio de negocio (BC01)</FieldLabel>
            <SocioPicker
              value={socio}
              onChange={setSocio}
              disabled={mutation.isPending}
            />
          </Field>
          {error ? (
            <Field data-invalid>
              <FieldError>{error}</FieldError>
            </Field>
          ) : null}
        </FieldGroup>
        <DialogFooter>
          <Button
            variant="ghost"
            className="rounded-md"
            onClick={() => setAbierto(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            className="rounded-md"
            onClick={() => void confirmar()}
            disabled={mutation.isPending || !socio}
          >
            {mutation.isPending ? "Vinculando..." : "Vincular"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function AsignarSocioSeccion({ cuentaId, onActualizado }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border border-dashed p-5">
      <div>
        <h2 className="text-sm font-medium">Socio de negocio</h2>
        <p className="text-xs text-muted-foreground">
          Esta cuenta no tiene un socio de BC01 vinculado.
        </p>
      </div>
      <DialogAsignarSocio cuentaId={cuentaId} onActualizado={onActualizado} />
    </div>
  )
}
