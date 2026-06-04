"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Plus, ShieldCheck } from "lucide-react"

import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import { Empty } from "@/compartido/componentes/ui/empty"
import { Skeleton } from "@/compartido/componentes/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table"

import { PiePaginacion } from "../componentes/paginacion-tabla"
import { useRoles } from "../ganchos/use-roles"
import type {
  ListarRolesQuery,
  RolResponse,
} from "../tipos/administracion.tipos"

const LIMIT_PAGINA = 20
const COLUMNAS = 5

function FilaRol({ rol }: { rol: RolResponse }) {
  const router = useRouter()
  const href = `/admin/roles/${rol.id}`

  return (
    <TableRow
      tabIndex={0}
      onClick={() => router.push(href)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          router.push(href)
        }
      }}
      className="cursor-pointer focus-visible:bg-muted/60 focus-visible:outline-none [&>td]:py-1.5"
    >
      <TableCell>
        <div className="flex items-center gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-none bg-primary/10 text-primary">
            <ShieldCheck className="size-4" />
          </span>
          <span className="font-medium">{rol.nombre}</span>
        </div>
      </TableCell>
      <TableCell className="max-w-sm truncate text-muted-foreground">
        {rol.descripcion}
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {rol.permisos.length}
      </TableCell>
      <TableCell>
        <Badge
          variant={rol.esSistema ? "secondary" : "outline"}
          className="rounded-none font-normal"
        >
          {rol.esSistema ? "Sistema" : "Custom"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <ChevronRight className="ml-auto size-4 text-muted-foreground/60" />
      </TableCell>
    </TableRow>
  )
}

export function RolesVista() {
  // `pagina` es 1-based — coincide con el paginador del backend.
  const [pagina, setPagina] = useState(1)
  const [limite, setLimite] = useState(LIMIT_PAGINA)

  const query = useMemo<ListarRolesQuery>(
    () => ({ pagina, limite }),
    [pagina, limite],
  )

  const { data, isLoading, isError, error } = useRoles(query)

  const total = data?.paginacion.total ?? 0

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
            {data ? (
              <Badge variant="secondary" className="rounded-none tabular-nums">
                {total}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Catálogo de roles disponibles para asignar a las cuentas.
          </p>
        </div>
        <Button asChild className="rounded-none">
          <Link href="/admin/roles/nuevo">
            <Plus />
            Nuevo rol
          </Link>
        </Button>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Rol</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent [&>td]:py-1.5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-7 rounded-none" />
                        <Skeleton className="rounded-none h-4 w-32" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="rounded-none h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="rounded-none h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="rounded-none h-4 w-16" />
                    </TableCell>
                    <TableCell />
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={COLUMNAS}
                    className="py-12 text-center text-sm text-destructive"
                  >
                    {error instanceof Error
                      ? error.message
                      : "No se pudieron cargar los roles."}
                  </TableCell>
                </TableRow>
              ) : data && data.datos.length > 0 ? (
                data.datos.map((rol) => <FilaRol key={rol.id} rol={rol} />)
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLUMNAS} className="py-12">
                    <Empty className="gap-2">
                      <ShieldCheck className="size-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        Aún no hay roles. Crea el primero para comenzar.
                      </p>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pie: rango + paginacion */}
        {data && total > 0 ? (
          <PiePaginacion
            pagina={pagina}
            limite={limite}
            total={total}
            onPagina={setPagina}
            onLimite={(l) => {
              setLimite(l)
              setPagina(1)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
