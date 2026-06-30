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
import { FieldSet, FieldLegend } from "@/compartido/componentes/ui/field";
import { LightbulbIcon } from "lucide-react";

import type { Moneda, OrigenTipo, PrecioSugerido, TipoLinea } from "../tipos/cotizaciones.tipos";
import type { CatalogoCargoAdicional } from "../tipos/cotizaciones.tipos";
import type { DraftLinea } from "../servicios/cotizaciones-editor.utils";
import { montoCargo, precioVentaLinea, totalVentaLinea } from "../servicios/cotizaciones-editor.utils";
import { usePrecioSugerido } from "../servicios/cotizaciones-queries";
import { EditorCargos } from "./editor-cargos";
import { EditorCargasFisicas } from "./editor-cargas-fisicas";
import { ModalidadSelector } from "./modalidad-selector";
import { TIPOS_LINEA, formatearMoneda } from "./lineas-grid.utils";

type Props = {
  linea: DraftLinea;
  moneda: string;
  opcionesCatalogo: CatalogoCargoAdicional[];
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  // Origen de la cotizacion (opcional): acota el precio sugerido al historial del cliente.
  clienteTipo?: OrigenTipo;
  clienteId?: string;
  // Ruta a nivel de SECCION: cuando se provee, no se editan origen/destino aca (los define
  // la seccion) y se usan para el precio sugerido. La carga de la linea la sincroniza la seccion.
  rutaSeccion?: { origen: string; destino: string };
  onChange: (linea: DraftLinea) => void;
};

/**
 * Formulario completo de una linea (tipo, modalidad, cargas fisicas, precio, stand-by,
 * cargos por linea, descripcion). Es CONTROLADO: cada cambio sale por onChange(linea).
 * No tiene contenedor propio (Sheet/Dialog) — se incrusta donde se necesite (hoy: fila
 * expandible del modal de seccion).
 */
export function LineaFormulario({
  linea,
  moneda,
  opcionesCatalogo,
  erroresCampo = {},
  disabled,
  clienteTipo,
  clienteId,
  rutaSeccion,
  onChange,
}: Props) {
  // Tolerancia de peso para el precio sugerido (§5.3.2). Default ±15% (igual que el backend).
  const [toleranciaPeso, setToleranciaPeso] = React.useState(0.15);

  const set = (patch: Partial<DraftLinea>) => onChange({ ...linea, ...patch });

  // Precio sugerido (solo TRANSPORTE): cruza historico por modalidad + ruta + carga.
  const pesoTotalTn = linea.carga.cargas.reduce((acc, it) => {
    const p = parseFloat(it.peso);
    if (isNaN(p) || p <= 0) return acc;
    return acc + (it.unidadPeso === "KG" ? p / 1000 : p);
  }, 0);
  // Ruta efectiva: la define la seccion si viene; si no, la de la carga.
  const origenEfectivo = rutaSeccion ? rutaSeccion.origen : linea.carga.origen;
  const destinoEfectivo = rutaSeccion ? rutaSeccion.destino : linea.carga.destino;
  const sugerenciaPrecio = usePrecioSugerido(
    {
      modalidadId: linea.idModalidad,
      origen: origenEfectivo,
      destino: destinoEfectivo,
      moneda: moneda as Moneda,
      pesoTotal: pesoTotalTn,
      toleranciaPeso,
      clienteTipo: clienteTipo && clienteId ? clienteTipo : undefined,
      clienteId: clienteTipo && clienteId ? clienteId : undefined,
    },
    linea.tipoLinea === "TRANSPORTE" && !disabled
  );

  // Aporte de la linea = venta + Σ cargos de la linea (lo que suma al subtotal de la seccion).
  const aporteLinea =
    totalVentaLinea(linea) + linea.cargosAdicionales.reduce((acc, c) => acc + montoCargo(c), 0);

  return (
    <div className="flex flex-col gap-5">
      {/* Banda de aporte de la linea */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
        <span className="text-xs text-muted-foreground">Aporte de la linea</span>
        <span className="font-mono text-base font-semibold tabular-nums">
          {formatearMoneda(aporteLinea, moneda)}
        </span>
      </div>

      {/* Tipo de linea + Modalidad */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="Tipo de servicio" obligatorio>
          <Select
            value={linea.tipoLinea}
            disabled={disabled}
            onValueChange={(v) => set({ tipoLinea: v as TipoLinea, idModalidad: "" })}
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

        <Campo label="Modalidad del servicio" obligatorio error={erroresCampo.idModalidad}>
          <ModalidadSelector
            name="__modalidad__"
            value={linea.idModalidad}
            tipoLinea={linea.tipoLinea}
            disabled={disabled}
            onValueChange={(id, modalidad) =>
              set(
                modalidad?.margenPct != null
                  ? { idModalidad: id, margenPct: String(modalidad.margenPct) }
                  : { idModalidad: id }
              )
            }
          />
        </Campo>
      </div>

      {/* Ruta — solo transporte. Si la define la seccion, se muestra informativa. */}
      {linea.tipoLinea === "TRANSPORTE" && rutaSeccion ? (
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm">
          <span className="text-xs text-muted-foreground">Ruta (de la seccion)</span>
          <span className="font-medium">
            {(rutaSeccion.origen || "—") + " → " + (rutaSeccion.destino || "—")}
          </span>
        </div>
      ) : null}
      {linea.tipoLinea === "TRANSPORTE" && !rutaSeccion ? (
        <Grupo titulo="Ruta">
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="Origen">
              <Input
                value={linea.carga.origen}
                disabled={disabled}
                placeholder="Ej: Lima"
                onChange={(e) => set({ carga: { ...linea.carga, origen: e.target.value } })}
              />
            </Campo>
            <Campo label="Destino">
              <Input
                value={linea.carga.destino}
                disabled={disabled}
                placeholder="Ej: Mina"
                onChange={(e) => set({ carga: { ...linea.carga, destino: e.target.value } })}
              />
            </Campo>
          </div>
        </Grupo>
      ) : null}

      {/* Cargas fisicas — solo transporte */}
      {linea.tipoLinea === "TRANSPORTE" ? (
        <Grupo
          titulo={`Cargas${linea.carga.cargas.length ? ` (${linea.carga.cargas.length})` : ""}`}
        >
          <EditorCargasFisicas
            cargas={linea.carga.cargas}
            erroresCampo={erroresCampo}
            disabled={disabled}
            onChange={(cargas) => set({ carga: { ...linea.carga, cargas } })}
          />
        </Grupo>
      ) : null}

      {/* Cantidad + precio base + margen */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Campo label="Cantidad" error={erroresCampo.cantidad}>
          <Input
            type="number"
            min={1}
            step="1"
            value={linea.cantidad}
            disabled={disabled}
            aria-invalid={Boolean(erroresCampo.cantidad)}
            onChange={(e) => set({ cantidad: e.target.value })}
          />
        </Campo>
        <Campo label="Precio base" obligatorio error={erroresCampo.precioBase}>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={linea.precioBase}
            disabled={disabled}
            aria-invalid={Boolean(erroresCampo.precioBase)}
            onChange={(e) => set({ precioBase: e.target.value })}
          />
        </Campo>
        <Campo label="Margen %" obligatorio error={erroresCampo.margenPct}>
          <Input
            type="number"
            min={0}
            max={99.99}
            step="0.01"
            value={linea.margenPct}
            disabled={disabled}
            aria-invalid={Boolean(erroresCampo.margenPct)}
            onChange={(e) => set({ margenPct: e.target.value })}
          />
        </Campo>
      </div>

      {/* Precio de venta calculado (read-only) */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
        <span className="text-xs text-muted-foreground">Precio de venta (calculado)</span>
        <span className="font-mono text-sm font-semibold tabular-nums">
          {formatearMoneda(precioVentaLinea(linea), moneda)}
          <span className="ml-1 text-xs font-normal text-muted-foreground">/ unidad</span>
        </span>
      </div>

      {/* Stand by por dia (solo TRANSPORTE; opcional). Informativo: no suma. */}
      {linea.tipoLinea === "TRANSPORTE" ? (
        <Campo label="Stand by / dia" error={erroresCampo.standbyDia}>
          <Input
            type="number"
            min={0}
            step="0.01"
            placeholder="— (sin stand-by)"
            value={linea.standbyDia}
            disabled={disabled}
            aria-invalid={Boolean(erroresCampo.standbyDia)}
            onChange={(e) => set({ standbyDia: e.target.value })}
          />
        </Campo>
      ) : null}

      {/* Precio sugerido — solo TRANSPORTE con modalidad + ruta + peso. */}
      {linea.tipoLinea === "TRANSPORTE" &&
      linea.idModalidad &&
      origenEfectivo.trim() !== "" &&
      destinoEfectivo.trim() !== "" ? (
        pesoTotalTn > 0 ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs text-muted-foreground">
                Tolerancia de peso del comparable
              </Label>
              <Select
                value={String(toleranciaPeso)}
                disabled={disabled}
                onValueChange={(v) => setToleranciaPeso(parseFloat(v))}
              >
                <SelectTrigger size="sm" className="w-24 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">±10%</SelectItem>
                  <SelectItem value="0.15">±15%</SelectItem>
                  <SelectItem value="0.2">±20%</SelectItem>
                  <SelectItem value="0.3">±30%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <SugerenciaPrecio
              estado={sugerenciaPrecio}
              moneda={moneda}
              disabled={disabled}
              onUsar={(monto) => {
                const margen = parseFloat(linea.margenPct) || 0;
                const base = margen >= 100 ? monto : monto * (1 - margen / 100);
                set({ precioBase: String(Math.round(base * 100) / 100) });
              }}
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Agregá el peso de la carga para ver el precio sugerido.
          </p>
        )
      ) : null}

      {/* Tipo de unidad — solo transporte */}
      {linea.tipoLinea === "TRANSPORTE" ? (
        <Campo label="Tipo de unidad">
          <Input
            value={linea.carga.tipoVehiculo}
            disabled={disabled}
            placeholder="Ej: Cama baja"
            onChange={(e) => set({ carga: { ...linea.carga, tipoVehiculo: e.target.value } })}
          />
        </Campo>
      ) : null}

      {/* Subform polimorfico (no-transporte) */}
      {linea.tipoLinea === "ALQUILER_EQUIPO" ? (
        <Grupo titulo="Datos de equipo">
          <div className="grid gap-3 sm:grid-cols-3">
            <CampoMini label="Tipo de equipo" value={linea.equipo.equipoTipo} disabled={disabled} onChange={(v) => set({ equipo: { ...linea.equipo, equipoTipo: v } })} />
            <CampoMini label="Marca" value={linea.equipo.marca} disabled={disabled} onChange={(v) => set({ equipo: { ...linea.equipo, marca: v } })} />
            <CampoMini label="Modelo" value={linea.equipo.modelo} disabled={disabled} onChange={(v) => set({ equipo: { ...linea.equipo, modelo: v } })} />
            <CampoMini label="Capacidad" value={linea.equipo.capacidad} disabled={disabled} onChange={(v) => set({ equipo: { ...linea.equipo, capacidad: v } })} />
            <CampoMini label="Horas minimas" tipo="number" value={linea.equipo.horasMinimas} disabled={disabled} onChange={(v) => set({ equipo: { ...linea.equipo, horasMinimas: v } })} />
            <CampoMini label="Dias contrato min." tipo="number" value={linea.equipo.diasContratoMin} disabled={disabled} onChange={(v) => set({ equipo: { ...linea.equipo, diasContratoMin: v } })} />
          </div>
        </Grupo>
      ) : null}

      {linea.tipoLinea === "ALMACENAJE" ? (
        <Grupo titulo="Datos de almacenaje">
          <div className="grid gap-3 sm:grid-cols-2">
            <CampoMini label="Area (m2)" tipo="number" value={linea.almacenaje.areaM2} disabled={disabled} onChange={(v) => set({ almacenaje: { ...linea.almacenaje, areaM2: v } })} />
            <CampoMini label="Periodo (dias)" tipo="number" value={linea.almacenaje.periodoDias} disabled={disabled} onChange={(v) => set({ almacenaje: { ...linea.almacenaje, periodoDias: v } })} />
          </div>
        </Grupo>
      ) : null}

      {linea.tipoLinea === "PERSONAL" ? (
        <Grupo titulo="Datos de personal">
          <div className="grid gap-3 sm:grid-cols-2">
            <CampoMini label="Rol" value={linea.personal.rol} disabled={disabled} onChange={(v) => set({ personal: { ...linea.personal, rol: v } })} />
          </div>
        </Grupo>
      ) : null}

      {/* Cargos adicionales de la linea — inline (tabla comoda en el modal ancho) */}
      <Grupo
        titulo={`Cargos adicionales por linea${
          linea.cargosAdicionales.length ? ` (${linea.cargosAdicionales.length})` : ""
        }`}
      >
        <EditorCargos
          cargos={linea.cargosAdicionales}
          opcionesCatalogo={opcionesCatalogo}
          erroresCampo={erroresCampo}
          disabled={disabled}
          onChange={(cargos) => set({ cargosAdicionales: cargos })}
        />
      </Grupo>

      {/* Descripcion — opcional */}
      <Campo label="Descripcion" error={erroresCampo.descripcion}>
        <Input
          value={linea.descripcion}
          disabled={disabled}
          placeholder="Descripcion del servicio (opcional)"
          aria-invalid={Boolean(erroresCampo.descripcion)}
          onChange={(e) => set({ descripcion: e.target.value })}
        />
      </Campo>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers presentacionales
// ---------------------------------------------------------------------------

function SugerenciaPrecio({
  estado,
  moneda,
  disabled,
  onUsar,
}: {
  estado: { data: PrecioSugerido | null; isLoading: boolean; error: unknown };
  moneda: string;
  disabled?: boolean;
  onUsar: (monto: number) => void;
}) {
  const { data, isLoading, error } = estado;

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">Buscando precio sugerido…</p>;
  }
  if (error || !data) return null;
  if (data.muestras === 0 || data.monto === null) {
    return (
      <p className="text-xs text-muted-foreground">
        Sin sugerencia para esta ruta todavia (sin historial comparable).
      </p>
    );
  }

  const monto = data.monto;
  const hayRango = data.montoMin !== null && data.montoMax !== null;
  const alcanceEtiqueta = data.alcance === "cliente" ? "de este cliente" : "de mercado";

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <LightbulbIcon className="size-3.5" />
            Precio sugerido
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {alcanceEtiqueta}
            </span>
            <span className="text-muted-foreground/70">· {data.muestras} muestras</span>
          </span>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {formatearMoneda(monto, moneda)}
            {hayRango ? (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                rango {formatearMoneda(data.montoMin as number, moneda)}–
                {formatearMoneda(data.montoMax as number, moneda)}
              </span>
            ) : null}
          </span>
          {!data.ajustadoPorPeso ? (
            <span className="text-[11px] text-muted-foreground">
              Referencia aproximada de la ruta (sin historial de peso similar).
            </span>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          disabled={disabled}
          onClick={() => onUsar(monto)}
        >
          Usar
        </Button>
      </div>

      {data.comparables.length > 0 ? (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Ver comparables ({data.comparables.length})
          </summary>
          <ul className="mt-1.5 flex flex-col gap-1">
            {data.comparables.map((c) => (
              <li
                key={c.cotizacionId}
                className="flex items-center justify-between gap-3 border-t border-border/60 pt-1"
              >
                <span className="truncate text-muted-foreground">
                  {c.tipoVehiculo || "Sin unidad"} · {c.estado} · {c.ejecutivo}
                </span>
                <span className="shrink-0 font-mono tabular-nums text-foreground">
                  {formatearMoneda(c.precioVenta, moneda)}
                  <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                    ({c.margenPct}% mg)
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

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
    <FieldSet className="gap-3 rounded-lg border border-border px-4 pb-4 pt-1">
      <FieldLegend
        variant="label"
        className="px-1.5 font-semibold uppercase tracking-wide text-muted-foreground data-[variant=label]:text-xs"
      >
        {titulo}
      </FieldLegend>
      {children}
    </FieldSet>
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
