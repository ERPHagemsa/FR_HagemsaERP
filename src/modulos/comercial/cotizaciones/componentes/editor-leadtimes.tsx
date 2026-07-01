"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { ConfirmarEliminar } from "@/compartido/componentes/ui/confirmar-eliminar";
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

import type { DraftLeadTime } from "../servicios/cotizaciones-editor.utils";
import { leadTimeVacio } from "../servicios/cotizaciones-editor.utils";

type Props = {
  leadTimes: DraftLeadTime[];
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  onChange: (leadTimes: DraftLeadTime[]) => void;
};

// Mismo patron de tabla (primitivo Table de shadcn) que el grid de lineas:
// mantiene la armonia visual de la zona informativa.
export function EditorLeadtimes({ leadTimes, erroresCampo = {}, disabled, onChange }: Props) {
  function agregar() {
    const nuevo = leadTimeVacio();
    nuevo.orden = leadTimes.length;
    onChange([...leadTimes, nuevo]);
  }

  function eliminar(clave: string) {
    onChange(leadTimes.filter((l) => l.claveCliente !== clave));
  }

  function actualizar(clave: string, patch: Partial<DraftLeadTime>) {
    onChange(
      leadTimes.map((l) => (l.claveCliente === clave ? { ...l, ...patch } : l))
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {leadTimes.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-full">Descripcion</TableHead>
                <TableHead>Dias min.</TableHead>
                <TableHead title="Si el plazo es un rango (min–max) en vez de un valor exacto">
                  Es rango
                </TableHead>
                <TableHead>Dias max.</TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leadTimes.map((lt, idx) => {
                const errDesc = erroresCampo[`leadTimes.${idx}.descripcion`];
                const errMin = erroresCampo[`leadTimes.${idx}.diasMin`];
                const errMax = erroresCampo[`leadTimes.${idx}.diasMax`];
                return (
                  <TableRow key={lt.claveCliente}>
                    <TableCell>
                      <Input
                        className="h-8 text-xs"
                        value={lt.descripcion}
                        disabled={disabled}
                        placeholder="Ej: Lima → Mina"
                        aria-invalid={Boolean(errDesc)}
                        onChange={(e) => actualizar(lt.claveCliente, { descripcion: e.target.value })}
                      />
                      {errDesc ? (
                        <p className="mt-0.5 whitespace-normal text-xs text-destructive">{errDesc}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-24 text-xs"
                        type="number"
                        min={0}
                        step="1"
                        value={lt.diasMin}
                        disabled={disabled}
                        aria-invalid={Boolean(errMin)}
                        onChange={(e) => actualizar(lt.claveCliente, { diasMin: e.target.value })}
                      />
                      {errMin ? (
                        <p className="mt-0.5 whitespace-normal text-xs text-destructive">{errMin}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Checkbox
                          id={`esRango-${lt.claveCliente}`}
                          checked={lt.esRango}
                          disabled={disabled}
                          onCheckedChange={(checked) =>
                            actualizar(lt.claveCliente, {
                              esRango: Boolean(checked),
                              diasMax: Boolean(checked) ? lt.diasMax : "",
                            })
                          }
                        />
                        <Label
                          htmlFor={`esRango-${lt.claveCliente}`}
                          className="cursor-pointer text-xs text-muted-foreground"
                        >
                          Rango
                        </Label>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-24 text-xs"
                        type="number"
                        min={0}
                        step="1"
                        value={lt.diasMax}
                        disabled={disabled || !lt.esRango}
                        placeholder={lt.esRango ? "" : "—"}
                        aria-invalid={Boolean(errMax)}
                        onChange={(e) => actualizar(lt.claveCliente, { diasMax: e.target.value })}
                      />
                      {errMax ? (
                        <p className="mt-0.5 whitespace-normal text-xs text-destructive">{errMax}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <ConfirmarEliminar
                        onConfirmar={() => eliminar(lt.claveCliente)}
                        descripcion="Se eliminara este lead time."
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="size-8 text-destructive hover:text-destructive"
                          disabled={disabled}
                          aria-label="Eliminar lead time"
                        >
                          <Trash2Icon />
                        </Button>
                      </ConfirmarEliminar>
                    </TableCell>
                  </TableRow>
                );
              })}
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
        Agregar lead time
      </Button>
    </div>
  );
}
