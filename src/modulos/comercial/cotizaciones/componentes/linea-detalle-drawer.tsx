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
import { ScrollArea } from "@/compartido/componentes/ui/scroll-area";
import { FieldSet, FieldLegend } from "@/compartido/componentes/ui/field";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog";
import { LightbulbIcon, SlidersHorizontalIcon } from "lucide-react";

import type { Moneda, OrigenTipo, PrecioSugerido, TipoLinea } from "../tipos/cotizaciones.tipos";
import type { CatalogoCargoAdicional } from "../tipos/cotizaciones.tipos";
import type { DraftLinea } from "../servicios/cotizaciones-editor.utils";
import { montoCargo } from "../servicios/cotizaciones-editor.utils";
import { usePrecioSugerido } from "../servicios/cotizaciones-queries";
import { EditorCargos } from "./editor-cargos";
import { EditorCargasFisicas } from "./editor-cargas-fisicas";
import { ModalidadSelector } from "./modalidad-selector";
import { TIPOS_LINEA, formatearMoneda } from "./lineas-grid.utils";

type Props = {
  abierto: boolean;
  linea: DraftLinea | null;
  moneda: string;
  opcionesCatalogo: CatalogoCargoAdicional[];
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  // Origen de la cotizacion (opcional): acota el precio sugerido al historial de este
  // cliente (fallback a mercado). Ambos juntos o ninguno. En alta sin origen cargado, undefined.
  clienteTipo?: OrigenTipo;
  clienteId?: string;
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
  opcionesCatalogo,
  erroresCampo = {},
  disabled,
  clienteTipo,
  clienteId,
  onCerrar,
  onGuardar,
}: Props) {
  const [borrador, setBorrador] = React.useState<DraftLinea | null>(linea);
  const [claveActual, setClaveActual] = React.useState<string | null>(
    linea?.claveCliente ?? null
  );
  const [cargosAbierto, setCargosAbierto] = React.useState(false);
  // Tolerancia de peso para el precio sugerido (§5.3.2). Default ±15% (igual que el backend).
  // Es decision del ejecutivo: define que tan ancho es el rango de peso de los comparables.
  const [toleranciaPeso, setToleranciaPeso] = React.useState(0.15);

  // Re-sincronizar el borrador cuando entra otra linea (o null), sin useEffect:
  // patron de ajuste de estado durante el render recomendado por React.
  const claveEntrante = linea?.claveCliente ?? null;
  if (claveEntrante !== claveActual) {
    setClaveActual(claveEntrante);
    setBorrador(linea);
  }

  // Precio sugerido (solo TRANSPORTE): el backend cruza el historico por modalidad +
  // ruta + carga (API §5.3.2). pesoTotal en TN: sumamos el peso de los items convirtiendo
  // KG→TN; si queda 0 no se envia (el backend no filtra por peso). El hook gatea el disparo
  // a los 4 campos requeridos (modalidad + origen + destino + moneda). Va ANTES del early
  // return para no romper el orden de hooks.
  const pesoTotalTn = (borrador?.carga.cargas ?? []).reduce((acc, it) => {
    const p = parseFloat(it.peso);
    if (isNaN(p) || p <= 0) return acc;
    return acc + (it.unidadPeso === "KG" ? p / 1000 : p);
  }, 0);
  const sugerenciaPrecio = usePrecioSugerido(
    {
      modalidadId: borrador?.idModalidad ?? "",
      origen: borrador?.carga.origen ?? "",
      destino: borrador?.carga.destino ?? "",
      moneda: moneda as Moneda,
      pesoTotal: pesoTotalTn, // requerido; el hook no dispara si es 0
      toleranciaPeso, // decision del ejecutivo (±%); default 0.15
      // cliente* solo si vienen ambos (el backend los exige juntos).
      clienteTipo: clienteTipo && clienteId ? clienteTipo : undefined,
      clienteId: clienteTipo && clienteId ? clienteId : undefined,
    },
    borrador?.tipoLinea === "TRANSPORTE" && !disabled
  );

  if (!borrador) return null;

  const set = (patch: Partial<DraftLinea>) =>
    setBorrador((b) => (b ? { ...b, ...patch } : b));

  // Aporte real de la linea = base (cantidad × precioUnitario) + Σ cargos adicionales de la linea.
  // Es lo que la linea suma al subtotal de la seccion (los cargos de linea SI suman; ver API §5.4).
  const base =
    (parseFloat(borrador.cantidad) || 0) * (parseFloat(borrador.precioUnitario) || 0);
  const totalCargos = borrador.cargosAdicionales.reduce((acc, c) => acc + montoCargo(c), 0);
  const aporteLinea = base + totalCargos;

  return (
    <Sheet open={abierto} onOpenChange={(v) => (!v ? onCerrar() : undefined)}>
      {/* El ancho lo fija el primitivo con `data-[side=right]:sm:max-w-sm`. Para
          pisarlo hay que usar EL MISMO prefijo de variante; un `sm:max-w-*` plano
          no lo deduplica twMerge y pierde por especificidad. */}
      {/* <SheetContent side="right" className="w-full gap-0 sm:max-w-3xl"> */}
      <SheetContent side="right" className="w-full gap-0 data-[side=right]:sm:max-w-2xl">
        <SheetHeader className="border-b border-border">
          <SheetTitle>Detalle de la linea</SheetTitle>
          <SheetDescription>
            Campos especificos segun el tipo de servicio.
          </SheetDescription>
          {/* Banda de aporte: el header es fijo, asi queda visible al scrollear.
              Va en su propia fila (no en la esquina) para no chocar con la X de cierre. */}
          <div className="mt-1 flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2">
            <span className="text-xs text-muted-foreground">Aporte de la linea</span>
            <span className="font-mono text-base font-semibold tabular-nums">
              {formatearMoneda(aporteLinea, moneda)}
            </span>
          </div>
        </SheetHeader>

        {/* min-h-0 + flex-1: deja que el ScrollArea ocupe el resto y scrollee por dentro
            (scrollbar fino de Radix, no el nativo del navegador). */}
        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-5 p-6">
            {/* Tipo de linea + Modalidad — comparten fila en 2 columnas */}
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo label="Tipo de servicio" obligatorio>
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

              <Campo label="Modalidad del servicio" obligatorio error={erroresCampo.idModalidad}>
                <ModalidadSelector
                  name="__modalidad__"
                  value={borrador.idModalidad}
                  tipoLinea={borrador.tipoLinea}
                  disabled={disabled}
                  onValueChange={(id) => set({ idModalidad: id })}
                />
              </Campo>
            </div>

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

            {/* Cargas — items fisicos a transportar, solo transporte */}
            {borrador.tipoLinea === "TRANSPORTE" ? (
              <Grupo
                titulo={`Cargas${
                  borrador.carga.cargas.length ? ` (${borrador.carga.cargas.length})` : ""
                }`}
              >
                <EditorCargasFisicas
                  cargas={borrador.carga.cargas}
                  erroresCampo={erroresCampo}
                  disabled={disabled}
                  onChange={(cargas) => set({ carga: { ...borrador.carga, cargas } })}
                />
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

            {/* Precio sugerido — solo TRANSPORTE con modalidad + origen + destino + peso.
                El peso es REQUERIDO por el backend (§5.3.2): si falta, pedirlo. Es una
                referencia historica: el ejecutivo la usa o cotiza a criterio. */}
            {borrador.tipoLinea === "TRANSPORTE" &&
            borrador.idModalidad &&
            borrador.carga.origen.trim() !== "" &&
            borrador.carga.destino.trim() !== "" ? (
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
                    onUsar={(monto) => set({ precioUnitario: String(monto) })}
                  />
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Agregá el peso de la carga para ver el precio sugerido.
                </p>
              )
            ) : null}

             {/* Tipo de vehiculo — encima de la seccion de Cargas, solo transporte */}
            {borrador.tipoLinea === "TRANSPORTE" ? (
              <Campo label="Tipo de unidad">
                <Input
                  value={borrador.carga.tipoVehiculo}
                  disabled={disabled}
                  placeholder="Ej: Cama baja"
                  onChange={(e) =>
                    set({ carga: { ...borrador.carga, tipoVehiculo: e.target.value } })
                  }
                />
              </Campo>
            ) : null}

            {/* Subform polimorfico (no-transporte; el de TRANSPORTE vive arriba) */}
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

            {/* Cargos adicionales del item (nivel linea): resumen read-only aca,
                edicion en un Dialog ancho donde la tabla entra comoda. */}
            <Grupo
              titulo={`Cargos adicionales por Linea${
                borrador.cargosAdicionales.length
                  ? ` (${borrador.cargosAdicionales.length})`
                  : ""
              }`}
            >
              {borrador.cargosAdicionales.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {borrador.cargosAdicionales.map((cargo) => (
                    <li
                      key={cargo.claveCliente}
                      className="flex items-center justify-between gap-3 text-xs"
                    >
                      <span className="truncate text-foreground">
                        {cargo.descripcion || "Sin descripcion"}
                      </span>
                      <span className="shrink-0 font-mono tabular-nums text-muted-foreground">
                        {parseFloat(cargo.cantidad) || 0} ×{" "}
                        {parseFloat(cargo.precioUnitario) || 0} ={" "}
                        {formatearMoneda(montoCargo(cargo), moneda)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Sin cargos adicionales.</p>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                disabled={disabled}
                onClick={() => setCargosAbierto(true)}
              >
                <SlidersHorizontalIcon data-icon="inline-start" />
                Gestionar cargos
              </Button>
            </Grupo>

            {/* Descripcion — opcional; va al final (en TRANSPORTE manda el nombre de cada carga) */}
            <Campo label="Descripcion" error={erroresCampo.descripcion}>
              <Input
                value={borrador.descripcion}
                disabled={disabled}
                placeholder="Descripcion del servicio (opcional)"
                aria-invalid={Boolean(erroresCampo.descripcion)}
                onChange={(e) => set({ descripcion: e.target.value })}
              />
            </Campo>
          </div>
        </ScrollArea>

        {/* Sub-editor de cargos: la tabla ancha vive aca, no en el drawer angosto */}
        <Dialog open={cargosAbierto} onOpenChange={setCargosAbierto}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Cargos de la linea</DialogTitle>
              <DialogDescription>
                Cargos adicionales propios de esta linea (escolta, movilizacion, etc.).
              </DialogDescription>
            </DialogHeader>
            <EditorCargos
              cargos={borrador.cargosAdicionales}
              opcionesCatalogo={opcionesCatalogo}
              erroresCampo={erroresCampo}
              disabled={disabled}
              onChange={(cargos) => set({ cargosAdicionales: cargos })}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button">Listo</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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

/**
 * Banda de precio sugerido (API §5.3.2). Estados:
 *  - cargando → texto discreto;
 *  - error → no muestra nada (la sugerencia es opcional, no debe alarmar);
 *  - muestras 0 / monto null → "sin sugerencia" (ruta sin historial, NO es error);
 *  - con dato → mediana + rango p25-p75, alcance (cliente/mercado), nº de muestras,
 *    boton "Usar" y los comparables (evidencia) en un detalle colapsable.
 */
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
  const alcanceEtiqueta =
    data.alcance === "cliente" ? "de este cliente" : "de mercado";

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

      {/* Evidencia: cotizaciones que respaldan la sugerencia (capeadas a 10 por el backend). */}
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
                  {formatearMoneda(c.precioUnitario, moneda)}
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
      {/* Mismo prefijo de variante para pisar el `text-sm` del primitivo:
          un `text-xs` plano no lo deduplica twMerge (ver SheetContent arriba). */}
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
