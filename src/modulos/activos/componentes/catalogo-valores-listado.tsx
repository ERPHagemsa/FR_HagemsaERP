"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheck, CircleX, History, MoreVertical, Pencil, Plus } from "lucide-react";

import { extraerMensajeError } from "@/compartido/api/formato-error";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/compartido/componentes/ui/alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/compartido/componentes/ui/alert-dialog";
import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Card, CardContent } from "@/compartido/componentes/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/compartido/componentes/ui/sheet";
import { Separator } from "@/compartido/componentes/ui/separator";
import { Skeleton } from "@/compartido/componentes/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { Textarea } from "@/compartido/componentes/ui/textarea";
import type { TipoCatalogoMaestro, ValorCatalogo } from "../tipos/maestros.tipos";
import {
  useActualizarValorCatalogoMutation,
  useCambiarEstadoRegistroValorCatalogoMutation,
  useCrearValorCatalogoMutation,
  useValoresCatalogoQuery,
} from "../servicios/maestros-queries";

// ---------------------------------------------------------------------------
// Dialog — Nuevo valor
// ---------------------------------------------------------------------------

function DialogCrearValor({
  tipoCatalogo,
  abierto,
  onCerrar,
  onCreado,
}: {
  tipoCatalogo: TipoCatalogoMaestro;
  abierto: boolean;
  onCerrar: () => void;
  onCreado: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);

  const crear = useCrearValorCatalogoMutation(tipoCatalogo, {
    onSuccess: () => {
      setError(null);
      setNombre("");
      setDescripcion("");
      onCreado();
      onCerrar();
    },
    onError: (err) => setError(extraerMensajeError(err)),
  });

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null);
      setNombre("");
      setDescripcion("");
      onCerrar();
    }
  }

  function handleConfirmar() {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;

    setError(null);
    crear.mutate({
      nombre: nombreLimpio,
      descripcion: descripcion.trim() || undefined,
    });
  }

  const valido = nombre.trim().length > 0;

  return (
    <Sheet open={abierto} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Nuevo valor</SheetTitle>
          <SheetDescription>
            Completa los datos para crear un nuevo valor de catalogo.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>No se pudo crear el valor</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-nombre">Nombre</Label>
              <Input
                id="form-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Euro 6"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-descripcion">Descripcion (opcional)</Label>
              <Textarea
                id="form-descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripcion del valor"
                rows={2}
              />
            </div>
          </div>
        </div>

        <Separator />
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={crear.isPending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button onClick={handleConfirmar} disabled={crear.isPending || !valido}>
            {crear.isPending ? "Creando..." : "Crear"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Dialog — Editar valor
// ---------------------------------------------------------------------------

function DialogEditarValor({
  tipoCatalogo,
  item,
  onCerrar,
  onActualizado,
}: {
  tipoCatalogo: TipoCatalogoMaestro;
  item: ValorCatalogo | null;
  onCerrar: () => void;
  onActualizado: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [itemActualId, setItemActualId] = useState<number | null>(null);

  // Resincronizar el formulario cuando entra otro item, sin useEffect
  // (ajuste de estado durante el render, mismo patron que catalogo-modalidades).
  const idEntrante = item?.id ?? null;
  if (idEntrante !== itemActualId) {
    setItemActualId(idEntrante);
    setNombre(item?.nombre ?? "");
    setDescripcion(item?.descripcion ?? "");
    setError(null);
  }

  const actualizar = useActualizarValorCatalogoMutation(tipoCatalogo, {
    onSuccess: () => {
      setError(null);
      onActualizado();
      onCerrar();
    },
    onError: (err) => setError(extraerMensajeError(err)),
  });

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null);
      onCerrar();
    }
  }

  function handleConfirmar() {
    if (!item) return;
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;

    setError(null);
    actualizar.mutate({
      id: item.id,
      payload: { nombre: nombreLimpio, descripcion: descripcion.trim() },
    });
  }

  const valido = nombre.trim().length > 0;

  return (
    <Sheet open={item !== null} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Editar valor</SheetTitle>
          <SheetDescription>
            Modifica el nombre o la descripcion de este valor de catalogo.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6">
          {error ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>No se pudo actualizar el valor</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-editar-nombre">Nombre</Label>
              <Input
                id="form-editar-nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Euro 6"
                required
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="form-editar-descripcion">Descripcion (opcional)</Label>
              <Textarea
                id="form-editar-descripcion"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Descripcion del valor"
                rows={2}
              />
            </div>
          </div>
        </div>

        <Separator />
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button type="button" variant="outline" disabled={actualizar.isPending}>
              Cancelar
            </Button>
          </SheetClose>
          <Button onClick={handleConfirmar} disabled={actualizar.isPending || !valido}>
            {actualizar.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Dialog — Eliminar / Restaurar
// ---------------------------------------------------------------------------

function DialogCambiarEstadoRegistro({
  tipoCatalogo,
  item,
  onCerrar,
  onActualizado,
}: {
  tipoCatalogo: TipoCatalogoMaestro;
  item: ValorCatalogo | null;
  onCerrar: () => void;
  onActualizado: () => void;
}) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const vaAEliminar = item?.estadoRegistro === true;

  const mutacion = useCambiarEstadoRegistroValorCatalogoMutation(tipoCatalogo, {
    onSuccess: () => {
      setError(null);
      setMotivo("");
      onActualizado();
      onCerrar();
    },
    onError: (err) => setError(extraerMensajeError(err)),
  });

  function handleOpenChange(open: boolean) {
    if (!open) {
      setError(null);
      setMotivo("");
      onCerrar();
    }
  }

  function handleConfirmar() {
    if (!item) return;
    if (vaAEliminar && !motivo.trim()) {
      setError("El motivo es obligatorio para eliminar un valor de catalogo.");
      return;
    }

    setError(null);
    mutacion.mutate({
      id: item.id,
      payload: {
        estadoRegistro: !vaAEliminar,
        motivo: motivo.trim() || undefined,
      },
    });
  }

  return (
    <AlertDialog open={item !== null} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {vaAEliminar ? "Eliminar valor" : "Restaurar valor"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {vaAEliminar
              ? `"${item?.nombre}" quedara inactivo y no podra seleccionarse en nuevos registros. Esta accion queda registrada en el historial.`
              : `"${item?.nombre}" volvera a estar disponible para seleccionarse en nuevos registros.`}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="form-motivo">
            Motivo{vaAEliminar ? "" : " (opcional)"}
          </Label>
          <Textarea
            id="form-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Explica el motivo del cambio"
            rows={3}
            required={vaAEliminar}
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertTitle>No se pudo completar la accion</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={mutacion.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            variant={vaAEliminar ? "destructive" : "default"}
            onClick={handleConfirmar}
            disabled={mutacion.isPending}
          >
            {mutacion.isPending
              ? "Procesando..."
              : vaAEliminar
                ? "Eliminar"
                : "Restaurar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

interface PropsCatalogoValoresListado {
  tipoCatalogo: TipoCatalogoMaestro;
  titulo: string;
  permiteCrear?: boolean;
  notaSoloLectura?: string;
}

export function CatalogoValoresListado({
  tipoCatalogo,
  titulo,
  permiteCrear = true,
  notaSoloLectura,
}: PropsCatalogoValoresListado) {
  const [estadoFiltro, setEstadoFiltro] = useState<"TODOS" | "true" | "false">(
    "true"
  );
  const consulta = useValoresCatalogoQuery(
    tipoCatalogo,
    estadoFiltro === "TODOS" ? undefined : estadoFiltro === "true"
  );
  const valores = consulta.data ?? [];

  const [dialogCrearAbierto, setDialogCrearAbierto] = useState(false);
  const [itemEditando, setItemEditando] = useState<ValorCatalogo | null>(null);
  const [itemCambiandoEstado, setItemCambiandoEstado] =
    useState<ValorCatalogo | null>(null);

  function handleRefetch() {
    void consulta.refetch();
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <p className="text-sm text-muted-foreground">
            {valores.length} {valores.length === 1 ? "registro" : "registros"}
            {notaSoloLectura ? ` · ${notaSoloLectura}` : ""}
          </p>
        </div>
        {permiteCrear ? (
          <Button onClick={() => setDialogCrearAbierto(true)}>
            <Plus />
            Nuevo valor
          </Button>
        ) : null}
      </div>

      <Card>
        <CardContent className="flex flex-col gap-4 pt-5">
          {consulta.error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar la informacion</AlertTitle>
              <AlertDescription>{extraerMensajeError(consulta.error)}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-end gap-3">
            <div className="grid min-w-36 gap-1.5">
              <Select value={estadoFiltro} onValueChange={(v) => setEstadoFiltro(v as typeof estadoFiltro)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Estado: Todos</SelectItem>
                  <SelectItem value="true">Activos</SelectItem>
                  <SelectItem value="false">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border">
            <Table className="w-full table-fixed [&_td]:px-2 [&_th]:px-2">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[8%] text-center">Accion</TableHead>
                  <TableHead className="w-[30%]">Nombre</TableHead>
                  <TableHead className="w-[38%]">Descripcion</TableHead>
                  <TableHead className="w-[24%]">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-7 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : valores.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-28 text-center text-muted-foreground">
                      No hay valores para los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  valores.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="outline"
                              aria-label={`Acciones de ${item.nombre}`}
                            >
                              <MoreVertical />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="min-w-48">
                            <DropdownMenuGroup>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/activos/maestros/${tipoCatalogo}/${item.id}/historial`}
                                >
                                  <History />
                                  Auditar
                                </Link>
                              </DropdownMenuItem>
                              {permiteCrear ? (
                                <DropdownMenuItem onSelect={() => setItemEditando(item)}>
                                  <Pencil />
                                  Editar
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant={item.estadoRegistro ? "destructive" : "default"}
                                onSelect={() => setItemCambiandoEstado(item)}
                              >
                                {item.estadoRegistro ? <CircleX /> : <CircleCheck />}
                                {item.estadoRegistro ? "Eliminar" : "Restaurar"}
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                      <TableCell className="truncate text-sm font-medium">{item.nombre}</TableCell>
                      <TableCell className="truncate text-sm text-muted-foreground">
                        {item.descripcion ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.estadoRegistro ? "default" : "secondary"}>
                          {item.estadoRegistro ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <DialogCrearValor
        tipoCatalogo={tipoCatalogo}
        abierto={dialogCrearAbierto}
        onCerrar={() => setDialogCrearAbierto(false)}
        onCreado={handleRefetch}
      />
      <DialogEditarValor
        tipoCatalogo={tipoCatalogo}
        item={itemEditando}
        onCerrar={() => setItemEditando(null)}
        onActualizado={handleRefetch}
      />
      <DialogCambiarEstadoRegistro
        tipoCatalogo={tipoCatalogo}
        item={itemCambiandoEstado}
        onCerrar={() => setItemCambiandoEstado(null)}
        onActualizado={handleRefetch}
      />
    </section>
  );
}
