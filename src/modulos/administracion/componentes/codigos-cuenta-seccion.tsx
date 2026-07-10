"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/compartido/componentes/ui/field"
import { Input } from "@/compartido/componentes/ui/input"

import { useActualizarCodigos } from "../ganchos/use-mutaciones-cuenta"
import type { CuentaResponse } from "../tipos/administracion.tipos"

const FORMATO_CODIGO = /^[A-Za-z0-9]{1,20}$/

interface Props {
  cuenta: CuentaResponse
  onActualizado?: () => unknown
}

function DialogEditarCodigos({ cuenta, onActualizado }: Props) {
  const [abierto, setAbierto] = useState(false)
  const [codigoSocio, setCodigoSocio] = useState(cuenta.codigoSocio ?? "")
  const [codigoCuenta, setCodigoCuenta] = useState(cuenta.codigoCuenta ?? "")
  const [error, setError] = useState<string | null>(null)
  const mutation = useActualizarCodigos(cuenta.id, { onSuccess: onActualizado })

  function abrir(siguiente: boolean) {
    if (siguiente) {
      setCodigoSocio(cuenta.codigoSocio ?? "")
      setCodigoCuenta(cuenta.codigoCuenta ?? "")
      setError(null)
    }
    setAbierto(siguiente)
  }

  async function confirmar() {
    const socio = codigoSocio.trim()
    const cuentaCod = codigoCuenta.trim()

    // "Todo o nada": ambos o ninguno.
    if ((socio && !cuentaCod) || (!socio && cuentaCod)) {
      setError(
        "Los dos codigos van juntos: completa ambos o deja ambos vacios para limpiar.",
      )
      return
    }
    if (socio && !FORMATO_CODIGO.test(socio)) {
      setError("El codigo de socio debe tener 1-20 caracteres alfanumericos.")
      return
    }
    if (cuentaCod && !FORMATO_CODIGO.test(cuentaCod)) {
      setError("El codigo de cuenta debe tener 1-20 caracteres alfanumericos.")
      return
    }
    if (socio && cuentaCod && socio === cuentaCod) {
      setError("Los dos codigos deben ser distintos entre si.")
      return
    }
    setError(null)

    try {
      await mutation.mutateAsync({
        codigoSocio: socio || null,
        codigoCuenta: cuentaCod || null,
      })
      toast.success(socio ? "Codigos actualizados" : "Codigos eliminados")
      setAbierto(false)
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudieron guardar los codigos.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  const tieneCodigos = Boolean(cuenta.codigoSocio || cuenta.codigoCuenta)

  return (
    <Dialog open={abierto} onOpenChange={abrir}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-md">
          <Pencil />
          {tieneCodigos ? "Editar codigos" : "Asignar codigos"}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-md">
        <DialogHeader>
          <DialogTitle>Codigos internos</DialogTitle>
          <DialogDescription>
            Se usan para la generacion de codigos en los PDFs. Van juntos:
            completa ambos o deja ambos vacios para limpiarlos.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="codigo-socio">Codigo de socio</FieldLabel>
            <Input
              id="codigo-socio"
              className="rounded-md"
              value={codigoSocio}
              onChange={(e) => setCodigoSocio(e.target.value)}
              placeholder="Ej. BA"
              maxLength={20}
              autoComplete="off"
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="codigo-cuenta">Codigo de cuenta</FieldLabel>
            <Input
              id="codigo-cuenta"
              className="rounded-md"
              value={codigoCuenta}
              onChange={(e) => setCodigoCuenta(e.target.value)}
              placeholder="Ej. C1"
              maxLength={20}
              autoComplete="off"
            />
            <FieldDescription>
              El cambio se reflejara en el token del usuario en su proximo
              inicio de sesion o refresco.
            </FieldDescription>
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
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CodigosCuentaSeccion({ cuenta, onActualizado }: Props) {
  return (
    <div className="space-y-4 border p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Codigos internos</h2>
          <p className="text-xs text-muted-foreground">
            Codigos de la cuenta para la generacion de PDFs. Independientes del
            socio de negocio.
          </p>
        </div>
        <DialogEditarCodigos cuenta={cuenta} onActualizado={onActualizado} />
      </div>

      <dl className="grid grid-cols-1 gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Codigo de socio</dt>
          <dd className="mt-0.5 font-mono">{cuenta.codigoSocio ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Codigo de cuenta</dt>
          <dd className="mt-0.5 font-mono">{cuenta.codigoCuenta ?? "—"}</dd>
        </div>
      </dl>
    </div>
  )
}
