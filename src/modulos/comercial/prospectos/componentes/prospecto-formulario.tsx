"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

import {
  esError409,
  esErrorValidacion,
  extraerMensajeError,
  invalidarConsulta,
  obtenerErroresPorCampo,
} from "@/compartido/api";
import {
  CLAVE_PROSPECTOS,
  CLAVE_PROSPECTO_DETALLE,
  CLAVE_PROSPECTO_HISTORIAL,
} from "../../claves-consulta";
import { Alert, AlertDescription } from "@/compartido/componentes/ui/alert";
import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import { Spinner } from "@/compartido/componentes/ui/spinner";
import { Textarea } from "@/compartido/componentes/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import { cn } from "@/compartido/utilidades/utils";

import { resolverIdentidad } from "../../identidad/servicios/identidad-api";
import { schemaResolverIdentidad } from "../../identidad/tipos/identidad.schemas";
import type { RespuestaResolverIdentidad } from "../../identidad/tipos/identidad.tipos";
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
  const formularioRef = React.useRef<HTMLFormElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [erroresCampo, setErroresCampo] = React.useState<
    Record<string, string>
  >({});
  // Dedup en alta: aviso si el documento ya es prospecto o cliente.
  const [avisoIdentidad, setAvisoIdentidad] =
    React.useState<RespuestaResolverIdentidad | null>(null);
  const [verificandoIdentidad, setVerificandoIdentidad] = React.useState(false);

  const registrarMutation = useRegistrarProspectoMutation();
  const actualizarMutation = useActualizarProspectoMutation();

  const esEdicion = modo === "editar";

  // Verifica contra resolver-identidad si el documento ya existe (prospecto/cliente),
  // para evitar registrar informacion repetida. Best-effort: si la consulta falla
  // no bloquea el alta — el 409 del backend sigue siendo la red de seguridad final.
  async function verificarIdentidad() {
    if (esEdicion) return;
    const root = formularioRef.current;
    if (!root) return;

    const parsed = schemaResolverIdentidad.safeParse({
      tipoDocumento: getValue(root, "tipoDocumento"),
      numeroDocumento: getValue(root, "numeroDocumento"),
    });
    if (!parsed.success) {
      setAvisoIdentidad(null);
      return;
    }

    setVerificandoIdentidad(true);
    try {
      const respuesta = await resolverIdentidad(
        parsed.data.tipoDocumento,
        parsed.data.numeroDocumento
      );
      // NUEVO no genera ruido; solo avisamos cuando ya existe.
      setAvisoIdentidad(respuesta.veredicto === "NUEVO" ? null : respuesta);
    } catch {
      setAvisoIdentidad(null);
    } finally {
      setVerificandoIdentidad(false);
    }
  }

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
      nombreComercial: getValue(root, "nombreComercial") || undefined,
      razonSocial: getValue(root, "razonSocial"),
      direccion: getValue(root, "direccion"),
      tipoDocumento: getValue(root, "tipoDocumento") as TipoDocumento,
      numeroDocumento: getValue(root, "numeroDocumento"),
      medioContactoInicial: getValue(root, "medioContactoInicial") as MedioContactoInicial,
      contactoInicial: {
        nombre: getValue(root, "contacto.nombre"),
        cargo: getValue(root, "contacto.cargo") || undefined,
        telefono: getValue(root, "contacto.telefono") || undefined,
        email: getValue(root, "contacto.email"),
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
      invalidarConsulta(CLAVE_PROSPECTOS);
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
      direccion: getValue(root, "direccion") || undefined,
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
      invalidarConsulta(CLAVE_PROSPECTOS);
      invalidarConsulta(CLAVE_PROSPECTO_DETALLE);
      invalidarConsulta(CLAVE_PROSPECTO_HISTORIAL);
      router.push(
        `/comercial/prospectos/${prospecto.id}?accion=actualizado`
      );
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
    <form
      ref={formularioRef}
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
    >
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>
            {esEdicion ? "Editar prospecto" : "Registrar prospecto"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pt-5 pb-0">
          {esEdicion ? (
            /* ----- Edicion: una sola columna, sin contacto inicial ----- */
            <>
              <SeccionTitulo
                titulo="Datos del prospecto"
                descripcion="Informacion comercial y de identificacion."
              />

              <div className="grid gap-4 md:grid-cols-2">
                <CampoTexto
                  label="Razon social"
                  name="razonSocial"
                  requerido
                  defaultValue={prospecto?.razonSocial}
                  error={erroresCampo["razonSocial"]}
                  disabled={isSaving}
                  onChange={() => limpiarErrorCampo("razonSocial")}
                />
                <CampoTexto
                  label="Nombre comercial"
                  name="nombreComercial"
                  defaultValue={prospecto?.nombreComercial ?? undefined}
                  error={erroresCampo["nombreComercial"]}
                  disabled={isSaving}
                  onChange={() => limpiarErrorCampo("nombreComercial")}
                />
              </div>

              <div className="mt-4">
                <CampoTexto
                  label="Direccion"
                  name="direccion"
                  requerido
                  defaultValue={prospecto?.direccion}
                  error={erroresCampo["direccion"]}
                  disabled={isSaving}
                  onChange={() => limpiarErrorCampo("direccion")}
                />
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <CampoSelect
                  label="Tipo de documento"
                  name="tipoDocumento"
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

              {/* Ejecutivo responsable: editable solo en edicion.
                  En alta el backend lo asigna automaticamente. */}
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
            </>
          ) : (
            /* ----- Nuevo: dos columnas (datos | contacto inicial) ----- */
            <div className="grid gap-y-8 lg:grid-cols-2">
              {/* Columna 1: datos del prospecto */}
              <div className="flex flex-col gap-4 lg:pr-10">
                <SeccionTitulo
                  titulo="Datos del prospecto"
                  descripcion="Informacion comercial y de identificacion."
                />
                <CampoTexto
                  label="Razon social"
                  name="razonSocial"
                  requerido
                  error={erroresCampo["razonSocial"]}
                  disabled={isSaving}
                  onChange={() => limpiarErrorCampo("razonSocial")}
                />
                <CampoTexto
                  label="Nombre comercial"
                  name="nombreComercial"
                  error={erroresCampo["nombreComercial"]}
                  disabled={isSaving}
                  onChange={() => limpiarErrorCampo("nombreComercial")}
                />
                <CampoTexto
                  label="Direccion"
                  name="direccion"
                  requerido
                  error={erroresCampo["direccion"]}
                  disabled={isSaving}
                  onChange={() => limpiarErrorCampo("direccion")}
                />
                <CampoSelect
                  label="Tipo de documento"
                  name="tipoDocumento"
                  requerido
                  opciones={[
                    { valor: "RUC", etiqueta: "RUC" },
                    { valor: "DNI", etiqueta: "DNI" },
                    { valor: "CE", etiqueta: "Carnet de extranjeria" },
                  ]}
                  defaultValue="RUC"
                  error={erroresCampo["tipoDocumento"]}
                  disabled={isSaving}
                />
                <CampoTexto
                  label="Numero de documento"
                  name="numeroDocumento"
                  requerido
                  error={erroresCampo["numeroDocumento"]}
                  disabled={isSaving}
                  onChange={() => limpiarErrorCampo("numeroDocumento")}
                  onBlur={() => void verificarIdentidad()}
                  adornoFin={
                    verificandoIdentidad ? (
                      <Spinner className="size-4 text-muted-foreground" />
                    ) : null
                  }
                />

                {avisoIdentidad?.veredicto === "PROSPECTO_EXISTENTE" &&
                avisoIdentidad.prospecto ? (
                  <Alert>
                    <AlertDescription className="flex flex-col gap-2">
                      <span>
                        Ya existe un prospecto con este documento
                        {avisoIdentidad.prospecto.razonSocial
                          ? `: ${avisoIdentidad.prospecto.razonSocial}`
                          : ""}
                        . Revisalo antes de registrar uno nuevo para no duplicar
                        informacion.
                      </span>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-fit"
                      >
                        <Link
                          href={`/comercial/prospectos/${avisoIdentidad.prospecto.prospectoId}`}
                        >
                          Ver prospecto existente
                        </Link>
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : null}

                {avisoIdentidad?.veredicto === "PROSPECTO_ELIMINADO" &&
                avisoIdentidad.prospecto ? (
                  // Informativo, no bloqueante (como los demás veredictos): el 409
                  // del backend sigue siendo la red de seguridad. Sin botón de acción
                  // — la restauración se hace desde el módulo de Prospectos.
                  <Alert>
                    <AlertDescription>
                      {avisoIdentidad.prospecto.razonSocial
                        ? `Se encontró el prospecto «${avisoIdentidad.prospecto.razonSocial}», pero está eliminado.`
                        : "Se encontró un prospecto con este documento, pero está eliminado."}{" "}
                      Para reutilizar este documento, restáuralo desde el módulo de
                      Prospectos.
                    </AlertDescription>
                  </Alert>
                ) : null}

                {avisoIdentidad?.veredicto === "CLIENTE" ||
                avisoIdentidad?.veredicto === "CLIENTE_INACTIVO" ? (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Este documento ya pertenece a un cliente registrado
                      {avisoIdentidad.cliente?.razonSocial
                        ? `: ${avisoIdentidad.cliente.razonSocial}`
                        : ""}
                      . No corresponde registrarlo como prospecto.
                    </AlertDescription>
                  </Alert>
                ) : null}

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
                  defaultValue="CORREO"
                  error={erroresCampo["medioContactoInicial"]}
                  disabled={isSaving}
                />
              </div>

              {/* Columna 2: contacto inicial */}
              <div className="flex flex-col gap-4 lg:border-l lg:border-border lg:pl-10">
                <SeccionTitulo
                  titulo="Contacto inicial"
                  descripcion="Persona de contacto con la que se inicio la relacion comercial. El email es obligatorio."
                />
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
                <CampoTexto
                  label="Telefono"
                  name="contacto.telefono"
                  type="tel"
                  error={erroresCampo["contacto.telefono"]}
                  disabled={isSaving}
                  onChange={() => limpiarErrorCampo("contacto.telefono")}
                />
                <CampoTexto
                  label="Email"
                  name="contacto.email"
                  type="email"
                  requerido
                  error={erroresCampo["contacto.email"]}
                  disabled={isSaving}
                  onChange={() => limpiarErrorCampo("contacto.email")}
                />
                <CampoTextarea
                  label="Observaciones"
                  name="contacto.observaciones"
                  disabled={isSaving}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="-mx-5 mt-5 flex items-center justify-end gap-2 border-t border-border bg-muted/40 px-5 py-4">
            <Button type="button" variant="outline" asChild disabled={isSaving}>
              <Link href={urlCancelar}>Cancelar</Link>
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Guardando..."
                : esEdicion
                  ? "Guardar cambios"
                  : "Registrar prospecto"}
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
  adornoFin,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
  requerido?: boolean;
  error?: string;
  // Contenido al final del input (ej. spinner de verificacion).
  adornoFin?: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>
        {label}
        {requerido ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <div className="relative">
        <Input
          id={name}
          name={name}
          aria-invalid={Boolean(error)}
          onChange={onChange}
          className={cn(adornoFin ? "pr-9" : undefined, className)}
          {...props}
        />
        {adornoFin ? (
          <div className="absolute inset-y-0 right-2.5 flex items-center">
            {adornoFin}
          </div>
        ) : null}
      </div>
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
      <Select name={name} defaultValue={defaultValue} disabled={disabled}>
        <SelectTrigger
          id={name}
          aria-invalid={Boolean(error)}
          className="w-full"
        >
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
      <Textarea
        id={name}
        name={name}
        rows={3}
        aria-invalid={Boolean(error)}
        className="min-h-24"
        {...props}
      />
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
