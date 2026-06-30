"use client";

import * as React from "react";
import { LayersIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

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
import { montoCargo, seccionVacia } from "../servicios/cotizaciones-editor.utils";
import { useListarCatalogosCargoAdicional } from "../servicios/cotizaciones-queries";
import { SeccionDetalleModal } from "./seccion-detalle-modal";
import { TablaStandby } from "./tabla-standby";
import type { EntradaStandby } from "./tabla-standby";
import { TablaCotizacion } from "./tabla-cotizacion";
import type { SeccionVista } from "./tabla-cotizacion";
import { etiquetaTipo, formatearMoneda, totalLinea } from "./lineas-grid.utils";

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
    setCrearAbierto(false);
    // Abrir el modal para agregar lineas. La seccion NO se agrega todavia: recien
    // entra a la lista (y se persiste) al pulsar "Aplicar"; "Cancelar" la descarta.
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
  const sinContenido =
    seccion.lineas.length === 0 && seccion.cargosAdicionales.length === 0;
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
        <span className="text-sm font-medium">
          {seccion.esDefecto ? "Sin agrupar" : seccion.nombre || "Seccion sin nombre"}
        </span>
        <div className="ml-auto flex items-center gap-1">
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
      </div>

      {sinContenido ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">Sin lineas en esta seccion.</p>
      ) : (
        <TablaCotizacion seccion={vistaDeSeccion(seccion)} moneda={moneda} />
      )}

      {/* Stand by — su propia tabla, separada del costo (informativo, no suma). */}
      <TablaStandby entradas={entradasStandby(seccion)} moneda={moneda} />
    </div>
  );
}

// Convierte una DraftSeccion al view-model de la tabla (layout del PDF).
function vistaDeSeccion(seccion: DraftSeccion): SeccionVista {
  const ruta =
    seccion.origen !== "" || seccion.destino !== ""
      ? `${seccion.origen || "—"} → ${seccion.destino || "—"}`
      : "";
  return {
    ruta,
    lineas: seccion.lineas.map((l) => ({
      unidad: unidadDeLinea(l),
      descripcion: <DescripcionCelda linea={l} />,
      montoTotal: totalLinea(l),
      cargos: l.cargosAdicionales.map((c) => ({
        descripcion: c.descripcion,
        monto: montoCargo(c),
      })),
    })),
    cargosSeccion: seccion.cargosAdicionales.map((c) => ({
      descripcion: c.descripcion,
      monto: montoCargo(c),
    })),
    subtotal: subtotalSeccion(seccion),
  };
}

// Unidad/recurso de la linea para la columna Unidad (igual que el PDF):
// tipoVehiculo (transporte), equipoTipo (equipo) o rol (personal).
function unidadDeLinea(l: DraftLinea): string {
  switch (l.tipoLinea) {
    case "TRANSPORTE":
      return l.carga.tipoVehiculo;
    case "ALQUILER_EQUIPO":
      return l.equipo.equipoTipo;
    case "PERSONAL":
      return l.personal.rol;
    default:
      return "";
  }
}

// Celda Descripcion: titulo (descripcion de la linea) + cargas fisicas con sus
// dimensiones (solo transporte), como en el PDF.
function DescripcionCelda({ linea }: { linea: DraftLinea }) {
  const cargas = linea.tipoLinea === "TRANSPORTE" ? linea.carga.cargas : [];
  if (!linea.descripcion && cargas.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className="flex flex-col gap-1">
      {linea.descripcion ? <span className="font-medium">{linea.descripcion}</span> : null}
      {cargas.map((c) => {
        const dims = [
          c.largoM !== "" ? `L: ${c.largoM} m` : null,
          c.anchoM !== "" ? `A: ${c.anchoM} m` : null,
          c.altoM !== "" ? `H: ${c.altoM} m` : null,
          c.peso !== "" ? `Peso: ${c.peso} ${c.unidadPeso}` : null,
        ]
          .filter(Boolean)
          .join("   ·   ");
        return (
          <div key={c.claveCliente} className="flex flex-col">
            <span className="text-xs font-medium">{c.nombre || "Carga"}</span>
            {dims ? (
              <span className="text-[11px] italic text-muted-foreground">{dims}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

// Reune las entradas de stand-by de una seccion (lineas de transporte + cargos de
// linea + cargos de seccion). El stand-by es informativo y va en su propia tabla.
function entradasStandby(seccion: DraftSeccion): EntradaStandby[] {
  const entradas: EntradaStandby[] = [];
  for (const l of seccion.lineas) {
    if (l.tipoLinea === "TRANSPORTE" && l.standbyDia.trim() !== "") {
      entradas.push({
        concepto: l.descripcion || l.carga.tipoVehiculo || etiquetaTipo(l.tipoLinea),
        tipo: "Linea",
        precio: parseFloat(l.standbyDia) || 0,
      });
    }
    for (const c of l.cargosAdicionales) {
      if (c.standbyDia.trim() !== "") {
        entradas.push({
          concepto: c.descripcion || "Cargo",
          tipo: "Cargo de linea",
          precio: parseFloat(c.standbyDia) || 0,
        });
      }
    }
  }
  for (const c of seccion.cargosAdicionales) {
    if (c.standbyDia.trim() !== "") {
      entradas.push({
        concepto: c.descripcion || "Cargo",
        tipo: "Cargo de seccion",
        precio: parseFloat(c.standbyDia) || 0,
      });
    }
  }
  return entradas;
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
