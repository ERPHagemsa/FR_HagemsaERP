"use client"

import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { QrCode } from "lucide-react"

import { useConsulta } from "@/compartido/api/use-consulta"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import { resolverEtiquetaPorToken } from "@/modulos/activos/servicios/etiquetas-api"

/** Pagina publica que recibe el QR; la ficha completa sigue siendo solo lectura. */
export default function EtiquetaEscaneadaPage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const token = Array.isArray(params.token) ? params.token[0] : params.token
  const consulta = useConsulta(
    () => resolverEtiquetaPorToken(token),
    [token],
    { enabled: Boolean(token) },
  )

  useEffect(() => {
    if (consulta.data?.activo?.codigo) {
      router.replace(`/activos/${consulta.data.activo.codigo}`)
    }
  }, [consulta.data?.activo?.codigo, router])

  return (
    <main className="grid min-h-screen place-items-center bg-muted/30 p-5">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <QrCode className="size-5 text-primary" />
            <CardTitle>Etiqueta QR de activo</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {consulta.isLoading ? <Skeleton className="h-28 w-full" /> : null}
          {consulta.isError ? (
            <p className="text-sm text-destructive">
              Esta etiqueta no existe, fue anulada o no esta disponible.
            </p>
          ) : null}
          {consulta.data ? (
            consulta.data.activo ? (
              <>
                <div className="grid gap-1">
                  <span className="font-mono text-sm text-muted-foreground">
                    {consulta.data.codigo}
                  </span>
                  <strong>{consulta.data.activo.codigo}</strong>
                  <span className="text-sm text-muted-foreground">
                    {consulta.data.activo.descripcion}
                  </span>
                </div>
                <Button asChild>
                  <Link href={`/activos/${consulta.data.activo.codigo}`}>
                    Abrir ficha del activo
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">
                  Abriendo la ficha en modo lectura...
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Esta etiqueta fue generada, pero aun no esta vinculada a un activo.
              </p>
            )
          ) : null}
        </CardContent>
      </Card>
    </main>
  )
}
