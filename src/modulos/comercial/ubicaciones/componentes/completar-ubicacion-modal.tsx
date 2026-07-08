"use client";

import * as React from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import { Textarea } from "@/compartido/componentes/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/compartido/componentes/ui/dialog";

import { buscarUbicacionesBc14 } from "../servicios/ubicaciones-api";
import { useCompletarUbicacionMutation } from "../servicios/ubicaciones-queries";
import { normalizarErrorAccion } from "../../cotizaciones/servicios/cotizaciones-error-handler";
import { SelectorUbicacionMapa } from "./selector-ubicacion-mapa";
import type {
  DatosUbicacionGeo,
  PayloadCompletarUbicacion,
  TipoUbicacion,
  UbicacionBc14,
  UbicacionTemporal,
} from "../tipos/ubicaciones.tipos";

const TIPOS_UBICACION: { valor: TipoUbicacion; etiqueta: string }[] = [
  { valor: "SEDE", etiqueta: "Sede" },
  { valor: "CLIENTE", etiqueta: "Cliente" },
  { valor: "PLANTA", etiqueta: "Planta" },
  { valor: "MINA", etiqueta: "Mina" },
  { valor: "PUERTO", etiqueta: "Puerto" },
  { valor: "PEAJE", etiqueta: "Peaje" },
  { valor: "ESTACIONAMIENTO", etiqueta: "Estacionamiento" },
  { valor: "ALMACEN", etiqueta: "Almacén" },
  { valor: "PATIO", etiqueta: "Patio" },
  { valor: "TERMINAL", etiqueta: "Terminal" },
  { valor: "OTRO", etiqueta: "Otro" },
];

type Props = {
  abierto: boolean;
  // Ubicación temporal a completar. null cuando no hay nada abierto.
  temporal: UbicacionTemporal | null;
  onCerrar: () => void;
};

interface FormState {
  tipoUbicacion: TipoUbicacion | "";
  pais: string;
  departamento: string;
  codigoDepartamento: string;
  provincia: string;
  codigoProvincia: string;
  distrito: string;
  codigoDistrito: string;
  ubigeo: string;
  direccion: string;
  referenciaUbicacion: string;
  coordenadasGoogle: string;
}

function estadoInicial(t: UbicacionTemporal | null): FormState {
  return {
    tipoUbicacion: t?.tipoUbicacion ?? "",
    pais: t?.pais ?? "Peru",
    departamento: t?.departamento ?? "",
    codigoDepartamento: "",
    provincia: t?.provincia ?? "",
    codigoProvincia: "",
    distrito: t?.distrito ?? "",
    codigoDistrito: "",
    ubigeo: "",
    direccion: t?.direccion ?? "",
    referenciaUbicacion: t?.referenciaUbicacion ?? "",
    coordenadasGoogle:
      t?.latitud != null && t?.longitud != null
        ? `${t.latitud}, ${t.longitud}`
        : "",
  };
}

/**
 * Modal para completar una ubicación temporal (solo con la cotización GANADA).
 *
 * Flujo buscar-antes-de-crear: el usuario llena los datos y busca coincidencias
 * en el maestro de BC-14. Si hay candidatas, puede vincular una existente (se
 * copia a la maestra local, sin publicar) o confirmar que es nueva (queda
 * COMPLETA a la espera del PUB/SUB de la fase final).
 */
export function CompletarUbicacionModal({ abierto, temporal, onCerrar }: Props) {
  const [form, setForm] = React.useState<FormState>(() =>
    estadoInicial(temporal)
  );
  // null = todavía no se buscó; [] = se buscó y no hubo coincidencias.
  const [candidatas, setCandidatas] = React.useState<UbicacionBc14[] | null>(
    null
  );
  const [buscando, setBuscando] = React.useState(false);

  const mutacion = useCompletarUbicacionMutation(temporal?.id ?? "");

  // El estado se reinicia por remount (el padre pasa `key` con el id de la
  // temporal), no vía efecto: así evitamos setState dentro de useEffect.

  function set(parcial: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...parcial }));
    // Cualquier cambio invalida la búsqueda previa.
    setCandidatas(null);
  }

  // Vuelca los datos del mapa (Places / Geocoding) al formulario. Los campos
  // siguen editables: solo se pisan los que el lugar/pin devolvió con valor.
  function alSeleccionarMapa(d: DatosUbicacionGeo) {
    const parcial: Partial<FormState> = {
      direccion: d.direccion,
      coordenadasGoogle: `${d.latitud}, ${d.longitud}`,
      codigoDepartamento: d.codigoDepartamento ?? "",
      codigoProvincia: d.codigoProvincia ?? "",
      codigoDistrito: d.codigoDistrito ?? "",
      ubigeo: d.ubigeo ?? "",
    };
    if (d.pais) parcial.pais = d.pais;
    if (d.departamento) parcial.departamento = d.departamento;
    if (d.provincia) parcial.provincia = d.provincia;
    if (d.distrito) parcial.distrito = d.distrito;
    set(parcial);
  }

  const camposCompletos =
    form.tipoUbicacion !== "" &&
    form.pais.trim() !== "" &&
    form.departamento.trim() !== "" &&
    form.provincia.trim() !== "" &&
    form.distrito.trim() !== "" &&
    form.direccion.trim() !== "";

  function payloadBase(): PayloadCompletarUbicacion {
    return {
      tipoUbicacion: form.tipoUbicacion as TipoUbicacion,
      pais: form.pais.trim(),
      departamento: form.departamento.trim(),
      codigoDepartamento: form.codigoDepartamento.trim() || null,
      provincia: form.provincia.trim(),
      codigoProvincia: form.codigoProvincia.trim() || null,
      distrito: form.distrito.trim(),
      codigoDistrito: form.codigoDistrito.trim() || null,
      ubigeo: form.ubigeo.trim() || null,
      direccion: form.direccion.trim(),
      referenciaUbicacion: form.referenciaUbicacion.trim() || null,
      coordenadasGoogle: form.coordenadasGoogle.trim() || null,
    };
  }

  async function alBuscar() {
    if (!temporal) return;
    setBuscando(true);
    try {
      const resultado = await buscarUbicacionesBc14({
        nombre: temporal.nombre,
        departamento: form.departamento.trim() || undefined,
        provincia: form.provincia.trim() || undefined,
        distrito: form.distrito.trim() || undefined,
      });
      setCandidatas(resultado);
    } catch (err) {
      const { mensaje } = normalizarErrorAccion(
        err,
        "No se pudo consultar el maestro de ubicaciones"
      );
      toast.error(mensaje);
    } finally {
      setBuscando(false);
    }
  }

  async function completar(payload: PayloadCompletarUbicacion) {
    try {
      await mutacion.mutateAsync(payload);
      toast.success("Ubicación completada");
      onCerrar();
    } catch (err) {
      const { mensaje } = normalizarErrorAccion(
        err,
        "No se pudo completar la ubicación"
      );
      toast.error(mensaje);
    }
  }

  function alVincular(candidata: UbicacionBc14) {
    void completar({
      ...payloadBase(),
      vincularUbicacionBc14Id: candidata.id,
    });
  }

  function alRegistrarNueva() {
    void completar({ ...payloadBase(), confirmarCreacion: true });
  }

  const enviando = mutacion.isPending;

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="size-4" />
            Completar ubicación
          </DialogTitle>
          <DialogDescription>
            {temporal ? (
              <>
                Completá los datos de <strong>{temporal.nombre}</strong> que
                exige Configuración General (BC-14). Antes de registrar, buscá si
                ya existe para no duplicarla.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          {/* Columna izquierda: formulario */}
          <div className="grid content-start gap-4">
          <div className="grid gap-2">
            <Label>Tipo de ubicación</Label>
            <Select
              value={form.tipoUbicacion}
              onValueChange={(v) => set({ tipoUbicacion: v as TipoUbicacion })}
              disabled={enviando}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccioná un tipo" />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_UBICACION.map((t) => (
                  <SelectItem key={t.valor} value={t.valor}>
                    {t.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>País</Label>
              <Input
                value={form.pais}
                onChange={(e) =>
                  set({
                    pais: e.target.value,
                    codigoDepartamento: "",
                    codigoProvincia: "",
                    codigoDistrito: "",
                    ubigeo: "",
                  })
                }
                disabled={enviando}
              />
            </div>
            <div className="grid gap-2">
              <Label>Departamento</Label>
              <Input
                value={form.departamento}
                onChange={(e) =>
                  set({
                    departamento: e.target.value,
                    codigoDepartamento: "",
                    codigoProvincia: "",
                    codigoDistrito: "",
                    ubigeo: "",
                  })
                }
                disabled={enviando}
              />
            </div>
            <div className="grid gap-2">
              <Label>Provincia</Label>
              <Input
                value={form.provincia}
                onChange={(e) =>
                  set({
                    provincia: e.target.value,
                    codigoProvincia: "",
                    codigoDistrito: "",
                    ubigeo: "",
                  })
                }
                disabled={enviando}
              />
            </div>
            <div className="grid gap-2">
              <Label>Distrito</Label>
              <Input
                value={form.distrito}
                onChange={(e) =>
                  set({
                    distrito: e.target.value,
                    codigoDistrito: "",
                    ubigeo: "",
                  })
                }
                disabled={enviando}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Dirección</Label>
            <Input
              value={form.direccion}
              onChange={(e) => set({ direccion: e.target.value })}
              disabled={enviando}
            />
          </div>

          <div className="grid gap-2">
            <Label>Referencia (opcional)</Label>
            <Textarea
              rows={2}
              value={form.referenciaUbicacion}
              onChange={(e) => set({ referenciaUbicacion: e.target.value })}
              disabled={enviando}
            />
          </div>

          <div className="grid gap-2">
            <Label>Coordenadas Google (opcional)</Label>
            <Input
              placeholder="-14.4523123, -71.7534123"
              value={form.coordenadasGoogle}
              onChange={(e) => set({ coordenadasGoogle: e.target.value })}
              disabled={enviando}
            />
          </div>

          {/* Buscar-antes-de-crear */}
          {candidatas === null ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => void alBuscar()}
              disabled={!camposCompletos || buscando || enviando}
            >
              {buscando ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Buscar duplicados en BC-14
            </Button>
          ) : candidatas.length > 0 ? (
            <div className="grid gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/40">
              <p className="text-sm font-medium">
                Ya existen ubicaciones parecidas en BC-14. ¿Es alguna de estas?
              </p>
              {candidatas.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded border bg-background p-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.nombre}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[c.distrito, c.provincia, c.departamento]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => alVincular(c)}
                    disabled={enviando}
                  >
                    Vincular
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={alRegistrarNueva}
                disabled={enviando}
              >
                Ninguna: registrar como nueva
              </Button>
            </div>
          ) : (
            <div className="grid gap-2 rounded-md border border-emerald-300 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/40">
              <p className="text-sm">
                No hay coincidencias en BC-14. Podés registrarla como nueva.
              </p>
            </div>
          )}
          </div>

          {/* Columna derecha: mapa */}
          <div className="md:order-last md:self-start">
            <SelectorUbicacionMapa
              valorInicial={
                temporal
                  ? { latitud: temporal.latitud, longitud: temporal.longitud }
                  : undefined
              }
              onSeleccion={alSeleccionarMapa}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={onCerrar}
            disabled={enviando}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={alRegistrarNueva}
            disabled={!camposCompletos || candidatas === null || enviando}
          >
            {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
            Registrar ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
