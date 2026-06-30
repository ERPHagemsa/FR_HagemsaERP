"use client";

import * as React from "react";
import { CornerDownRightIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog";
import { ScrollArea } from "@/compartido/componentes/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";
import { FieldSet, FieldLegend } from "@/compartido/componentes/ui/field";

import type { CatalogoCargoAdicional, OrigenTipo } from "../tipos/cotizaciones.tipos";
import type {
  DraftLinea,
  DraftSeccion,
} from "../servicios/cotizaciones-editor.utils";
import {
  lineaVacia,
  montoCargo,
  sincronizarRutaSeccion,
} from "../servicios/cotizaciones-editor.utils";
import { EditorCargos } from "./editor-cargos";
import { LineaDetalleDrawer } from "./linea-detalle-drawer";
import { TablaStandby } from "./tabla-standby";
import type { EntradaStandby } from "./tabla-standby";
import {
  claseBadgeTipo,
  etiquetaTipo,
  formatearMoneda,
  resumenDetalle,
  totalLinea,
} from "./lineas-grid.utils";

const COLUMNAS = 8;

type Props = {
  abierto: boolean;
  // Seccion a editar (copia de trabajo: el modal mantiene su propio borrador y solo
  // confirma con "Aplicar"). null cuando no hay nada abierto.
  seccion: DraftSeccion | null;
  moneda: string;
  opcionesCatalogo: CatalogoCargoAdicional[];
  disabled?: boolean;
  // Origen de la cotizacion: acota el precio sugerido al historial del cliente.
  clienteTipo?: OrigenTipo;
  clienteId?: string;
  onCerrar: () => void;
  onGuardar: (seccion: DraftSeccion) => void;
};

/**
 * Modal de edicion de una SECCION y sus lineas. Mismo lenguaje visual que la tabla
 * del detalle de la cotizacion (Concepto · Descripcion · Cant · P. base · P. venta ·
 * Stand by · Total), pero editable. La ruta (origen/destino) se captura UNA vez en la
 * cabecera de la seccion y todas las lineas de transporte la heredan; el detalle
 * polimorfico de cada linea vive en el drawer lateral (que ya no pide ruta).
 *
 * Controlado por confirmacion: trabaja sobre una copia local y emite onGuardar(seccion)
 * solo al pulsar "Aplicar"; "Cancelar" descarta los cambios.
 */
export function SeccionDetalleModal({
  abierto,
  seccion,
  moneda,
  opcionesCatalogo,
  disabled,
  clienteTipo,
  clienteId,
  onCerrar,
  onGuardar,
}: Props) {
  const [borrador, setBorrador] = React.useState<DraftSeccion | null>(seccion);
  const [claveActual, setClaveActual] = React.useState<string | null>(
    seccion?.claveCliente ?? null
  );

  // Edicion de una linea EXISTENTE (ya en la seccion).
  const [drawerClave, setDrawerClave] = React.useState<string | null>(null);
  // Alta de una linea NUEVA sin confirmar: vive fuera de la grilla hasta "Aplicar".
  const [nuevaLinea, setNuevaLinea] = React.useState<DraftLinea | null>(null);

  // Re-sincronizar el borrador cuando entra otra seccion (o null), sin useEffect:
  // patron de ajuste de estado durante el render recomendado por React.
  const claveEntrante = seccion?.claveCliente ?? null;
  if (claveEntrante !== claveActual) {
    setClaveActual(claveEntrante);
    setBorrador(seccion);
    setDrawerClave(null);
    setNuevaLinea(null);
  }

  if (!borrador) return null;

  const set = (patch: Partial<DraftSeccion>) =>
    setBorrador((b) => (b ? { ...b, ...patch } : b));

  const lineaExistente =
    borrador.lineas.find((l) => l.claveCliente === drawerClave) ?? null;
  const lineaDrawer = nuevaLinea ?? lineaExistente;
  const drawerAbierto = nuevaLinea !== null || drawerClave !== null;

  const subtotal =
    borrador.lineas.reduce((a, l) => a + totalLinea(l), 0) +
    borrador.cargosAdicionales.reduce((a, c) => a + montoCargo(c), 0) +
    borrador.lineas.reduce(
      (la, l) => la + l.cargosAdicionales.reduce((a, c) => a + montoCargo(c), 0),
      0
    );

  function actualizarLinea(clave: string, patch: Partial<DraftLinea>) {
    set({
      lineas: borrador!.lineas.map((l) =>
        l.claveCliente === clave ? { ...l, ...patch } : l
      ),
    });
  }

  function eliminarLinea(clave: string) {
    if (drawerClave === clave) setDrawerClave(null);
    set({ lineas: borrador!.lineas.filter((l) => l.claveCliente !== clave) });
  }

  function agregarLinea() {
    // La linea nueva nace con la ruta de la seccion (TRANSPORTE) ya heredada.
    const nueva = lineaVacia();
    nueva.carga = { ...nueva.carga, origen: borrador!.origen, destino: borrador!.destino };
    setNuevaLinea(nueva);
  }

  function cerrarDrawer() {
    setDrawerClave(null);
    setNuevaLinea(null);
  }

  function aplicarDrawer(linea: DraftLinea) {
    if (nuevaLinea) {
      set({ lineas: [...borrador!.lineas, linea] });
      setNuevaLinea(null);
      return;
    }
    actualizarLinea(linea.claveCliente, linea);
    setDrawerClave(null);
  }

  function aplicar() {
    // Sincroniza la ruta de la seccion en todas las lineas de transporte antes de emitir.
    onGuardar(sincronizarRutaSeccion(borrador!));
  }

  return (
    <Dialog open={abierto} onOpenChange={(v) => (!v ? onCerrar() : undefined)}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>
            {borrador.esDefecto ? "Lineas sin agrupar" : "Editar seccion"}
          </DialogTitle>
          <DialogDescription>
            La ruta se define a nivel de seccion: todas las lineas de transporte la heredan.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-5 p-6">
            {/* Cabecera editable de la seccion: nombre + ruta */}
            <div className="grid gap-4 sm:grid-cols-3">
              {!borrador.esDefecto ? (
                <Campo label="Nombre de la seccion" obligatorio>
                  <Input
                    value={borrador.nombre}
                    disabled={disabled}
                    placeholder="Ej: Tramo Lima - Mina"
                    onChange={(e) => set({ nombre: e.target.value })}
                  />
                </Campo>
              ) : null}
              <Campo label="Origen">
                <Input
                  value={borrador.origen}
                  disabled={disabled}
                  placeholder="Ej: Lima"
                  onChange={(e) => set({ origen: e.target.value })}
                />
              </Campo>
              <Campo label="Destino">
                <Input
                  value={borrador.destino}
                  disabled={disabled}
                  placeholder="Ej: Mina"
                  onChange={(e) => set({ destino: e.target.value })}
                />
              </Campo>
            </div>

            {/* Tabla de lineas — mismo lenguaje visual del detalle, editable */}
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-36">Tipo</TableHead>
                    <TableHead className="min-w-[180px]">Descripcion</TableHead>
                    <TableHead className="min-w-[160px]">Detalle</TableHead>
                    <TableHead className="w-16 text-right">Cant.</TableHead>
                    <TableHead className="w-24 text-right">P. base</TableHead>
                    <TableHead className="w-20 text-right">Margen %</TableHead>
                    <TableHead className="w-28 text-right">Total venta</TableHead>
                    <TableHead className="w-16 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {borrador.lineas.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell
                        colSpan={COLUMNAS}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        Sin lineas en esta seccion.
                      </TableCell>
                    </TableRow>
                  ) : (
                    borrador.lineas.map((linea) => (
                      <React.Fragment key={linea.claveCliente}>
                        <TableRow
                          className={`group align-middle ${
                            linea.cargosAdicionales.length > 0 ? "border-b-0" : ""
                          }`}
                        >
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`whitespace-nowrap font-medium ${claseBadgeTipo(linea.tipoLinea)}`}
                            >
                              {etiquetaTipo(linea.tipoLinea)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-8 border-transparent bg-transparent px-2 text-sm shadow-none hover:border-border focus-visible:border-border"
                              value={linea.descripcion}
                              placeholder="Descripcion del servicio"
                              disabled={disabled}
                              onChange={(e) =>
                                actualizarLinea(linea.claveCliente, { descripcion: e.target.value })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <button
                              type="button"
                              className="line-clamp-1 text-left text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                              onClick={() => setDrawerClave(linea.claveCliente)}
                              title="Editar detalle"
                            >
                              {resumenDetalle(linea)}
                            </button>
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-8 w-14 border-transparent bg-transparent px-2 text-right text-sm tabular-nums shadow-none hover:border-border focus-visible:border-border"
                              type="number"
                              min={1}
                              step="1"
                              value={linea.cantidad}
                              disabled={disabled}
                              onChange={(e) =>
                                actualizarLinea(linea.claveCliente, { cantidad: e.target.value })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-8 w-24 border-transparent bg-transparent px-2 text-right text-sm tabular-nums shadow-none hover:border-border focus-visible:border-border"
                              type="number"
                              min={0}
                              step="0.01"
                              value={linea.precioBase}
                              disabled={disabled}
                              onChange={(e) =>
                                actualizarLinea(linea.claveCliente, { precioBase: e.target.value })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              className="h-8 w-20 border-transparent bg-transparent px-2 text-right text-sm tabular-nums shadow-none hover:border-border focus-visible:border-border"
                              type="number"
                              min={0}
                              max={99.99}
                              step="0.01"
                              value={linea.margenPct}
                              disabled={disabled}
                              onChange={(e) =>
                                actualizarLinea(linea.claveCliente, { margenPct: e.target.value })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium tabular-nums">
                            {formatearMoneda(totalLinea(linea), moneda)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="size-8"
                                disabled={disabled}
                                onClick={() => setDrawerClave(linea.claveCliente)}
                                aria-label="Editar detalle"
                              >
                                <PencilIcon className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="size-8 text-destructive hover:text-destructive"
                                disabled={disabled}
                                onClick={() => eliminarLinea(linea.claveCliente)}
                                aria-label="Eliminar linea"
                              >
                                <Trash2Icon className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Sub-fila read-only: cargos de la linea (se editan en el drawer). */}
                        {linea.cargosAdicionales.length > 0 ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={COLUMNAS} className="py-1">
                              <div className="flex flex-col gap-0.5">
                                {linea.cargosAdicionales.map((c) => (
                                  <div
                                    key={c.claveCliente}
                                    className="flex items-center gap-2 text-xs text-muted-foreground"
                                  >
                                    <CornerDownRightIcon className="size-3 shrink-0 opacity-50" />
                                    <span className="truncate">
                                      {c.descripcion || "Sin descripcion"}
                                    </span>
                                    <span className="ml-auto shrink-0 font-mono tabular-nums">
                                      {parseFloat(c.cantidad) || 0} ×{" "}
                                      {parseFloat(c.precioUnitario) || 0} ={" "}
                                      {formatearMoneda(montoCargo(c), moneda)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              disabled={disabled}
              onClick={agregarLinea}
            >
              <PlusIcon data-icon="inline-start" />
              Agregar linea
            </Button>

            {/* Cargos adicionales de la seccion */}
            <FieldSet className="gap-2 rounded-xl border border-border bg-muted/10 px-4 pb-4 pt-1">
              <FieldLegend
                variant="label"
                className="px-1.5 font-semibold uppercase tracking-wide text-muted-foreground data-[variant=label]:text-xs"
              >
                Cargos adicionales de la seccion
              </FieldLegend>
              <EditorCargos
                cargos={borrador.cargosAdicionales}
                opcionesCatalogo={opcionesCatalogo}
                disabled={disabled}
                onChange={(cargos) => set({ cargosAdicionales: cargos })}
              />
            </FieldSet>

            {/* Stand by — informativo, su propia tabla (no suma al total). Se edita en
                el detalle de cada linea (drawer) y en los cargos; aca solo se resume. */}
            {entradasStandby(borrador).length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-border">
                <TablaStandby entradas={entradasStandby(borrador)} moneda={moneda} />
              </div>
            ) : null}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-border px-6 py-3">
          <span className="text-sm text-muted-foreground">
            Subtotal:{" "}
            <span className="font-mono font-semibold text-foreground tabular-nums">
              {formatearMoneda(subtotal, moneda)}
            </span>
          </span>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCerrar}>
              Cancelar
            </Button>
            <Button type="button" disabled={disabled} onClick={aplicar}>
              Aplicar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Drawer de detalle de linea — sin ruta (la define la seccion) */}
      <LineaDetalleDrawer
        abierto={drawerAbierto}
        linea={lineaDrawer}
        moneda={moneda}
        opcionesCatalogo={opcionesCatalogo}
        disabled={disabled}
        clienteTipo={clienteTipo}
        clienteId={clienteId}
        rutaSeccion={{ origen: borrador.origen, destino: borrador.destino }}
        onCerrar={cerrarDrawer}
        onGuardar={aplicarDrawer}
      />
    </Dialog>
  );
}

// Stand-by de la seccion (draft): lineas de transporte + cargos de linea + cargos de
// seccion con stand-by. Va en su propia tabla, separado del costo.
function entradasStandby(seccion: DraftSeccion): EntradaStandby[] {
  const entradas: EntradaStandby[] = [];
  for (const l of seccion.lineas) {
    if (l.tipoLinea === "TRANSPORTE" && l.standbyDia.trim() !== "") {
      entradas.push({
        concepto: l.descripcion || l.carga.tipoVehiculo || etiquetaTipo(l.tipoLinea),
        tipo: "Linea",
        precio: parseFloat(l.standbyDia) || 0,
      });
    }
    for (const c of l.cargosAdicionales) {
      if (c.standbyDia.trim() !== "") {
        entradas.push({
          concepto: c.descripcion || "Cargo",
          tipo: "Cargo de linea",
          precio: parseFloat(c.standbyDia) || 0,
        });
      }
    }
  }
  for (const c of seccion.cargosAdicionales) {
    if (c.standbyDia.trim() !== "") {
      entradas.push({
        concepto: c.descripcion || "Cargo",
        tipo: "Cargo de seccion",
        precio: parseFloat(c.standbyDia) || 0,
      });
    }
  }
  return entradas;
}

// ---------------------------------------------------------------------------
// Atomos
// ---------------------------------------------------------------------------

function Campo({
  label,
  obligatorio,
  children,
}: {
  label: string;
  obligatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label} {obligatorio ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
