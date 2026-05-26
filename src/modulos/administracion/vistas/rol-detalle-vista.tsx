"use client"

import { useMemo } from "react"
import Link from "next/link"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"

import { useRol } from "../ganchos/use-roles"

interface PropsRolDetalleVista {
  rolId: string
}

function agruparPermisos(
  permisos: ReadonlyArray<string>,
): Record<string, string[]> {
  const grupos: Record<string, string[]> = {}
  for (const codigo of permisos) {
    const partes = codigo.split(":")
    const modulo = partes[0] ?? "otros"
    if (!grupos[modulo]) grupos[modulo] = []
    grupos[modulo].push(codigo)
  }
  return grupos
}

export function RolDetalleVista({ rolId }: PropsRolDetalleVista) {
  const { data, isLoading, isError, error } = useRol(rolId)

  const gruposPermisos = useMemo(
    () => (data ? agruparPermisos(data.permisos) : {}),
    [data],
  )

  return (
    <div className="flex flex-col gap-4 p-6">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/roles">
            <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} />
            Volver a roles
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </CardContent>
        </Card>
      ) : isError ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              {error instanceof Error
                ? error.message
                : "No se pudo cargar el rol."}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : data ? (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{data.nombre}</CardTitle>
                <CardDescription>{data.descripcion}</CardDescription>
              </div>
              <Badge variant={data.esSistema ? "secondary" : "outline"}>
                {data.esSistema ? "Sistema" : "Custom"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 text-sm md:grid-cols-2">
              <div>
                <dt className="font-medium text-muted-foreground">ID</dt>
                <dd className="font-mono text-xs">{data.id}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">
                  Cantidad de permisos
                </dt>
                <dd>{data.permisos.length}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Creado</dt>
                <dd>{new Date(data.createdAt).toLocaleString("es-PE")}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">
                  Ultima actualizacion
                </dt>
                <dd>{new Date(data.updatedAt).toLocaleString("es-PE")}</dd>
              </div>
            </dl>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Permisos asignados</h3>
              {data.permisos.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Este rol no tiene permisos asignados todavia.
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(gruposPermisos).map(([modulo, permisos]) => (
                    <div key={modulo}>
                      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {modulo}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {permisos.map((p) => (
                          <Badge key={p} variant="outline" className="font-mono">
                            {p}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
