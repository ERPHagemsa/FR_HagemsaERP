"use client";

import * as React from "react";
import { LayersIcon, MapPinIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Badge } from "@/compartido/componentes/ui/badge";
import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog";

import type { OrigenTipo } from "../tipos/cotizaciones.tipos";
import type { DraftLinea, DraftSeccion } from "../servicios/cotizaciones-editor.utils";
import {
  montoCargo,
  precioVentaLinea,
  seccionVacia,
} from "../servicios/cotizaciones-editor.utils";
import { useListarCatalogosCargoAdicional } from "../servicios/cotizaciones-queries";
import { SeccionDetalleModal } from "./seccion-detalle-modal";
import {
  claseBadgeTipo,
  etiquetaTipo,
  formatearMoneda,
  totalLinea,
} from "./lineas-grid.utils";

type Props = {
  secciones: DraftSeccion[];
  moneda: string;
  disabled?: boolean;
  // Origen de la cotizacion: acota el precio sugerido al historial del cliente.
  clienteTipo?: OrigenTipo;
  clienteId?: string;
  onChange: (secciones: DraftSeccion[]) => void;
};

/**
 * CotizacionSeccionesEditor — editor de contenido por SECCIONES (modelo 2026-06).
 *
 * La cotizacion se arma como una lista de secciones; cada seccion define su ruta
 * (origen/destino) y agrupa sus lineas (que heredan la ruta) y sus cargos. Los
 * bloques se muestran en modo lectura con el lenguaje visual del detalle; toda la
 * edicion ocurre en un modal por seccion (SeccionDetalleModal). Componente
 * controlado: cada cambio sale por onChange(secciones).
 */
export function CotizacionSeccionesEditor({
  secciones,
  moneda,
  disabled,
  clienteTipo,
  clienteId,
  onChange,
}: Props) {
  // Catalogo de cargos — cargado una vez al nivel del editor y pasado al modal.
  const { data: catalogoData } = useListarCatalogosCargoAdicional({ estado: "ACTIVO", porPagina: 50 });
  const opcionesCatalogo = catalogoData?.data ?? [];

  // Seccion abierta en el modal de edicion.
  const [editando, setEditando] = React.useState<DraftSeccion | null>(null);
  // Dialog "crear seccion" (pide nombre + ruta antes de abrir el modal de lineas).
  const [crearAbierto, setCrearAbierto] = React.useState(false);
  const [nuevoNombre, setNuevoNombre] = React.useState("");
  const [nuevoOrigen, setNuevoOrigen] = React.useState("");
  const [nuevoDestino, setNuevoDestino] = React.useState("");

  const ordenadas = secciones
    .slice()
    .sort((a, b) => Number(b.esDefecto) - Number(a.esDefecto) || a.orden - b.orden);

  const total = secciones.reduce((acc, s) => acc + subtotalSeccion(s), 0);
  const totalLineas = secciones.reduce((acc, s) => acc + s.lineas.length, 0);

  function abrirCrear() {
    setNuevoNombre("");
    setNuevoOrigen("");
    setNuevoDestino("");
    setCrearAbierto(true);
  }

  function confirmarCrear() {
    const nueva = seccionVacia(false);
    nueva.orden = secciones.length;
    nueva.nombre = nuevoNombre.trim();
    nueva.origen = nuevoOrigen.trim();
    nueva.destino = nuevoDestino.trim();
    onChange([...secciones, nueva]);
    setCrearAbierto(false);
    // Abrir de una vez el modal de la seccion para agregar lineas.
    setEditando(nueva);
  }

  function guardarSeccion(seccion: DraftSeccion) {
    const existe = secciones.some((s) => s.claveCliente === seccion.claveCliente);
    onChange(
      existe
        ? secciones.map((s) => (s.claveCliente === seccion.claveCliente ? seccion : s))
        : [...secciones, seccion]
    );
    setEditando(null);
  }

  function eliminarSeccion(clave: string) {
    onChange(secciones.filter((s) => s.claveCliente !== clave));
  }

  return (
    <div className="flex flex-col gap-4">
      {ordenadas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
          <p className="text-sm text-muted-foreground">
            Todavia no agregaste secciones a esta cotizacion.
          </p>
          <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={abrirCrear}>
            <PlusIcon data-icon="inline-start" />
            Crear primera seccion
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {ordenadas.map((seccion) => (
            <BloqueSeccion
              key={seccion.claveCliente}
              seccion={seccion}
              moneda={moneda}
              disabled={disabled}
              onEditar={() => setEditando(seccion)}
              onEliminar={() => eliminarSeccion(seccion.claveCliente)}
            />
          ))}
        </div>
      )}

      {ordenadas.length > 0 ? (
        <Button type="button" variant="outline" size="sm" className="self-start" disabled={disabled} onClick={abrirCrear}>
          <LayersIcon data-icon="inline-start" />
          Crear seccion
        </Button>
      ) : null}

      {/* Barra de totales */}
      <div className="sticky bottom-0 z-10 mt-2 rounded-xl border border-border bg-card/95 px-5 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted-foreground">
            {totalLineas} {totalLineas === 1 ? "linea" : "lineas"} ·{" "}
            {ordenadas.length} {ordenadas.length === 1 ? "seccion" : "secciones"}
          </span>
          <div className="flex items-baseline gap-3">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Total</span>
            <span className="font-mono text-lg font-semibold tabular-nums">
              {formatearMoneda(total, moneda)}
            </span>
          </div>
        </div>
      </div>
      <p className="text-right text-xs text-muted-foreground">
        Estimado — el backend recalcula totales e impuestos al guardar.
      </p>

      {/* Modal de edicion de la seccion */}
      <SeccionDetalleModal
        abierto={editando !== null}
        seccion={editando}
        moneda={moneda}
        opcionesCatalogo={opcionesCatalogo}
        disabled={disabled}
        clienteTipo={clienteTipo}
        clienteId={clienteId}
        onCerrar={() => setEditando(null)}
        onGuardar={guardarSeccion}
      />

      {/* Dialog "crear seccion": nombre + ruta */}
      <Dialog open={crearAbierto} onOpenChange={setCrearAbierto}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva seccion</DialogTitle>
            <DialogDescription>
              Define la ruta de la seccion. Sus lineas de transporte heredaran este origen
              y destino.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <CampoCrear label="Nombre de la seccion" obligatorio>
              <Input
                value={nuevoNombre}
                placeholder="Ej: Tramo Lima - Mina"
                onChange={(e) => setNuevoNombre(e.target.value)}
              />
            </CampoCrear>
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoCrear label="Origen">
                <Input
                  value={nuevoOrigen}
                  placeholder="Ej: Lima"
                  onChange={(e) => setNuevoOrigen(e.target.value)}
                />
              </CampoCrear>
              <CampoCrear label="Destino">
                <Input
                  value={nuevoDestino}
                  placeholder="Ej: Mina"
                  onChange={(e) => setNuevoDestino(e.target.value)}
                />
              </CampoCrear>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCrearAbierto(false)}>
              Cancelar
            </Button>
            <Button type="button" disabled={nuevoNombre.trim() === ""} onClick={confirmarCrear}>
              Crear y agregar lineas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bloque de seccion (lectura) — lenguaje visual del detalle, con stand-by
// ---------------------------------------------------------------------------

function subtotalSeccion(s: DraftSeccion): number {
  const lineas = s.lineas.reduce((a, l) => a + totalLinea(l), 0);
  const cargosSeccion = s.cargosAdicionales.reduce((a, c) => a + montoCargo(c), 0);
  const cargosLineas = s.lineas.reduce(
    (la, l) => la + l.cargosAdicionales.reduce((a, c) => a + montoCargo(c), 0),
    0
  );
  return lineas + cargosSeccion + cargosLineas;
}

function BloqueSeccion({
  seccion,
  moneda,
  disabled,
  onEditar,
  onEliminar,
}: {
  seccion: DraftSeccion;
  moneda: string;
  disabled?: boolean;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const tieneRuta = seccion.origen !== "" || seccion.destino !== "";
  return (
    <div className="rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
        <span className="text-sm font-medium">
          {seccion.esDefecto ? "Sin agrupar" : seccion.nombre || "Seccion sin nombre"}
        </span>
        {tieneRuta ? (
          <Badge variant="outline" className="gap-1 text-xs font-normal">
            <MapPinIcon className="size-3" />
            {(seccion.origen || "—") + " → " + (seccion.destino || "—")}
          </Badge>
        ) : null}
        <span className="ml-auto text-sm text-muted-foreground tabular-nums">
          Subtotal: {formatearMoneda(subtotalSeccion(seccion), moneda)}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8"
          disabled={disabled}
          onClick={onEditar}
          aria-label="Editar seccion"
        >
          <PencilIcon className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 text-destructive hover:text-destructive"
          disabled={disabled}
          onClick={onEliminar}
          aria-label="Eliminar seccion"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </div>

      {seccion.lineas.length > 0 ? (
        <TablaLineas lineas={seccion.lineas} moneda={moneda} />
      ) : (
        <p className="px-3 py-2 text-sm text-muted-foreground">Sin lineas en esta seccion.</p>
      )}

      {seccion.cargosAdicionales.length > 0 ? (
        <div className="border-t border-border px-3 py-2">
          <p className="mb-1 text-xs text-muted-foreground">Cargos adicionales de la seccion</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th className="py-1 text-left font-medium">Descripcion</th>
                <th className="py-1 text-left font-medium">Unidad</th>
                <th className="py-1 text-right font-medium">Cant.</th>
                <th className="py-1 text-right font-medium">P. unitario</th>
                <th className="py-1 text-right font-medium">Stand by</th>
                <th className="py-1 text-right font-medium">Monto</th>
              </tr>
            </thead>
            <tbody>
              {seccion.cargosAdicionales.map((c) => (
                <tr key={c.claveCliente} className="border-b border-border/50 last:border-0">
                  <td className="py-1">{c.descripcion || "—"}</td>
                  <td className="py-1 text-muted-foreground">{c.unidadCobro}</td>
                  <td className="py-1 text-right tabular-nums">{parseFloat(c.cantidad) || 0}</td>
                  <td className="py-1 text-right tabular-nums">
                    {formatearMoneda(parseFloat(c.precioUnitario) || 0, moneda)}
                  </td>
                  <td className="py-1 text-right tabular-nums text-muted-foreground">
                    {c.standbyDia.trim() !== "" ? formatearMoneda(parseFloat(c.standbyDia) || 0, moneda) : "—"}
                  </td>
                  <td className="py-1 text-right tabular-nums">
                    {formatearMoneda(montoCargo(c), moneda)} {moneda}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}

function TablaLineas({ lineas, moneda }: { lineas: DraftLinea[]; moneda: string }) {
  return (
    <table className="w-full border-collapse text-sm [&_td]:border [&_td]:border-border/60 [&_th]:border [&_th]:border-border/60">
      <thead>
        <tr className="text-xs text-muted-foreground">
          <th className="px-3 py-2 text-left font-medium">Tipo</th>
          <th className="px-3 py-2 text-left font-medium">Descripcion</th>
          <th className="px-3 py-2 text-right font-medium">Cant.</th>
          <th className="px-3 py-2 text-right font-medium">P. base</th>
          <th className="px-3 py-2 text-right font-medium">P. venta</th>
          <th className="px-3 py-2 text-right font-medium">Stand by</th>
          <th className="px-3 py-2 text-right font-medium">Total venta</th>
        </tr>
      </thead>
      <tbody>
        {lineas.map((linea) => (
          <React.Fragment key={linea.claveCliente}>
            <tr className="align-top">
              <td className="px-3 py-2">
                <Badge
                  variant="outline"
                  className={`whitespace-nowrap font-medium ${claseBadgeTipo(linea.tipoLinea)}`}
                >
                  {etiquetaTipo(linea.tipoLinea)}
                </Badge>
              </td>
              <td className="px-3 py-2">{linea.descripcion || "—"}</td>
              <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                {parseFloat(linea.cantidad) || 0}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-muted-foreground">
                {formatearMoneda(parseFloat(linea.precioBase) || 0, moneda)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums">
                {formatearMoneda(precioVentaLinea(linea), moneda)}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right tabular-nums text-muted-foreground">
                {linea.tipoLinea === "TRANSPORTE" && linea.standbyDia.trim() !== ""
                  ? formatearMoneda(parseFloat(linea.standbyDia) || 0, moneda)
                  : "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right font-semibold tabular-nums">
                {formatearMoneda(totalLinea(linea), moneda)} {moneda}
              </td>
            </tr>
            {linea.cargosAdicionales.map((c) => (
              <tr key={c.claveCliente} className="align-top text-xs text-muted-foreground">
                <td className="px-3 py-1.5" />
                <td className="px-3 py-1.5">↳ {c.descripcion || "Cargo"}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{parseFloat(c.cantidad) || 0}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {formatearMoneda(parseFloat(c.precioUnitario) || 0, moneda)}
                </td>
                <td className="px-3 py-1.5 text-right">—</td>
                <td className="px-3 py-1.5 text-right tabular-nums">
                  {c.standbyDia.trim() !== "" ? formatearMoneda(parseFloat(c.standbyDia) || 0, moneda) : "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-1.5 text-right font-medium tabular-nums">
                  {formatearMoneda(montoCargo(c), moneda)} {moneda}
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}

function CampoCrear({
  label,
  obligatorio,
  children,
}: {
  label: string;
  obligatorio?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label} {obligatorio ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
