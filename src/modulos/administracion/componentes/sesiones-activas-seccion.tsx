"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

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
import { Input } from "@/compartido/componentes/ui/input"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"

import {
  useRevocarSesion,
  useSesionesCuenta,
} from "../ganchos/use-sesiones"
import type { SesionResponse } from "../tipos/administracion.tipos"

function abreviarUserAgent(userAgent: string | null): string {
  if (!userAgent) return "—"
  if (userAgent.length <= 60) return userAgent
  return `${userAgent.slice(0, 60)}…`
}

interface PropsDialogRevocar {
  sesion: SesionResponse
  onActualizado: () => unknown
}

function DialogRevocarSesion({ sesion, onActualizado }: PropsDialogRevocar) {
  const [abierto, setAbierto] = useState(false)
  const [razon, setRazon] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useRevocarSesion({ onSuccess: onActualizado })

  async function confirmar() {
    if (!razon.trim()) {
      setError("La razon es obligatoria.")
      return
    }
    setError(null)
    try {
      await mutation.mutateAsync({
        sesionId: sesion.id,
        payload: { razon: razon.trim() },
      })
      toast.success("Sesion revocada")
      setAbierto(false)
      setRazon("")
    } catch (err) {
      const mensaje = extraerMensajeError(err, "No se pudo revocar la sesion.")
      setError(mensaje)
      toast.error(mensaje)
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={setAbierto}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Revocar sesion" className="rounded-none">
          <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none">
        <DialogHeader>
          <DialogTitle>Revocar sesion</DialogTitle>
          <DialogDescription>
            La sesion sera invalidada de inmediato. El usuario debera iniciar
            sesion nuevamente desde ese dispositivo.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="razon-revocar-sesion">Razon</FieldLabel>
            <Input
              className="rounded-none"
              id="razon-revocar-sesion"
              value={razon}
              onChange={(e) => setRazon(e.target.value)}
              placeholder="Por que se revoca esta sesion"
              maxLength={500}
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
            className="rounded-none"
            variant="ghost"
            onClick={() => setAbierto(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            className="rounded-none"
            variant="destructive"
            onClick={() => void confirmar()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Revocando..." : "Revocar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PropsSesionesActivasSeccion {
  cuentaId: string
}

export function SesionesActivasSeccion({
  cuentaId,
}: PropsSesionesActivasSeccion) {
  const sesiones = useSesionesCuenta(cuentaId)
  const items = sesiones.data?.datos ?? []

  return (
    <div className="space-y-3 border-t pt-6">
      <div>
        <h3 className="text-sm font-semibold">Sesiones activas</h3>
        <p className="text-xs text-muted-foreground">
          Dispositivos con sesion vigente. Revoca una sesion para cerrarla de
          inmediato.
        </p>
      </div>

      {sesiones.isLoading ? (
        <Skeleton className="rounded-none h-24 w-full" />
      ) : sesiones.isError ? (
        <p className="text-sm text-destructive">
          {extraerMensajeError(
            sesiones.error,
            "No se pudieron cargar las sesiones.",
          )}
        </p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Esta cuenta no tiene sesiones activas.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dispositivo</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>Iniciada</TableHead>
              <TableHead>Expira</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((sesion) => (
              <TableRow key={sesion.id}>
                <TableCell
                  className="max-w-[280px] truncate font-mono text-xs"
                  title={sesion.userAgent ?? undefined}
                >
                  {abreviarUserAgent(sesion.userAgent)}
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {sesion.ipAddress ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(sesion.emitidaEn).toLocaleString("es-PE")}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(sesion.expiraEn).toLocaleString("es-PE")}
                </TableCell>
                <TableCell className="text-right">
                  <DialogRevocarSesion
                    sesion={sesion}
                    onActualizado={sesiones.refetch}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
