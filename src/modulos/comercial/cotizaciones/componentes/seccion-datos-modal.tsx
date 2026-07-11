"use client";

import * as React from "react";
import { Check, MapPin } from "lucide-react";

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
import {
  AutocompleteUbicacion,
  etiquetaTipoUbicacion,
  jerarquiaUbicacion,
} from "../../ubicaciones/componentes/autocomplete-ubicacion";
import type { Ubicacion } from "../../ubicaciones/tipos/ubicaciones.tipos";
import type { DraftSeccion, ModoServicio } from "../servicios/cotizaciones-editor.utils";
import { sincronizarRutaSeccion } from "../servicios/cotizaciones-editor.utils";

type Props = {
  abierto: boolean;
  // Seccion a editar (copia de trabajo). null cuando no hay nada abierto.
  seccion: DraftSeccion | null;
  disabled?: boolean;
  // Modo de servicio (solo creación): OTROS oculta la ruta (no aplica origen/destino);
  // TRANSPORTE la exige. undefined (edición) → ruta visible y opcional (como antes).
  modoServicio?: ModoServicio;
  onCerrar: () => void;
  onGuardar: (seccion: DraftSeccion) => void;
};

/**
 * Modal para los DATOS de la sección: nombre + ruta (origen/destino). La ruta se
 * captura una sola vez acá y todas las líneas de transporte la heredan.
 *
 * Origen/destino se buscan contra la MAESTRA de ubicaciones (autocomplete): elegir
 * una reusa la ubicación exacta; escribir una nueva la crea como temporal al
 * guardar. Controlado por confirmación: trabaja sobre una copia local y emite
 * onGuardar solo al pulsar "Aplicar".
 */
export function SeccionDatosModal({
  abierto,
  seccion,
  disabled,
  modoServicio,
  onCerrar,
  onGuardar,
}: Props) {
  const [borrador, setBorrador] = React.useState<DraftSeccion | null>(seccion);
  const [claveActual, setClaveActual] = React.useState<string | null>(
    seccion?.claveCliente ?? null
  );
  // Ubicación de la maestra elegida en esta sesión (para el detalle). Al reabrir
  // una sección guardada solo tenemos el nombre, así que arranca en null.
  const [origenSel, setOrigenSel] = React.useState<Ubicacion | null>(null);
  const [destinoSel, setDestinoSel] = React.useState<Ubicacion | null>(null);

  // Re-sincronizar el borrador cuando entra otra sección (o null), sin useEffect.
  const claveEntrante = seccion?.claveCliente ?? null;
  if (claveEntrante !== claveActual) {
    setClaveActual(claveEntrante);
    setBorrador(seccion);
    setOrigenSel(null);
    setDestinoSel(null);
  }

  if (!borrador) return null;

  // En "Otros" no se pide ruta; en transporte es obligatoria; en edición (sin
  // modo) se mantiene visible y opcional (comportamiento previo).
  const mostrarRuta = modoServicio !== "OTROS";
  const rutaRequerida = modoServicio === "TRANSPORTE";

  const nombreVacio = borrador.nombre.trim() === "";
  const rutaIncompleta =
    rutaRequerida &&
    (borrador.origen.trim() === "" || borrador.destino.trim() === "");

  const set = (patch: Partial<DraftSeccion>) =>
    setBorrador((b) => (b ? { ...b, ...patch } : b));

  function aplicar() {
    // Al nombrar la sección deja de ser el bucket "sin agrupar" (esDefecto). Luego
    // sincroniza la ruta en las líneas de transporte antes de emitir.
    const nombrada: DraftSeccion = {
      ...borrador!,
      esDefecto: borrador!.nombre.trim() !== "" ? false : borrador!.esDefecto,
      // En "Otros" no hay ruta: se limpia cualquier origen/destino (y sus ids) residual.
      origen: mostrarRuta ? borrador!.origen : "",
      destino: mostrarRuta ? borrador!.destino : "",
      origenUbicacionId: mostrarRuta ? borrador!.origenUbicacionId : "",
      destinoUbicacionId: mostrarRuta ? borrador!.destinoUbicacionId : "",
    };
    onGuardar(sincronizarRutaSeccion(nombrada));
  }

  return (
    <Dialog open={abierto} onOpenChange={(v) => (!v ? onCerrar() : undefined)}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Datos de la sección</DialogTitle>
          <DialogDescription>
            {mostrarRuta
              ? "Nombre y ruta de la sección. Buscá el origen y destino en el maestro de ubicaciones (o escribí uno nuevo); sus líneas de transporte los heredan."
              : "Nombre de la sección. Este tipo de servicio no lleva ruta (origen/destino)."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <Campo label="Nombre de la sección" obligatorio>
            <Input
              value={borrador.nombre}
              disabled={disabled}
              placeholder="Ej: Tramo Lima - Mina"
              onChange={(e) => set({ nombre: e.target.value })}
            />
          </Campo>

          {mostrarRuta ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <RutaCampo
                label="Origen"
                obligatorio={rutaRequerida}
                value={borrador.origen}
                seleccionada={origenSel}
                disabled={disabled}
                placeholder="Buscá o escribí (ej: Lima)"
                onTexto={(v) => {
                  // Texto a mano: sin id del maestro → el precio sugerido no aplica.
                  set({ origen: v, origenUbicacionId: "" });
                  setOrigenSel(null);
                }}
                onSeleccionar={(u) => {
                  set({ origen: u.nombre, origenUbicacionId: u.id });
                  setOrigenSel(u);
                }}
              />
              <RutaCampo
                label="Destino"
                obligatorio={rutaRequerida}
                value={borrador.destino}
                seleccionada={destinoSel}
                disabled={disabled}
                placeholder="Buscá o escribí (ej: Mina)"
                onTexto={(v) => {
                  // Texto a mano: sin id del maestro → el precio sugerido no aplica.
                  set({ destino: v, destinoUbicacionId: "" });
                  setDestinoSel(null);
                }}
                onSeleccionar={(u) => {
                  set({ destino: u.nombre, destinoUbicacionId: u.id });
                  setDestinoSel(u);
                }}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={disabled || nombreVacio || rutaIncompleta}
            title={
              nombreVacio
                ? "Asigna un nombre a la sección"
                : rutaIncompleta
                  ? "Ingresa origen y destino (obligatorios para transporte)"
                  : undefined
            }
            onClick={aplicar}
          >
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Campo de ruta (origen/destino): autocomplete + detalle de lo elegido / aviso. */
function RutaCampo({
  label,
  obligatorio,
  value,
  seleccionada,
  disabled,
  placeholder,
  onTexto,
  onSeleccionar,
}: {
  label: string;
  obligatorio?: boolean;
  value: string;
  seleccionada: Ubicacion | null;
  disabled?: boolean;
  placeholder: string;
  onTexto: (valor: string) => void;
  onSeleccionar: (u: Ubicacion) => void;
}) {
  return (
    <div className="grid content-start gap-1.5">
      <Label className="text-xs text-muted-foreground">
        {label}{" "}
        {obligatorio ? <span className="text-destructive">*</span> : null}
      </Label>
      <AutocompleteUbicacion
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChangeTexto={onTexto}
        onSeleccionar={onSeleccionar}
      />
      {seleccionada ? (
        <DetalleUbicacion u={seleccionada} />
      ) : value.trim() !== "" ? (
        <p className="text-[11px] text-muted-foreground">
          No está en el maestro — se creará como ubicación nueva al guardar.
        </p>
      ) : null}
    </div>
  );
}

/** Tarjeta de detalle de la ubicación elegida del maestro (datos completos). */
function DetalleUbicacion({ u }: { u: Ubicacion }) {
  const coords =
    u.latitud != null && u.longitud != null
      ? `${u.latitud}, ${u.longitud}`
      : null;
  const jerarquia = jerarquiaUbicacion(u, " · ");
  return (
    <div className="grid gap-2.5 rounded-lg border bg-muted/40 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary" className="font-normal">
          {etiquetaTipoUbicacion(u.tipoUbicacion)}
        </Badge>
        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <Check className="size-3" /> En el maestro
        </span>
      </div>
      <DetalleFila label="Dirección" valor={u.direccion} />
      <DetalleFila label="Ubicación" valor={jerarquia || null} />
      <DetalleFila label="País" valor={u.pais} />
      <DetalleFila label="Referencia" valor={u.referenciaUbicacion} />
      <DetalleFila
        label="Coordenadas"
        valor={coords}
        icono={<MapPin className="size-3" />}
        mono
      />
    </div>
  );
}

/** Fila etiqueta:valor del detalle; se omite si el valor está vacío. */
function DetalleFila({
  label,
  valor,
  icono,
  mono,
}: {
  label: string;
  valor?: string | null;
  icono?: React.ReactNode;
  mono?: boolean;
}) {
  if (!valor) return null;
  return (
    <div className="grid grid-cols-[6rem_1fr] items-start gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className={"inline-flex items-center gap-1 " + (mono ? "tabular-nums" : "")}>
        {icono}
        {valor}
      </span>
    </div>
  );
}

function Campo({
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
