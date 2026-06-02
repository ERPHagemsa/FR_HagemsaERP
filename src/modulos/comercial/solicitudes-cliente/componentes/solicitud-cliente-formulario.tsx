"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  esError409,
  esError404,
  esErrorValidacion,
  extraerMensajeError,
  obtenerErroresPorCampo,
} from "@/compartido/api";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
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

import { useRegistrarSCMutation } from "../servicios/solicitudes-cliente-queries";
import { ResolverIdentidadPanel } from "./resolver-identidad-panel";
import type { CanalEntrada, OrigenTipo } from "../../cotizaciones/tipos/cotizaciones.tipos";
import {
  issuesAErroresCampo,
  schemaRegistrarSC,
} from "../../cotizaciones/tipos/cotizaciones.schemas";

// ---------------------------------------------------------------------------
// Helper para leer el valor de un campo del formulario
// ---------------------------------------------------------------------------

function getValue(root: HTMLElement, name: string): string {
  return (
    (
      root.querySelector(`[name="${name}"]`) as
        | HTMLInputElement
        | HTMLSelectElement
        | HTMLTextAreaElement
        | null
    )?.value.trim() ?? ""
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function SolicitudClienteFormulario() {
  const router = useRouter();
  const formularioRef = React.useRef<HTMLFormElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [erroresCampo, setErroresCampo] = React.useState<Record<string, string>>({});
  // Estado controlado para campos que el panel resolver-identidad puede pre-rellenar
  const [origenIdValue, setOrigenIdValue] = React.useState("");
  const [origenTipoValue, setOrigenTipoValue] = React.useState<OrigenTipo>("PROSPECTO");

  const registrarMutation = useRegistrarSCMutation();

  function limpiarErrorCampo(name: string) {
    setErroresCampo((prev) => {
      if (!prev[name]) return prev;
      const siguiente = { ...prev };
      delete siguiente[name];
      return siguiente;
    });
  }

  async function onSubmit() {
    const root = formularioRef.current;
    if (!root) return;

    setErroresCampo({});
    setIsSaving(true);

    try {
      const datos = {
        origenTipo: origenTipoValue,
        origenId: origenIdValue,
        contactoOrigenId: getValue(root, "contactoOrigenId"),
        canalEntrada: getValue(root, "canalEntrada") as CanalEntrada,
        descripcionServicio: getValue(root, "descripcionServicio"),
        fechaRequerida: getValue(root, "fechaRequerida") || undefined,
        observaciones: getValue(root, "observaciones") || undefined,
      };

      const resultado = schemaRegistrarSC.safeParse(datos);
      if (!resultado.success) {
        setErroresCampo(issuesAErroresCampo(resultado.error));
        setIsSaving(false);
        return;
      }

      try {
        const respuesta = await registrarMutation.mutateAsync(resultado.data);
        // DELTA 1: navegar directo al editor del borrador usando idCotizacion de la respuesta 201
        router.push(`/comercial/cotizaciones/${respuesta.idCotizacion}/editar`);
      } catch (err) {
        aplicarErrorApi(err);
      }
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo registrar la solicitud"));
    } finally {
      setIsSaving(false);
    }
  }

  function aplicarErrorApi(err: unknown) {
    // 409: el contacto no pertenece al origen (RN-03-022) → inline en contactoOrigenId
    if (esError409(err)) {
      setErroresCampo((prev) => ({
        ...prev,
        contactoOrigenId: "El contacto seleccionado no pertenece al origen indicado.",
      }));
      toast.error("El contacto seleccionado no pertenece al origen indicado.");
      return;
    }

    // 404: el origen indicado no existe
    if (esError404(err)) {
      toast.error("El prospecto o cliente indicado no existe.");
      return;
    }

    // 422: regla de negocio — mostrar verbatim
    if (esErrorValidacion(err)) {
      toast.error(extraerMensajeError(err, "No se pudo registrar la solicitud"));
      return;
    }

    // 400: errores de campo inline
    const erroresPorCampoApi = obtenerErroresPorCampo(err);
    const camposConError = Object.keys(erroresPorCampoApi);
    if (camposConError.length > 0) {
      const nuevosMensajes: Record<string, string> = {};
      for (const campo of camposConError) {
        nuevosMensajes[campo] = erroresPorCampoApi[campo].mensaje;
      }
      setErroresCampo(nuevosMensajes);
      toast.error("Revisa los campos marcados en el formulario.");
      return;
    }

    toast.error(extraerMensajeError(err, "No se pudo registrar la solicitud"));
  }

  return (
    <form
      ref={formularioRef}
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
    >
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>Registrar solicitud de cliente</CardTitle>
        </CardHeader>
        <CardContent className="px-5 pt-5 pb-0">
          <div className="grid gap-y-8 lg:grid-cols-2">
            {/* Columna 1: datos del origen */}
            <div className="flex flex-col gap-4 lg:pr-10">
              <SeccionTitulo
                titulo="Datos del origen"
                descripcion="Prospecto o cliente que origina la solicitud."
              />
              <ResolverIdentidadPanel
                onIdentidadResuelta={({ origenTipo, origenId }) => {
                  setOrigenTipoValue(origenTipo);
                  setOrigenIdValue(origenId);
                  limpiarErrorCampo("origenTipo");
                  limpiarErrorCampo("origenId");
                }}
              />
              <CampoSelect
                label="Tipo de origen"
                name="origenTipo"
                requerido
                opciones={[
                  { valor: "PROSPECTO", etiqueta: "Prospecto" },
                  { valor: "CLIENTE", etiqueta: "Cliente" },
                ]}
                value={origenTipoValue}
                onValueChange={(v) => setOrigenTipoValue(v as OrigenTipo)}
                error={erroresCampo["origenTipo"]}
                disabled={isSaving}
              />
              <CampoTexto
                label="ID del origen (UUID)"
                name="origenId"
                requerido
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={origenIdValue}
                error={erroresCampo["origenId"]}
                disabled={isSaving}
                onChange={(e) => {
                  setOrigenIdValue(e.target.value);
                  limpiarErrorCampo("origenId");
                }}
              />
              <CampoTexto
                label="ID del contacto (UUID)"
                name="contactoOrigenId"
                requerido
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                error={erroresCampo["contactoOrigenId"]}
                disabled={isSaving}
                onChange={() => limpiarErrorCampo("contactoOrigenId")}
              />
              <CampoSelect
                label="Canal de entrada"
                name="canalEntrada"
                requerido
                opciones={[
                  { valor: "CORREO", etiqueta: "Correo electronico" },
                  { valor: "LLAMADA", etiqueta: "Llamada telefonica" },
                  { valor: "TELEFONO", etiqueta: "Telefono" },
                  { valor: "EMAIL", etiqueta: "Email" },
                  { valor: "PRESENCIAL", etiqueta: "Visita presencial" },
                  { valor: "OTRO", etiqueta: "Otro" },
                ]}
                defaultValue="CORREO"
                error={erroresCampo["canalEntrada"]}
                disabled={isSaving}
              />
            </div>

            {/* Columna 2: descripcion del servicio */}
            <div className="flex flex-col gap-4 lg:border-l lg:border-border lg:pl-10">
              <SeccionTitulo
                titulo="Descripcion del servicio"
                descripcion="Detalle del servicio requerido por el cliente."
              />
              <CampoTextarea
                label="Descripcion del servicio"
                name="descripcionServicio"
                requerido
                placeholder="Describe el servicio requerido..."
                error={erroresCampo["descripcionServicio"]}
                disabled={isSaving}
                onChange={() => limpiarErrorCampo("descripcionServicio")}
              />
              <CampoTexto
                label="Fecha requerida"
                name="fechaRequerida"
                type="date"
                error={erroresCampo["fechaRequerida"]}
                disabled={isSaving}
                onChange={() => limpiarErrorCampo("fechaRequerida")}
              />
              <CampoTextarea
                label="Observaciones"
                name="observaciones"
                placeholder="Observaciones adicionales..."
                error={erroresCampo["observaciones"]}
                disabled={isSaving}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="-mx-5 mt-5 flex items-center justify-end gap-2 border-t border-border bg-muted/40 px-5 py-4">
            <Button type="button" variant="outline" asChild disabled={isSaving}>
              <Link href="/comercial/cotizaciones">Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Registrando..." : "Registrar solicitud"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Sub-componentes de formulario
// ---------------------------------------------------------------------------

function SeccionTitulo({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion?: string;
}) {
  return (
    <div className="mb-5 border-b border-border pb-4">
      <p className="text-sm font-semibold text-foreground">{titulo}</p>
      {descripcion ? (
        <p className="mt-1 text-xs text-muted-foreground">{descripcion}</p>
      ) : null}
    </div>
  );
}

function CampoTexto({
  label,
  name,
  requerido = false,
  error,
  onChange,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  requerido?: boolean;
  error?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>
        {label}
        {requerido ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <Input
        id={name}
        name={name}
        aria-invalid={Boolean(error)}
        onChange={onChange}
        {...props}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function CampoSelect({
  label,
  name,
  requerido = false,
  opciones,
  defaultValue,
  value,
  onValueChange,
  error,
  disabled,
}: {
  label: string;
  name: string;
  requerido?: boolean;
  opciones: { valor: string; etiqueta: string }[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>
        {label}
        {requerido ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <Select
        name={name}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger id={name} aria-invalid={Boolean(error)} className="w-full">
          <SelectValue placeholder="Selecciona una opcion" />
        </SelectTrigger>
        <SelectContent>
          {opciones.map((opcion) => (
            <SelectItem key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function CampoTextarea({
  label,
  name,
  requerido = false,
  error,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  requerido?: boolean;
  error?: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>
        {label}
        {requerido ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <Textarea
        id={name}
        name={name}
        rows={3}
        aria-invalid={Boolean(error)}
        className="min-h-24"
        {...props}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
