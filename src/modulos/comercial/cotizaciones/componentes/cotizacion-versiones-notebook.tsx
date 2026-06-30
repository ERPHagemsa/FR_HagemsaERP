"use client";

import * as React from "react";
import { Printer } from "lucide-react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/compartido/componentes/ui/tabs";

import { useImprimirPdf } from "../ganchos/use-imprimir-pdf";
import type {
  CargaHijo,
  EquipoHijo,
  AlmacenajeHijo,
  PersonalHijo,
  Linea,
  Seccion,
  Version,
} from "../tipos/cotizaciones.tipos";

type Props = {
  idCotizacion: string;
  versiones: Version[];
  versionVigente: number | null;
};

// Notebook estilo Odoo: UNA sola version visible a la vez.
// El selector elige que version se ve; las pestañas parten el detalle
// de esa version (Resumen / Lineas / Lead times / Standby) para que
// nada quede apilado infinitamente hacia abajo.
export function CotizacionVersionesNotebook({ idCotizacion, versiones, versionVigente }: Props) {
  const { imprimir, generando } = useImprimirPdf(idCotizacion);
  const ordenadas = React.useMemo(
    () => [...versiones].sort((a, b) => b.numeroVersion - a.numeroVersion),
    [versiones]
  );

  const inicial = versionVigente ?? ordenadas[0]?.numeroVersion ?? null;
  const [seleccionada, setSeleccionada] = React.useState<number | null>(inicial);

  if (ordenadas.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card py-8 text-center text-sm text-muted-foreground">
        Esta cotizacion aun no tiene versiones.
      </div>
    );
  }

  const version =
    ordenadas.find((v) => v.numeroVersion === seleccionada) ?? ordenadas[0];

  const lineasSinSeccion = version.lineas.filter((l) => l.idSeccion === null);
  const lineasPorSeccion = new Map<string, Linea[]>();
  for (const linea of version.lineas) {
    if (linea.idSeccion === null) continue;
    if (!lineasPorSeccion.has(linea.idSeccion)) lineasPorSeccion.set(linea.idSeccion, []);
    lineasPorSeccion.get(linea.idSeccion)!.push(linea);
  }

  const leadTimes = version.leadTimes ?? [];
  const totalLineas = version.lineas.length;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      {/* Barra de version: selector + estado + total */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={String(version.numeroVersion)}
            onValueChange={(v) => setSeleccionada(Number(v))}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ordenadas.map((v) => (
                <SelectItem key={v.numeroVersion} value={String(v.numeroVersion)}>
                  Version {v.numeroVersion}
                  {v.numeroVersion === versionVigente ? " (vigente)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Badge variant="outline" className="text-xs font-medium">
            {version.moneda}
          </Badge>
          {version.numeroVersion === versionVigente ? (
            <Badge variant="default">Vigente</Badge>
          ) : null}
          {version.congelada ? (
            <Badge variant="secondary">Congelada</Badge>
          ) : (
            <Badge variant="outline">Editable</Badge>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Base (sin margen) y ganancia = montoTotal − montoBase (ver API §4). */}
          {version.montoBase != null && version.montoTotal != null ? (
            <div className="hidden flex-col items-end text-xs text-muted-foreground sm:flex">
              <span className="tabular-nums">
                Base: {formatearMonto(version.montoBase)} {version.moneda}
              </span>
              <span className="tabular-nums">
                Ganancia: {formatearMonto(version.montoTotal - version.montoBase)} {version.moneda}
              </span>
            </div>
          ) : null}
          <div className="flex items-baseline gap-2">
            <span className="text-xs uppercase text-muted-foreground">Monto total</span>
            <span className="text-lg font-semibold tabular-nums">
              {version.montoTotal !== null
                ? `${formatearMonto(version.montoTotal)} ${version.moneda}`
                : "—"}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => imprimir(version.numeroVersion)}
            disabled={generando}
          >
            <Printer data-icon="inline-start" />
            {generando ? "Generando..." : "Imprimir version"}
          </Button>
        </div>
      </div>

      {version.motivo ? (
        <p className="text-sm text-muted-foreground">{version.motivo}</p>
      ) : null}

      {/* Notebook: pestañas del detalle de la version */}
      <Tabs defaultValue="lineas" className="mt-1">
        <TabsList variant="line">
          <TabsTrigger value="lineas">Lineas ({totalLineas})</TabsTrigger>
          <TabsTrigger value="leadtimes">Lead times ({leadTimes.length})</TabsTrigger>
        </TabsList>

        {/* --- Lineas --- */}
        <TabsContent value="lineas" className="pt-4">
          {totalLineas === 0 ? (
            <p className="text-sm text-muted-foreground">Esta version no tiene lineas.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {version.secciones
                .slice()
                .sort((a, b) => a.orden - b.orden)
                .map((seccion) => (
                  <SeccionBloque
                    key={seccion.id}
                    seccion={seccion}
                    lineas={lineasPorSeccion.get(seccion.id) ?? []}
                    moneda={version.moneda}
                  />
                ))}

              {lineasSinSeccion.length > 0 ? (
                <div className="rounded-lg border border-border">
                  <div className="border-b border-border bg-muted/30 px-3 py-2 text-sm font-medium">
                    Lineas sin seccion ({lineasSinSeccion.length})
                  </div>
                  <TablaLineas lineas={lineasSinSeccion} moneda={version.moneda} />
                </div>
              ) : null}
            </div>
          )}
        </TabsContent>

        {/* --- Lead times --- */}
        <TabsContent value="leadtimes" className="pt-4">
          {leadTimes.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin lead times registrados.</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Descripcion</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Plazo</th>
                  </tr>
                </thead>
                <tbody>
                  {leadTimes.map((lt) => (
                    <tr key={lt.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">{lt.descripcion}</td>
                      <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">
                        {lt.diasMax !== null
                          ? `${lt.diasMin}–${lt.diasMax} dias`
                          : `${lt.diasMin} dia${lt.diasMin !== 1 ? "s" : ""}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Seccion como bloque con tabla de lineas
// ---------------------------------------------------------------------------

function SeccionBloque({
  seccion,
  lineas,
  moneda,
}: {
  seccion: Seccion;
  lineas: Linea[];
  moneda: string;
}) {
  const cargos = seccion.cargosAdicionales ?? [];

  return (
    <div className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
        <span className="text-sm font-medium">{seccion.nombre ?? "Seccion"}</span>
        <span className="text-sm text-muted-foreground tabular-nums">
          Subtotal: {formatearMonto(seccion.subtotal)} {moneda}
        </span>
      </div>

      {lineas.length > 0 ? (
        <TablaLineas lineas={lineas} moneda={moneda} />
      ) : (
        <p className="px-3 py-2 text-sm text-muted-foreground">Sin lineas en esta seccion.</p>
      )}

      {cargos.length > 0 ? (
        <div className="border-t border-border px-3 py-2">
          <p className="mb-1 text-xs text-muted-foreground">Cargos adicionales</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="py-1 text-left font-medium">Descripcion</th>
                <th className="py-1 text-left font-medium">Unidad</th>
                <th className="py-1 text-right font-medium">Cant.</th>
                <th className="py-1 text-right font-medium">P. unitario</th>
                <th className="py-1 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody>
              {cargos.map((c) => (
                <tr key={c.id} className="border-b border-border/50 last:border-0">
                  <td className="py-1">{c.descripcion}</td>
                  <td className="py-1 text-muted-foreground">{c.unidadCobro ?? "—"}</td>
                  <td className="py-1 text-right tabular-nums">{c.cantidad ?? "—"}</td>
                  <td className="py-1 text-right tabular-nums">{c.precioUnitario !== undefined ? formatearMonto(c.precioUnitario) : "—"}</td>
                  <td className="py-1 text-right tabular-nums">{formatearMonto(c.monto)} {moneda}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tabla de lineas (con detalle polimorfico expandible inline)
// ---------------------------------------------------------------------------

// Tabla estilo documento: Ruta · Concepto · Descripcion · Cant · Costo base ·
// P. venta · Monto total. La Ruta (comun a todas las lineas) se combina con
// rowSpan. Cada cargo adicional de la linea es su PROPIA fila: su monto cae en
// la columna Monto total y el Concepto se combina (rowSpan) sobre linea+cargos.
function TablaLineas({ lineas, moneda }: { lineas: Linea[]; moneda: string }) {
  const ordenadas = lineas.slice().sort((a, b) => a.orden - b.orden);
  const rutaComun = ordenadas.map(rutaLinea).find(Boolean) ?? "—";
  // Cada linea ocupa 1 fila + 1 por cada cargo adicional.
  const totalFilas = ordenadas.reduce(
    (acc, l) => acc + 1 + (l.cargosAdicionales?.length ?? 0),
    0,
  );
  return (
    <table className="w-full border-collapse text-sm [&_td]:border [&_td]:border-border/60 [&_th]:border [&_th]:border-border/60">
      <thead>
        <tr className="text-xs text-muted-foreground">
          <th className="px-3 py-2 text-left font-medium">Ruta</th>
          <th className="px-3 py-2 text-left font-medium">Concepto</th>
          <th className="px-3 py-2 text-left font-medium">Descripcion</th>
          <th className="px-3 py-2 text-right font-medium">Cant.</th>
          <th className="px-3 py-2 text-right font-medium">Costo base</th>
          <th className="px-3 py-2 text-right font-medium">P. venta</th>
          <th className="px-3 py-2 text-right font-medium">Monto total</th>
        </tr>
      </thead>
      <tbody>
        {ordenadas.map((linea, i) => {
          const tipoLabel = formatearTipoLinea(linea.tipoLinea);
          // Transporte: el concepto es el vehiculo (no se repite en descripcion).
          const concepto = linea.carga
            ? linea.carga.tipoVehiculo ?? tipoLabel
            : linea.descripcion ?? tipoLabel;
          const cargos = linea.cargosAdicionales ?? [];
          return (
            <React.Fragment key={linea.id}>
              <tr className="align-top">
                {i === 0 ? (
                  <td
                    rowSpan={totalFilas}
                    className="whitespace-nowrap px-3 py-2 align-middle font-medium text-muted-foreground"
                  >
                    {rutaComun}
                  </td>
                ) : null}
                <td rowSpan={1 + cargos.length} className="px-3 py-2 font-medium">
                  {concepto}
                </td>
                <td className="px-3 py-2">
                  <DescripcionLinea linea={linea} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                  {linea.cantidad}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-muted-foreground">
                  {formatearMonto(linea.precioBase)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                  {formatearMonto(linea.precioVenta)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">
                  {formatearMonto(linea.precioVentaTotal)} {moneda}
                </td>
              </tr>
              {cargos.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="px-3 py-2 font-medium">{c.descripcion}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {c.cantidad}
                  </td>
                  <td className="px-3 py-2 text-right text-muted-foreground">—</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-muted-foreground">
                    {formatearMonto(c.precioUnitario)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">
                    {formatearMonto(c.monto)} {moneda}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

// Ruta de una linea de transporte (origen → destino); null si no aplica.
function rutaLinea(linea: Linea): string | null {
  const carga = linea.carga;
  if (!carga || (!carga.origen && !carga.destino)) return null;
  return `${carga.origen ?? "—"} → ${carga.destino ?? "—"}`;
}

function tieneDetalle(linea: Linea): boolean {
  return Boolean(linea.carga || linea.equipo || linea.almacenaje || linea.personal);
}

function DescripcionLinea({ linea }: { linea: Linea }) {
  if (!tieneDetalle(linea)) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col gap-1.5 text-xs">
      {linea.carga ? <CargaDescripcion carga={linea.carga} /> : null}
      {linea.equipo ? <EquipoDetalle equipo={linea.equipo} /> : null}
      {linea.almacenaje ? <AlmacenajeDetalle almacenaje={linea.almacenaje} /> : null}
      {linea.personal ? <PersonalDetalle personal={linea.personal} /> : null}
    </div>
  );
}

// Transporte: cada item fisico con su nombre (arriba) y dimensiones L/A/H/P
// (debajo). Una sola grilla compartida (8 columnas: 4 pares etiqueta+valor)
// mantiene L/A/H/P alineados verticalmente entre todos los items, como Excel.
function CargaDescripcion({ carga }: { carga: CargaHijo }) {
  if (carga.cargas.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="grid grid-cols-[auto_auto_auto_auto_auto_auto_auto_auto] gap-x-1 gap-y-0.5 tabular-nums">
      {carga.cargas.map((it, idx) => (
        <React.Fragment key={it.id}>
          <span
            className={idx === 0 ? "col-span-8 font-medium" : "col-span-8 mt-1.5 font-medium"}
          >
            {it.nombre || "Carga"}
          </span>
          <span className="text-muted-foreground/70">L:</span>
          <span className="pr-3 text-right text-muted-foreground">{valorDim(it.largoM, "m")}</span>
          <span className="text-muted-foreground/70">A:</span>
          <span className="pr-3 text-right text-muted-foreground">{valorDim(it.anchoM, "m")}</span>
          <span className="text-muted-foreground/70">H:</span>
          <span className="pr-3 text-right text-muted-foreground">{valorDim(it.altoM, "m")}</span>
          <span className="text-muted-foreground/70">P:</span>
          <span className="text-right text-muted-foreground">
            {valorDim(it.peso, it.unidadPeso ?? "TN")}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}

// Valor de una dimension; "—" si no viene cargada (mantiene la columna alineada).
function valorDim(valor: number | null, unidad: string): string {
  return valor !== null ? `${valor} ${unidad}` : "—";
}

function EquipoDetalle({ equipo }: { equipo: EquipoHijo }) {
  const marcaModelo = [equipo.marca, equipo.modelo].filter(Boolean).join(" ") || null;
  const minimos =
    [
      equipo.horasMinimas !== null ? `${equipo.horasMinimas} h min` : null,
      equipo.diasContratoMin !== null ? `${equipo.diasContratoMin} dias contrato min` : null,
    ]
      .filter(Boolean)
      .join(" · ") || null;
  return (
    <div className="flex flex-col gap-0.5">
      <DetalleFila label="Equipo" valor={equipo.equipoTipo} />
      <DetalleFila label="Marca/Modelo" valor={marcaModelo} />
      <DetalleFila label="Capacidad" valor={equipo.capacidad} />
      <DetalleFila label="Minimos" valor={minimos} />
    </div>
  );
}

function AlmacenajeDetalle({ almacenaje }: { almacenaje: AlmacenajeHijo }) {
  return (
    <div className="flex flex-col gap-0.5">
      <DetalleFila
        label="Area"
        valor={almacenaje.areaM2 !== null ? `${almacenaje.areaM2} m2` : null}
      />
      <DetalleFila
        label="Periodo"
        valor={almacenaje.periodoDias !== null ? `${almacenaje.periodoDias} dias` : null}
      />
    </div>
  );
}

function PersonalDetalle({ personal }: { personal: PersonalHijo }) {
  return <DetalleFila label="Rol" valor={personal.rol} />;
}

// ---------------------------------------------------------------------------
// Atomos
// ---------------------------------------------------------------------------

// Dato inline "label: valor"; se omite por completo si no hay valor (adaptativo).
function DetalleFila({ label, valor }: { label: string; valor: string | null | undefined }) {
  if (!valor) return null;
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5">
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-medium">{valor}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formato
// ---------------------------------------------------------------------------

function formatearTipoLinea(tipo: string) {
  const mapa: Record<string, string> = {
    TRANSPORTE: "Transporte",
    ALQUILER_EQUIPO: "Alquiler equipo",
    ALMACENAJE: "Almacenaje",
    AGENCIAMIENTO: "Agenciamiento",
    PERSONAL: "Personal",
    SERVICIO_AUXILIAR: "Servicio auxiliar",
  };
  return mapa[tipo] ?? tipo;
}

function formatearMonto(valor: number) {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}
