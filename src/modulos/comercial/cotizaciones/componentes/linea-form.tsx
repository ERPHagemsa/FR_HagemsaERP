"use client";

import * as React from "react";
import { ChevronDownIcon, ChevronUpIcon, Trash2Icon } from "lucide-react";

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

import type { TipoLinea } from "../tipos/cotizaciones.tipos";
import type {
  DraftLinea,
  DraftCargaHijo,
  DraftEquipoHijo,
  DraftAlmacenajeHijo,
  DraftPersonalHijo,
} from "../servicios/cotizaciones-editor.utils";
import { ModalidadSelector } from "./modalidad-selector";

const TIPOS_LINEA: { valor: TipoLinea; etiqueta: string }[] = [
  { valor: "TRANSPORTE", etiqueta: "Transporte" },
  { valor: "ALQUILER_EQUIPO", etiqueta: "Alquiler de equipo" },
  { valor: "ALMACENAJE", etiqueta: "Almacenaje" },
  { valor: "AGENCIAMIENTO", etiqueta: "Agenciamiento" },
  { valor: "PERSONAL", etiqueta: "Personal" },
  { valor: "SERVICIO_AUXILIAR", etiqueta: "Servicio auxiliar" },
];

type Props = {
  linea: DraftLinea;
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  onEliminar: () => void;
  onChange: (patch: Partial<DraftLinea>) => void;
};

export function LineaForm({ linea, erroresCampo = {}, disabled, onEliminar, onChange }: Props) {
  const [expandido, setExpandido] = React.useState(true);

  return (
    <div className="rounded-xl border border-border bg-card">
      {/* Cabecera de linea */}
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <button
          type="button"
          className="flex flex-1 items-center gap-2 text-left text-sm font-medium"
          onClick={() => setExpandido((v) => !v)}
        >
          {expandido ? <ChevronUpIcon className="size-4 shrink-0" /> : <ChevronDownIcon className="size-4 shrink-0" />}
          <span className="truncate">{linea.descripcion || "Nueva linea"}</span>
          <span className="shrink-0 text-xs text-muted-foreground">
            ({TIPOS_LINEA.find((t) => t.valor === linea.tipoLinea)?.etiqueta ?? linea.tipoLinea})
          </span>
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 text-destructive hover:text-destructive"
          disabled={disabled}
          onClick={onEliminar}
          aria-label="Eliminar linea"
        >
          <Trash2Icon />
        </Button>
      </div>

      {expandido ? (
        <div className="flex flex-col gap-4 p-4">
          {/* Fila 1: tipoLinea + modalidad */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Tipo de linea <span className="text-destructive">*</span>
              </Label>
              <Select
                value={linea.tipoLinea}
                onValueChange={(v) => onChange({ tipoLinea: v as TipoLinea })}
                disabled={disabled}
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
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Modalidad <span className="text-destructive">*</span>
              </Label>
              <ModalidadSelector
                name="__modalidad__"
                value={linea.idModalidad}
                tipoLinea={linea.tipoLinea}
                disabled={disabled}
                onValueChange={(id) => onChange({ idModalidad: id })}
              />
              {erroresCampo["idModalidad"] ? (
                <p className="text-xs text-destructive">{erroresCampo["idModalidad"]}</p>
              ) : null}
            </div>
          </div>

          {/* Fila 2: descripcion (nombre/identificacion de la linea) */}
          <div className="grid gap-1.5">
            <Label className="text-xs text-muted-foreground">
              Descripcion <span className="text-destructive">*</span>
            </Label>
            <Input
              value={linea.descripcion}
              disabled={disabled}
              placeholder="Descripcion del servicio"
              aria-invalid={Boolean(erroresCampo["descripcion"])}
              onChange={(e) => onChange({ descripcion: e.target.value })}
            />
            {erroresCampo["descripcion"] ? (
              <p className="text-xs text-destructive">{erroresCampo["descripcion"]}</p>
            ) : null}
          </div>

          {/* Ruta (solo transporte) */}
          {linea.tipoLinea === "TRANSPORTE" ? (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-muted-foreground">Ruta</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Origen</Label>
                  <Input
                    value={linea.carga.origen}
                    disabled={disabled}
                    placeholder="Ej: Lima"
                    onChange={(e) =>
                      onChange({ carga: { ...linea.carga, origen: e.target.value } })
                    }
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs text-muted-foreground">Destino</Label>
                  <Input
                    value={linea.carga.destino}
                    disabled={disabled}
                    placeholder="Ej: Mina"
                    onChange={(e) =>
                      onChange({ carga: { ...linea.carga, destino: e.target.value } })
                    }
                  />
                </div>
              </div>
            </div>
          ) : null}

          {/* Fila 3: cantidad + precio unitario.
              Moneda se gestiona a nivel de version en editor-borrador-campos.tsx.
              El backend calcula precioTotal = precioUnitario × cantidad (solo lectura). */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">Cantidad</Label>
              <Input
                type="number"
                min={1}
                step="1"
                value={linea.cantidad}
                disabled={disabled}
                aria-invalid={Boolean(erroresCampo["cantidad"])}
                onChange={(e) => onChange({ cantidad: e.target.value })}
              />
              {erroresCampo["cantidad"] ? (
                <p className="text-xs text-destructive">{erroresCampo["cantidad"]}</p>
              ) : null}
            </div>

            <div className="grid gap-1.5">
              <Label className="text-xs text-muted-foreground">
                Precio unitario <span className="text-destructive">*</span>
              </Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={linea.precioUnitario}
                disabled={disabled}
                aria-invalid={Boolean(erroresCampo["precioUnitario"])}
                onChange={(e) => onChange({ precioUnitario: e.target.value })}
              />
              {erroresCampo["precioUnitario"] ? (
                <p className="text-xs text-destructive">{erroresCampo["precioUnitario"]}</p>
              ) : null}
            </div>
          </div>

          {/* Hijo polimorfico segun tipoLinea */}
          {linea.tipoLinea === "TRANSPORTE" ? (
            <SubformCarga
              carga={linea.carga}
              disabled={disabled}
              onChange={(patch) => onChange({ carga: { ...linea.carga, ...patch } })}
            />
          ) : null}
          {linea.tipoLinea === "ALQUILER_EQUIPO" ? (
            <SubformEquipo
              equipo={linea.equipo}
              disabled={disabled}
              onChange={(patch) => onChange({ equipo: { ...linea.equipo, ...patch } })}
            />
          ) : null}
          {linea.tipoLinea === "ALMACENAJE" ? (
            <SubformAlmacenaje
              almacenaje={linea.almacenaje}
              disabled={disabled}
              onChange={(patch) =>
                onChange({ almacenaje: { ...linea.almacenaje, ...patch } })
              }
            />
          ) : null}
          {linea.tipoLinea === "PERSONAL" ? (
            <SubformPersonal
              personal={linea.personal}
              disabled={disabled}
              onChange={(patch) =>
                onChange({ personal: { ...linea.personal, ...patch } })
              }
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-forms hijos polimorficos
// ---------------------------------------------------------------------------

function SubformCarga({
  carga,
  disabled,
  onChange,
}: {
  carga: DraftCargaHijo;
  disabled?: boolean;
  onChange: (patch: Partial<DraftCargaHijo>) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      {/* Origen/Destino NO van acá: son la "Ruta" y se editan arriba, junto a la modalidad. */}
      <p className="mb-3 text-xs font-medium text-muted-foreground">Datos de carga (transporte)</p>
      <div className="grid gap-3 md:grid-cols-3">
        <CampoTextoSubform label="Vehiculo" value={carga.tipoVehiculo} disabled={disabled} onChange={(v) => onChange({ tipoVehiculo: v })} />
        <CampoNumeroSubform label="Peso (Tn)" value={carga.pesoTn} disabled={disabled} onChange={(v) => onChange({ pesoTn: v })} />
        <CampoNumeroSubform label="Largo (m)" value={carga.largoM} disabled={disabled} onChange={(v) => onChange({ largoM: v })} />
        <CampoNumeroSubform label="Ancho (m)" value={carga.anchoM} disabled={disabled} onChange={(v) => onChange({ anchoM: v })} />
        <CampoNumeroSubform label="Alto (m)" value={carga.altoM} disabled={disabled} onChange={(v) => onChange({ altoM: v })} />
      </div>
    </div>
  );
}

function SubformEquipo({
  equipo,
  disabled,
  onChange,
}: {
  equipo: DraftEquipoHijo;
  disabled?: boolean;
  onChange: (patch: Partial<DraftEquipoHijo>) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="mb-3 text-xs font-medium text-muted-foreground">Datos de equipo</p>
      <div className="grid gap-3 md:grid-cols-3">
        <CampoTextoSubform label="Tipo de equipo" value={equipo.equipoTipo} disabled={disabled} onChange={(v) => onChange({ equipoTipo: v })} />
        <CampoTextoSubform label="Marca" value={equipo.marca} disabled={disabled} onChange={(v) => onChange({ marca: v })} />
        <CampoTextoSubform label="Modelo" value={equipo.modelo} disabled={disabled} onChange={(v) => onChange({ modelo: v })} />
        <CampoTextoSubform label="Capacidad" value={equipo.capacidad} disabled={disabled} onChange={(v) => onChange({ capacidad: v })} />
        <CampoNumeroSubform label="Horas minimas" value={equipo.horasMinimas} disabled={disabled} onChange={(v) => onChange({ horasMinimas: v })} />
        <CampoNumeroSubform label="Dias contrato min." value={equipo.diasContratoMin} disabled={disabled} onChange={(v) => onChange({ diasContratoMin: v })} />
      </div>
    </div>
  );
}

function SubformAlmacenaje({
  almacenaje,
  disabled,
  onChange,
}: {
  almacenaje: DraftAlmacenajeHijo;
  disabled?: boolean;
  onChange: (patch: Partial<DraftAlmacenajeHijo>) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="mb-3 text-xs font-medium text-muted-foreground">Datos de almacenaje</p>
      <div className="grid gap-3 md:grid-cols-2">
        <CampoNumeroSubform label="Area (m2)" value={almacenaje.areaM2} disabled={disabled} onChange={(v) => onChange({ areaM2: v })} />
        <CampoNumeroSubform label="Periodo (dias)" value={almacenaje.periodoDias} disabled={disabled} onChange={(v) => onChange({ periodoDias: v })} />
      </div>
    </div>
  );
}

function SubformPersonal({
  personal,
  disabled,
  onChange,
}: {
  personal: DraftPersonalHijo;
  disabled?: boolean;
  onChange: (patch: Partial<DraftPersonalHijo>) => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="mb-3 text-xs font-medium text-muted-foreground">Datos de personal</p>
      <div className="grid gap-3 md:grid-cols-2">
        <CampoTextoSubform
          label="Rol"
          value={personal.rol}
          disabled={disabled}
          onChange={(v) => onChange({ rol: v })}
        />
      </div>
    </div>
  );
}

function CampoTextoSubform({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        className="h-8 text-xs"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function CampoNumeroSubform({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        className="h-8 text-xs"
        type="number"
        min={0}
        step="any"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
