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
import { LineaFormulario } from "./linea-formulario";
import { TablaStandby } from "./tabla-standby";
import type { EntradaStandby } from "./tabla-standby";
import {
  claseBadgeTipo,
  etiquetaTipo,
  formatearMoneda,
  resumenDetalle,
  totalLinea,
} from "./lineas-grid.utils";

const COLUMNAS = 5;

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
 * Modal de edicion de una SECCION y sus lineas. La ruta (origen/destino) se captura
 * UNA vez en la cabecera de la seccion y todas las lineas de transporte la heredan.
 * Las lineas se listan en una tabla resumen; al editar/crear una linea, su fila se
 * EXPANDE con el formulario completo (LineaFormulario) en el mismo modal — un solo
 * paso, sin abrir un drawer aparte.
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

  // Linea cuya fila esta expandida para editar su formulario completo (inline).
  const [expandidaClave, setExpandidaClave] = React.useState<string | null>(null);

  // Re-sincronizar el borrador cuando entra otra seccion (o null), sin useEffect:
  // patron de ajuste de estado durante el render recomendado por React.
  const claveEntrante = seccion?.claveCliente ?? null;
  if (claveEntrante !== claveActual) {
    setClaveActual(claveEntrante);
    setBorrador(seccion);
    setExpandidaClave(null);
  }

  if (!borrador) return null;

  const set = (patch: Partial<DraftSeccion>) =>
    setBorrador((b) => (b ? { ...b, ...patch } : b));

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
    if (expandidaClave === clave) setExpandidaClave(null);
    set({ lineas: borrador!.lineas.filter((l) => l.claveCliente !== clave) });
  }

  function agregarLinea() {
    // La linea nueva nace con la ruta de la seccion (TRANSPORTE) ya heredada y se
    // expande de inmediato para editarla en el mismo modal (un solo paso).
    const nueva = lineaVacia();
    nueva.carga = { ...nueva.carga, origen: borrador!.origen, destino: borrador!.destino };
    set({ lineas: [...borrador!.lineas, nueva] });
    setExpandidaClave(nueva.claveCliente);
  }

  function toggleExpandir(clave: string) {
    setExpandidaClave((c) => (c === clave ? null : clave));
  }

  function aplicar() {
    // Al nombrar la seccion deja de ser el bucket "sin agrupar" (esDefecto): se
    // convierte en una seccion normal con nombre. Luego sincroniza la ruta en las
    // lineas de transporte antes de emitir.
    const nombrada: DraftSeccion = {
      ...borrador!,
      esDefecto: borrador!.nombre.trim() !== "" ? false : borrador!.esDefecto,
    };
    onGuardar(sincronizarRutaSeccion(nombrada));
  }

  return (
    <Dialog open={abierto} onOpenChange={(v) => (!v ? onCerrar() : undefined)}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Editar seccion</DialogTitle>
          <DialogDescription>
            {borrador.esDefecto
              ? "Asigna un nombre y la ruta para agrupar estas lineas en una seccion."
              : "La ruta se define a nivel de seccion: todas las lineas de transporte la heredan."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-5 p-6">
            {/* Cabecera editable de la seccion: nombre + ruta (siempre con nombre:
                al editar el bucket "sin agrupar" se nombra y deja de ser plano). */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Campo label="Nombre de la seccion" obligatorio>
                <Input
                  value={borrador.nombre}
                  disabled={disabled}
                  placeholder="Ej: Tramo Lima - Mina"
                  onChange={(e) => set({ nombre: e.target.value })}
                />
              </Campo>
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

            {/* Tabla de lineas: resumen read-only; al editar/crear se EXPANDE la fila
                con el formulario completo de la linea (un solo paso, sin drawer). */}
            <div className="overflow-hidden rounded-xl border border-border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="w-36">Tipo</TableHead>
                    <TableHead className="min-w-[200px]">Descripcion</TableHead>
                    <TableHead className="min-w-[180px]">Detalle</TableHead>
                    <TableHead className="w-32 text-right">Total venta</TableHead>
                    <TableHead className="w-20 text-right">Acciones</TableHead>
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
                    borrador.lineas.map((linea) => {
                      const expandida = expandidaClave === linea.claveCliente;
                      const pegada = expandida || linea.cargosAdicionales.length > 0;
                      return (
                        <React.Fragment key={linea.claveCliente}>
                          <TableRow className={`group align-middle ${pegada ? "border-b-0" : ""}`}>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`whitespace-nowrap font-medium ${claseBadgeTipo(linea.tipoLinea)}`}
                              >
                                {etiquetaTipo(linea.tipoLinea)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {linea.descripcion || (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <button
                                type="button"
                                className="line-clamp-1 text-left text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                                onClick={() => toggleExpandir(linea.claveCliente)}
                                title="Editar linea"
                              >
                                {resumenDetalle(linea)}
                              </button>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm font-medium tabular-nums">
                              {formatearMoneda(totalLinea(linea), moneda)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-0.5">
                                <Button
                                  type="button"
                                  variant={expandida ? "secondary" : "ghost"}
                                  size="sm"
                                  className="size-8"
                                  disabled={disabled}
                                  onClick={() => toggleExpandir(linea.claveCliente)}
                                  aria-label="Editar linea"
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

                          {/* Resumen read-only de cargos (cuando la fila NO esta expandida) */}
                          {!expandida && linea.cargosAdicionales.length > 0 ? (
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

                          {/* Fila expandida: formulario completo de la linea (inline) */}
                          {expandida ? (
                            <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={COLUMNAS} className="bg-muted/20 p-4">
                                <LineaFormulario
                                  linea={linea}
                                  moneda={moneda}
                                  opcionesCatalogo={opcionesCatalogo}
                                  disabled={disabled}
                                  clienteTipo={clienteTipo}
                                  clienteId={clienteId}
                                  rutaSeccion={{ origen: borrador.origen, destino: borrador.destino }}
                                  onChange={(l) => actualizarLinea(l.claveCliente, l)}
                                />
                                <div className="mt-3 flex justify-end">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setExpandidaClave(null)}
                                  >
                                    Listo
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : null}
                        </React.Fragment>
                      );
                    })
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

            {/* Cargos adicionales — parte del contenido de la seccion (no es una caja aparte) */}
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Cargos adicionales de la seccion
              </p>
              <EditorCargos
                cargos={borrador.cargosAdicionales}
                opcionesCatalogo={opcionesCatalogo}
                disabled={disabled}
                onChange={(cargos) => set({ cargosAdicionales: cargos })}
              />
            </div>

            {/* Stand by — informativo, su propia tabla (no suma al total). Se edita en
                el formulario de cada linea y en los cargos; aca solo se resume. */}
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
            <Button
              type="button"
              disabled={disabled || borrador.nombre.trim() === ""}
              title={borrador.nombre.trim() === "" ? "Asigna un nombre a la seccion" : undefined}
              onClick={aplicar}
            >
              Aplicar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
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
