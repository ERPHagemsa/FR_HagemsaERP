"use client";

import * as React from "react";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/compartido/componentes/ui/button";
import { Combobox } from "@/compartido/componentes/ui/combobox";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import { Textarea } from "@/compartido/componentes/ui/textarea";
import { useConsulta } from "@/compartido/api";
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

import {
  listarDepartamentos,
  listarDistritos,
  listarProvincias,
} from "../servicios/geo-api";
import { useCompletarUbicacionMutation } from "../servicios/ubicaciones-queries";
import { normalizarErrorAccion } from "../../cotizaciones/servicios/cotizaciones-error-handler";
import { SelectorUbicacionMapa } from "./selector-ubicacion-mapa";
import type {
  DatosUbicacionGeo,
  PayloadCompletarUbicacion,
  TipoUbicacion,
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
  provincia: string;
  distrito: string;
  direccion: string;
  referenciaUbicacion: string;
  coordenadasGoogle: string;
}

function estadoInicial(t: UbicacionTemporal | null): FormState {
  return {
    tipoUbicacion: t?.tipoUbicacion ?? "",
    pais: t?.pais ?? "Peru",
    departamento: t?.departamento ?? "",
    provincia: t?.provincia ?? "",
    distrito: t?.distrito ?? "",
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
 * Al registrar, la temporal queda COMPLETA a la espera de la publicación PUB/SUB
 * (fase final): BC-14 valida si ya existe y devuelve los datos para replicar en
 * la maestra local. No se deduplica acá.
 */
export function CompletarUbicacionModal({ abierto, temporal, onCerrar }: Props) {
  const [form, setForm] = React.useState<FormState>(() =>
    estadoInicial(temporal)
  );

  const mutacion = useCompletarUbicacionMutation(temporal?.id ?? "");

  // El estado se reinicia por remount (el padre pasa `key` con el id de la
  // temporal), no vía efecto: así evitamos setState dentro de useEffect.

  function set(parcial: Partial<FormState>) {
    setForm((prev) => ({ ...prev, ...parcial }));
  }

  // Cascada geo-api: departamento → provincia → distrito. Cada lista depende de
  // la selección de la de arriba; al cambiar el padre se reinician los hijos.
  const departamentos = useConsulta(() => listarDepartamentos(), [], {
    clave: "geo-departamentos",
  });
  const provincias = useConsulta(
    () => listarProvincias(form.departamento),
    [form.departamento],
    { enabled: form.departamento.trim() !== "" }
  );
  const distritos = useConsulta(
    () => listarDistritos(form.departamento, form.provincia),
    [form.departamento, form.provincia],
    { enabled: form.provincia.trim() !== "" }
  );

  const opcionesDepartamento = (departamentos.data ?? []).map((d) => ({
    valor: d.nombre,
    etiqueta: d.nombre,
  }));
  const opcionesProvincia = (provincias.data ?? []).map((p) => ({
    valor: p.nombre,
    etiqueta: p.nombre,
  }));
  const opcionesDistrito = (distritos.data ?? []).map((d) => ({
    valor: d.nombre,
    etiqueta: d.nombre,
  }));

  // Elegir departamento reinicia provincia y distrito; elegir provincia
  // reinicia distrito. Así no queda una jerarquía inconsistente.
  function elegirDepartamento(valor: string) {
    set({ departamento: valor, provincia: "", distrito: "" });
  }
  function elegirProvincia(valor: string) {
    set({ provincia: valor, distrito: "" });
  }
  function elegirDistrito(valor: string) {
    set({ distrito: valor });
  }

  // Vuelca los datos del mapa (Places / Geocoding) al formulario. Los campos
  // siguen editables: solo se pisan los que el lugar/pin devolvió con valor.
  function alSeleccionarMapa(d: DatosUbicacionGeo) {
    const parcial: Partial<FormState> = {
      direccion: d.direccion,
      coordenadasGoogle: `${d.latitud}, ${d.longitud}`,
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
      provincia: form.provincia.trim(),
      distrito: form.distrito.trim(),
      direccion: form.direccion.trim(),
      referenciaUbicacion: form.referenciaUbicacion.trim() || null,
      coordenadasGoogle: form.coordenadasGoogle.trim() || null,
    };
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

  function alRegistrar() {
    void completar(payloadBase());
  }

  const enviando = mutacion.isPending;

  return (
    <Dialog open={abierto} onOpenChange={(v) => !v && onCerrar()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-6xl lg:max-w-7xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="size-4" />
            Completar ubicación
          </DialogTitle>
          <DialogDescription>
            {temporal ? (
              <>
                Completá los datos de <strong>{temporal.nombre}</strong> que
                exige Configuración General (BC-14). Al registrar, BC-14 valida y
                sincroniza la ubicación.
              </>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-2 md:grid-cols-[28rem_minmax(0,1fr)] md:items-stretch">
          {/* Columna izquierda: formulario (ancho fijo, el mapa se lleva el resto) */}
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
                onChange={(e) => set({ pais: e.target.value })}
                disabled={enviando}
              />
            </div>
            <div className="grid gap-2">
              <Label>Departamento</Label>
              <Combobox
                opciones={opcionesDepartamento}
                valor={form.departamento}
                onValorChange={elegirDepartamento}
                placeholder="Seleccioná departamento"
                cargando={departamentos.isLoading}
                disabled={enviando}
              />
            </div>
            <div className="grid gap-2">
              <Label>Provincia</Label>
              <Combobox
                opciones={opcionesProvincia}
                valor={form.provincia}
                onValorChange={elegirProvincia}
                placeholder="Seleccioná provincia"
                textoVacio={
                  form.departamento
                    ? "Sin resultados."
                    : "Elegí un departamento primero."
                }
                cargando={provincias.isLoading}
                disabled={enviando || !form.departamento}
              />
            </div>
            <div className="grid gap-2">
              <Label>Distrito</Label>
              <Combobox
                opciones={opcionesDistrito}
                valor={form.distrito}
                onValorChange={elegirDistrito}
                placeholder="Seleccioná distrito"
                textoVacio={
                  form.provincia
                    ? "Sin resultados."
                    : "Elegí una provincia primero."
                }
                cargando={distritos.isLoading}
                disabled={enviando || !form.provincia}
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
          </div>

          {/* Columna derecha: mapa (se estira a la altura del formulario) */}
          <div className="md:order-last">
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
            onClick={alRegistrar}
            disabled={!camposCompletos || enviando}
          >
            {enviando ? <Loader2 className="size-4 animate-spin" /> : null}
            Registrar ubicación
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
