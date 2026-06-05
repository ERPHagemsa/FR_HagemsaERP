"use client";

import { GitCompareArrows } from "lucide-react";
import * as React from "react";

import { Button } from "@/compartido/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/compartido/componentes/ui/card";
import type { ActivoConfiguracionHistorica } from "../tipos/activo.tipos";

type Props = {
  configuraciones: ActivoConfiguracionHistorica[];
};

export function ConfiguracionHistoricaActivo({ configuraciones }: Props) {
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);

  const totalPaginas = Math.max(
    1,
    Math.ceil(configuraciones.length / registrosPorPagina)
  );
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  const visibles = configuraciones.slice(inicioPagina, finPagina);
  const desdeVisible = configuraciones.length ? inicioPagina + 1 : 0;
  const hastaVisible = Math.min(finPagina, configuraciones.length);

  React.useEffect(() => {
    setPagina(1);
  }, [configuraciones, registrosPorPagina]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <GitCompareArrows className="size-5" aria-hidden="true" />
        </span>
        <div>
          <CardTitle>Configuracion historica</CardTitle>
          <p className="text-sm text-muted-foreground">
            Repotenciaciones, cambios de carroceria, placa o referencia anterior.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left">
              <tr>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Tipo</th>
                <th className="px-4 py-3 font-semibold">Anterior</th>
                <th className="px-4 py-3 font-semibold">Nuevo</th>
                <th className="px-4 py-3 font-semibold">Motivo</th>
                <th className="px-4 py-3 font-semibold">Usuario</th>
              </tr>
            </thead>
            <tbody>
              {configuraciones.length ? (
                visibles.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-b-0">
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatearFecha(item.fechaCambio)}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatearTexto(item.tipoCambio)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <Referencia
                        codigo={item.codigoAnterior}
                        placa={item.placaAnterior}
                        carroceria={item.carroceriaAnterior}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Referencia
                        codigo={item.codigoNuevo}
                        placa={item.placaNueva}
                        carroceria={item.carroceriaNueva}
                      />
                    </td>
                    <td className="max-w-[260px] truncate px-4 py-3 text-muted-foreground" title={item.motivo ?? "-"}>
                      {item.motivo ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {item.usuarioRegistro ?? "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    Este activo aun no tiene configuracion historica registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {configuraciones.length ? (
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              Mostrando {desdeVisible}-{hastaVisible} de{" "}
              {configuraciones.length} registros
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2">
                <span>Filas</span>
                <select
                  className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
                  value={registrosPorPagina}
                  onChange={(event) =>
                    setRegistrosPorPagina(Number(event.target.value))
                  }
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagina === 1}
                onClick={() => setPagina((actual) => Math.max(1, actual - 1))}
              >
                Anterior
              </Button>
              <span className="min-w-20 text-center">
                {pagina} / {totalPaginas}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagina === totalPaginas}
                onClick={() =>
                  setPagina((actual) => Math.min(totalPaginas, actual + 1))
                }
              >
                Siguiente
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function Referencia({
  codigo,
  placa,
  carroceria,
}: {
  codigo: string | null;
  placa: string | null;
  carroceria: string | null;
}) {
  return (
    <div className="grid gap-1">
      <span className="font-medium text-foreground">{codigo ?? "-"}</span>
      <span>Placa: {placa ?? "-"}</span>
      <span>Carroceria: {carroceria ?? "-"}</span>
    </div>
  );
}

function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatearTexto(value: string) {
  const texto = value.replaceAll("_", " ").toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
