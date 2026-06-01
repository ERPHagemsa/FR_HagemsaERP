"use client";

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

import type { Moneda } from "../tipos/cotizaciones.tipos";
import type { DraftStandby } from "../servicios/cotizaciones-editor.utils";
import { standbyVacio } from "../servicios/cotizaciones-editor.utils";

type Props = {
  standby: DraftStandby[];
  disabled?: boolean;
  onChange: (standby: DraftStandby[]) => void;
};

export function EditorStandby({ standby, disabled, onChange }: Props) {
  function agregar() {
    onChange([...standby, standbyVacio()]);
  }

  function eliminar(clave: string) {
    onChange(standby.filter((s) => s.claveCliente !== clave));
  }

  function actualizar(clave: string, patch: Partial<DraftStandby>) {
    onChange(
      standby.map((s) => (s.claveCliente === clave ? { ...s, ...patch } : s))
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {standby.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Recurso</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Tarifa/dia</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">Moneda</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {standby.map((sb) => (
                <tr key={sb.claveCliente} className="border-b border-border last:border-0">
                  <td className="px-3 py-2">
                    <Input
                      className="h-7 text-xs"
                      value={sb.recurso}
                      disabled={disabled}
                      placeholder="Nombre del recurso"
                      onChange={(e) => actualizar(sb.claveCliente, { recurso: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      className="h-7 w-24 text-xs"
                      type="number"
                      min={0}
                      step="0.01"
                      value={sb.tarifaDia}
                      disabled={disabled}
                      onChange={(e) => actualizar(sb.claveCliente, { tarifaDia: e.target.value })}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <Select
                      value={sb.moneda}
                      onValueChange={(v) => actualizar(sb.claveCliente, { moneda: v as Moneda })}
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-7 w-20 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PEN" className="text-xs">PEN</SelectItem>
                        <SelectItem value="USD" className="text-xs">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="px-2 py-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="size-7 text-destructive hover:text-destructive"
                      disabled={disabled}
                      onClick={() => eliminar(sb.claveCliente)}
                      aria-label="Eliminar standby"
                    >
                      <Trash2Icon />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
        Agregar standby
      </Button>
    </div>
  );
}

// Exported label component for section headers that want to show count
export function LabelStandby({ count }: { count: number }) {
  return (
    <Label className="text-xs font-medium text-muted-foreground">
      Standby / tarifas{count > 0 ? ` (${count})` : ""}
    </Label>
  );
}
