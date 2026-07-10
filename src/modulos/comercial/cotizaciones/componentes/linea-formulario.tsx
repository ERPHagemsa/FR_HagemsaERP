"use client";

import * as React from "react";

import { Button } from "@/compartido/componentes/ui/button";
import { Checkbox } from "@/compartido/componentes/ui/checkbox";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import { LightbulbIcon } from "lucide-react";

import type { Moneda, OrigenTipo, PrecioSugerido, TipoLinea } from "../tipos/cotizaciones.tipos";
import type { CatalogoCargoAdicional } from "../tipos/cotizaciones.tipos";
import type { DraftLinea, ModoServicio } from "../servicios/cotizaciones-editor.utils";
import { montoCargo, precioVentaLinea, totalVentaLinea } from "../servicios/cotizaciones-editor.utils";
import { usePrecioSugerido } from "../servicios/cotizaciones-queries";
import { ListaCargos } from "./lista-cargos";
import { EditorCargasFisicas } from "./editor-cargas-fisicas";
import { ModalidadSelector } from "./modalidad-selector";
import { TipoUnidadCombobox } from "./tipo-unidad-combobox";
import { TIPOS_LINEA, etiquetaTipo, formatearMoneda } from "./lineas-grid.utils";

type Props = {
  linea: DraftLinea;
  moneda: string;
  opcionesCatalogo: CatalogoCargoAdicional[];
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  // Origen de la cotizacion (opcional): acota el precio sugerido al historial del cliente.
  clienteTipo?: OrigenTipo;
  clienteId?: string;
  // Ruta a nivel de SECCION: la define la seccion (no se edita aca) y se usa para el
  // precio sugerido; la carga de la linea la sincroniza la seccion.
  rutaSeccion?: { origen: string; destino: string };
  // Modo de servicio (solo creacion): TRANSPORTE fija el tipo (sin selector); OTROS
  // acota el selector a los tipos no-transporte. undefined = edicion (todos los tipos).
  modoServicio?: ModoServicio;
  onChange: (linea: DraftLinea) => void;
};

/**
 * Formulario de una linea en UN SOLO formulario (sin pestañas). Dos columnas en
 * pantallas grandes: la izquierda con Servicio + Precio y la derecha con el Detalle
 * de la carga (son varios datos, por eso va aparte). Los Cargos adicionales van a
 * lo ancho, debajo. Es CONTROLADO: cada cambio sale por onChange(linea). Sin
 * contenedor propio (se incrusta donde haga falta).
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
  modoServicio,
  onChange,
}: Props) {
  const [toleranciaPeso, setToleranciaPeso] = React.useState(0.15);

  const set = (patch: Partial<DraftLinea>) => onChange({ ...linea, ...patch });

  const esTransporte = linea.tipoLinea === "TRANSPORTE";

  // Modo TRANSPORTE: el tipo de servicio queda fijo (sin selector). Modo OTROS:
  // el selector solo ofrece los tipos no-transporte. En edicion (sin modo) van todos.
  const tipoServicioFijo = modoServicio === "TRANSPORTE";
  const tiposServicioDisponibles =
    modoServicio === "OTROS"
      ? TIPOS_LINEA.filter((t) => t.valor !== "TRANSPORTE")
      : TIPOS_LINEA;

  // Precio sugerido (solo TRANSPORTE): cruza historico por modalidad + ruta + carga.
  const pesoTotalTn = linea.carga.cargas.reduce((acc, it) => {
    const p = parseFloat(it.peso);
    if (isNaN(p) || p <= 0) return acc;
    return acc + (it.unidadPeso === "KG" ? p / 1000 : p);
  }, 0);
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
    esTransporte && !disabled
  );

  const aporteLinea =
    totalVentaLinea(linea) + linea.cargosAdicionales.reduce((acc, c) => acc + montoCargo(c), 0);

  const tieneDetalle =
    esTransporte ||
    linea.tipoLinea === "ALQUILER_EQUIPO" ||
    linea.tipoLinea === "ALMACENAJE" ||
    linea.tipoLinea === "PERSONAL";

  return (
    <div className="flex flex-col gap-5">
      {/* Ruta de la seccion (heredada) — arriba del todo, no se edita aca */}
      {esTransporte && rutaSeccion ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Ruta (de la seccion)
          </span>
          <span className="text-sm font-medium">
            {(rutaSeccion.origen || "—") + " → " + (rutaSeccion.destino || "—")}
          </span>
        </div>
      ) : null}

      {/* Resumen siempre visible: aporte + precio de venta por unidad */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground">Aporte de la linea</span>
          <span className="font-mono text-base font-semibold tabular-nums">
            {formatearMoneda(aporteLinea, moneda)}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          P. Venta:{" "}
          <span className="font-mono font-medium text-foreground tabular-nums">
            {formatearMoneda(precioVentaLinea(linea), moneda)}
          </span>
        </span>
      </div>

      {/* Columnas: Servicio + Precio | Detalle de la carga | Cargos adicionales.
          Sin detalle son 2 columnas (Servicio+Precio | Cargos). */}
      <div className={`grid gap-5 ${tieneDetalle ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
        {/* --- Columna izquierda --- */}
        <div className="flex flex-col gap-5">
          {/* Servicio: que se cotiza */}
          <Seccion titulo="Servicio">
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Tipo de servicio" obligatorio={!tipoServicioFijo}>
                {tipoServicioFijo ? (
                  // Modo TRANSPORTE: tipo fijo, sin selector (mismo look que el Select).
                  <div className="flex h-9 items-center rounded-4xl border border-input bg-input/30 px-3 text-sm text-muted-foreground">
                    {etiquetaTipo(linea.tipoLinea)}
                  </div>
                ) : (
                  <Select
                    value={linea.tipoLinea}
                    disabled={disabled}
                    onValueChange={(v) => set({ tipoLinea: v as TipoLinea, idModalidad: "" })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposServicioDisponibles.map((t) => (
                        <SelectItem key={t.valor} value={t.valor}>
                          {t.etiqueta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Campo>

              <Campo label="Modalidad" obligatorio error={erroresCampo.idModalidad}>
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

            <Campo label="Descripcion" error={erroresCampo.descripcion}>
              <Input
                value={linea.descripcion}
                disabled={disabled}
                placeholder="Nombre o descripcion del servicio (opcional)"
                aria-invalid={Boolean(erroresCampo.descripcion)}
                onChange={(e) => set({ descripcion: e.target.value })}
              />
            </Campo>
          </Seccion>

          {/* Precio */}
          <Seccion titulo="Precio">
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

            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
              <span className="text-xs text-muted-foreground">Precio de venta (calculado)</span>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {formatearMoneda(precioVentaLinea(linea), moneda)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">/ unidad</span>
              </span>
            </div>

            {esTransporte &&
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
                  Agrega el peso de la carga (columna Detalle) para ver el precio sugerido.
                </p>
              )
            ) : null}

            
            {esTransporte ? (
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

            {/* Lead time por linea: tiempo de transito de la ruta (dias). El rotulo
                en el PDF/detalle se deriva de la ruta origen→destino de la seccion. */}
            {esTransporte ? (
              <Campo
                label="Lead time (dias)"
                error={erroresCampo.leadTimeDiasMin ?? erroresCampo.leadTimeDiasMax}
              >
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    step="1"
                    placeholder="— (sin lead time)"
                    className="w-28"
                    value={linea.leadTimeDiasMin}
                    disabled={disabled}
                    aria-invalid={Boolean(erroresCampo.leadTimeDiasMin)}
                    onChange={(e) => set({ leadTimeDiasMin: e.target.value })}
                  />
                  <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Checkbox
                      checked={linea.leadTimeEsRango}
                      disabled={disabled}
                      onCheckedChange={(checked) =>
                        set({
                          leadTimeEsRango: Boolean(checked),
                          leadTimeDiasMax: checked ? linea.leadTimeDiasMax : "",
                        })
                      }
                    />
                    Rango
                  </label>
                  <Input
                    type="number"
                    min={1}
                    step="1"
                    placeholder={linea.leadTimeEsRango ? "max" : "—"}
                    className="w-24"
                    value={linea.leadTimeDiasMax}
                    disabled={disabled || !linea.leadTimeEsRango}
                    aria-invalid={Boolean(erroresCampo.leadTimeDiasMax)}
                    onChange={(e) => set({ leadTimeDiasMax: e.target.value })}
                  />
                </div>
              </Campo>
            ) : null}
          </Seccion>
        </div>

        {/* --- Columna derecha: Detalle de la carga (varios datos) --- */}
        {tieneDetalle ? (
          <Seccion titulo={esTransporte ? "Detalle de la carga" : "Detalle"}>
            {esTransporte ? (
              <>
                <Campo
                  label="Tipo de unidad"
                  obligatorio
                  error={erroresCampo["carga.idTipoUnidad"]}
                >
                  <TipoUnidadCombobox
                    value={linea.carga.idTipoUnidad}
                    disabled={disabled}
                    invalid={Boolean(erroresCampo["carga.idTipoUnidad"])}
                    onValueChange={(id, opcion) =>
                      set({
                        carga: {
                          ...linea.carga,
                          idTipoUnidad: id,
                          fuenteTipoUnidad: opcion?.fuente ?? "",
                          tipoUnidadNombre: opcion?.nombre ?? "",
                        },
                      })
                    }
                  />
                </Campo>
                {!rutaSeccion ? (
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
                ) : null}
                <div>
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Cargas{linea.carga.cargas.length ? ` (${linea.carga.cargas.length})` : ""}
                  </p>
                  <EditorCargasFisicas
                    cargas={linea.carga.cargas}
                    erroresCampo={erroresCampo}
                    disabled={disabled}
                    onChange={(cargas) => set({ carga: { ...linea.carga, cargas } })}
                  />
                </div>
              </>
            ) : null}

            {linea.tipoLinea === "ALQUILER_EQUIPO" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <CampoMini label="Tipo de equipo" value={linea.equipo.equipoTipo} disabled={disabled} onChange={(v) => set({ equipo: { ...linea.equipo, equipoTipo: v } })} />
                <CampoMini label="Marca" value={linea.equipo.marca} disabled={disabled} onChange={(v) => set({ equipo: { ...linea.equipo, marca: v } })} />
                <CampoMini label="Modelo" value={linea.equipo.modelo} disabled={disabled} onChange={(v) => set({ equipo: { ...linea.equipo, modelo: v } })} />
                <CampoMini label="Capacidad" value={linea.equipo.capacidad} disabled={disabled} onChange={(v) => set({ equipo: { ...linea.equipo, capacidad: v } })} />
                <CampoMini label="Horas minimas" tipo="number" value={linea.equipo.horasMinimas} disabled={disabled} onChange={(v) => set({ equipo: { ...linea.equipo, horasMinimas: v } })} />
                <CampoMini label="Dias contrato min." tipo="number" value={linea.equipo.diasContratoMin} disabled={disabled} onChange={(v) => set({ equipo: { ...linea.equipo, diasContratoMin: v } })} />
              </div>
            ) : null}

            {linea.tipoLinea === "ALMACENAJE" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <CampoMini label="Area (m2)" tipo="number" value={linea.almacenaje.areaM2} disabled={disabled} onChange={(v) => set({ almacenaje: { ...linea.almacenaje, areaM2: v } })} />
                <CampoMini label="Periodo (dias)" tipo="number" value={linea.almacenaje.periodoDias} disabled={disabled} onChange={(v) => set({ almacenaje: { ...linea.almacenaje, periodoDias: v } })} />
              </div>
            ) : null}

            {linea.tipoLinea === "PERSONAL" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <CampoMini label="Rol" value={linea.personal.rol} disabled={disabled} onChange={(v) => set({ personal: { ...linea.personal, rol: v } })} />
              </div>
            ) : null}
          </Seccion>
        ) : null}

        {/* --- Columna: Cargos adicionales de la linea (tarjetas, columna angosta) --- */}
        <Seccion
          titulo={`Cargos adicionales${
            linea.cargosAdicionales.length ? ` (${linea.cargosAdicionales.length})` : ""
          }`}
        >
          <ListaCargos
            cargos={linea.cargosAdicionales}
            moneda={moneda}
            opcionesCatalogo={opcionesCatalogo}
            disabled={disabled}
            contexto="Cargo de la linea."
            onChange={(cargos) => set({ cargosAdicionales: cargos })}
          />
        </Seccion>
      </div>
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
                  {c.tipoUnidadNombre || "Sin unidad"} · {c.estado} · {c.ejecutivo}
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

// Agrupador visual del formulario plano: titulo + borde suave para que las partes
// (Servicio, Precio, Detalle, Cargos) se distingan sin necesidad de pestañas.
function Seccion({
  titulo,
  children,
}: {
  titulo: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {titulo}
      </p>
      {children}
    </section>
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
