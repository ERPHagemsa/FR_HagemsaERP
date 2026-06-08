"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { Checkbox } from "@/compartido/componentes/ui/checkbox";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";

import type { DraftLeadTime } from "../servicios/cotizaciones-editor.utils";
import { leadTimeVacio } from "../servicios/cotizaciones-editor.utils";

type Props = {
  leadTimes: DraftLeadTime[];
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  onChange: (leadTimes: DraftLeadTime[]) => void;
};

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
        <div className="flex flex-col gap-3">
          {leadTimes.map((lt, idx) => {
            const errDesc = erroresCampo[`leadTimes.${idx}.descripcion`];
            const errMin = erroresCampo[`leadTimes.${idx}.diasMin`];
            const errMax = erroresCampo[`leadTimes.${idx}.diasMax`];
            return (
              <div
                key={lt.claveCliente}
                className="grid grid-cols-[1fr_auto_auto_auto_auto] items-end gap-3 rounded-lg border border-border bg-muted/20 p-3"
              >
                {/* Descripcion */}
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">
                    Descripcion <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className="h-8 text-xs"
                    value={lt.descripcion}
                    disabled={disabled}
                    placeholder="Ej: Lima → Mina"
                    aria-invalid={Boolean(errDesc)}
                    onChange={(e) => actualizar(lt.claveCliente, { descripcion: e.target.value })}
                  />
                  {errDesc ? (
                    <p className="text-xs text-destructive">{errDesc}</p>
                  ) : null}
                </div>

                {/* Dias minimos */}
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">
                    Dias min. <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    className="h-8 w-20 text-xs"
                    type="number"
                    min={0}
                    step="1"
                    value={lt.diasMin}
                    disabled={disabled}
                    aria-invalid={Boolean(errMin)}
                    onChange={(e) => actualizar(lt.claveCliente, { diasMin: e.target.value })}
                  />
                  {errMin ? (
                    <p className="text-xs text-destructive">{errMin}</p>
                  ) : null}
                </div>

                {/* Toggle: es rango */}
                <div className="grid gap-1">
                  <Label className="text-xs text-muted-foreground">Es rango</Label>
                  <div className="flex h-8 items-center gap-1.5">
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
                </div>

                {/* Dias maximos (solo si esRango) */}
                <div className="grid gap-1">
                  <Label
                    className={`text-xs ${lt.esRango ? "text-muted-foreground" : "text-muted-foreground/40"}`}
                  >
                    Dias max.
                  </Label>
                  <Input
                    className="h-8 w-20 text-xs"
                    type="number"
                    min={0}
                    step="1"
                    value={lt.diasMax}
                    disabled={disabled || !lt.esRango}
                    aria-invalid={Boolean(errMax)}
                    onChange={(e) => actualizar(lt.claveCliente, { diasMax: e.target.value })}
                  />
                  {errMax ? (
                    <p className="text-xs text-destructive">{errMax}</p>
                  ) : null}
                </div>

                {/* Eliminar */}
                <div className="flex items-end pb-0.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="size-8 text-destructive hover:text-destructive"
                    disabled={disabled}
                    onClick={() => eliminar(lt.claveCliente)}
                    aria-label="Eliminar lead time"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </div>
            );
          })}
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
