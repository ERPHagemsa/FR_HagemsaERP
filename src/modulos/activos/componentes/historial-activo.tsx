"use client";

import { History } from "lucide-react";
import * as React from "react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/compartido/componentes/ui/card";
import type {
  ActivoConfiguracionHistorica,
  ActivoHistorial,
} from "../tipos/activo.tipos";

type Props = {
  historial: ActivoHistorial[];
  configuraciones?: ActivoConfiguracionHistorica[];
};

type DetalleAuditoria = {
  campo: string;
  antes: string;
  despues: string;
  tipo?: "normal" | "positivo" | "negativo";
};

type GrupoAuditoria = {
  id: string;
  fecha: string;
  accion: string;
  modulo: string;
  resumen: string;
  usuario: string;
  motivo: string;
  detalles: DetalleAuditoria[];
};

export function HistorialActivo({ historial, configuraciones = [] }: Props) {
  const [pagina, setPagina] = React.useState(1);
  const [registrosPorPagina, setRegistrosPorPagina] = React.useState(10);
  const grupos = React.useMemo(
    () => construirGruposAuditoria(historial, configuraciones),
    [historial, configuraciones]
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(grupos.length / registrosPorPagina)
  );
  const inicioPagina = (pagina - 1) * registrosPorPagina;
  const finPagina = inicioPagina + registrosPorPagina;
  const visibles = grupos.slice(inicioPagina, finPagina);
  const desdeVisible = grupos.length ? inicioPagina + 1 : 0;
  const hastaVisible = Math.min(finPagina, grupos.length);

  React.useEffect(() => {
    setPagina(1);
  }, [grupos.length, registrosPorPagina]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <History className="size-5" aria-hidden="true" />
        </span>
        <div>
          <CardTitle>Historial y auditoria</CardTitle>
          <p className="text-sm text-muted-foreground">
            Cambios registrados para trazabilidad del activo.
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {grupos.length ? (
          <div className="grid gap-3">
            {visibles.map((grupo) => (
              <details
                key={grupo.id}
                className="group overflow-hidden rounded-xl border border-border bg-background"
              >
                <summary className="grid cursor-pointer list-none gap-3 px-4 py-3 transition-colors hover:bg-muted/40 md:grid-cols-[180px_1fr_160px_160px] md:items-center">
                  <div className="text-sm text-muted-foreground">
                    {formatearFechaHora(grupo.fecha)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{grupo.accion}</span>
                      <Badge variant="outline">{grupo.modulo}</Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {grupo.resumen}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Usuario: {grupo.usuario}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {grupo.detalles.length} detalle
                    {grupo.detalles.length === 1 ? "" : "s"}
                  </div>
                </summary>

                <div className="border-t border-border px-4 py-3">
                  <div className="mb-3 grid gap-1 text-sm text-muted-foreground">
                    <span>Motivo: {grupo.motivo}</span>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border bg-muted/30 text-left">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Campo</th>
                          <th className="px-4 py-3 font-semibold">Antes</th>
                          <th className="px-4 py-3 font-semibold">Despues</th>
                        </tr>
                      </thead>
                      <tbody>
                        {grupo.detalles.map((detalle, index) => (
                          <tr
                            key={`${grupo.id}-${detalle.campo}-${index}`}
                            className="border-b border-border last:border-b-0"
                          >
                            <td className="px-4 py-3 font-medium">
                              {detalle.campo}
                            </td>
                            <td className="max-w-[260px] px-4 py-3">
                              <ValorAuditoria
                                tipo="antes"
                                valor={detalle.antes}
                              />
                            </td>
                            <td className="max-w-[260px] px-4 py-3">
                              <ValorAuditoria
                                tipo="despues"
                                tono={detalle.tipo}
                                valor={detalle.despues}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </details>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border px-4 py-10 text-center text-sm text-muted-foreground">
            Este activo aun no tiene historial registrado.
          </div>
        )}
        {grupos.length ? (
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              Mostrando {desdeVisible}-{hastaVisible} de {grupos.length} acciones
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

function construirGruposAuditoria(
  historial: ActivoHistorial[],
  configuraciones: ActivoConfiguracionHistorica[]
): GrupoAuditoria[] {
  const gruposConfiguracion = configuraciones.map((item) => ({
    id: `configuracion-${item.id}`,
    fecha: item.fechaCambio || item.createdAt,
    accion: formatearTipoConfiguracion(item.tipoCambio),
    modulo: "Configuracion historica",
    resumen: construirResumenConfiguracion(item),
    usuario: item.usuarioRegistro ?? "-",
    motivo: item.motivo ?? "-",
    detalles: construirDetallesConfiguracion(item),
  }));

  const tieneConfiguracion = configuraciones.length > 0;
  const historialVisible = tieneConfiguracion
    ? historial.filter((item) => item.tipoCambio !== "CONFIGURACION_HISTORICA")
    : historial;
  const gruposPorLlave = new Map<string, ActivoHistorial[]>();

  for (const item of historialVisible) {
    const llave = [
      item.tipoCambio,
      item.createdAt,
      item.usuario ?? "",
      item.motivo ?? "",
    ].join("|");
    gruposPorLlave.set(llave, [...(gruposPorLlave.get(llave) ?? []), item]);
  }

  const gruposHistorial = Array.from(gruposPorLlave.entries()).map(
    ([llave, items]) => {
      const primero = items[0];

      return {
        id: `historial-${llave}`,
        fecha: primero.createdAt,
        accion: formatearTexto(primero.tipoCambio),
        modulo: obtenerModuloHistorial(items),
        resumen: construirResumenHistorial(items),
        usuario: primero.usuario ?? "-",
        motivo: primero.motivo ?? "-",
        detalles: items.map((item) => construirDetalleHistorial(item)),
      };
    }
  );

  return [...gruposConfiguracion, ...gruposHistorial].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );
}

function construirResumenConfiguracion(item: ActivoConfiguracionHistorica) {
  if (item.tipoCambio === "CAMBIO_PLACA") {
    return `Replaqueo: placa anterior ${formatearValor(
      item.placaAnterior
    )} -> placa nueva ${formatearValor(
      item.placaNueva
    )}`;
  }

  if (item.tipoCambio === "CAMBIO_CARROCERIA") {
    return `Cambio de carroceria: ${formatearValor(
      item.carroceriaAnterior
    )} -> ${formatearValor(item.carroceriaNueva)}`;
  }

  const cambiosPrincipales = [
    item.codigoAnterior || item.codigoNuevo
      ? `Codigo: ${formatearValor(item.codigoAnterior)} -> ${formatearValor(
          item.codigoNuevo
        )}`
      : null,
    item.placaAnterior || item.placaNueva
      ? `Placa: ${formatearValor(item.placaAnterior)} -> ${formatearValor(
          item.placaNueva
        )}`
      : null,
    item.carroceriaAnterior || item.carroceriaNueva
      ? `Carroceria: ${formatearValor(
          item.carroceriaAnterior
        )} -> ${formatearValor(item.carroceriaNueva)}`
      : null,
  ].filter(Boolean);

  return cambiosPrincipales.join(" | ") || "Configuracion historica registrada";
}

function construirResumenHistorial(items: ActivoHistorial[]) {
  if (items.length === 1) {
    const item = items[0];
    const detalle = construirDetalleHistorial(item);
    return `${detalle.campo}: ${detalle.antes} -> ${detalle.despues}`;
  }

  return `${items.length} campos modificados`;
}

function construirDetallesConfiguracion(
  item: ActivoConfiguracionHistorica
): DetalleAuditoria[] {
  const detalles: DetalleAuditoria[] = [
    {
      campo: "Tipo de cambio",
      antes: "-",
      despues: formatearTipoConfiguracion(item.tipoCambio),
      tipo: "positivo",
    },
  ];

  agregarDetalleSiCambio(detalles, {
    campo: "Codigo funcional",
    antes: item.codigoAnterior,
    despues: item.codigoNuevo,
  });

  agregarDetalleSiCambio(detalles, {
    campo: "Placa de rodaje",
    antes: item.placaAnterior,
    despues: item.placaNueva,
  });

  agregarDetalleSiCambio(detalles, {
    campo: "Carroceria",
    antes: item.carroceriaAnterior,
    despues: item.carroceriaNueva,
  });

  if (item.activoAnteriorId) {
    detalles.push({
      campo: "Trazabilidad de inventario",
      antes: `Activo anterior #${item.activoAnteriorId}`,
      despues: `Activo nuevo #${item.activoNuevoId}`,
      tipo: "positivo",
    });
  }

  if (item.documentoSustentoUrl) {
    detalles.push({
      campo: "Documento sustento",
      antes: "-",
      despues: formatearValor(item.documentoSustentoUrl),
      tipo: "positivo",
    });
  }

  return detalles;
}

function agregarDetalleSiCambio(
  detalles: DetalleAuditoria[],
  {
    campo,
    antes,
    despues,
  }: {
    campo: string;
    antes: string | null;
    despues: string | null;
  }
) {
  const valorAnterior = formatearValor(antes);
  const valorNuevo = formatearValor(despues);

  if (valorAnterior === "-" && valorNuevo === "-") return;
  if (valorAnterior === valorNuevo) return;

  detalles.push({
    campo,
    antes: valorAnterior,
    despues: valorNuevo,
    tipo: "positivo",
  });
}

function construirDetalleHistorial(item: ActivoHistorial): DetalleAuditoria {
  const campo = formatearCampo(item.campo);
  const antes = formatearValor(item.valorAnterior);
  const despues = formatearValor(item.valorNuevo);

  if (item.tipoCambio === "REINTEGRO" || item.tipoCambio === "REINGRESO") {
    return {
      campo: campo === "Registro" ? "Referencia de reingreso" : campo,
      antes: normalizarOrigenReintegro(antes),
      despues: normalizarNuevoReintegro(despues),
      tipo: "positivo",
    };
  }

  if (item.campo === "estadoRegistro") {
    return {
      campo,
      antes,
      despues,
      tipo: despues.toLowerCase() === "anulado" ? "negativo" : "positivo",
    };
  }

  if (item.tipoCambio === "SINIESTRO" || item.tipoCambio === "BAJA") {
    return { campo, antes, despues, tipo: "negativo" };
  }

  return { campo, antes, despues, tipo: "positivo" };
}

function normalizarOrigenReintegro(value: string) {
  const match = value.match(/origen id\s+(\d+)/i);
  if (match) return `Activo anterior #${match[1]}`;
  return value;
}

function normalizarNuevoReintegro(value: string) {
  if (value === "-") return value;
  return `Nuevo activo ${value}`;
}

function obtenerModuloHistorial(items: ActivoHistorial[]) {
  if (items.some((item) => item.campo?.startsWith("vehiculo."))) {
    return "Vehiculo";
  }
  if (items.some((item) => item.campo === "estadoRegistro")) {
    return "Registro";
  }
  if (items.some((item) => item.campo?.includes("Factura") || item.campo === "proveedor")) {
    return "Adquisicion";
  }

  return "Activo";
}

function ValorAuditoria({
  tipo,
  tono = "normal",
  valor,
}: {
  tipo: "antes" | "despues";
  tono?: DetalleAuditoria["tipo"];
  valor: string;
}) {
  if (valor === "-") {
    return <span className="text-muted-foreground">-</span>;
  }

  if (tipo === "antes") {
    return (
      <span className="inline-flex rounded-md bg-destructive/10 px-2 py-1 text-destructive line-through decoration-destructive/70">
        {valor}
      </span>
    );
  }

  const className =
    tono === "negativo"
      ? "bg-destructive/10 text-destructive"
      : tono === "positivo"
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-muted text-foreground";

  return (
    <span className={`inline-flex rounded-md px-2 py-1 ${className}`}>
      {valor}
    </span>
  );
}

function formatearFechaHora(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatearTexto(value: string) {
  const texto = value.replaceAll("_", " ").toLowerCase();
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearTipoConfiguracion(value: ActivoConfiguracionHistorica["tipoCambio"]) {
  const labels: Record<ActivoConfiguracionHistorica["tipoCambio"], string> = {
    REPOTENCIACION: "Repotenciacion",
    CAMBIO_CARROCERIA: "Cambio de carroceria",
    CAMBIO_PLACA: "Replaqueo",
    REMOLCAMIENTO: "Remolcamiento",
    MEJORA_ESTRUCTURAL: "Mejora estructural",
    RENOVACION: "Renovacion",
    OTRO: "Configuracion historica",
  };

  return labels[value] ?? formatearTexto(value);
}

const CAMPOS_HISTORIAL: Record<string, string> = {
  registro: "Registro",
  codigo: "Codigo",
  tipoActivo: "Tipo de activo",
  descripcion: "Descripcion",
  ubicacion: "Ubicacion",
  estadoActivo: "Estado del activo",
  estadoRegistro: "Estado de registro",
  observacion: "Observacion",
  valorUnidad: "Valor de unidad",
  moneda: "Moneda",
  proveedor: "Proveedor",
  numeroFactura: "Numero de factura",
  fechaFactura: "Fecha de factura",
  "vehiculo.plantillaInventario": "Plantilla",
  "vehiculo.placaRodaje": "Placa",
  "vehiculo.anioFabricacion": "Ano de fabricacion",
  "vehiculo.color": "Color",
  "vehiculo.marca": "Marca",
  "vehiculo.modelo": "Modelo",
  "vehiculo.carroceria": "Carroceria",
  "vehiculo.ejes": "Ejes",
  "vehiculo.categoria": "Categoria",
  "vehiculo.serieChasis": "Serie de chasis",
  "vehiculo.serieMotor": "Serie de motor",
  "vehiculo.estadoOperativo": "Estado operativo",
  "vehiculo.estadoCalibracion": "Estado de calibracion",
  "vehiculo.ancho": "Ancho",
  "vehiculo.longitud": "Longitud",
  "vehiculo.alto": "Alto",
  "vehiculo.tipoSuspension": "Tipo de suspension",
  "vehiculo.tipoTornamesa": "Tipo de tornamesa",
  "vehiculo.claseEuro": "Clase Euro / NEC",
  "vehiculo.ratioCorona": "Ratio de corona",
  "vehiculo.tipoTransmision": "Tipo de transmision",
};

function formatearCampo(value: string | null) {
  if (!value) return "-";
  return CAMPOS_HISTORIAL[value] ?? separarCamelCase(value);
}

function separarCamelCase(value: string) {
  const limpio = value.replace("vehiculo.", "").replaceAll("_", " ");
  return limpio
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .replace(/^./, (char) => char.toUpperCase());
}

function formatearValor(value: string | null) {
  if (!value) return "-";

  const fecha = Date.parse(value);
  if (/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value) && !Number.isNaN(fecha)) {
    return new Intl.DateTimeFormat("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(value));
  }

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/^./, (char) => char.toUpperCase());
}
