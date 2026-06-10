"use client";

import * as React from "react";

import { Button } from "@/compartido/componentes/ui/button";
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

import type { TipoLinea } from "../tipos/cotizaciones.tipos";
import type { DraftLinea } from "../servicios/cotizaciones-editor.utils";
import { ModalidadSelector } from "./modalidad-selector";
import { TIPOS_LINEA, formatearMoneda } from "./lineas-grid.utils";

type Props = {
  abierto: boolean;
  linea: DraftLinea | null;
  moneda: string;
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  onCerrar: () => void;
  onGuardar: (linea: DraftLinea) => void;
};

/**
 * Drawer lateral de detalle de linea. Edita tipo, modalidad, descripcion, ruta,
 * cantidad, precio y el subform polimorfico segun el tipo. La grilla solo edita
 * los campos rapidos inline; todo lo "rico" vive aca para no romper la densidad.
 *
 * El borrador es local: se confirma con "Aplicar" y se descarta al cerrar.
 */
export function LineaDetalleDrawer({
  abierto,
  linea,
  moneda,
  erroresCampo = {},
  disabled,
  onCerrar,
  onGuardar,
}: Props) {
  const [borrador, setBorrador] = React.useState<DraftLinea | null>(linea);
  const [claveActual, setClaveActual] = React.useState<string | null>(
    linea?.claveCliente ?? null
  );

  // Re-sincronizar el borrador cuando entra otra linea (o null), sin useEffect:
  // patron de ajuste de estado durante el render recomendado por React.
  const claveEntrante = linea?.claveCliente ?? null;
  if (claveEntrante !== claveActual) {
    setClaveActual(claveEntrante);
    setBorrador(linea);
  }

  if (!borrador) return null;

  const set = (patch: Partial<DraftLinea>) =>
    setBorrador((b) => (b ? { ...b, ...patch } : b));

  const total =
    (parseFloat(borrador.cantidad) || 0) * (parseFloat(borrador.precioUnitario) || 0);

  return (
    <Sheet open={abierto} onOpenChange={(v) => (!v ? onCerrar() : undefined)}>
      {/* El ancho lo fija el primitivo con `data-[side=right]:sm:max-w-sm`. Para
          pisarlo hay que usar EL MISMO prefijo de variante; un `sm:max-w-*` plano
          no lo deduplica twMerge y pierde por especificidad. */}
      {/* <SheetContent side="right" className="w-full gap-0 sm:max-w-3xl"> */}
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-lg">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Detalle de la linea</SheetTitle>
          <SheetDescription>
            Campos especificos segun el tipo de servicio.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex flex-col gap-5">
            {/* Tipo de linea — fila propia */}
            <Campo label="Tipo de linea" obligatorio>
              <Select
                value={borrador.tipoLinea}
                disabled={disabled}
                // Al cambiar el tipo, la modalidad anterior deja de aplicar
                // (las modalidades se filtran por tipo): la limpiamos.
                onValueChange={(v) =>
                  set({ tipoLinea: v as TipoLinea, idModalidad: "" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_LINEA.map((t) => (
                    <SelectItem key={t.valor} value={t.valor}>
                      {t.etiqueta}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Campo>

            {/* Modalidad — fila propia a ancho completo (su contenido
                `codigo — nombre` no entra bien en media fila). */}
            <Campo label="Modalidad" obligatorio error={erroresCampo.idModalidad}>
              <ModalidadSelector
                name="__modalidad__"
                value={borrador.idModalidad}
                tipoLinea={borrador.tipoLinea}
                disabled={disabled}
                onValueChange={(id) => set({ idModalidad: id })}
              />
            </Campo>

            <Campo label="Descripcion" obligatorio error={erroresCampo.descripcion}>
              <Input
                value={borrador.descripcion}
                disabled={disabled}
                placeholder="Descripcion del servicio"
                aria-invalid={Boolean(erroresCampo.descripcion)}
                onChange={(e) => set({ descripcion: e.target.value })}
              />
            </Campo>

            {/* Ruta — solo transporte */}
            {borrador.tipoLinea === "TRANSPORTE" ? (
              <Grupo titulo="Ruta">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Campo label="Origen">
                    <Input
                      value={borrador.carga.origen}
                      disabled={disabled}
                      placeholder="Ej: Lima"
                      onChange={(e) =>
                        set({ carga: { ...borrador.carga, origen: e.target.value } })
                      }
                    />
                  </Campo>
                  <Campo label="Destino">
                    <Input
                      value={borrador.carga.destino}
                      disabled={disabled}
                      placeholder="Ej: Mina"
                      onChange={(e) =>
                        set({ carga: { ...borrador.carga, destino: e.target.value } })
                      }
                    />
                  </Campo>
                </div>
              </Grupo>
            ) : null}

            {/* Cantidad + precio */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Cantidad" error={erroresCampo.cantidad}>
                <Input
                  type="number"
                  min={1}
                  step="1"
                  value={borrador.cantidad}
                  disabled={disabled}
                  aria-invalid={Boolean(erroresCampo.cantidad)}
                  onChange={(e) => set({ cantidad: e.target.value })}
                />
              </Campo>
              <Campo label="Precio unitario" obligatorio error={erroresCampo.precioUnitario}>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={borrador.precioUnitario}
                  disabled={disabled}
                  aria-invalid={Boolean(erroresCampo.precioUnitario)}
                  onChange={(e) => set({ precioUnitario: e.target.value })}
                />
              </Campo>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
              <span className="text-sm text-muted-foreground">Total de la linea</span>
              <span className="font-mono text-base font-semibold tabular-nums">
                {formatearMoneda(total, moneda)}
              </span>
            </div>

            {/* Subform polimorfico */}
            {borrador.tipoLinea === "TRANSPORTE" ? (
              <Grupo titulo="Datos de carga">
                <div className="grid gap-3 sm:grid-cols-3">
                  <CampoMini label="Vehiculo" value={borrador.carga.tipoVehiculo} disabled={disabled} onChange={(v) => set({ carga: { ...borrador.carga, tipoVehiculo: v } })} />
                  <CampoMini label="Peso (Tn)" tipo="number" value={borrador.carga.pesoTn} disabled={disabled} onChange={(v) => set({ carga: { ...borrador.carga, pesoTn: v } })} />
                  <CampoMini label="Largo (m)" tipo="number" value={borrador.carga.largoM} disabled={disabled} onChange={(v) => set({ carga: { ...borrador.carga, largoM: v } })} />
                  <CampoMini label="Ancho (m)" tipo="number" value={borrador.carga.anchoM} disabled={disabled} onChange={(v) => set({ carga: { ...borrador.carga, anchoM: v } })} />
                  <CampoMini label="Alto (m)" tipo="number" value={borrador.carga.altoM} disabled={disabled} onChange={(v) => set({ carga: { ...borrador.carga, altoM: v } })} />
                </div>
              </Grupo>
            ) : null}

            {borrador.tipoLinea === "ALQUILER_EQUIPO" ? (
              <Grupo titulo="Datos de equipo">
                <div className="grid gap-3 sm:grid-cols-3">
                  <CampoMini label="Tipo de equipo" value={borrador.equipo.equipoTipo} disabled={disabled} onChange={(v) => set({ equipo: { ...borrador.equipo, equipoTipo: v } })} />
                  <CampoMini label="Marca" value={borrador.equipo.marca} disabled={disabled} onChange={(v) => set({ equipo: { ...borrador.equipo, marca: v } })} />
                  <CampoMini label="Modelo" value={borrador.equipo.modelo} disabled={disabled} onChange={(v) => set({ equipo: { ...borrador.equipo, modelo: v } })} />
                  <CampoMini label="Capacidad" value={borrador.equipo.capacidad} disabled={disabled} onChange={(v) => set({ equipo: { ...borrador.equipo, capacidad: v } })} />
                  <CampoMini label="Horas minimas" tipo="number" value={borrador.equipo.horasMinimas} disabled={disabled} onChange={(v) => set({ equipo: { ...borrador.equipo, horasMinimas: v } })} />
                  <CampoMini label="Dias contrato min." tipo="number" value={borrador.equipo.diasContratoMin} disabled={disabled} onChange={(v) => set({ equipo: { ...borrador.equipo, diasContratoMin: v } })} />
                </div>
              </Grupo>
            ) : null}

            {borrador.tipoLinea === "ALMACENAJE" ? (
              <Grupo titulo="Datos de almacenaje">
                <div className="grid gap-3 sm:grid-cols-2">
                  <CampoMini label="Area (m2)" tipo="number" value={borrador.almacenaje.areaM2} disabled={disabled} onChange={(v) => set({ almacenaje: { ...borrador.almacenaje, areaM2: v } })} />
                  <CampoMini label="Periodo (dias)" tipo="number" value={borrador.almacenaje.periodoDias} disabled={disabled} onChange={(v) => set({ almacenaje: { ...borrador.almacenaje, periodoDias: v } })} />
                </div>
              </Grupo>
            ) : null}

            {borrador.tipoLinea === "PERSONAL" ? (
              <Grupo titulo="Datos de personal">
                <div className="grid gap-3 sm:grid-cols-2">
                  <CampoMini label="Rol" value={borrador.personal.rol} disabled={disabled} onChange={(v) => set({ personal: { ...borrador.personal, rol: v } })} />
                </div>
              </Grupo>
            ) : null}
          </div>
        </div>

        <Separator />
        <SheetFooter className="flex-row justify-end gap-2">
          <SheetClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </SheetClose>
          <Button type="button" disabled={disabled} onClick={() => onGuardar(borrador)}>
            Aplicar
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// Helpers presentacionales
// ---------------------------------------------------------------------------

function Campo({
  label,
  obligatorio,
  error,
  children,
}: {
  label: string;
  obligatorio?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label} {obligatorio ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>
      {children}
    </div>
  );
}

function CampoMini({
  label,
  value,
  tipo = "text",
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  tipo?: "text" | "number";
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        className="h-8 text-xs"
        type={tipo}
        min={tipo === "number" ? 0 : undefined}
        step={tipo === "number" ? "any" : undefined}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
