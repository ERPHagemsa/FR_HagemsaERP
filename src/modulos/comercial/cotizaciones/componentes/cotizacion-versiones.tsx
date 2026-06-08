import { Badge } from "@/compartido/componentes/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";

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
  versiones: Version[];
  versionVigente: number | null;
};

export function CotizacionVersiones({ versiones, versionVigente }: Props) {
  const ordenadas = [...versiones].sort((a, b) => a.numeroVersion - b.numeroVersion);

  if (ordenadas.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Esta cotizacion aun no tiene versiones.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {ordenadas.map((version) => (
        <VersionCard
          key={version.numeroVersion}
          version={version}
          esVigente={version.numeroVersion === versionVigente}
        />
      ))}
    </div>
  );
}

function VersionCard({
  version,
  esVigente,
}: {
  version: Version;
  esVigente: boolean;
}) {
  // Agrupar lineas por seccion para mostrarlas organizadas
  const seccionesMap = new Map<string, Seccion>(
    version.secciones.map((s) => [s.id, s])
  );

  const lineasPorSeccion = new Map<string | null, Linea[]>();
  for (const linea of version.lineas) {
    const key = linea.idSeccion ?? null;
    if (!lineasPorSeccion.has(key)) lineasPorSeccion.set(key, []);
    lineasPorSeccion.get(key)!.push(linea);
  }

  const standbys = version.standbys ?? [];
  const leadTimes = version.leadTimes ?? [];

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-base">
            Version {version.numeroVersion}
          </CardTitle>
          {/* Moneda de la version junto al numero */}
          <Badge variant="outline" className="text-xs font-medium">
            {version.moneda}
          </Badge>
          {esVigente ? (
            <Badge variant="default">Vigente</Badge>
          ) : null}
          {version.congelada ? (
            <Badge variant="secondary">Congelada</Badge>
          ) : (
            <Badge variant="outline">Editable</Badge>
          )}
        </div>
        {version.motivo ? (
          <p className="text-sm text-muted-foreground">{version.motivo}</p>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-5 pt-5">
        {/* Total */}
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <TotalItem
            label="Monto total"
            valor={version.montoTotal}
            moneda={version.moneda}
          />
        </div>

        {/* Datos de validez/envio */}
        <div className="grid gap-4 md:grid-cols-3">
          <DatoVersion
            label="Validez (dias)"
            value={version.validezDias !== null ? String(version.validezDias) : null}
          />
          <DatoVersion
            label="Fecha de envio"
            value={version.fechaEnvio ? formatearFecha(version.fechaEnvio) : null}
          />
          <DatoVersion
            label="Fecha de vencimiento"
            value={version.fechaVencimiento ? formatearFecha(version.fechaVencimiento) : null}
          />
        </div>

        {/* Lead times */}
        {leadTimes.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Lead times / plazos</p>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Descripcion</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Plazo</th>
                  </tr>
                </thead>
                <tbody>
                  {leadTimes.map((lt) => (
                    <tr key={lt.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">{lt.descripcion}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {lt.diasMax !== null
                          ? `${lt.diasMin}–${lt.diasMax} dias`
                          : `${lt.diasMin} dia${lt.diasMin !== 1 ? "s" : ""}`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Secciones con sus lineas y cargosAdicionales */}
        {version.secciones.length > 0 ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium">Secciones</p>
            {version.secciones
              .sort((a, b) => a.orden - b.orden)
              .map((seccion) => (
                <SeccionCard
                  key={seccion.id}
                  seccion={seccion}
                  lineas={lineasPorSeccion.get(seccion.id) ?? []}
                  moneda={version.moneda}
                />
              ))}
          </div>
        ) : null}

        {/* Lineas sin seccion */}
        {(lineasPorSeccion.get(null) ?? []).length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">
              Lineas ({(lineasPorSeccion.get(null) ?? []).length})
            </p>
            <div className="flex flex-col gap-2">
              {(lineasPorSeccion.get(null) ?? []).map((linea) => (
                <LineaRow
                  key={linea.id}
                  linea={linea}
                  moneda={version.moneda}
                  seccionesMap={seccionesMap}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* Standbys (informativos, no suman al total) */}
        {standbys.length > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Standby / tarifas</p>
            <p className="text-xs text-muted-foreground">Informativos — no suman al monto total.</p>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Descripcion</th>
                    <th className="px-3 py-2 text-right font-medium text-muted-foreground">Monto</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Unidad</th>
                    <th className="px-3 py-2 text-left font-medium text-muted-foreground">Por linea</th>
                  </tr>
                </thead>
                <tbody>
                  {standbys.map((sb) => (
                    <tr key={sb.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">{sb.descripcion}</td>
                      <td className="px-3 py-2 text-right">{formatearMonto(sb.monto)}</td>
                      <td className="px-3 py-2">{sb.unidad}</td>
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
          </div>
        ) : null}

        {/* Si no hay lineas ni standby */}
        {version.lineas.length === 0 && standbys.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Esta version no tiene lineas ni tarifas de standby.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SeccionCard({
  seccion,
  lineas,
  moneda,
}: {
  seccion: Seccion;
  lineas: Linea[];
  moneda: string;
}) {
  const cargosAdicionales = seccion.cargosAdicionales ?? [];

  return (
    <div className="rounded-xl border border-border bg-muted/20">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <p className="text-sm font-medium">
          {seccion.nombre ?? "Lineas sin seccion"}
        </p>
        <span className="text-sm text-muted-foreground">
          Subtotal: {formatearMonto(seccion.subtotal)}
        </span>
      </div>

      {lineas.length > 0 ? (
        <div className="p-3">
          <div className="flex flex-col gap-2">
            {lineas.map((linea) => (
              <LineaRow
                key={linea.id}
                linea={linea}
                moneda={moneda}
                seccionesMap={new Map()}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Cargos adicionales de la seccion */}
      {cargosAdicionales.length > 0 ? (
        <div className="border-t border-border px-3 py-2">
          <p className="mb-1.5 text-xs text-muted-foreground">Cargos adicionales</p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-3 py-1.5 text-left font-medium text-muted-foreground">Descripcion</th>
                  <th className="px-3 py-1.5 text-right font-medium text-muted-foreground">Monto</th>
                </tr>
              </thead>
              <tbody>
                {cargosAdicionales.map((cargo) => (
                  <tr key={cargo.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-1.5">{cargo.descripcion}</td>
                    <td className="px-3 py-1.5 text-right">{formatearMonto(cargo.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {lineas.length === 0 && cargosAdicionales.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted-foreground">Sin lineas en esta seccion.</p>
      ) : null}
    </div>
  );
}

function LineaRow({
  linea,
  moneda,
}: {
  linea: Linea;
  moneda: string;
  seccionesMap: Map<string, Seccion>;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium">{linea.descripcion}</span>
            <Badge variant="outline" className="text-xs">
              {formatearTipoLinea(linea.tipoLinea)}
            </Badge>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 text-sm">
          <span className="font-medium">{formatearMonto(linea.precioTotal)} {moneda}</span>
          <span className="text-xs text-muted-foreground">
            {linea.cantidad} × {formatearMonto(linea.precioUnitario)} {moneda}
          </span>
        </div>
      </div>

      {/* Hijo polimorfico */}
      {linea.carga ? <CargaDetalle carga={linea.carga} /> : null}
      {linea.equipo ? <EquipoDetalle equipo={linea.equipo} /> : null}
      {linea.almacenaje ? <AlmacenajeDetalle almacenaje={linea.almacenaje} /> : null}
      {linea.personal ? <PersonalDetalle personal={linea.personal} /> : null}
    </div>
  );
}

function CargaDetalle({ carga }: { carga: CargaHijo }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-xs md:grid-cols-3">
      <MiniDato label="Vehiculo" value={carga.tipoVehiculo} />
      <MiniDato label="Origen" value={carga.origen} />
      <MiniDato label="Destino" value={carga.destino} />
      <MiniDato label="Peso (Tn)" value={carga.pesoTn !== null ? String(carga.pesoTn) : null} />
      <MiniDato
        label="Dimensiones (m)"
        value={
          carga.largoM !== null && carga.anchoM !== null && carga.altoM !== null
            ? `${carga.largoM} x ${carga.anchoM} x ${carga.altoM}`
            : null
        }
      />
    </div>
  );
}

function EquipoDetalle({ equipo }: { equipo: EquipoHijo }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-xs md:grid-cols-3">
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
    </div>
  );
}

function AlmacenajeDetalle({ almacenaje }: { almacenaje: AlmacenajeHijo }) {
  return (
    <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-muted/30 px-3 py-2 text-xs">
      <MiniDato
        label="Area (m2)"
        value={almacenaje.areaM2 !== null ? String(almacenaje.areaM2) : null}
      />
      <MiniDato
        label="Periodo (dias)"
        value={almacenaje.periodoDias !== null ? String(almacenaje.periodoDias) : null}
      />
    </div>
  );
}

function PersonalDetalle({ personal }: { personal: PersonalHijo }) {
  return (
    <div className="mt-2 rounded-lg bg-muted/30 px-3 py-2 text-xs">
      <MiniDato label="Rol" value={personal.rol} />
    </div>
  );
}

function TotalItem({
  label,
  valor,
  moneda,
}: {
  label: string;
  valor: number | null;
  moneda: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 text-center">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-semibold">
        {valor !== null ? `${formatearMonto(valor)} ${moneda}` : "—"}
      </span>
    </div>
  );
}

function DatoVersion({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid gap-1">
      <span className="text-xs font-medium uppercase text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? "—"}</span>
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
