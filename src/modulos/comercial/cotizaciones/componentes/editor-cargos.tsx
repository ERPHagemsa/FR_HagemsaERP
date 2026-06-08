"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";

import type { DraftCargoAdicional } from "../servicios/cotizaciones-editor.utils";
import { cargoAdicionalVacio } from "../servicios/cotizaciones-editor.utils";

type Props = {
  cargos: DraftCargoAdicional[];
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  onChange: (cargos: DraftCargoAdicional[]) => void;
};

export function EditorCargos({ cargos, erroresCampo = {}, disabled, onChange }: Props) {
  function agregar() {
    const nuevo = cargoAdicionalVacio();
    nuevo.orden = cargos.length;
    onChange([...cargos, nuevo]);
  }

  function eliminar(clave: string) {
    onChange(cargos.filter((c) => c.claveCliente !== clave));
  }

  function actualizar(clave: string, patch: Partial<DraftCargoAdicional>) {
    onChange(
      cargos.map((c) => (c.claveCliente === clave ? { ...c, ...patch } : c))
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {cargos.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="w-full">Descripcion</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargos.map((cargo, idx) => {
                const errDesc = erroresCampo[`cargosAdicionales.${idx}.descripcion`];
                const errMonto = erroresCampo[`cargosAdicionales.${idx}.monto`];
                return (
                  <TableRow key={cargo.claveCliente}>
                    <TableCell>
                      <Input
                        className="h-8 text-xs"
                        value={cargo.descripcion}
                        disabled={disabled}
                        placeholder="Ej: Escolta SUTRAN"
                        aria-invalid={Boolean(errDesc)}
                        onChange={(e) => actualizar(cargo.claveCliente, { descripcion: e.target.value })}
                      />
                      {errDesc ? (
                        <p className="mt-0.5 whitespace-normal text-xs text-destructive">{errDesc}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Input
                        className="h-8 w-28 text-xs"
                        type="number"
                        min={0}
                        step="0.01"
                        value={cargo.monto}
                        disabled={disabled}
                        aria-invalid={Boolean(errMonto)}
                        onChange={(e) => actualizar(cargo.claveCliente, { monto: e.target.value })}
                      />
                      {errMonto ? (
                        <p className="mt-0.5 whitespace-normal text-xs text-destructive">{errMonto}</p>
                      ) : null}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="size-8 text-destructive hover:text-destructive"
                        disabled={disabled}
                        onClick={() => eliminar(cargo.claveCliente)}
                        aria-label="Eliminar cargo adicional"
                      >
                        <Trash2Icon />
                      </Button>
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
        Agregar cargo adicional
      </Button>
    </div>
  );
}
