"use client";

import * as React from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { ConfirmarEliminar } from "@/compartido/componentes/ui/confirmar-eliminar";
import type { CatalogoCargoAdicional } from "../tipos/cotizaciones.tipos";
import type { DraftCargoAdicional } from "../servicios/cotizaciones-editor.utils";
import { cargoAdicionalVacio, montoCargo } from "../servicios/cotizaciones-editor.utils";
import { formatearMoneda } from "./lineas-grid.utils";
import { CargoDetalleModal } from "./cargo-detalle-modal";

type Props = {
  cargos: DraftCargoAdicional[];
  moneda: string;
  opcionesCatalogo: CatalogoCargoAdicional[];
  disabled?: boolean;
  // Contexto para el subtitulo del modal ("Cargo de la linea" / "Cargo de la seccion").
  contexto?: string;
  onChange: (cargos: DraftCargoAdicional[]) => void;
};

/**
 * Lista de cargos adicionales (solo lectura) con acciones: agregar / editar / eliminar.
 * Agregar y editar abren el CargoDetalleModal (un cargo a la vez); el resto se resuelve
 * aca. Componente controlado: cada cambio sale por onChange(cargos).
 */
export function ListaCargos({
  cargos,
  moneda,
  opcionesCatalogo,
  disabled,
  contexto,
  onChange,
}: Props) {
  // Cargo abierto en el modal (nuevo o existente). null = modal cerrado.
  const [editando, setEditando] = React.useState<DraftCargoAdicional | null>(null);

  function abrirAgregar() {
    const nuevo = cargoAdicionalVacio();
    nuevo.orden = cargos.length;
    setEditando(nuevo);
  }

  function guardar(cargo: DraftCargoAdicional) {
    const existe = cargos.some((c) => c.claveCliente === cargo.claveCliente);
    onChange(
      existe
        ? cargos.map((c) => (c.claveCliente === cargo.claveCliente ? cargo : c))
        : [...cargos, cargo]
    );
    setEditando(null);
  }

  function eliminar(clave: string) {
    onChange(cargos.filter((c) => c.claveCliente !== clave));
  }

  return (
    <div className="flex flex-col gap-2">
      {cargos.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {cargos.map((cargo) => {
            const cantidad = parseFloat(cargo.cantidad) || 0;
            const precio = parseFloat(cargo.precioUnitario) || 0;
            return (
              <li
                key={cargo.claveCliente}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {cargo.nombre || "Sin cargo seleccionado"}
                  </p>
                  {cargo.descripcion.trim() !== "" ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {cargo.descripcion}
                    </p>
                  ) : null}
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {cantidad} × {formatearMoneda(precio, moneda)}
                    <span className="uppercase"> · {cargo.unidadCobro}</span>
                    {cargo.standbyDia.trim() !== "" ? (
                      <span> · stand-by {formatearMoneda(parseFloat(cargo.standbyDia) || 0, moneda)}/dia</span>
                    ) : null}
                    {cargo.leadTimeDiasMin.trim() !== "" ? (
                      <span>
                        {" · lead time "}
                        {cargo.leadTimeEsRango && cargo.leadTimeDiasMax.trim() !== ""
                          ? `${cargo.leadTimeDiasMin}–${cargo.leadTimeDiasMax} dias`
                          : `${cargo.leadTimeDiasMin} dias`}
                      </span>
                    ) : null}
                  </p>
                </div>
                <span className="shrink-0 font-mono text-sm font-medium tabular-nums">
                  {formatearMoneda(montoCargo(cargo), moneda)}
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-8"
                    disabled={disabled}
                    onClick={() => setEditando(cargo)}
                    aria-label="Editar cargo adicional"
                  >
                    <PencilIcon className="size-4" />
                  </Button>
                  <ConfirmarEliminar
                    onConfirmar={() => eliminar(cargo.claveCliente)}
                    descripcion="Se eliminara este cargo adicional."
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="size-8 text-destructive hover:text-destructive"
                      disabled={disabled}
                      aria-label="Eliminar cargo adicional"
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </ConfirmarEliminar>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">
          Sin cargos adicionales. Agrega los que apliquen.
        </p>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={abrirAgregar}
      >
        <PlusIcon data-icon="inline-start" />
        Agregar cargo adicional
      </Button>

      <CargoDetalleModal
        abierto={editando !== null}
        cargo={editando}
        contexto={contexto}
        moneda={moneda}
        opcionesCatalogo={opcionesCatalogo}
        disabled={disabled}
        onCerrar={() => setEditando(null)}
        onGuardar={guardar}
      />
    </div>
  );
}
