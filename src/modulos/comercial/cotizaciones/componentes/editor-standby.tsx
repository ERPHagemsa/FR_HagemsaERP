"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { Checkbox } from "@/compartido/componentes/ui/checkbox";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";

import type { DraftStandby } from "../servicios/cotizaciones-editor.utils";
import { standbyVacio } from "../servicios/cotizaciones-editor.utils";

type Props = {
  standby: DraftStandby[];
  disabled?: boolean;
  onChange: (standby: DraftStandby[]) => void;
};

export function EditorStandby({ standby, disabled, onChange }: Props) {
  function agregar() {
    const nuevo = standbyVacio();
    nuevo.orden = standby.length;
    onChange([...standby, nuevo]);
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
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-full">Descripcion</TableHead>
                <TableHead>Tarifa diaria</TableHead>
                <TableHead title="El costo se cobra una vez por cada linea de la cotizacion">
                  Aplica por linea
                </TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {standby.map((sb) => (
                <TableRow key={sb.claveCliente}>
                  <TableCell>
                    <Input
                      className="h-8 text-xs"
                      value={sb.descripcion}
                      disabled={disabled}
                      placeholder="Ej: Grua de reserva"
                      onChange={(e) => actualizar(sb.claveCliente, { descripcion: e.target.value })}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Input
                        className="h-8 w-28 text-xs"
                        type="number"
                        min={0}
                        step="0.01"
                        value={sb.monto}
                        disabled={disabled}
                        onChange={(e) => actualizar(sb.claveCliente, { monto: e.target.value })}
                      />
                      <span className="whitespace-nowrap text-xs text-muted-foreground">/dia</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Checkbox
                        id={`porLinea-${sb.claveCliente}`}
                        checked={sb.porLinea}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          actualizar(sb.claveCliente, { porLinea: Boolean(checked) })
                        }
                      />
                      <Label
                        htmlFor={`porLinea-${sb.claveCliente}`}
                        className="cursor-pointer text-xs text-muted-foreground"
                        title="El costo se cobra una vez por cada linea de la cotizacion (vs. una sola vez)"
                      >
                        Si
                      </Label>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="size-8 text-destructive hover:text-destructive"
                      disabled={disabled}
                      onClick={() => eliminar(sb.claveCliente)}
                      aria-label="Eliminar standby"
                    >
                      <Trash2Icon />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
