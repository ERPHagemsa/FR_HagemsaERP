"use client";

import { useState } from "react";

import { extraerMensajeError } from "@/compartido/api/formato-error";
import { Alert, AlertDescription, AlertTitle } from "@/compartido/componentes/ui/alert";
import { Badge } from "@/compartido/componentes/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import type { AccionHistorialCatalogo, TipoCatalogoMaestro } from "../../tipos/maestros.tipos";
import { useHistorialCatalogoQuery } from "../../servicios/maestros-queries";
import { CATALOGOS_MAESTROS } from "./catalogos-maestros.config";

function BadgeAccion({ accion }: { accion: AccionHistorialCatalogo }) {
  const variante =
    accion === "ELIMINACION" ? "destructive" : accion === "REGISTRO" ? "default" : "secondary";
  const etiqueta =
    accion === "REGISTRO" ? "Alta" : accion === "ELIMINACION" ? "Eliminacion" : "Modificacion";
  return <Badge variant={variante}>{etiqueta}</Badge>;
}

export function HistorialCatalogoListado() {
  const [tipoCatalogo, setTipoCatalogo] = useState<TipoCatalogoMaestro | "TODOS">("TODOS");
  const consulta = useHistorialCatalogoQuery(
    tipoCatalogo === "TODOS" ? undefined : { tipoCatalogo }
  );
  const historial = consulta.data ?? [];

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div>
          <CardTitle>Historial de cambios</CardTitle>
          <CardDescription>
            Auditoria de altas, modificaciones y eliminaciones de valores de catalogo.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-5">
        {consulta.error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo cargar el historial</AlertTitle>
            <AlertDescription>{extraerMensajeError(consulta.error)}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex flex-wrap items-end gap-3">
          <div className="grid min-w-56 gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Catalogo</span>
            <Select
              value={tipoCatalogo}
              onValueChange={(v) => setTipoCatalogo(v as TipoCatalogoMaestro | "TODOS")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TODOS">Todos</SelectItem>
                {CATALOGOS_MAESTROS.map((c) => (
                  <SelectItem key={c.tipoCatalogo} value={c.tipoCatalogo}>
                    {c.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border">
          <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[14%]">Fecha</TableHead>
                <TableHead className="w-[14%]">Catalogo</TableHead>
                <TableHead className="w-[12%]">Accion</TableHead>
                <TableHead className="w-[15%]">Valor anterior</TableHead>
                <TableHead className="w-[15%]">Valor nuevo</TableHead>
                <TableHead className="w-[20%]">Motivo</TableHead>
                <TableHead className="w-[10%]">Usuario</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consulta.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={7}>
                      <Skeleton className="h-7 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : historial.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground">
                    No hay movimientos registrados.
                  </TableCell>
                </TableRow>
              ) : (
                historial.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="truncate text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString("es-PE")}
                    </TableCell>
                    <TableCell className="truncate text-sm">
                      {CATALOGOS_MAESTROS.find((c) => c.tipoCatalogo === item.tipoCatalogo)
                        ?.titulo ?? item.tipoCatalogo}
                    </TableCell>
                    <TableCell>
                      <BadgeAccion accion={item.accion} />
                    </TableCell>
                    <TableCell className="truncate text-sm text-muted-foreground">
                      {item.valorAnterior ?? "—"}
                    </TableCell>
                    <TableCell className="truncate text-sm text-muted-foreground">
                      {item.valorNuevo ?? "—"}
                    </TableCell>
                    <TableCell className="truncate text-sm">{item.motivo ?? "—"}</TableCell>
                    <TableCell className="truncate text-sm text-muted-foreground">
                      {item.usuario ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
