"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon } from "@hugeicons/core-free-icons"

import { Badge } from "@/compartido/componentes/ui/badge"
import { Button } from "@/compartido/componentes/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card"
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

import { useCuentas } from "../ganchos/use-cuentas"
import type {
  EstadoCuenta,
  ListarCuentasQuery,
  TipoCuenta,
} from "../tipos/administracion.tipos"

const LIMIT_PAGINA = 20

function variantePorEstado(
  estado: EstadoCuenta,
): "default" | "secondary" | "destructive" | "outline" {
  switch (estado) {
    case "activo":
      return "default"
    case "suspendido":
      return "destructive"
    case "inactivo":
      return "secondary"
    default:
      return "outline"
  }
}

export function CuentasVista() {
  const [estado, setEstado] = useState<EstadoCuenta | "todos">("todos")
  const [tipoCuenta, setTipoCuenta] = useState<TipoCuenta | "todos">("todos")
  const [busqueda, setBusqueda] = useState("")
  // `pagina` es 1-based — coincide con el paginador del backend.
  const [pagina, setPagina] = useState(1)

  const query = useMemo<ListarCuentasQuery>(
    () => ({
      estado: estado === "todos" ? undefined : estado,
      tipoCuenta: tipoCuenta === "todos" ? undefined : tipoCuenta,
      busqueda: busqueda.trim() || undefined,
      pagina,
      limite: LIMIT_PAGINA,
    }),
    [estado, tipoCuenta, busqueda, pagina],
  )

  const { data, isLoading, isError, error } = useCuentas(query)

  function aplicarFiltros<T>(setter: (v: T) => void) {
    return (valor: T) => {
      setter(valor)
      setPagina(1)
    }
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Cuentas</CardTitle>
              <CardDescription>
                Listado de cuentas registradas en el sistema.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/cuentas/nueva">
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                Nueva cuenta
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <Input
              placeholder="Buscar por email o nombre..."
              value={busqueda}
              onChange={(e) =>
                aplicarFiltros<string>(setBusqueda)(e.target.value)
              }
              className="md:max-w-sm"
            />

            <Select
              value={estado}
              onValueChange={(v) =>
                aplicarFiltros<EstadoCuenta | "todos">(setEstado)(
                  v as EstadoCuenta | "todos",
                )
              }
            >
              <SelectTrigger className="md:w-44">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="suspendido">Suspendido</SelectItem>
                <SelectItem value="inactivo">Inactivo</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={tipoCuenta}
              onValueChange={(v) =>
                aplicarFiltros<TipoCuenta | "todos">(setTipoCuenta)(
                  v as TipoCuenta | "todos",
                )
              }
            >
              <SelectTrigger className="md:w-44">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                <SelectItem value="interno">Interno</SelectItem>
                <SelectItem value="cliente">Cliente</SelectItem>
                <SelectItem value="proveedor">Proveedor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Creada</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-destructive">
                    {error instanceof Error
                      ? error.message
                      : "No se pudieron cargar las cuentas."}
                  </TableCell>
                </TableRow>
              ) : data?.datos && data.datos.length > 0 ? (
                data.datos.map((cuenta) => (
                  <TableRow key={cuenta.id}>
                    <TableCell className="font-medium">
                      {cuenta.nombreCompleto}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {cuenta.email}
                    </TableCell>
                    <TableCell className="capitalize">
                      {cuenta.tipoCuenta}
                    </TableCell>
                    <TableCell>
                      <Badge variant={variantePorEstado(cuenta.estado)}>
                        {cuenta.estado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(cuenta.createdAt).toLocaleDateString("es-PE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/cuentas/${cuenta.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Empty>No hay cuentas que coincidan con los filtros.</Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {data && data.paginacion.totalPaginas > 1 ? (
            <div className="flex items-center justify-between gap-2 pt-2">
              <p className="text-sm text-muted-foreground">
                Pagina {data.paginacion.pagina} de{" "}
                {data.paginacion.totalPaginas} ({data.paginacion.total}{" "}
                cuentas)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  disabled={!data.paginacion.tieneAnterior}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagina((p) => p + 1)}
                  disabled={!data.paginacion.tieneSiguiente}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
