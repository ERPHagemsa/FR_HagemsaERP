"use client"

import Link from "next/link"
import { Add01Icon } from "@hugeicons/core-free-icons"
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

import { useRoles } from "../ganchos/use-roles"

export function RolesVista() {
  const { data, isLoading, isError, error } = useRoles()

  return (
    <div className="flex flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Roles</CardTitle>
              <CardDescription>
                Catalogo de roles disponibles para asignar a las cuentas.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/admin/roles/nuevo">
                <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                Nuevo rol
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripcion</TableHead>
                <TableHead className="text-center">Permisos</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-6 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-destructive">
                    {error instanceof Error
                      ? error.message
                      : "No se pudieron cargar los roles."}
                  </TableCell>
                </TableRow>
              ) : data?.items && data.items.length > 0 ? (
                data.items.map((rol) => (
                  <TableRow key={rol.id}>
                    <TableCell className="font-medium">{rol.nombre}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {rol.descripcion}
                    </TableCell>
                    <TableCell className="text-center">
                      {rol.permisos.length}
                    </TableCell>
                    <TableCell>
                      <Badge variant={rol.esSistema ? "secondary" : "outline"}>
                        {rol.esSistema ? "Sistema" : "Custom"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/roles/${rol.id}`}>Ver</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <Empty>Aun no hay roles. Crea el primero para comenzar.</Empty>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
