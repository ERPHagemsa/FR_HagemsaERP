"use client";

import * as React from "react";

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
import type { DraftSeccion } from "../servicios/cotizaciones-editor.utils";
import { sincronizarRutaSeccion } from "../servicios/cotizaciones-editor.utils";

type Props = {
  abierto: boolean;
  // Seccion a editar (copia de trabajo). null cuando no hay nada abierto.
  seccion: DraftSeccion | null;
  disabled?: boolean;
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

  const set = (patch: Partial<DraftSeccion>) =>
    setBorrador((b) => (b ? { ...b, ...patch } : b));

  function aplicar() {
    // Al nombrar la sección deja de ser el bucket "sin agrupar" (esDefecto). Luego
    // sincroniza la ruta en las líneas de transporte antes de emitir.
    const nombrada: DraftSeccion = {
      ...borrador!,
      esDefecto: borrador!.nombre.trim() !== "" ? false : borrador!.esDefecto,
    };
    onGuardar(sincronizarRutaSeccion(nombrada));
  }

  return (
    <Dialog open={abierto} onOpenChange={(v) => (!v ? onCerrar() : undefined)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Datos de la sección</DialogTitle>
          <DialogDescription>
            Nombre y ruta de la sección. Buscá el origen y destino en el maestro de
            ubicaciones (o escribí uno nuevo); sus líneas de transporte los heredan.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <Campo label="Nombre de la sección" obligatorio>
            <Input
              value={borrador.nombre}
              disabled={disabled}
              placeholder="Ej: Tramo Lima - Mina"
              onChange={(e) => set({ nombre: e.target.value })}
            />
          </Campo>

          <div className="grid gap-4 sm:grid-cols-2">
            <RutaCampo
              label="Origen"
              value={borrador.origen}
              seleccionada={origenSel}
              disabled={disabled}
              placeholder="Buscá o escribí (ej: Lima)"
              onTexto={(v) => {
                set({ origen: v });
                setOrigenSel(null);
              }}
              onSeleccionar={(u) => {
                set({ origen: u.nombre });
                setOrigenSel(u);
              }}
            />
            <RutaCampo
              label="Destino"
              value={borrador.destino}
              seleccionada={destinoSel}
              disabled={disabled}
              placeholder="Buscá o escribí (ej: Mina)"
              onTexto={(v) => {
                set({ destino: v });
                setDestinoSel(null);
              }}
              onSeleccionar={(u) => {
                set({ destino: u.nombre });
                setDestinoSel(u);
              }}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={disabled || borrador.nombre.trim() === ""}
            title={
              borrador.nombre.trim() === ""
                ? "Asigna un nombre a la sección"
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
  value,
  seleccionada,
  disabled,
  placeholder,
  onTexto,
  onSeleccionar,
}: {
  label: string;
  value: string;
  seleccionada: Ubicacion | null;
  disabled?: boolean;
  placeholder: string;
  onTexto: (valor: string) => void;
  onSeleccionar: (u: Ubicacion) => void;
}) {
  return (
    <div className="grid content-start gap-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
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

/** Tarjeta de detalle de la ubicación elegida del maestro. */
function DetalleUbicacion({ u }: { u: Ubicacion }) {
  const coords =
    u.latitud != null && u.longitud != null
      ? `${u.latitud}, ${u.longitud}`
      : null;
  const geo = [jerarquiaUbicacion(u, ", "), u.pais].filter(Boolean).join(", ");
  return (
    <div className="grid gap-1 rounded-md border bg-muted/40 p-2.5 text-xs">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{etiquetaTipoUbicacion(u.tipoUbicacion)}</Badge>
        <span className="text-muted-foreground">del maestro</span>
      </div>
      {u.direccion ? (
        <p className="truncate" title={u.direccion}>
          {u.direccion}
        </p>
      ) : null}
      {geo ? <p className="text-muted-foreground">{geo}</p> : null}
      {coords ? (
        <p className="text-muted-foreground tabular-nums">{coords}</p>
      ) : null}
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
