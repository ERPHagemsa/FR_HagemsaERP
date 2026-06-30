"use client";

import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/compartido/componentes/ui/table";

import type { UnidadCobro } from "../tipos/cotizaciones.tipos";
import type { DraftCargoAdicional } from "../servicios/cotizaciones-editor.utils";
import { cargoAdicionalVacio, montoCargo } from "../servicios/cotizaciones-editor.utils";
import type { CatalogoCargoAdicional } from "../tipos/cotizaciones.tipos";

const UNIDADES_COBRO: { valor: UnidadCobro; etiqueta: string }[] = [
  { valor: "VIAJE", etiqueta: "Viaje" },
  { valor: "DIA", etiqueta: "Dia" },
  { valor: "M2", etiqueta: "M2" },
  { valor: "SERVICIO", etiqueta: "Servicio" },
  { valor: "HORA", etiqueta: "Hora" },
  { valor: "TONELADA", etiqueta: "Tonelada" },
  { valor: "CONTENEDOR", etiqueta: "Contenedor" },
  { valor: "OTRO", etiqueta: "Otro" },
];

type Props = {
  cargos: DraftCargoAdicional[];
  opcionesCatalogo: CatalogoCargoAdicional[];
  erroresCampo?: Record<string, string>;
  disabled?: boolean;
  onChange: (cargos: DraftCargoAdicional[]) => void;
};

export function EditorCargos({ cargos, opcionesCatalogo, erroresCampo = {}, disabled, onChange }: Props) {
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
                <TableHead className="min-w-[180px]">Descripcion</TableHead>
                <TableHead className="w-36">Unidad de cobro</TableHead>
                <TableHead className="w-24">Cantidad</TableHead>
                <TableHead className="w-28">Precio unitario</TableHead>
                <TableHead className="w-28">Stand by / dia</TableHead>
                <TableHead className="w-28 text-right">Monto</TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {cargos.map((cargo, idx) => {
                const errDesc = erroresCampo[`cargosAdicionales.${idx}.descripcion`];
                const errUnidad = erroresCampo[`cargosAdicionales.${idx}.unidadCobro`];
                const errCantidad = erroresCampo[`cargosAdicionales.${idx}.cantidad`];
                const errPrecio = erroresCampo[`cargosAdicionales.${idx}.precioUnitario`];
                const errStandby = erroresCampo[`cargosAdicionales.${idx}.standbyDia`];
                const monto = montoCargo(cargo);
                return (
                  <TableRow key={cargo.claveCliente}>
                    {/* Cargo: seleccion estricta desde el catalogo de cargos adicionales */}
                    <TableCell>
                      <Select
                        value={cargo.descripcion || undefined}
                        disabled={disabled || opcionesCatalogo.length === 0}
                        onValueChange={(v) =>
                          actualizar(cargo.claveCliente, { descripcion: v })
                        }
                      >
                        <SelectTrigger
                          className="h-8 w-full min-w-[180px] text-xs"
                          aria-invalid={Boolean(errDesc)}
                        >
                          <SelectValue
                            placeholder={
                              opcionesCatalogo.length === 0
                                ? "Sin catalogo disponible"
                                : "Selecciona un cargo"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {opcionesCatalogo.map((o) => (
                              <SelectItem key={o.id} value={o.nombre} className="text-xs">
                                {o.nombre}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {errDesc ? (
                        <p className="mt-0.5 whitespace-normal text-xs text-destructive">{errDesc}</p>
                      ) : null}
                    </TableCell>

                    {/* Unidad de cobro */}
                    <TableCell>
                      <Select
                        value={cargo.unidadCobro}
                        disabled={disabled}
                        onValueChange={(v) =>
                          actualizar(cargo.claveCliente, { unidadCobro: v as UnidadCobro })
                        }
                      >
                        <SelectTrigger
                          className="h-8 w-full text-xs"
                          aria-invalid={Boolean(errUnidad)}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {UNIDADES_COBRO.map((u) => (
                              <SelectItem key={u.valor} value={u.valor} className="text-xs">
                                {u.etiqueta}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {errUnidad ? (
                        <p className="mt-0.5 whitespace-normal text-xs text-destructive">{errUnidad}</p>
                      ) : null}
                    </TableCell>

                    {/* Cantidad */}
                    <TableCell>
                      <Input
                        className="h-8 w-20 text-xs"
                        type="number"
                        min={0}
                        step="1"
                        value={cargo.cantidad}
                        disabled={disabled}
                        aria-invalid={Boolean(errCantidad)}
                        onChange={(e) => actualizar(cargo.claveCliente, { cantidad: e.target.value })}
                      />
                      {errCantidad ? (
                        <p className="mt-0.5 whitespace-normal text-xs text-destructive">{errCantidad}</p>
                      ) : null}
                    </TableCell>

                    {/* Precio unitario */}
                    <TableCell>
                      <Input
                        className="h-8 w-24 text-xs"
                        type="number"
                        min={0}
                        step="0.01"
                        value={cargo.precioUnitario}
                        disabled={disabled}
                        aria-invalid={Boolean(errPrecio)}
                        onChange={(e) => actualizar(cargo.claveCliente, { precioUnitario: e.target.value })}
                      />
                      {errPrecio ? (
                        <p className="mt-0.5 whitespace-normal text-xs text-destructive">{errPrecio}</p>
                      ) : null}
                    </TableCell>

                    {/* Stand by por dia (opcional; vacio = sin stand-by) */}
                    <TableCell>
                      <Input
                        className="h-8 w-24 text-xs"
                        type="number"
                        min={0}
                        step="0.01"
                        placeholder="—"
                        value={cargo.standbyDia}
                        disabled={disabled}
                        aria-invalid={Boolean(errStandby)}
                        onChange={(e) => actualizar(cargo.claveCliente, { standbyDia: e.target.value })}
                      />
                      {errStandby ? (
                        <p className="mt-0.5 whitespace-normal text-xs text-destructive">{errStandby}</p>
                      ) : null}
                    </TableCell>

                    {/* Monto calculado (READ-ONLY — cantidad × precioUnitario) */}
                    <TableCell className="text-right font-mono text-xs text-muted-foreground tabular-nums">
                      {monto.toLocaleString("es-PE", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>

                    {/* Eliminar */}
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
                        <Trash2Icon data-icon="inline-start" />
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
