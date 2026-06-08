"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ChevronRight, Plus, Search, Users } from "lucide-react"

import { SiteHeader } from "@/compartido/componentes/site-header"

import {
  Avatar,
  AvatarFallback,
} from "@/compartido/componentes/ui/avatar"
import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import { Empty } from "@/compartido/componentes/ui/empty"
import { Input } from "@/compartido/componentes/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select"
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
import { useCuentas } from "../ganchos/use-cuentas"
import type {
  CuentaResponse,
  EstadoCuenta,
  ListarCuentasQuery,
  TipoCuenta,
} from "../tipos/administracion.tipos"

const LIMIT_PAGINA = 20
const COLUMNAS = 7

// Punto de color del estado — verde (activo), rojo (suspendido), gris (inactivo).
const PUNTO_ESTADO: Record<EstadoCuenta, string> = {
  activo: "bg-emerald-500",
  suspendido: "bg-red-500",
  inactivo: "bg-zinc-400",
}

function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  if (partes.length === 0) return "?"
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase()
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase()
}

function FilaCuenta({ cuenta }: { cuenta: CuentaResponse }) {
  const router = useRouter()
  const href = `/admin/cuentas/${cuenta.id}`
  const inactiva = cuenta.estado === "inactivo"

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
          <Avatar size="sm" className="rounded-md after:rounded-md">
            <AvatarFallback className="rounded-md bg-primary/10 text-xs font-medium text-primary">
              {iniciales(cuenta.nombreCompleto)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div
              className={cn(
                "truncate font-medium",
                inactiva && "text-muted-foreground line-through",
              )}
            >
              {cuenta.nombreCompleto}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell
        className={cn("text-muted-foreground", inactiva && "line-through")}
      >
        {cuenta.nombreUsuario ? `@${cuenta.nombreUsuario}` : "—"}
      </TableCell>
      <TableCell
        className={cn("text-muted-foreground", inactiva && "line-through")}
      >
        {cuenta.email}
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="rounded-md font-normal capitalize">
          {cuenta.tipoCuenta}
        </Badge>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-2 capitalize">
          <span
            className={cn(
              "size-1.5 rounded-md",
              PUNTO_ESTADO[cuenta.estado] ?? "bg-zinc-400",
            )}
          />
          {cuenta.estado}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground tabular-nums">
        {new Date(cuenta.createdAt).toLocaleDateString("es-PE")}
      </TableCell>
      <TableCell className="text-right">
        <ChevronRight className="ml-auto size-4 text-muted-foreground/60" />
      </TableCell>
    </TableRow>
  )
}

export function CuentasVista() {
  const [estado, setEstado] = useState<EstadoCuenta | "todos">("todos")
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta | "todos">("todos")
  const [busqueda, setBusqueda] = useState("")
  // `pagina` es 1-based — coincide con el paginador del backend.
  const [pagina, setPagina] = useState(1)
  const [limite, setLimite] = useState(LIMIT_PAGINA)

  const query = useMemo<ListarCuentasQuery>(
    () => ({
      estado: estado === "todos" ? undefined : estado,
      tipoCuenta: tipoCuenta === "todos" ? undefined : tipoCuenta,
      busqueda: busqueda.trim() || undefined,
      pagina,
      limite,
    }),
    [estado, tipoCuenta, busqueda, pagina, limite],
  )

  const { data, isLoading, isError, error } = useCuentas(query)

  function aplicarFiltro<T>(setter: (v: T) => void) {
    return (valor: T) => {
      setter(valor)
      setPagina(1)
    }
  }

  const total = data?.paginacion.total ?? 0

  return (
    <>
      <SiteHeader
        title="Cuentas"
        breadcrumbs={[
          { title: "IAM y administración" },
          { title: "Cuentas" },
        ]}
      />
      <div className="flex flex-col gap-6 p-6">
      {/* Cabecera */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight">Cuentas</h1>
            {data ? (
              <Badge variant="secondary" className="rounded-md tabular-nums">
                {total}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            Gestiona las cuentas registradas y sus accesos.
          </p>
        </div>
        <Button asChild className="rounded-md">
          <Link href="/admin/cuentas/nueva">
            <Plus />
            Nuevo
          </Link>
        </Button>
      </div>

      {/* Barra de herramientas */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full lg:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, usuario o email…"
            value={busqueda}
            onChange={(e) => aplicarFiltro<string>(setBusqueda)(e.target.value)}
            className="rounded-md pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup
            type="single"
            value={estado}
            onValueChange={(v) =>
              aplicarFiltro<EstadoCuenta | "todos">(setEstado)(
                (v as EstadoCuenta | "todos") || "todos",
              )
            }
            variant="outline"
            size="sm"
            className="rounded-md"
          >
            <ToggleGroupItem
              value="todos"
              className="first:rounded-l-md last:rounded-r-md"
            >
              Todos
            </ToggleGroupItem>
            <ToggleGroupItem
              value="activo"
              className="first:rounded-l-md last:rounded-r-md"
            >
              Activos
            </ToggleGroupItem>
            <ToggleGroupItem
              value="suspendido"
              className="first:rounded-l-md last:rounded-r-md"
            >
              Suspendidos
            </ToggleGroupItem>
            <ToggleGroupItem
              value="inactivo"
              className="first:rounded-l-md last:rounded-r-md"
            >
              Inactivos
            </ToggleGroupItem>
          </ToggleGroup>

          <Select
            value={tipoCuenta}
            onValueChange={(v) =>
              aplicarFiltro<TipoCuenta | "todos">(setTipoCuenta)(
                v as TipoCuenta | "todos",
              )
            }
          >
            <SelectTrigger size="sm" className="w-40 rounded-md">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent className="rounded-md">
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="interno">Interno</SelectItem>
              <SelectItem value="cliente">Cliente</SelectItem>
              <SelectItem value="proveedor">Proveedor</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Cuenta</TableHead>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i} className="hover:bg-transparent [&>td]:py-1.5">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Skeleton className="size-6 rounded-md" />
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
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
                      : "No se pudieron cargar las cuentas."}
                  </TableCell>
                </TableRow>
              ) : data && data.datos.length > 0 ? (
                data.datos.map((cuenta) => (
                  <FilaCuenta key={cuenta.id} cuenta={cuenta} />
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={COLUMNAS} className="py-12">
                    <Empty className="gap-2">
                      <Users className="size-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        No hay cuentas que coincidan con los filtros.
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
    </>
  )
}
