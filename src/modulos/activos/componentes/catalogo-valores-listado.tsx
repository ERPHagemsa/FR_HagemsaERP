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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/compartido/componentes/ui/dropdown-menu";
import { Input } from "@/compartido/componentes/ui/input";
import { Checkbox } from "@/compartido/componentes/ui/checkbox";
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
  const esCarroceria = tipoCatalogo === "CARROCERIA";
  const esTipoDocumento = tipoCatalogo === "TIPO_DOCUMENTO";
  const usaAbreviatura = esCarroceria || tipoCatalogo === "CLASE_VEHICULO";
  const longitudAbreviatura = esCarroceria ? 2 : 1;
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [claseVehiculoId, setClaseVehiculoId] = useState("");
  const [codigoAbreviado, setCodigoAbreviado] = useState("");
  const [alcance, setAlcance] = useState<"INDIVIDUAL" | "COMPARTIDO">("INDIVIDUAL");
  const [requiereVencimiento, setRequiereVencimiento] = useState(false);
  const [orden, setOrden] = useState("0");
  const [error, setError] = useState<string | null>(null);

  const clasesVehiculo = useValoresCatalogoQuery("CLASE_VEHICULO", true, undefined, {
    enabled: esCarroceria,
  });

  const crear = useCrearValorCatalogoMutation(tipoCatalogo, {
    onSuccess: () => {
      setError(null);
      setNombre("");
      setDescripcion("");
      setClaseVehiculoId("");
      setCodigoAbreviado("");
      setAlcance("INDIVIDUAL");
      setRequiereVencimiento(false);
      setOrden("0");
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
      setClaseVehiculoId("");
      setCodigoAbreviado("");
      setAlcance("INDIVIDUAL");
      setRequiereVencimiento(false);
      setOrden("0");
      onCerrar();
    }
  }

  function handleConfirmar() {
    const nombreLimpio = nombre.trim();
    if (!nombreLimpio) return;
    if (esCarroceria && !claseVehiculoId) return;
    if (usaAbreviatura && codigoAbreviado.trim().length !== longitudAbreviatura) return;

    setError(null);
    crear.mutate({
      nombre: nombreLimpio,
      descripcion: descripcion.trim() || undefined,
      claseVehiculoReferenciaId: esCarroceria ? Number(claseVehiculoId) : undefined,
      codigoAbreviado: usaAbreviatura ? codigoAbreviado.trim().toUpperCase() : undefined,
      alcance: esTipoDocumento ? alcance : undefined,
      requiereVencimiento: esTipoDocumento ? requiereVencimiento : undefined,
      orden: esTipoDocumento ? Number(orden) || 0 : undefined,
    });
  }

  const valido =
    nombre.trim().length > 0 &&
    (!esCarroceria || claseVehiculoId !== "") &&
    (!usaAbreviatura || codigoAbreviado.trim().length === longitudAbreviatura);

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

            {esCarroceria ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="form-clase-vehiculo">Clase de vehiculo</Label>
                <Select value={claseVehiculoId} onValueChange={setClaseVehiculoId}>
                  <SelectTrigger id="form-clase-vehiculo" className="w-full">
                    <SelectValue placeholder="Selecciona una clase" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clasesVehiculo.data ?? []).map((clase) => (
                      <SelectItem key={clase.id} value={String(clase.id)}>
                        {clase.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {usaAbreviatura ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="form-codigo-abreviado">
                  Abreviatura ({longitudAbreviatura} {longitudAbreviatura === 1 ? "letra" : "letras"})
                </Label>
                <Input
                  id="form-codigo-abreviado"
                  value={codigoAbreviado}
                  onChange={(e) => setCodigoAbreviado(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, longitudAbreviatura))}
                  placeholder={esCarroceria ? "Ej. CA" : "Ej. M"}
                  maxLength={longitudAbreviatura}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Solo se usa para codigos nuevos; no modifica activos ya creados.
                </p>
              </div>
            ) : null}

            {esTipoDocumento ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="form-alcance">Alcance</Label>
                  <Select value={alcance} onValueChange={(v) => setAlcance(v as "INDIVIDUAL" | "COMPARTIDO")}>
                    <SelectTrigger id="form-alcance" className="w-full">
                      <SelectValue placeholder="Selecciona el alcance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="COMPARTIDO">Compartido (Global)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2.5 py-1">
                  <Checkbox
                    id="form-requiere-vencimiento"
                    checked={requiereVencimiento}
                    onCheckedChange={(checked) => setRequiereVencimiento(!!checked)}
                  />
                  <Label htmlFor="form-requiere-vencimiento" className="cursor-pointer text-sm font-medium">
                    Requiere fecha de vencimiento
                  </Label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="form-orden">Orden de visualizacion</Label>
                  <Input
                    id="form-orden"
                    type="number"
                    value={orden}
                    onChange={(e) => setOrden(e.target.value)}
                    placeholder="Ej. 10"
                  />
                </div>
              </>
            ) : null}

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
  const esCarroceria = tipoCatalogo === "CARROCERIA";
  const esTipoDocumento = tipoCatalogo === "TIPO_DOCUMENTO";
  const usaAbreviatura = esCarroceria || tipoCatalogo === "CLASE_VEHICULO";
  const longitudAbreviatura = esCarroceria ? 2 : 1;
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [claseVehiculoId, setClaseVehiculoId] = useState("");
  const [codigoAbreviado, setCodigoAbreviado] = useState("");
  const [alcance, setAlcance] = useState<"INDIVIDUAL" | "COMPARTIDO">("INDIVIDUAL");
  const [requiereVencimiento, setRequiereVencimiento] = useState(false);
  const [orden, setOrden] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [itemActualId, setItemActualId] = useState<number | null>(null);

  const clasesVehiculo = useValoresCatalogoQuery("CLASE_VEHICULO", true, undefined, {
    enabled: esCarroceria,
  });

  // Resincronizar el formulario cuando entra otro item, sin useEffect
  // (ajuste de estado durante el render, mismo patron que catalogo-modalidades).
  const idEntrante = item?.id ?? null;
  if (idEntrante !== itemActualId) {
    setItemActualId(idEntrante);
    setNombre(item?.nombre ?? "");
    setDescripcion(item?.descripcion ?? "");
    setClaseVehiculoId(
      item?.claseVehiculoReferenciaId ? String(item.claseVehiculoReferenciaId) : ""
    );
    setCodigoAbreviado(item?.codigoAbreviado ?? "");
    setAlcance(item?.alcance ?? "INDIVIDUAL");
    setRequiereVencimiento(item?.requiereVencimiento ?? false);
    setOrden(String(item?.orden ?? 0));
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
    if (esCarroceria && !claseVehiculoId) return;
    if (usaAbreviatura && codigoAbreviado.trim().length !== longitudAbreviatura) return;

    setError(null);
    actualizar.mutate({
      id: item.id,
      payload: {
        nombre: nombreLimpio,
        descripcion: descripcion.trim(),
        claseVehiculoReferenciaId: esCarroceria ? Number(claseVehiculoId) : undefined,
        codigoAbreviado: usaAbreviatura ? codigoAbreviado.trim().toUpperCase() : undefined,
        alcance: esTipoDocumento ? alcance : undefined,
        requiereVencimiento: esTipoDocumento ? requiereVencimiento : undefined,
        orden: esTipoDocumento ? Number(orden) || 0 : undefined,
      },
    });
  }

  const valido =
    nombre.trim().length > 0 &&
    (!esCarroceria || claseVehiculoId !== "") &&
    (!usaAbreviatura || codigoAbreviado.trim().length === longitudAbreviatura);

  // El nombre de la clase seleccionada no se auto-rellena la primera vez: Radix
  // solo registra el texto de un SelectItem cuando este se monta (al abrir el
  // dropdown), y aqui el valor llega preseleccionado antes de abrirlo nunca.
  const claseSeleccionadaNombre =
    clasesVehiculo.data?.find((c) => String(c.id) === claseVehiculoId)?.nombre ??
    (claseVehiculoId !== "" && claseVehiculoId === String(item?.claseVehiculoReferenciaId ?? "")
      ? item?.claseVehiculoReferenciaNombre ?? undefined
      : undefined);

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

            {esCarroceria ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="form-editar-clase-vehiculo">Clase de vehiculo</Label>
                <Select value={claseVehiculoId} onValueChange={setClaseVehiculoId}>
                  <SelectTrigger id="form-editar-clase-vehiculo" className="w-full">
                    <SelectValue placeholder="Selecciona una clase">
                      {claseSeleccionadaNombre}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(clasesVehiculo.data ?? []).map((clase) => (
                      <SelectItem key={clase.id} value={String(clase.id)}>
                        {clase.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}

            {usaAbreviatura ? (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="form-editar-codigo-abreviado">
                  Abreviatura ({longitudAbreviatura} {longitudAbreviatura === 1 ? "letra" : "letras"})
                </Label>
                <Input
                  id="form-editar-codigo-abreviado"
                  value={codigoAbreviado}
                  onChange={(e) => setCodigoAbreviado(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, longitudAbreviatura))}
                  placeholder={esCarroceria ? "Ej. CA" : "Ej. M"}
                  maxLength={longitudAbreviatura}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  El cambio aplica solo a codigos que se generen desde ahora.
                </p>
              </div>
            ) : null}

            {esTipoDocumento ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="form-editar-alcance">Alcance</Label>
                  <Select value={alcance} onValueChange={(v) => setAlcance(v as "INDIVIDUAL" | "COMPARTIDO")}>
                    <SelectTrigger id="form-editar-alcance" className="w-full">
                      <SelectValue placeholder="Selecciona el alcance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="COMPARTIDO">Compartido (Global)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2.5 py-1">
                  <Checkbox
                    id="form-editar-requiere-vencimiento"
                    checked={requiereVencimiento}
                    onCheckedChange={(checked) => setRequiereVencimiento(!!checked)}
                  />
                  <Label htmlFor="form-editar-requiere-vencimiento" className="cursor-pointer text-sm font-medium">
                    Requiere fecha de vencimiento
                  </Label>
                </div>

                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="form-editar-orden">Orden de visualizacion</Label>
                  <Input
                    id="form-editar-orden"
                    type="number"
                    value={orden}
                    onChange={(e) => setOrden(e.target.value)}
                    placeholder="Ej. 10"
                  />
                </div>
              </>
            ) : null}

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
  const esCarroceria = tipoCatalogo === "CARROCERIA";
  const esTipoDocumento = tipoCatalogo === "TIPO_DOCUMENTO";
  const muestraAbreviatura = esCarroceria || tipoCatalogo === "CLASE_VEHICULO";
  const [estadoFiltro, setEstadoFiltro] = useState<"TODOS" | "true" | "false">(
    "true"
  );
  const [claseFiltro, setClaseFiltro] = useState("TODOS");
  const clasesVehiculo = useValoresCatalogoQuery("CLASE_VEHICULO", true, undefined, {
    enabled: esCarroceria,
  });
  const consulta = useValoresCatalogoQuery(
    tipoCatalogo,
    estadoFiltro === "TODOS" ? undefined : estadoFiltro === "true",
    esCarroceria && claseFiltro !== "TODOS" ? Number(claseFiltro) : undefined
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
    <section className="border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{titulo}</h2>
            <Badge variant="secondary" className="font-medium">
              {valores.length} {valores.length === 1 ? "registro" : "registros"}
            </Badge>
          </div>
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

      <div className="flex flex-col gap-4 p-4">
          {consulta.error ? (
            <Alert variant="destructive">
              <AlertTitle>No se pudo cargar la informacion</AlertTitle>
              <AlertDescription>{extraerMensajeError(consulta.error)}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 border border-border bg-muted/30 px-3 py-2">
            <span className="text-xs font-medium uppercase text-muted-foreground">Filtros</span>
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
            {esCarroceria ? (
              <div className="grid min-w-48 gap-1.5">
                <Select value={claseFiltro} onValueChange={setClaseFiltro}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Clase: Todas</SelectItem>
                    {(clasesVehiculo.data ?? []).map((clase) => (
                      <SelectItem key={clase.id} value={String(clase.id)}>
                        {clase.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          <div className="overflow-hidden border border-border">
            <Table className="w-full table-fixed [&_td]:px-3 [&_th]:px-3">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="w-[8%] text-center">Accion</TableHead>
                  <TableHead className="w-[20%]">Nombre</TableHead>
                  {muestraAbreviatura ? <TableHead className="w-[12%]">Abrev.</TableHead> : null}
                  {esCarroceria ? <TableHead className="w-[16%]">Clase</TableHead> : null}
                  {esTipoDocumento ? (
                    <>
                      <TableHead className="w-[15%]">Alcance</TableHead>
                      <TableHead className="w-[15%]">Req. Venc.</TableHead>
                      <TableHead className="w-[10%]">Orden</TableHead>
                    </>
                  ) : null}
                  <TableHead className={esCarroceria || esTipoDocumento ? "w-[22%]" : "w-[32%]"}>
                    Descripcion
                  </TableHead>
                  <TableHead className="w-[18%]">Estado</TableHead>
                  <TableHead className="w-[16%]">Modificado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {consulta.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={esCarroceria ? 7 : esTipoDocumento ? 8 : muestraAbreviatura ? 6 : 5}>
                        <Skeleton className="h-7 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : valores.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={esCarroceria ? 7 : esTipoDocumento ? 8 : muestraAbreviatura ? 6 : 5}
                      className="h-28 text-center text-muted-foreground"
                    >
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
                      {muestraAbreviatura ? (
                        <TableCell className="font-mono text-sm font-semibold">
                          {item.codigoAbreviado ?? "—"}
                        </TableCell>
                      ) : null}
                      {esCarroceria ? (
                        <TableCell className="truncate text-sm text-muted-foreground">
                          {item.claseVehiculoReferenciaNombre ?? "—"}
                        </TableCell>
                      ) : null}
                      {esTipoDocumento ? (
                        <>
                          <TableCell className="text-sm">
                            <Badge variant="outline">
                              {item.alcance === "COMPARTIDO" ? "Compartido" : "Individual"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {item.requiereVencimiento ? "Sí" : "No"}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {item.orden ?? 0}
                          </TableCell>
                        </>
                      ) : null}
                      <TableCell className="truncate text-sm text-muted-foreground">
                        {item.descripcion ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.estadoRegistro ? "default" : "secondary"}>
                          {item.estadoRegistro ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="truncate text-sm text-muted-foreground">
                        {new Date(item.fechaModificacion).toLocaleString("es-PE")}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
      </div>

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
