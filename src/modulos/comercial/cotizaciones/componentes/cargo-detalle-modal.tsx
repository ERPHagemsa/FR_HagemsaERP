"use client";

import * as React from "react";

import { Button } from "@/compartido/componentes/ui/button";
import { Checkbox } from "@/compartido/componentes/ui/checkbox";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog";
import type { CatalogoCargoAdicional, UnidadCobro } from "../tipos/cotizaciones.tipos";
import type { DraftCargoAdicional } from "../servicios/cotizaciones-editor.utils";
import { montoCargo } from "../servicios/cotizaciones-editor.utils";
import { formatearMoneda } from "./lineas-grid.utils";

const UNIDADES_COBRO: { valor: UnidadCobro; etiqueta: string }[] = [
  { valor: "VIAJE", etiqueta: "Viaje" },
  { valor: "DIA", etiqueta: "Dia" },
  { valor: "M2", etiqueta: "M2" },
  { valor: "SERVICIO", etiqueta: "Servicio" },
  { valor: "HORA", etiqueta: "Hora" },
  { valor: "TONELADA", etiqueta: "Tonelada" },
  { valor: "CONTENEDOR", etiqueta: "Contenedor" },
  { valor: "OTRO", etiqueta: "Otro" },
];

type Props = {
  abierto: boolean;
  // Cargo a editar/crear (copia de trabajo). null cuando no hay nada abierto.
  cargo: DraftCargoAdicional | null;
  // Contexto ("Cargo de la linea" / "Cargo de la seccion") para el subtitulo.
  contexto?: string;
  moneda: string;
  opcionesCatalogo: CatalogoCargoAdicional[];
  disabled?: boolean;
  onCerrar: () => void;
  onGuardar: (cargo: DraftCargoAdicional) => void;
};

/**
 * Modal para agregar o editar UN cargo adicional (descripcion del catalogo, unidad
 * de cobro, cantidad, precio unitario y stand-by). El monto es calculado.
 *
 * Controlado por confirmacion: trabaja sobre una copia local y emite onGuardar(cargo)
 * solo al pulsar "Aplicar"; "Cancelar" descarta los cambios.
 */
export function CargoDetalleModal({
  abierto,
  cargo,
  contexto,
  moneda,
  opcionesCatalogo,
  disabled,
  onCerrar,
  onGuardar,
}: Props) {
  const [borrador, setBorrador] = React.useState<DraftCargoAdicional | null>(cargo);
  const [claveActual, setClaveActual] = React.useState<string | null>(
    cargo?.claveCliente ?? null
  );

  // Re-sincronizar el borrador cuando entra otro cargo (o null), sin useEffect.
  const claveEntrante = cargo?.claveCliente ?? null;
  if (claveEntrante !== claveActual) {
    setClaveActual(claveEntrante);
    setBorrador(cargo);
  }

  if (!borrador) return null;

  const set = (patch: Partial<DraftCargoAdicional>) =>
    setBorrador((c) => (c ? { ...c, ...patch } : c));

  const monto = montoCargo(borrador);
  const sinCatalogo = opcionesCatalogo.length === 0;
  const puedeGuardar = !disabled && borrador.nombre.trim() !== "";

  return (
    <Dialog open={abierto} onOpenChange={(v) => (!v ? onCerrar() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cargo adicional</DialogTitle>
          <DialogDescription>
            {contexto ?? "Datos del cargo (el monto se calcula: cantidad × precio unitario)."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Cargo: seleccion estricta desde el catalogo (define el nombre) */}
          <Campo label="Cargo" obligatorio>
            <Select
              value={borrador.nombre || undefined}
              disabled={disabled || sinCatalogo}
              onValueChange={(v) => set({ nombre: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={sinCatalogo ? "Sin catalogo disponible" : "Selecciona un cargo"}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {opcionesCatalogo.map((o) => (
                    <SelectItem key={o.id} value={o.nombre}>
                      {o.nombre}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Campo>

          {/* Descripcion: texto libre opcional (detalle del cargo) */}
          <Campo label="Descripcion (opcional)">
            <Input
              value={borrador.descripcion}
              disabled={disabled}
              placeholder="Detalle libre del cargo"
              onChange={(e) => set({ descripcion: e.target.value })}
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Unidad de cobro">
              <Select
                value={borrador.unidadCobro}
                disabled={disabled}
                onValueChange={(v) => set({ unidadCobro: v as UnidadCobro })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {UNIDADES_COBRO.map((u) => (
                      <SelectItem key={u.valor} value={u.valor}>
                        {u.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Campo>
            <Campo label="Cantidad">
              <Input
                type="number"
                min={0}
                step="1"
                value={borrador.cantidad}
                disabled={disabled}
                onChange={(e) => set({ cantidad: e.target.value })}
              />
            </Campo>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Precio unitario">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={borrador.precioUnitario}
                disabled={disabled}
                onChange={(e) => set({ precioUnitario: e.target.value })}
              />
            </Campo>
            <Campo label="Stand by / dia">
              <Input
                type="number"
                min={0}
                step="0.01"
                placeholder="— (sin stand-by)"
                value={borrador.standbyDia}
                disabled={disabled}
                onChange={(e) => set({ standbyDia: e.target.value })}
              />
            </Campo>
          </div>

          {/* Lead time del cargo (transito en dias); informativo, no suma al total. */}
          <Campo label="Lead time (dias)">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                step="1"
                placeholder="— (sin lead time)"
                className="w-28"
                value={borrador.leadTimeDiasMin}
                disabled={disabled}
                onChange={(e) => set({ leadTimeDiasMin: e.target.value })}
              />
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Checkbox
                  checked={borrador.leadTimeEsRango}
                  disabled={disabled}
                  onCheckedChange={(checked) =>
                    set({
                      leadTimeEsRango: Boolean(checked),
                      leadTimeDiasMax: checked ? borrador.leadTimeDiasMax : "",
                    })
                  }
                />
                Rango
              </label>
              <Input
                type="number"
                min={1}
                step="1"
                placeholder={borrador.leadTimeEsRango ? "max" : "—"}
                className="w-24"
                value={borrador.leadTimeDiasMax}
                disabled={disabled || !borrador.leadTimeEsRango}
                onChange={(e) => set({ leadTimeDiasMax: e.target.value })}
              />
            </div>
          </Campo>

          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Monto (calculado)</span>
            <span className="font-mono text-sm font-semibold tabular-nums">
              {formatearMoneda(monto, moneda)}
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!puedeGuardar}
            title={
              !puedeGuardar && !disabled ? "Selecciona un cargo del catalogo" : undefined
            }
            onClick={() => onGuardar(borrador)}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
