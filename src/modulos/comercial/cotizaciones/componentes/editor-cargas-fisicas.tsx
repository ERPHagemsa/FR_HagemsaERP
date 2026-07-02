"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { ConfirmarEliminar } from "@/compartido/componentes/ui/confirmar-eliminar";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";

import type { SugerenciaCarga, UnidadPeso } from "../tipos/cotizaciones.tipos";
import type { DraftCargaItem } from "../servicios/cotizaciones-editor.utils";
import { cargaItemVacio } from "../servicios/cotizaciones-editor.utils";
import { AutocompleteCargaNombre } from "./autocomplete-carga-nombre";

// Las dimensiones del draft son strings (inputs controlados); la sugerencia trae number|null.
const numAStr = (n: number | null): string => (n == null ? "" : String(n));

const UNIDADES_PESO: { valor: UnidadPeso; etiqueta: string }[] = [
  { valor: "TN", etiqueta: "TN" },
  { valor: "KG", etiqueta: "KG" },
];

type Props = {
  cargas: DraftCargaItem[];
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  onChange: (cargas: DraftCargaItem[]) => void;
};

/**
 * Editor de los items fisicos de una linea de TRANSPORTE (carga.cargas[]).
 * Una tarjeta por item — el drawer es angosto, asi que crece en vertical en lugar
 * de apretar columnas. Escala a muchos items sin perder legibilidad.
 *
 * Las claves de error son relativas a la linea: "carga.cargas.{idx}.{campo}"
 * (las re-scopea mapearErroresContenido desde el indice draft del borrador).
 */
export function EditorCargasFisicas({ cargas, erroresCampo = {}, disabled, onChange }: Props) {
  function agregar() {
    const nuevo = cargaItemVacio();
    nuevo.orden = cargas.length;
    onChange([...cargas, nuevo]);
  }

  function eliminar(clave: string) {
    onChange(cargas.filter((c) => c.claveCliente !== clave));
  }

  function actualizar(clave: string, patch: Partial<DraftCargaItem>) {
    onChange(cargas.map((c) => (c.claveCliente === clave ? { ...c, ...patch } : c)));
  }

  return (
    <div className="flex flex-col gap-3">
      {cargas.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {cargas.map((carga, idx) => {
            const errNombre = erroresCampo[`carga.cargas.${idx}.nombre`];
            const errLargo = erroresCampo[`carga.cargas.${idx}.largoM`];
            const errAncho = erroresCampo[`carga.cargas.${idx}.anchoM`];
            const errAlto = erroresCampo[`carga.cargas.${idx}.altoM`];
            const errPeso = erroresCampo[`carga.cargas.${idx}.peso`];
            return (
              <li
                key={carga.claveCliente}
                className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-3"
              >
                {/* Nombre + unidad + eliminar — todo en una fila */}
                <div className="flex items-end gap-2">
                  <div className="grid flex-1 gap-1">
                    <Label className="text-xs text-muted-foreground">
                      Dimensión de la carga {idx + 1} <span className="text-destructive">*</span>
                    </Label>
                    <AutocompleteCargaNombre
                      value={carga.nombre}
                      disabled={disabled}
                      invalid={Boolean(errNombre)}
                      placeholder="Ej: Excavadora CAT 320"
                      onChangeTexto={(v) => actualizar(carga.claveCliente, { nombre: v })}
                      onSeleccionar={(s: SugerenciaCarga) =>
                        actualizar(carga.claveCliente, {
                          nombre: s.nombre,
                          largoM: numAStr(s.largoM),
                          anchoM: numAStr(s.anchoM),
                          altoM: numAStr(s.altoM),
                          peso: numAStr(s.peso),
                          // La sugerencia puede no traer unidad: conservamos la actual del draft.
                          unidadPeso: s.unidadPeso ?? carga.unidadPeso,
                        })
                      }
                    />
                  </div>
                  <div className="grid shrink-0 gap-1">
                    <Label className="text-xs text-muted-foreground">Concepto</Label>
                    <Select
                      value={carga.unidadPeso}
                      disabled={disabled}
                      onValueChange={(v) =>
                        actualizar(carga.claveCliente, { unidadPeso: v as UnidadPeso })
                      }
                    >
                      {/* size="sm" => data-[size=sm]:h-8 (32px), iguala el input.
                          Un `h-8` plano NO lo logra: no dedupe el data-[size=default]:h-9 del primitivo. */}
                      <SelectTrigger size="sm" className="w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES_PESO.map((u) => (
                          <SelectItem key={u.valor} value={u.valor} className="text-xs">
                            {u.etiqueta}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <ConfirmarEliminar
                    onConfirmar={() => eliminar(carga.claveCliente)}
                    descripcion="Se eliminara esta carga."
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="size-8 shrink-0 text-destructive hover:text-destructive"
                      disabled={disabled}
                      aria-label="Eliminar carga"
                    >
                      <Trash2Icon data-icon="inline-start" />
                    </Button>
                  </ConfirmarEliminar>
                </div>
                {errNombre ? (
                  <p className="-mt-1.5 text-xs text-destructive">{errNombre}</p>
                ) : null}

                {/* Dimensiones + peso: 4 columnas parejas (la unidad subio a la fila del nombre) */}
                <div className="grid grid-cols-2 items-start gap-2 sm:grid-cols-4">
                  <CampoMini
                    label="Largo (m)"
                    value={carga.largoM}
                    error={errLargo}
                    disabled={disabled}
                    onChange={(v) => actualizar(carga.claveCliente, { largoM: v })}
                  />
                  <CampoMini
                    label="Ancho (m)"
                    value={carga.anchoM}
                    error={errAncho}
                    disabled={disabled}
                    onChange={(v) => actualizar(carga.claveCliente, { anchoM: v })}
                  />
                  <CampoMini
                    label="Alto (m)"
                    value={carga.altoM}
                    error={errAlto}
                    disabled={disabled}
                    onChange={(v) => actualizar(carga.claveCliente, { altoM: v })}
                  />
                  <CampoMini
                    label="Peso"
                    value={carga.peso}
                    error={errPeso}
                    disabled={disabled}
                    onChange={(v) => actualizar(carga.claveCliente, { peso: v })}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Sin cargas. Agrega los items a transportar.</p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={agregar}
      >
        <PlusIcon data-icon="inline-start" />
        Agregar carga
      </Button>
    </div>
  );
}

function CampoMini({
  label,
  value,
  error,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  error?: string;
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
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
