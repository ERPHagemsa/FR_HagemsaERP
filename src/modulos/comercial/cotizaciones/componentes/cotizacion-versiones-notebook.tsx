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
  CargaItem,
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
  const standbys = version.standbys ?? [];
  const totalLineas = version.lineas.length;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
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
      <Tabs defaultValue="resumen" className="mt-1">
        <TabsList variant="line">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="lineas">Lineas ({totalLineas})</TabsTrigger>
          <TabsTrigger value="leadtimes">Lead times ({leadTimes.length})</TabsTrigger>
          <TabsTrigger value="standby">Standby ({standbys.length})</TabsTrigger>
        </TabsList>

        {/* --- Resumen --- */}
        <TabsContent value="resumen" className="pt-4">
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            <DatoInline
              label="Validez (dias)"
              value={version.validezDias !== null ? String(version.validezDias) : null}
            />
            <DatoInline
              label="Fecha de envio"
              value={version.fechaEnvio ? formatearFecha(version.fechaEnvio) : null}
            />
            <DatoInline
              label="Fecha de vencimiento"
              value={version.fechaVencimiento ? formatearFecha(version.fechaVencimiento) : null}
            />
          </div>
          {version.condiciones || version.notas ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {version.condiciones ? (
                <BloqueTexto label="Condiciones" texto={version.condiciones} />
              ) : null}
              {version.notas ? (
                <BloqueTexto label="Notas" texto={version.notas} />
              ) : null}
            </div>
          ) : null}
        </TabsContent>

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

        {/* --- Standby --- */}
        <TabsContent value="standby" className="pt-4">
          {standbys.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin tarifas de standby.</p>
          ) : (
            <>
              <p className="mb-2 text-xs text-muted-foreground">
                Informativos — no suman al monto total.
              </p>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Descripcion</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Tarifa diaria</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Por linea</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standbys.map((sb) => (
                      <tr key={sb.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">{sb.descripcion}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatearMonto(sb.monto)} {version.moneda} / dia
                        </td>
                        <td className="px-3 py-2">
                          {sb.porLinea ? (
                            <Badge variant="secondary" className="text-xs">Por linea</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
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

function TablaLineas({ lineas, moneda }: { lineas: Linea[]; moneda: string }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-xs text-muted-foreground">
          <th className="px-3 py-2 text-left font-medium">Descripcion</th>
          <th className="px-3 py-2 text-left font-medium">Tipo</th>
          <th className="px-3 py-2 text-right font-medium">Cant.</th>
          <th className="px-3 py-2 text-right font-medium">P. venta</th>
          <th className="px-3 py-2 text-right font-medium">Total</th>
        </tr>
      </thead>
      <tbody>
        {lineas
          .slice()
          .sort((a, b) => a.orden - b.orden)
          .map((linea) => {
            const cargosLinea = linea.cargosAdicionales ?? [];
            return (
              <React.Fragment key={linea.id}>
                <tr className="border-b border-border/60 last:border-0">
                  <td className="px-3 py-2 font-medium">{linea.descripcion}</td>
                  <td className="px-3 py-2">
                    <Badge variant="outline" className="text-xs">
                      {formatearTipoLinea(linea.tipoLinea)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{linea.cantidad}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatearMonto(linea.precioVenta)}
                  </td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">
                    {formatearMonto(linea.precioVentaTotal)} {moneda}
                  </td>
                </tr>
                {tieneDetalle(linea) ? (
                  <tr className="border-b border-border/60 last:border-0">
                    <td colSpan={5} className="px-3 pb-2">
                      <DetalleLinea linea={linea} />
                    </td>
                  </tr>
                ) : null}
                {cargosLinea.length > 0 ? (
                  <tr className="border-b border-border/60 last:border-0">
                    <td colSpan={5} className="px-3 pb-2 pt-1">
                      <div className="rounded-md bg-muted/20 px-3 py-2">
                        <p className="mb-1 text-xs font-medium text-muted-foreground">Cargos de la linea</p>
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="text-muted-foreground">
                              <th className="py-0.5 text-left font-medium">Descripcion</th>
                              <th className="py-0.5 text-left font-medium">Unidad</th>
                              <th className="py-0.5 text-right font-medium">Cant.</th>
                              <th className="py-0.5 text-right font-medium">P. unitario</th>
                              <th className="py-0.5 text-right font-medium">Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {cargosLinea.map((c) => (
                              <tr key={c.id} className="border-t border-border/30">
                                <td className="py-0.5">{c.descripcion}</td>
                                <td className="py-0.5 text-muted-foreground">{c.unidadCobro ?? "—"}</td>
                                <td className="py-0.5 text-right tabular-nums">{c.cantidad ?? "—"}</td>
                                <td className="py-0.5 text-right tabular-nums">{c.precioUnitario !== undefined ? formatearMonto(c.precioUnitario) : "—"}</td>
                                <td className="py-0.5 text-right tabular-nums">{formatearMonto(c.monto)} {moneda}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </td>
                  </tr>
                ) : null}
              </React.Fragment>
            );
          })}
      </tbody>
    </table>
  );
}

function tieneDetalle(linea: Linea): boolean {
  return Boolean(linea.carga || linea.equipo || linea.almacenaje || linea.personal);
}

function DetalleLinea({ linea }: { linea: Linea }) {
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-1 rounded-md bg-muted/30 px-3 py-2 text-xs md:grid-cols-4">
      {linea.carga ? <CargaDetalle carga={linea.carga} /> : null}
      {linea.equipo ? <EquipoDetalle equipo={linea.equipo} /> : null}
      {linea.almacenaje ? <AlmacenajeDetalle almacenaje={linea.almacenaje} /> : null}
      {linea.personal ? <PersonalDetalle personal={linea.personal} /> : null}
    </div>
  );
}

function CargaDetalle({ carga }: { carga: CargaHijo }) {
  return (
    <>
      <MiniDato label="Vehiculo" value={carga.tipoVehiculo} />
      <MiniDato label="Origen" value={carga.origen} />
      <MiniDato label="Destino" value={carga.destino} />
      <MiniDato
        label="Cargas"
        value={carga.cargas.length > 0 ? String(carga.cargas.length) : null}
      />
      {carga.cargas.map((it) => (
        <MiniDato key={it.id} label={it.nombre || "Carga"} value={resumenCargaItem(it)} />
      ))}
    </>
  );
}

// Resumen de un item fisico para el detalle read-only: dimensiones · peso.
function resumenCargaItem(it: CargaItem): string | null {
  const partes: string[] = [];
  if (it.largoM !== null && it.anchoM !== null && it.altoM !== null) {
    partes.push(`${it.largoM} x ${it.anchoM} x ${it.altoM} m`);
  }
  if (it.peso !== null) {
    partes.push(`${it.peso} ${it.unidadPeso ?? "TN"}`);
  }
  return partes.length > 0 ? partes.join(" · ") : null;
}

function EquipoDetalle({ equipo }: { equipo: EquipoHijo }) {
  return (
    <>
      <MiniDato label="Tipo de equipo" value={equipo.equipoTipo} />
      <MiniDato label="Marca" value={equipo.marca} />
      <MiniDato label="Modelo" value={equipo.modelo} />
      <MiniDato label="Capacidad" value={equipo.capacidad} />
      <MiniDato
        label="Horas minimas"
        value={equipo.horasMinimas !== null ? String(equipo.horasMinimas) : null}
      />
      <MiniDato
        label="Dias contrato min."
        value={equipo.diasContratoMin !== null ? String(equipo.diasContratoMin) : null}
      />
    </>
  );
}

function AlmacenajeDetalle({ almacenaje }: { almacenaje: AlmacenajeHijo }) {
  return (
    <>
      <MiniDato label="Area (m2)" value={almacenaje.areaM2 !== null ? String(almacenaje.areaM2) : null} />
      <MiniDato
        label="Periodo (dias)"
        value={almacenaje.periodoDias !== null ? String(almacenaje.periodoDias) : null}
      />
    </>
  );
}

function PersonalDetalle({ personal }: { personal: PersonalHijo }) {
  return <MiniDato label="Rol" value={personal.rol} />;
}

// ---------------------------------------------------------------------------
// Atomos
// ---------------------------------------------------------------------------

function DatoInline({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border/40 pb-1">
      <span className="text-xs uppercase text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

function BloqueTexto({ label, texto }: { label: string; texto: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <p className="mb-1 text-xs uppercase text-muted-foreground">{label}</p>
      <p className="text-sm whitespace-pre-wrap">{texto}</p>
    </div>
  );
}

function MiniDato({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium">{value ?? "—"}</span>
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

function formatearFecha(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatearMonto(valor: number) {
  return new Intl.NumberFormat("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor);
}
