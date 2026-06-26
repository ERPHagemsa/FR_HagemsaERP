"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileSignature } from "lucide-react"

import { extraerMensajeError } from "@/compartido/api/formato-error"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert"
import { Button } from "@/compartido/componentes/ui/button"
import { Input } from "@/compartido/componentes/ui/input"
import { Label } from "@/compartido/componentes/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet"
import { Separator } from "@/compartido/componentes/ui/separator"

import { useCrearContratoDesdeTarifarioMutation } from "../servicios/contratos-queries"

interface Props {
  idTarifario: string
}

// Boton + sheet para hacer nacer un contrato desde un tarifario. El contrato
// hereda el cliente y la cotizacion origen del tarifario; aqui solo se captura
// la vigencia (opcional). Se monta en el detalle del tarifario cuando este es
// VIGENTE, tiene cliente y aun no pertenece a un contrato.
export function CrearContratoDesdeTarifario({ idTarifario }: Props) {
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)
  const [vigenciaInicio, setVigenciaInicio] = useState("")
  const [vigenciaFin, setVigenciaFin] = useState("")
  const [error, setError] = useState<string | null>(null)

  const crear = useCrearContratoDesdeTarifarioMutation(idTarifario, {
    onError: (err) => setError(extraerMensajeError(err)),
  })

  function reiniciar() {
    setVigenciaInicio("")
    setVigenciaFin("")
    setError(null)
  }

  async function handleConfirmar() {
    setError(null)
    const resultado = await crear
      .mutateAsync({
        vigenciaInicio: vigenciaInicio || undefined,
        vigenciaFin: vigenciaFin || undefined,
      })
      .catch(() => null)
    if (resultado) {
      setAbierto(false)
      router.push(`/comercial/contratos/${resultado.id}`)
    }
  }

  return (
    <>
      <Button onClick={() => setAbierto(true)}>
        <FileSignature />
        Crear contrato
      </Button>

      <Sheet
        open={abierto}
        onOpenChange={(o) => {
          if (!o) {
            reiniciar()
            setAbierto(false)
          }
        }}
      >
        <SheetContent
          side="right"
          className="w-full gap-0 data-[side=right]:sm:max-w-md"
        >
          <SheetHeader className="border-b border-border">
            <SheetTitle>Crear contrato desde el tarifario</SheetTitle>
            <SheetDescription>
              El contrato heredara el cliente y la cotizacion origen de este
              tarifario, y quedara vinculado a el.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>No se pudo crear</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vig-ini">Vigencia inicio</Label>
                <Input
                  id="vig-ini"
                  type="date"
                  value={vigenciaInicio}
                  onChange={(e) => setVigenciaInicio(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vig-fin">Vigencia fin</Label>
                <Input
                  id="vig-fin"
                  type="date"
                  value={vigenciaFin}
                  onChange={(e) => setVigenciaFin(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Puedes dejar la vigencia en blanco y definirla luego.
            </p>
          </div>

          <Separator />
          <SheetFooter className="flex-row justify-end gap-2">
            <SheetClose asChild>
              <Button variant="outline" disabled={crear.isPending}>
                Cancelar
              </Button>
            </SheetClose>
            <Button onClick={handleConfirmar} disabled={crear.isPending}>
              {crear.isPending ? "Creando..." : "Crear contrato"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}
