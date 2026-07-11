"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, KeyRound, Plus, Search } from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import { Empty } from "@/compartido/componentes/ui/empty"
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
  ToggleGroup,
  ToggleGroupItem,
} from "@/compartido/componentes/ui/toggle-group"
import { cn } from "@/compartido/utilidades/utils"

import { PiePaginacion } from "../componentes/paginacion-tabla"
import { useServiceClients } from "../ganchos/use-service-clients"
import type {
  EstadoServiceClient,
  ListarServiceClientsQuery,
  ServiceClientResponse,
} from "../tipos/administracion.tipos"

const LIMIT_PAGINA = 20
const COLUMNAS = 6

const PUNTO_ESTADO: Record<EstadoServiceClient, string> = {
  activo: "bg-emerald-500",
  suspendido: "bg-red-500",
}

function FilaCliente({ cliente }: { cliente: ServiceClientResponse }) {
  const router = useRouter()
  const href = `/admin/service-clients/${cliente.id}`
  const secretosActivos = cliente.secretos.filter((s) => s.activo).length

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
        <div className="font-mono text-sm font-medium">{cliente.clientId}</div>
      </TableCell>
      <TableCell className="text-muted-foreground">{cliente.nombre}</TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2 capitalize">
          <span
            className={cn(
              "size-1.5 rounded-md",
              PUNTO_ESTADO[cliente.estado] ?? "bg-zinc-400",
            )}
          />
          {cliente.estado}
        </span>
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground">
        {secretosActivos} activo{secretosActivos === 1 ? "" : "s"}
      </TableCell>
      <TableCell className="tabular-nums text-muted-foreground">
        {cliente.roles.length}
      </TableCell>
      <TableCell className="text-right">
        <ChevronRight className="ml-auto size-4 text-muted-foreground/60" />
      </TableCell>
    </TableRow>
  )
}

export function ServiceClientsVista() {
  const [estado, setEstado] = useState<EstadoServiceClient | "todos">("todos")
  const [busqueda, setBusqueda] = useState("")
  const [pagina, setPagina] = useState(1)
  const [limite, setLimite] = useState(LIMIT_PAGINA)

  const query = useMemo<ListarServiceClientsQuery>(
    () => ({
      estado: estado === "todos" ? undefined : estado,
      busqueda: busqueda.trim() || undefined,
      pagina,
      limite,
    }),
    [estado, busqueda, pagina, limite],
  )

  const { data, isLoading, isError, error } = useServiceClients(query)
  const total = data?.paginacion.total ?? 0

  return (
    <>
      <SiteHeader
        title="Clientes de servicio"
        breadcrumbs={[
          { title: "IAM y administración" },
          { title: "Clientes de servicio" },
        ]}
      />
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight">
                Clientes de servicio
              </h1>
              {data ? (
                <Badge variant="secondary" className="rounded-md tabular-nums">
                  {total}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">
              Identidades M2M para comunicación backend-a-backend (client credentials).
            </p>
          </div>
          <Button asChild className="rounded-md">
            <Link href="/admin/service-clients/nueva">
              <Plus />
              Nuevo
            </Link>
          </Button>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por clientId o nombre…"
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value)
                setPagina(1)
              }}
              className="rounded-md pl-9"
            />
          </div>

          <ToggleGroup
            type="single"
            value={estado}
            onValueChange={(v) => {
              setEstado((v as EstadoServiceClient | "todos") || "todos")
              setPagina(1)
            }}
            variant="outline"
            size="sm"
            className="rounded-md"
          >
            <ToggleGroupItem value="todos" className="first:rounded-l-md last:rounded-r-md">
              Todos
            </ToggleGroupItem>
            <ToggleGroupItem value="activo" className="first:rounded-l-md last:rounded-r-md">
              Activos
            </ToggleGroupItem>
            <ToggleGroupItem value="suspendido" className="first:rounded-l-md last:rounded-r-md">
              Suspendidos
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="overflow-hidden border">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Client ID</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Secretos</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={i} className="hover:bg-transparent [&>td]:py-1.5">
                      <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell />
                    </TableRow>
                  ))
                ) : isError ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={COLUMNAS} className="py-12 text-center text-sm text-destructive">
                      {error instanceof Error
                        ? error.message
                        : "No se pudieron cargar los clientes de servicio."}
                    </TableCell>
                  </TableRow>
                ) : data && data.datos.length > 0 ? (
                  data.datos.map((cliente) => (
                    <FilaCliente key={cliente.id} cliente={cliente} />
                  ))
                ) : (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={COLUMNAS} className="py-12">
                      <Empty className="gap-2">
                        <KeyRound className="size-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">
                          No hay clientes de servicio que coincidan con los filtros.
                        </p>
                      </Empty>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

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
    </>
  )
}
