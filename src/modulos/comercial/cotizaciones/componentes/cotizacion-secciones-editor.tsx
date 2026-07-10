"use client";

import * as React from "react";
import { LayersIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { ConfirmarEliminar } from "@/compartido/componentes/ui/confirmar-eliminar";

import type { CatalogoCargoAdicional, OrigenTipo } from "../tipos/cotizaciones.tipos";
import type {
  DraftCargoAdicional,
  DraftLinea,
  DraftSeccion,
  ModoServicio,
} from "../servicios/cotizaciones-editor.utils";
import {
  cargoAdicionalVacio,
  lineaVacia,
  montoCargo,
  precioVentaLinea,
  seccionVacia,
  sincronizarRutaSeccion,
  tipoLineaInicial,
} from "../servicios/cotizaciones-editor.utils";
import { useListarCatalogosCargoAdicional } from "../servicios/cotizaciones-queries";
import { LineaDetalleModal } from "./linea-detalle-modal";
import { CargoDetalleModal } from "./cargo-detalle-modal";
import { SeccionDatosModal } from "./seccion-datos-modal";
import { TablaStandby } from "./tabla-standby";
import type { EntradaStandby } from "./tabla-standby";
import { TablaLeadTime } from "./tabla-leadtime";
import type { EntradaLeadTime } from "./tabla-leadtime";
import {
  CeldaDescripcionLinea,
  TablaCotizacion,
  rutaDeSeccion,
  unidadDeLinea,
} from "./tabla-cotizacion";
import type { SeccionVista } from "./tabla-cotizacion";
import { etiquetaTipo, formatearMoneda, totalLinea } from "./lineas-grid.utils";

type Props = {
  secciones: DraftSeccion[];
  moneda: string;
  disabled?: boolean;
  // Origen de la cotizacion: acota el precio sugerido al historial del cliente.
  clienteTipo?: OrigenTipo;
  clienteId?: string;
  // Modo de servicio (solo creacion): TRANSPORTE fija el tipo; OTROS lo acota a los
  // no-transporte (default alquiler de equipo). undefined = edicion (sin acotar).
  modoServicio?: ModoServicio;
  onChange: (secciones: DraftSeccion[]) => void;
};

/**
 * CotizacionSeccionesEditor — editor de contenido por SECCIONES (modelo 2026-06).
 *
 * La cotizacion se arma como una lista de secciones; cada seccion define su ruta
 * (origen/destino) y agrupa sus lineas (que heredan la ruta) y sus cargos. Los
 * bloques se muestran en modo lectura con el lenguaje visual del detalle. La edicion
 * se reparte en modales enfocados: datos de la seccion (nombre + ruta), cargos
 * adicionales de la seccion, y una linea a la vez. Componente controlado: cada
 * cambio sale por onChange(secciones).
 */
export function CotizacionSeccionesEditor({
  secciones,
  moneda,
  disabled,
  clienteTipo,
  clienteId,
  modoServicio,
  onChange,
}: Props) {
  // Catalogo de cargos — cargado una vez al nivel del editor y pasado al modal.
  const { data: catalogoData } = useListarCatalogosCargoAdicional({ estado: "ACTIVO", porPagina: 50 });
  const opcionesCatalogo = catalogoData?.data ?? [];

  // Seccion abierta en el modal de DATOS (nombre + ruta). Se usa tanto para CREAR
  // (seccion nueva vacia) como para EDITAR una existente — misma UX con autocomplete
  // contra el maestro de ubicaciones.
  const [datosEditando, setDatosEditando] = React.useState<DraftSeccion | null>(null);
  // Linea abierta en el modal de edicion de UNA sola linea (editar existente o
  // agregar nueva). Guarda la seccion a la que pertenece para persistir el cambio.
  const [lineaEditando, setLineaEditando] = React.useState<{
    seccionClave: string;
    seccionNombre: string;
    rutaSeccion: { origen: string; destino: string };
    linea: DraftLinea;
  } | null>(null);

  const ordenadas = secciones
    .slice()
    .sort((a, b) => Number(b.esDefecto) - Number(a.esDefecto) || a.orden - b.orden);

  const total = secciones.reduce((acc, s) => acc + subtotalSeccion(s), 0);
  const totalLineas = secciones.reduce((acc, s) => acc + s.lineas.length, 0);

  // Crear seccion: abre el MISMO modal de datos (nombre + ruta con autocomplete
  // contra el maestro) con una seccion nueva vacia. Al aplicar entra a la lista y
  // su bloque aparece con el boton "Agregar linea".
  function abrirCrear() {
    const nueva = seccionVacia(false);
    nueva.orden = secciones.length;
    setDatosEditando(nueva);
  }

  // Reemplaza la seccion si ya existe, o la agrega si es nueva. No cierra modales:
  // cada caller cierra el suyo.
  function guardarSeccion(seccion: DraftSeccion) {
    const existe = secciones.some((s) => s.claveCliente === seccion.claveCliente);
    onChange(
      existe
        ? secciones.map((s) => (s.claveCliente === seccion.claveCliente ? seccion : s))
        : [...secciones, seccion]
    );
  }

  function eliminarSeccion(clave: string) {
    onChange(secciones.filter((s) => s.claveCliente !== clave));
  }

  // --- Edicion por linea (modal independiente, solo informacion de la linea) ---

  function abrirEditarLinea(seccion: DraftSeccion, linea: DraftLinea) {
    setLineaEditando({
      seccionClave: seccion.claveCliente,
      seccionNombre: nombreVisibleSeccion(seccion),
      rutaSeccion: { origen: seccion.origen, destino: seccion.destino },
      linea,
    });
  }

  function abrirAgregarLinea(seccion: DraftSeccion) {
    // La linea nueva nace con la ruta de la seccion (TRANSPORTE) ya heredada. Su
    // tipo de servicio inicial sale del modo (TRANSPORTE/OTROS); en edicion, sin
    // modo, cae al default TRANSPORTE de lineaVacia().
    const nueva = lineaVacia(
      modoServicio ? tipoLineaInicial(modoServicio) : undefined
    );
    nueva.carga = { ...nueva.carga, origen: seccion.origen, destino: seccion.destino };
    setLineaEditando({
      seccionClave: seccion.claveCliente,
      seccionNombre: nombreVisibleSeccion(seccion),
      rutaSeccion: { origen: seccion.origen, destino: seccion.destino },
      linea: nueva,
    });
  }

  // Persiste la linea editada/nueva dentro de su seccion (reemplaza si ya existe,
  // agrega si es nueva) y sincroniza la ruta de la seccion en las lineas de transporte.
  function guardarLinea(linea: DraftLinea) {
    if (!lineaEditando) return;
    const { seccionClave } = lineaEditando;
    const seccion = secciones.find((s) => s.claveCliente === seccionClave);
    if (!seccion) {
      setLineaEditando(null);
      return;
    }
    const existe = seccion.lineas.some((l) => l.claveCliente === linea.claveCliente);
    const lineas = existe
      ? seccion.lineas.map((l) => (l.claveCliente === linea.claveCliente ? linea : l))
      : [...seccion.lineas, linea];
    const actualizada = sincronizarRutaSeccion({ ...seccion, lineas });
    onChange(
      secciones.map((s) => (s.claveCliente === seccionClave ? actualizada : s))
    );
    setLineaEditando(null);
  }

  function eliminarLinea(seccion: DraftSeccion, clave: string) {
    const actualizada: DraftSeccion = {
      ...seccion,
      lineas: seccion.lineas.filter((l) => l.claveCliente !== clave),
    };
    onChange(
      secciones.map((s) => (s.claveCliente === seccion.claveCliente ? actualizada : s))
    );
  }

  // --- Edicion/borrado de un cargo adicional de seccion directo desde la tabla ---

  function guardarCargoSeccion(seccion: DraftSeccion, cargo: DraftCargoAdicional) {
    const existe = seccion.cargosAdicionales.some((c) => c.claveCliente === cargo.claveCliente);
    const cargos = existe
      ? seccion.cargosAdicionales.map((c) => (c.claveCliente === cargo.claveCliente ? cargo : c))
      : [...seccion.cargosAdicionales, cargo];
    onChange(
      secciones.map((s) =>
        s.claveCliente === seccion.claveCliente ? { ...s, cargosAdicionales: cargos } : s
      )
    );
  }

  function eliminarCargoSeccion(seccion: DraftSeccion, clave: string) {
    onChange(
      secciones.map((s) =>
        s.claveCliente === seccion.claveCliente
          ? { ...s, cargosAdicionales: s.cargosAdicionales.filter((c) => c.claveCliente !== clave) }
          : s
      )
    );
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
              opcionesCatalogo={opcionesCatalogo}
              onEditarDatos={() => setDatosEditando(seccion)}
              onEliminar={() => eliminarSeccion(seccion.claveCliente)}
              onEditarLinea={(linea) => abrirEditarLinea(seccion, linea)}
              onEliminarLinea={(clave) => eliminarLinea(seccion, clave)}
              onAgregarLinea={() => abrirAgregarLinea(seccion)}
              onGuardarCargo={(cargo) => guardarCargoSeccion(seccion, cargo)}
              onEliminarCargo={(clave) => eliminarCargoSeccion(seccion, clave)}
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

      {/* Modal de DATOS de la seccion (nombre + ruta) — crear y editar */}
      <SeccionDatosModal
        abierto={datosEditando !== null}
        seccion={datosEditando}
        disabled={disabled}
        modoServicio={modoServicio}
        onCerrar={() => setDatosEditando(null)}
        onGuardar={(s) => {
          guardarSeccion(s);
          setDatosEditando(null);
        }}
      />

      {/* Modal de edicion de UNA sola linea (solo informacion de la linea) */}
      <LineaDetalleModal
        abierto={lineaEditando !== null}
        linea={lineaEditando?.linea ?? null}
        seccionNombre={lineaEditando?.seccionNombre}
        rutaSeccion={lineaEditando?.rutaSeccion}
        moneda={moneda}
        opcionesCatalogo={opcionesCatalogo}
        disabled={disabled}
        clienteTipo={clienteTipo}
        clienteId={clienteId}
        modoServicio={modoServicio}
        onCerrar={() => setLineaEditando(null)}
        onGuardar={guardarLinea}
      />
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

// Nombre visible de la seccion (el bucket por defecto se muestra como "Sin agrupar").
function nombreVisibleSeccion(seccion: DraftSeccion): string {
  return seccion.esDefecto
    ? "Sin agrupar"
    : seccion.nombre || "Seccion sin nombre";
}

function BloqueSeccion({
  seccion,
  moneda,
  disabled,
  opcionesCatalogo,
  onEditarDatos,
  onEliminar,
  onEditarLinea,
  onEliminarLinea,
  onAgregarLinea,
  onGuardarCargo,
  onEliminarCargo,
}: {
  seccion: DraftSeccion;
  moneda: string;
  disabled?: boolean;
  opcionesCatalogo: CatalogoCargoAdicional[];
  onEditarDatos: () => void;
  onEliminar: () => void;
  onEditarLinea: (linea: DraftLinea) => void;
  onEliminarLinea: (clave: string) => void;
  onAgregarLinea: () => void;
  onGuardarCargo: (cargo: DraftCargoAdicional) => void;
  onEliminarCargo: (clave: string) => void;
}) {
  const sinLineas = seccion.lineas.length === 0;

  // Cargo de seccion abierto en el modal (nuevo o editar desde su fila en la tabla).
  const [cargoEditando, setCargoEditando] = React.useState<DraftCargoAdicional | null>(null);

  // Abre el modal con un cargo nuevo (vacio) para agregarlo directamente a la seccion.
  function abrirAgregarCargo() {
    const nuevo = cargoAdicionalVacio();
    nuevo.orden = seccion.cargosAdicionales.length;
    setCargoEditando(nuevo);
  }

  // Acciones por linea: editar (abre el modal de una sola linea) + eliminar (confirmado).
  const accionesLinea = (linea: DraftLinea) => (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="size-8"
        disabled={disabled}
        onClick={() => onEditarLinea(linea)}
        aria-label="Editar linea"
      >
        <PencilIcon className="size-4" />
      </Button>
      <ConfirmarEliminar
        onConfirmar={() => onEliminarLinea(linea.claveCliente)}
        descripcion="Se eliminara esta linea y sus cargos adicionales."
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 text-destructive hover:text-destructive"
          disabled={disabled}
          aria-label="Eliminar linea"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </ConfirmarEliminar>
    </div>
  );

  // Acciones por cargo de seccion: editar (abre el modal de un cargo) + eliminar (confirmado).
  const accionesCargo = (cargo: DraftCargoAdicional) => (
    <div className="flex items-center justify-end gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="size-8"
        disabled={disabled}
        onClick={() => setCargoEditando(cargo)}
        aria-label="Editar cargo adicional"
      >
        <PencilIcon className="size-4" />
      </Button>
      <ConfirmarEliminar
        onConfirmar={() => onEliminarCargo(cargo.claveCliente)}
        descripcion="Se eliminara este cargo adicional de la seccion."
      >
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="size-8 text-destructive hover:text-destructive"
          disabled={disabled}
          aria-label="Eliminar cargo adicional"
        >
          <Trash2Icon className="size-4" />
        </Button>
      </ConfirmarEliminar>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
        <span className="text-sm font-medium">{nombreVisibleSeccion(seccion)}</span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="size-8"
            disabled={disabled}
            onClick={onEditarDatos}
            aria-label="Editar datos de la seccion (nombre y ruta)"
            title="Nombre y ruta"
          >
            <PencilIcon className="size-4" />
          </Button>
          <ConfirmarEliminar
            onConfirmar={onEliminar}
            titulo="¿Eliminar la seccion?"
            descripcion="Se eliminara la seccion completa, con sus lineas y cargos adicionales."
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-8 text-destructive hover:text-destructive"
              disabled={disabled}
              aria-label="Eliminar seccion"
            >
              <Trash2Icon className="size-4" />
            </Button>
          </ConfirmarEliminar>
        </div>
      </div>

      {sinLineas && seccion.cargosAdicionales.length === 0 ? (
        <p className="px-3 py-2 text-sm text-muted-foreground">Sin lineas en esta seccion.</p>
      ) : (
        <TablaCotizacion
          seccion={vistaDeSeccion(seccion, accionesLinea, accionesCargo)}
          moneda={moneda}
          conAcciones
          conPrecios
          // La ruta solo aplica a transporte: se oculta si la seccion no tiene
          // lineas de transporte (servicios "Otros" no llevan origen/destino).
          mostrarRuta={seccion.lineas.some((l) => l.tipoLinea === "TRANSPORTE")}
        />
      )}

      {/* Acciones del bloque: agregar linea + editar cargos adicionales (modales) */}
      <div className="flex flex-wrap items-center gap-2 border-t border-border px-3 py-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onAgregarLinea}
        >
          <PlusIcon data-icon="inline-start" />
          Agregar linea
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={abrirAgregarCargo}
        >
          <PlusIcon data-icon="inline-start" />
          Agregar cargo adicional
        </Button>
      </div>

      {/* Stand by — su propia tabla, separada del costo (informativo, no suma). */}
      <TablaStandby entradas={entradasStandby(seccion)} moneda={moneda} />
      {/* Lead time — debajo del stand-by, mismo estilo (informativo, no suma). */}
      <TablaLeadTime entradas={entradasLeadTime(seccion)} />

      {/* Modal para editar un cargo adicional de seccion desde su fila en la tabla */}
      <CargoDetalleModal
        abierto={cargoEditando !== null}
        cargo={cargoEditando}
        contexto="Cargo de la seccion (aplica al job entero, no a una linea)."
        moneda={moneda}
        opcionesCatalogo={opcionesCatalogo}
        disabled={disabled}
        onCerrar={() => setCargoEditando(null)}
        onGuardar={(cargo) => {
          onGuardarCargo(cargo);
          setCargoEditando(null);
        }}
      />
    </div>
  );
}

// Convierte una DraftSeccion al view-model de la tabla (layout del PDF). Si se pasan
// `accionesLinea`/`accionesCargo`, cada linea/cargo de seccion lleva sus botones
// (editar/eliminar) en la columna Acciones.
function vistaDeSeccion(
  seccion: DraftSeccion,
  accionesLinea?: (linea: DraftLinea) => React.ReactNode,
  accionesCargo?: (cargo: DraftCargoAdicional) => React.ReactNode
): SeccionVista {
  return {
    ruta: rutaDeSeccion(seccion),
    lineas: seccion.lineas.map((l) => ({
      unidad: unidadDeLinea(l),
      descripcion: <CeldaDescripcionLinea linea={l} />,
      montoTotal: totalLinea(l),
      cantidad: parseFloat(l.cantidad) || 0,
      precioBase: parseFloat(l.precioBase) || 0,
      precioVenta: precioVentaLinea(l),
      cargos: l.cargosAdicionales.map((c) => ({
        nombre: c.nombre,
        descripcion: c.descripcion,
        monto: montoCargo(c),
        cantidad: parseFloat(c.cantidad) || 0,
      })),
      acciones: accionesLinea?.(l),
    })),
    cargosSeccion: seccion.cargosAdicionales.map((c) => ({
      nombre: c.nombre,
      descripcion: c.descripcion,
      monto: montoCargo(c),
      cantidad: parseFloat(c.cantidad) || 0,
      acciones: accionesCargo?.(c),
    })),
    subtotal: subtotalSeccion(seccion),
  };
}

// Reune las entradas de stand-by de una seccion (lineas de transporte + cargos de
// linea + cargos de seccion). El stand-by es informativo y va en su propia tabla.
function entradasStandby(seccion: DraftSeccion): EntradaStandby[] {
  const entradas: EntradaStandby[] = [];
  for (const l of seccion.lineas) {
    if (l.tipoLinea === "TRANSPORTE" && l.standbyDia.trim() !== "") {
      entradas.push({
        // El concepto del stand-by de la linea es el TIPO DE UNIDAD (tipoUnidadNombre),
        // no la descripcion; con fallback a la descripcion o la etiqueta del tipo.
        concepto: l.carga.tipoUnidadNombre || l.descripcion || etiquetaTipo(l.tipoLinea),
        tipo: "Linea",
        precio: parseFloat(l.standbyDia) || 0,
      });
    }
    for (const c of l.cargosAdicionales) {
      if (c.standbyDia.trim() !== "") {
        entradas.push({
          concepto: c.nombre || "Cargo",
          tipo: "Cargo de linea",
          precio: parseFloat(c.standbyDia) || 0,
        });
      }
    }
  }
  for (const c of seccion.cargosAdicionales) {
    if (c.standbyDia.trim() !== "") {
      entradas.push({
        concepto: c.nombre || "Cargo",
        tipo: "Cargo de seccion",
        precio: parseFloat(c.standbyDia) || 0,
      });
    }
  }
  return entradas;
}

// Reune las entradas de lead time de una seccion: una por cada linea de TRANSPORTE
// con lead time. El concepto (rotulo) es la ruta origen→destino de la linea (o de la
// seccion), con fallback a la descripcion. Informativo, va debajo del stand-by.
function entradasLeadTime(seccion: DraftSeccion): EntradaLeadTime[] {
  const entradas: EntradaLeadTime[] = [];
  // Plazo formateado desde los campos string del draft ("" = sin lead time).
  const plazoDe = (min: string, max: string): string =>
    max !== "" ? `${min}–${max} dias` : `${min} dia${min !== "1" ? "s" : ""}`;
  const maxDe = (c: { leadTimeEsRango: boolean; leadTimeDiasMax: string }) =>
    c.leadTimeEsRango ? c.leadTimeDiasMax.trim() : "";

  for (const l of seccion.lineas) {
    // Lead time de la linea de transporte. Concepto = TIPO DE UNIDAD (tipoUnidadNombre),
    // igual que el stand-by; fallback a la descripcion o la etiqueta del tipo.
    if (l.tipoLinea === "TRANSPORTE" && l.leadTimeDiasMin.trim() !== "") {
      const concepto = l.carga.tipoUnidadNombre || l.descripcion || etiquetaTipo(l.tipoLinea);
      entradas.push({ concepto, tipo: "Linea", plazo: plazoDe(l.leadTimeDiasMin.trim(), maxDe(l)) });
    }
    // Lead time de los cargos de la linea (rotulo = nombre del cargo).
    for (const c of l.cargosAdicionales) {
      if (c.leadTimeDiasMin.trim() !== "") {
        entradas.push({
          concepto: c.nombre || "Cargo",
          tipo: "Cargo de linea",
          plazo: plazoDe(c.leadTimeDiasMin.trim(), maxDe(c)),
        });
      }
    }
  }
  // Lead time de los cargos de nivel seccion (rotulo = nombre del cargo).
  for (const c of seccion.cargosAdicionales) {
    if (c.leadTimeDiasMin.trim() !== "") {
      entradas.push({
        concepto: c.nombre || "Cargo",
        tipo: "Cargo de seccion",
        plazo: plazoDe(c.leadTimeDiasMin.trim(), maxDe(c)),
      });
    }
  }
  return entradas;
}
