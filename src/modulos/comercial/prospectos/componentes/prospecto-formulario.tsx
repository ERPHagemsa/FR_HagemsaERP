"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  esError409,
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
import { Separator } from "@/compartido/componentes/ui/separator";
import { cn } from "@/compartido/utilidades";

import {
  useActualizarProspectoMutation,
  useRegistrarProspectoMutation,
} from "../servicios/prospectos-queries";
import type {
  MedioContactoInicial,
  Prospecto,
  TipoDocumento,
} from "../tipos/prospecto.tipos";
import {
  issuesAErroresCampo,
  schemaActualizarProspecto,
  schemaRegistrarProspecto,
} from "../tipos/prospecto.schemas";

// ---------------------------------------------------------------------------
// Helpers de campo
// ---------------------------------------------------------------------------

function getValue(
  root: HTMLElement,
  name: string
): string {
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
// Props
// ---------------------------------------------------------------------------

type Modo = "nuevo" | "editar";

type Props = {
  modo?: Modo;
  prospecto?: Prospecto;
};

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function ProspectoFormulario({ modo = "nuevo", prospecto }: Props) {
  const router = useRouter();
  const formularioRef = React.useRef<HTMLDivElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [erroresCampo, setErroresCampo] = React.useState<
    Record<string, string>
  >({});

  const registrarMutation = useRegistrarProspectoMutation();
  const actualizarMutation = useActualizarProspectoMutation();

  const esEdicion = modo === "editar";

  // Limpia error de un campo cuando el usuario lo edita
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
      if (esEdicion) {
        await onSubmitEditar(root);
      } else {
        await onSubmitNuevo(root);
      }
    } catch (err) {
      // Errores de red/inesperados (los de API se manejan dentro de cada handler)
      toast.error(extraerMensajeError(err, "No se pudo guardar el prospecto"));
    } finally {
      setIsSaving(false);
    }
  }

  async function onSubmitNuevo(root: HTMLElement) {
    const datos = {
      nombreComercial: getValue(root, "nombreComercial"),
      razonSocial: getValue(root, "razonSocial") || undefined,
      tipoDocumento: getValue(root, "tipoDocumento") as TipoDocumento,
      numeroDocumento: getValue(root, "numeroDocumento"),
      medioContactoInicial: getValue(root, "medioContactoInicial") as MedioContactoInicial,
      contactoInicial: {
        nombre: getValue(root, "contacto.nombre"),
        cargo: getValue(root, "contacto.cargo") || undefined,
        telefono: getValue(root, "contacto.telefono") || undefined,
        email: getValue(root, "contacto.email") || undefined,
        observaciones: getValue(root, "contacto.observaciones") || undefined,
      },
    };

    const resultado = schemaRegistrarProspecto.safeParse(datos);
    if (!resultado.success) {
      const errores = issuesAErroresCampo(resultado.error);
      // Mapear campos del contacto: "contactoInicial.telefono" -> "contacto.telefono"
      const erroresMapeados: Record<string, string> = {};
      for (const [k, v] of Object.entries(errores)) {
        if (k.startsWith("contactoInicial.")) {
          erroresMapeados[`contacto.${k.slice("contactoInicial.".length)}`] = v;
        } else {
          erroresMapeados[k] = v;
        }
      }
      setErroresCampo(erroresMapeados);
      setIsSaving(false);
      return;
    }

    try {
      const respuesta = await registrarMutation.mutateAsync(resultado.data);
      router.push(`/comercial/prospectos/${respuesta.id}?accion=registrado`);
    } catch (err) {
      aplicarErrorApi(err);
    }
  }

  async function onSubmitEditar(root: HTMLElement) {
    if (!prospecto) return;

    const datos = {
      nombreComercial: getValue(root, "nombreComercial") || undefined,
      razonSocial: getValue(root, "razonSocial") || undefined,
      tipoDocumento:
        (getValue(root, "tipoDocumento") as TipoDocumento) || undefined,
      numeroDocumento: getValue(root, "numeroDocumento") || undefined,
      medioContactoInicial:
        (getValue(root, "medioContactoInicial") as MedioContactoInicial) ||
        undefined,
      idEjecutivoResponsable:
        getValue(root, "idEjecutivoResponsable") || undefined,
    };

    const resultado = schemaActualizarProspecto.safeParse(datos);
    if (!resultado.success) {
      setErroresCampo(issuesAErroresCampo(resultado.error));
      setIsSaving(false);
      return;
    }

    try {
      await actualizarMutation.mutateAsync({
        id: prospecto.id,
        payload: resultado.data,
      });
      router.push(
        `/comercial/prospectos/${prospecto.id}?accion=actualizado`
      );
      router.refresh();
    } catch (err) {
      aplicarErrorApi(err);
    }
  }

  function aplicarErrorApi(err: unknown) {
    if (esError409(err)) {
      toast.error(
        "Ya existe un prospecto registrado con ese numero de documento (RUC/DNI/CE)."
      );
      return;
    }

    // 422: validacion de negocio — el mensaje del backend ya viene en
    // español y es preciso; se muestra tal cual via extraerMensajeError.
    if (esErrorValidacion(err)) {
      toast.error(extraerMensajeError(err, "No se pudo guardar el prospecto"));
      return;
    }

    // 400: si el backend devuelve errores por campo (array errores[]),
    // los mapeamos al estado para mostrarlos inline junto al campo.
    // Si no trae errores de campo, cae al toast generico.
    const erroresPorCampoApi = obtenerErroresPorCampo(err);
    const camposConError = Object.keys(erroresPorCampoApi);
    if (camposConError.length > 0) {
      const nuevosMensajes: Record<string, string> = {};
      for (const campo of camposConError) {
        nuevosMensajes[campo] = erroresPorCampoApi[campo].mensaje;
      }
      setErroresCampo(nuevosMensajes);
      // Toast adicional para que el usuario note que hay errores de campo
      toast.error("Revisa los campos marcados en el formulario.");
      return;
    }

    toast.error(extraerMensajeError(err, "No se pudo guardar el prospecto"));
  }

  const urlCancelar = esEdicion
    ? `/comercial/prospectos/${prospecto?.id}`
    : "/comercial/prospectos";

  return (
    <div ref={formularioRef}>
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>
            {esEdicion ? "Editar prospecto" : "Registrar prospecto"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pt-5 pb-0">
          {/* Datos generales del prospecto */}
          <SeccionTitulo
            titulo="Datos del prospecto"
            descripcion="Informacion comercial y de identificacion."
          />

          <div className="grid gap-4 md:grid-cols-2">
            <CampoTexto
              label="Nombre comercial"
              name="nombreComercial"
              requerido
              defaultValue={prospecto?.nombreComercial}
              error={erroresCampo["nombreComercial"]}
              disabled={isSaving}
              onChange={() => limpiarErrorCampo("nombreComercial")}
            />
            <CampoTexto
              label="Razon social"
              name="razonSocial"
              defaultValue={prospecto?.razonSocial ?? undefined}
              error={erroresCampo["razonSocial"]}
              disabled={isSaving}
              onChange={() => limpiarErrorCampo("razonSocial")}
            />
          </div>

          {/* Documento: requerido en nuevo, opcional en editar */}
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <CampoSelect
              label="Tipo de documento"
              name="tipoDocumento"
              requerido={!esEdicion}
              opciones={[
                { valor: "RUC", etiqueta: "RUC" },
                { valor: "DNI", etiqueta: "DNI" },
                { valor: "CE", etiqueta: "Carnet de extranjeria" },
              ]}
              defaultValue={prospecto?.tipoDocumento ?? "RUC"}
              error={erroresCampo["tipoDocumento"]}
              disabled={isSaving}
            />
            <CampoTexto
              label="Numero de documento"
              name="numeroDocumento"
              requerido={!esEdicion}
              defaultValue={prospecto?.numeroDocumento}
              error={erroresCampo["numeroDocumento"]}
              disabled={isSaving}
              onChange={() => limpiarErrorCampo("numeroDocumento")}
            />
          </div>

          <div className="mt-4">
            <CampoSelect
              label="Medio de contacto inicial"
              name="medioContactoInicial"
              requerido
              opciones={[
                { valor: "CORREO", etiqueta: "Correo electronico" },
                { valor: "LLAMADA", etiqueta: "Llamada telefonica" },
                { valor: "PRESENCIAL", etiqueta: "Visita presencial" },
                { valor: "OTRO", etiqueta: "Otro" },
              ]}
              defaultValue={prospecto?.medioContactoInicial ?? "CORREO"}
              error={erroresCampo["medioContactoInicial"]}
              disabled={isSaving}
            />
          </div>

          {/* Ejecutivo responsable: solo editable en modo edicion.
              En modo nuevo el backend lo asigna automaticamente. */}
          {esEdicion ? (
            <div className="mt-4">
              <CampoTexto
                label="ID ejecutivo responsable"
                name="idEjecutivoResponsable"
                defaultValue={prospecto?.idEjecutivoResponsable}
                error={erroresCampo["idEjecutivoResponsable"]}
                disabled={isSaving}
                onChange={() => limpiarErrorCampo("idEjecutivoResponsable")}
              />
            </div>
          ) : null}

          {/* Seccion contacto inicial: solo en modo nuevo */}
          {!esEdicion ? (
            <>
              <Separator className="my-6" />
              <SeccionTitulo
                titulo="Contacto inicial"
                descripcion="Persona de contacto con la que se inicio la relacion comercial. Se requiere al menos telefono o email."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <CampoTexto
                  label="Nombre del contacto"
                  name="contacto.nombre"
                  requerido
                  error={erroresCampo["contacto.nombre"]}
                  disabled={isSaving}
                  onChange={() => limpiarErrorCampo("contacto.nombre")}
                />
                <CampoTexto
                  label="Cargo"
                  name="contacto.cargo"
                  error={erroresCampo["contacto.cargo"]}
                  disabled={isSaving}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <CampoTexto
                  label="Telefono"
                  name="contacto.telefono"
                  type="tel"
                  error={erroresCampo["contacto.telefono"]}
                  disabled={isSaving}
                  onChange={() => {
                    limpiarErrorCampo("contacto.telefono");
                    limpiarErrorCampo("contacto.email");
                  }}
                />
                <CampoTexto
                  label="Email"
                  name="contacto.email"
                  type="email"
                  error={erroresCampo["contacto.email"]}
                  disabled={isSaving}
                  onChange={() => {
                    limpiarErrorCampo("contacto.email");
                    limpiarErrorCampo("contacto.telefono");
                  }}
                />
              </div>

              <div className="mt-4">
                <CampoTextarea
                  label="Observaciones"
                  name="contacto.observaciones"
                  disabled={isSaving}
                />
              </div>
            </>
          ) : null}

          {/* Footer */}
          <div className="-mx-5 mt-5 flex items-center justify-end gap-2 border-t border-border bg-muted/40 px-5 py-4">
            <Button type="button" variant="outline" asChild disabled={isSaving}>
              <Link href={urlCancelar}>Cancelar</Link>
            </Button>
            <Button type="button" onClick={onSubmit} disabled={isSaving}>
              {isSaving
                ? "Guardando..."
                : esEdicion
                  ? "Guardar cambios"
                  : "Registrar prospecto"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
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
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function CampoSelect({
  label,
  name,
  requerido = false,
  opciones,
  defaultValue,
  error,
  disabled,
}: {
  label: string;
  name: string;
  requerido?: boolean;
  opciones: { valor: string; etiqueta: string }[];
  defaultValue?: string;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>
        {label}
        {requerido ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={cn(
          "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
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
      <textarea
        id={name}
        name={name}
        rows={3}
        aria-invalid={Boolean(error)}
        className="min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        {...props}
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
