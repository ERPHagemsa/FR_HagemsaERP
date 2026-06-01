"use client";

import * as React from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

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

import type { TipoCargo } from "../tipos/cotizaciones.tipos";
import type { DraftCargo } from "../servicios/cotizaciones-editor.utils";
import { cargoVacio } from "../servicios/cotizaciones-editor.utils";

const TIPOS_CARGO: { valor: TipoCargo; etiqueta: string }[] = [
  { valor: "MOVILIZACION", etiqueta: "Movilizacion" },
  { valor: "DESMOVILIZACION", etiqueta: "Desmovilizacion" },
  { valor: "ESCOLTA", etiqueta: "Escolta" },
  { valor: "HOSPEDAJE", etiqueta: "Hospedaje" },
  { valor: "VIATICOS", etiqueta: "Viaticos" },
  { valor: "RECARGO", etiqueta: "Recargo" },
  { valor: "OTRO", etiqueta: "Otro" },
];

type Props = {
  cargos: DraftCargo[];
  disabled?: boolean;
  onChange: (cargos: DraftCargo[]) => void;
};

export function EditorCargos({ cargos, disabled, onChange }: Props) {
  function agregar() {
    onChange([...cargos, cargoVacio()]);
  }

  function eliminar(clave: string) {
    onChange(cargos.filter((c) => c.claveCliente !== clave));
  }

  function actualizar(clave: string, patch: Partial<DraftCargo>) {
    onChange(
      cargos.map((c) => (c.claveCliente === clave ? { ...c, ...patch } : c))
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {cargos.length > 0 ? (
        <div className="flex flex-col gap-2">
          {cargos.map((cargo) => (
            <FilaCargo
              key={cargo.claveCliente}
              cargo={cargo}
              disabled={disabled}
              onEliminar={() => eliminar(cargo.claveCliente)}
              onActualizar={(patch) => actualizar(cargo.claveCliente, patch)}
            />
          ))}
        </div>
      ) : null}

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="self-start"
        disabled={disabled}
        onClick={agregar}
      >
        <PlusIcon data-icon="inline-start" />
        Agregar cargo
      </Button>
    </div>
  );
}

function FilaCargo({
  cargo,
  disabled,
  onEliminar,
  onActualizar,
}: {
  cargo: DraftCargo;
  disabled?: boolean;
  onEliminar: () => void;
  onActualizar: (patch: Partial<DraftCargo>) => void;
}) {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 rounded-lg border border-border bg-muted/20 p-3">
      {/* Tipo */}
      <div className="grid gap-1">
        <Label className="text-xs text-muted-foreground">Tipo</Label>
        <Select
          value={cargo.tipoCargo}
          onValueChange={(v) => onActualizar({ tipoCargo: v as TipoCargo })}
          disabled={disabled}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_CARGO.map((t) => (
              <SelectItem key={t.valor} value={t.valor} className="text-xs">
                {t.etiqueta}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Concepto */}
      <div className="grid gap-1">
        <Label className="text-xs text-muted-foreground">Concepto</Label>
        <Input
          className="h-8 text-xs"
          value={cargo.concepto}
          disabled={disabled}
          placeholder="Descripcion del cargo"
          onChange={(e) => onActualizar({ concepto: e.target.value })}
        />
      </div>

      {/* Monto */}
      <div className="grid gap-1">
        <Label className="text-xs text-muted-foreground">Monto</Label>
        <Input
          className="h-8 w-24 text-xs"
          type="number"
          min={0}
          step="0.01"
          value={cargo.monto}
          disabled={disabled}
          onChange={(e) => onActualizar({ monto: parseFloat(e.target.value) || 0 })}
        />
      </div>

      {/* Eliminar */}
      <div className="flex items-end pb-0.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 text-destructive hover:text-destructive"
          disabled={disabled}
          onClick={onEliminar}
          aria-label="Eliminar cargo"
        >
          <Trash2Icon />
        </Button>
      </div>
    </div>
  );
}
