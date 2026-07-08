"use client";

import * as React from "react";
import { toast } from "sonner";

import {
  esError409,
  esError404,
  esErrorValidacion,
  extraerMensajeError,
  obtenerErroresPorCampo,
  useConsulta,
} from "@/compartido/api";
import { CalendarDays, Pencil } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import { Calendar } from "@/compartido/componentes/ui/calendar";
import { FieldLegend, FieldSet } from "@/compartido/componentes/ui/field";
import { Label } from "@/compartido/componentes/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/compartido/componentes/ui/popover";
import { Textarea } from "@/compartido/componentes/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/compartido/componentes/ui/select";
import { cn } from "@/compartido/utilidades/utils";

import { consultarProspecto } from "../../prospectos/servicios/prospectos-api";
import { useRegistrarSCMutation } from "../servicios/solicitudes-cliente-queries";
import { BuscarOrigenPanel } from "./buscar-origen-panel";
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

const REGEX_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function esUuid(valor: string): boolean {
  return REGEX_UUID.test(valor.trim());
}

// Formatea a YYYY-MM-DD desde las partes locales (evita el corrimiento de dia
// que produce toISOString al convertir a UTC).
function aISODate(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// ---------------------------------------------------------------------------
// Tipos del contexto compartido del formulario
// (NO incluye el formularioRef para no contaminar la prop de render)
// ---------------------------------------------------------------------------

export interface ContextoCamposNuevaSolicitud {
  isSaving: boolean;
  erroresCampo: Record<string, string>;
  origenIdValue: string;
  origenTipoValue: OrigenTipo;
  origenNombreValue: string;
  tipoDocumentoValue: string;
  numeroDocumentoValue: string;
  contactoOrigenIdValue: string;
  fechaRequeridaValue: Date | undefined;
  cargandoContactos: boolean;
  errorContactos: unknown;
  contactos: Array<{ id: string; nombre: string; esPrincipal: boolean; cargo?: string | null }>;
  setContactoElegido: (id: string) => void;
  setFechaRequeridaValue: (fecha: Date | undefined) => void;
  limpiarErrorCampo: (name: string) => void;
  limpiarOrigen: () => void;
  onIdentidadResuelta: (identidad: {
    origenTipo: OrigenTipo;
    origenId: string;
    nombre?: string;
    tipoDocumento?: string;
    numeroDocumento?: string;
  }) => void;
  onSubmit: () => void;
}

// ---------------------------------------------------------------------------
// Hook: encapsula toda la logica del formulario de nueva SC
// ---------------------------------------------------------------------------

export interface UseFormularioNuevaSolicitudOpciones {
  /** Callback que se llama con el id de la SC creada. El caller decide que hacer (navegar, cerrar panel, etc.). */
  onExito: (id: string) => void;
}

export interface RetornoFormularioNuevaSolicitud {
  /** Ref del <form> — cada consumidor la adjunta a su propia etiqueta <form ref={formularioRef}>. */
  formularioRef: React.RefObject<HTMLFormElement | null>;
  /** Contexto de campos (sin ref) — pasalo directamente a CamposNuevaSolicitud. */
  campos: ContextoCamposNuevaSolicitud;
}

export function useFormularioNuevaSolicitud({
  onExito,
}: UseFormularioNuevaSolicitudOpciones): RetornoFormularioNuevaSolicitud {
  const formularioRef = React.useRef<HTMLFormElement>(null);
  const [isSaving, setIsSaving] = React.useState(false);
  const [erroresCampo, setErroresCampo] = React.useState<Record<string, string>>({});
  const [origenIdValue, setOrigenIdValue] = React.useState("");
  const [origenTipoValue, setOrigenTipoValue] = React.useState<OrigenTipo>("PROSPECTO");
  const [origenNombreValue, setOrigenNombreValue] = React.useState("");
  const [tipoDocumentoValue, setTipoDocumentoValue] = React.useState("");
  const [numeroDocumentoValue, setNumeroDocumentoValue] = React.useState("");
  const [contactoElegido, setContactoElegido] = React.useState<string | null>(null);
  const [fechaRequeridaValue, setFechaRequeridaValue] = React.useState<Date | undefined>(undefined);

  const registrarMutation = useRegistrarSCMutation();

  const origenEsProspectoValido =
    origenTipoValue === "PROSPECTO" && esUuid(origenIdValue);

  const {
    data: prospecto,
    isLoading: cargandoContactos,
    error: errorContactos,
  } = useConsulta(
    () => consultarProspecto(origenIdValue.trim()),
    [origenIdValue],
    { enabled: origenEsProspectoValido }
  );

  const contactos = origenEsProspectoValido ? prospecto?.contactos ?? [] : [];
  const contactoPorDefecto =
    contactos.find((c) => c.esPrincipal)?.id ??
    (contactos.length === 1 ? contactos[0].id : "");
  const contactoOrigenIdValue = contactoElegido ?? contactoPorDefecto;

  function limpiarErrorCampo(name: string) {
    setErroresCampo((prev) => {
      if (!prev[name]) return prev;
      const siguiente = { ...prev };
      delete siguiente[name];
      return siguiente;
    });
  }

  function limpiarOrigen() {
    setOrigenIdValue("");
    setOrigenTipoValue("PROSPECTO");
    setOrigenNombreValue("");
    setContactoElegido(null);
    setTipoDocumentoValue("");
    setNumeroDocumentoValue("");
    setErroresCampo((prev) => {
      const siguiente = { ...prev };
      delete siguiente["origenId"];
      delete siguiente["contactoOrigenId"];
      return siguiente;
    });
  }

  function onIdentidadResuelta({
    origenTipo,
    origenId,
    nombre,
    tipoDocumento,
    numeroDocumento,
  }: {
    origenTipo: OrigenTipo;
    origenId: string;
    nombre?: string;
    tipoDocumento?: string;
    numeroDocumento?: string;
  }) {
    setOrigenTipoValue(origenTipo);
    setOrigenIdValue(origenId);
    setOrigenNombreValue(nombre ?? "");
    setContactoElegido(null);
    if (tipoDocumento) setTipoDocumentoValue(tipoDocumento);
    if (numeroDocumento) setNumeroDocumentoValue(numeroDocumento);
    limpiarErrorCampo("origenId");
    limpiarErrorCampo("contactoOrigenId");
  }

  function aplicarErrorApi(err: unknown) {
    if (esError409(err)) {
      if (origenTipoValue === "PROSPECTO") {
        setErroresCampo((prev) => ({
          ...prev,
          contactoOrigenId: "El contacto seleccionado no pertenece al origen indicado.",
        }));
        toast.error("El contacto seleccionado no pertenece al origen indicado.");
      } else {
        toast.error("El cliente indicado esta inactivo y no puede usarse como origen.");
      }
      return;
    }
    if (esError404(err)) {
      toast.error("El prospecto o cliente indicado no existe.");
      return;
    }
    if (esErrorValidacion(err)) {
      toast.error(extraerMensajeError(err, "No se pudo registrar la solicitud"));
      return;
    }
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

  async function onSubmitAsync() {
    const root = formularioRef.current;
    if (!root) return;

    setErroresCampo({});
    setIsSaving(true);

    try {
      const canalEntrada = getValue(root, "canalEntrada") as CanalEntrada;
      const descripcionServicio = getValue(root, "descripcionServicio");
      const fechaRequerida = fechaRequeridaValue
        ? aISODate(fechaRequeridaValue)
        : undefined;
      const observaciones = getValue(root, "observaciones") || undefined;

      const datos =
        origenTipoValue === "PROSPECTO"
          ? {
              origenTipo: "PROSPECTO" as const,
              origenId: origenIdValue,
              contactoOrigenId: contactoOrigenIdValue,
              canalEntrada,
              descripcionServicio,
              fechaRequerida,
              observaciones,
            }
          : {
              origenTipo: "CLIENTE" as const,
              origenId: origenIdValue,
              tipoDocumento: tipoDocumentoValue as "RUC" | "DNI" | "CE",
              numeroDocumento: numeroDocumentoValue,
              canalEntrada,
              descripcionServicio,
              fechaRequerida,
              observaciones,
            };

      const resultado = schemaRegistrarSC.safeParse(datos);
      if (!resultado.success) {
        setErroresCampo(issuesAErroresCampo(resultado.error));
        setIsSaving(false);
        return;
      }

      try {
        const respuesta = await registrarMutation.mutateAsync(resultado.data);
        onExito(respuesta.id);
      } catch (err) {
        aplicarErrorApi(err);
      }
    } catch (err) {
      toast.error(extraerMensajeError(err, "No se pudo registrar la solicitud"));
    } finally {
      setIsSaving(false);
    }
  }

  function onSubmit() {
    void onSubmitAsync();
  }

  const campos: ContextoCamposNuevaSolicitud = {
    isSaving,
    erroresCampo,
    origenIdValue,
    origenTipoValue,
    origenNombreValue,
    tipoDocumentoValue,
    numeroDocumentoValue,
    contactoOrigenIdValue,
    fechaRequeridaValue,
    cargandoContactos,
    errorContactos,
    contactos,
    setContactoElegido: (id: string) => setContactoElegido(id),
    setFechaRequeridaValue,
    limpiarErrorCampo,
    limpiarOrigen,
    onIdentidadResuelta,
    onSubmit,
  };

  return { formularioRef, campos };
}

// ---------------------------------------------------------------------------
// CamposNuevaSolicitud — presentacional, reutilizable en pagina y Sheet
// ---------------------------------------------------------------------------

export function CamposNuevaSolicitud({
  campos,
}: {
  campos: ContextoCamposNuevaSolicitud;
}) {
  const {
    isSaving,
    erroresCampo,
    origenIdValue,
    origenTipoValue,
    origenNombreValue,
    tipoDocumentoValue,
    numeroDocumentoValue,
    contactoOrigenIdValue,
    fechaRequeridaValue,
    cargandoContactos,
    errorContactos,
    contactos,
    setContactoElegido,
    setFechaRequeridaValue,
    limpiarErrorCampo,
    limpiarOrigen,
    onIdentidadResuelta,
  } = campos;

  return (
    <div className="flex flex-col gap-4">
      {/* Seccion: datos del origen */}
      <SeccionTitulo
        titulo="Datos del origen"
        descripcion="Prospecto o cliente que origina la solicitud."
      />

      {origenIdValue ? (
        <OrigenSeleccionado
          origenTipoValue={origenTipoValue}
          origenNombreValue={origenNombreValue}
          tipoDocumentoValue={tipoDocumentoValue}
          numeroDocumentoValue={numeroDocumentoValue}
          contactoOrigenIdValue={contactoOrigenIdValue}
          cargandoContactos={cargandoContactos}
          errorContactos={errorContactos}
          contactos={contactos}
          erroresCampo={erroresCampo}
          isSaving={isSaving}
          setContactoElegido={setContactoElegido}
          limpiarErrorCampo={limpiarErrorCampo}
          limpiarOrigen={limpiarOrigen}
        />
      ) : (
        <>
          <BuscarOrigenPanel onIdentidadResuelta={onIdentidadResuelta} />
          {erroresCampo["origenId"] ? (
            <p className="text-xs text-destructive">
              Selecciona un origen válido (prospecto o cliente).
            </p>
          ) : null}
        </>
      )}

      <CampoSelect
        label="Canal de entrada"
        name="canalEntrada"
        requerido
        opciones={[
          { valor: "CORREO", etiqueta: "Correo electronico" },
          { valor: "LLAMADA", etiqueta: "Llamada telefonica" },
          { valor: "PRESENCIAL", etiqueta: "Visita presencial" },
          { valor: "OTRO", etiqueta: "Otro" },
        ]}
        defaultValue="CORREO"
        error={erroresCampo["canalEntrada"]}
        disabled={isSaving}
      />

      {/* Seccion: descripcion del servicio */}
      <SeccionTitulo
        titulo="Servicio solicitado"
        descripcion="Detalle del servicio requerido por el cliente."
      />
      <CampoTextarea
        label="Descripcion"
        name="descripcionServicio"
        requerido
        placeholder="Describe el servicio requerido..."
        error={erroresCampo["descripcionServicio"]}
        disabled={isSaving}
        onChange={() => limpiarErrorCampo("descripcionServicio")}
      />
      <CampoFecha
        label="Fecha requerida del servicio"
        value={fechaRequeridaValue}
        onSelect={(fecha) => {
          setFechaRequeridaValue(fecha);
          limpiarErrorCampo("fechaRequerida");
        }}
        error={erroresCampo["fechaRequerida"]}
        disabled={isSaving}
      />
      <CampoTextarea
        label="Observaciones"
        name="observaciones"
        placeholder="Observaciones adicionales..."
        error={erroresCampo["observaciones"]}
        disabled={isSaving}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-componentes de formulario
// ---------------------------------------------------------------------------

function OrigenSeleccionado({
  origenTipoValue,
  origenNombreValue,
  tipoDocumentoValue,
  numeroDocumentoValue,
  contactoOrigenIdValue,
  cargandoContactos,
  errorContactos,
  contactos,
  erroresCampo,
  isSaving,
  setContactoElegido,
  limpiarErrorCampo,
  limpiarOrigen,
}: {
  origenTipoValue: OrigenTipo;
  origenNombreValue: string;
  tipoDocumentoValue: string;
  numeroDocumentoValue: string;
  contactoOrigenIdValue: string;
  cargandoContactos: boolean;
  errorContactos: unknown;
  contactos: Array<{ id: string; nombre: string; esPrincipal: boolean; cargo?: string | null }>;
  erroresCampo: Record<string, string>;
  isSaving: boolean;
  setContactoElegido: (id: string) => void;
  limpiarErrorCampo: (name: string) => void;
  limpiarOrigen: () => void;
}) {
  const leyenda =
    origenTipoValue === "PROSPECTO" ? "Prospecto seleccionado" : "Cliente seleccionado";

  return (
    <FieldSet className="gap-3 rounded-lg border border-border px-4 pb-4 pt-1">
      <FieldLegend
        variant="label"
        className="px-1.5 font-semibold uppercase tracking-wide text-muted-foreground data-[variant=label]:text-xs"
      >
        {leyenda}
      </FieldLegend>

      {/* Header: nombre + boton Cambiar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">Razon social</p>
          <p className="text-sm font-medium text-foreground">
            {origenNombreValue ? origenNombreValue : (
              <span className="text-muted-foreground">Sin razon social registrada</span>
            )}
          </p>
          {tipoDocumentoValue && numeroDocumentoValue ? (
            <div className="mt-1 flex flex-col gap-0.5">
              <p className="text-xs font-medium text-muted-foreground">Documento</p>
              <p className="text-sm text-foreground">
                {tipoDocumentoValue} {numeroDocumentoValue}
              </p>
            </div>
          ) : null}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={limpiarOrigen}
          className="shrink-0"
        >
          <Pencil className="size-3.5" />
          Cambiar
        </Button>
      </div>

      {/* Select de contacto — solo para PROSPECTO */}
      {origenTipoValue === "PROSPECTO" ? (
        <div className="grid gap-2">
          <Label htmlFor="contactoOrigenId">
            Contacto del prospecto
            <span className="ml-1 text-destructive">*</span>
          </Label>
          <Select
            value={contactoOrigenIdValue || undefined}
            onValueChange={(v) => {
              setContactoElegido(v);
              limpiarErrorCampo("contactoOrigenId");
            }}
            disabled={isSaving || cargandoContactos || contactos.length === 0}
          >
            <SelectTrigger
              id="contactoOrigenId"
              aria-invalid={Boolean(erroresCampo["contactoOrigenId"])}
              className="w-full"
            >
              <SelectValue
                placeholder={
                  cargandoContactos
                    ? "Cargando contactos..."
                    : contactos.length === 0
                      ? "El prospecto no tiene contactos activos"
                      : "Selecciona un contacto"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {contactos.map((contacto) => (
                <SelectItem key={contacto.id} value={contacto.id}>
                  {contacto.nombre}
                  {contacto.esPrincipal ? " (principal)" : ""}
                  {contacto.cargo ? ` — ${contacto.cargo}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errorContactos ? (
            <p className="text-xs text-destructive">
              No se pudieron cargar los contactos del prospecto.
            </p>
          ) : null}
          {erroresCampo["contactoOrigenId"] ? (
            <p className="text-xs text-destructive">
              {erroresCampo["contactoOrigenId"]}
            </p>
          ) : null}
        </div>
      ) : null}
    </FieldSet>
  );
}

function SeccionTitulo({
  titulo,
  descripcion,
}: {
  titulo: string;
  descripcion?: string;
}) {
  return (
    <div className="border-b border-border pb-4">
      <p className="text-sm font-semibold text-foreground">{titulo}</p>
      {descripcion ? (
        <p className="mt-1 text-xs text-muted-foreground">{descripcion}</p>
      ) : null}
    </div>
  );
}

function CampoFecha({
  label,
  requerido = false,
  value,
  onSelect,
  error,
  disabled,
}: {
  label: string;
  requerido?: boolean;
  value?: Date;
  onSelect: (fecha: Date | undefined) => void;
  error?: string;
  disabled?: boolean;
}) {
  const [abierto, setAbierto] = React.useState(false);

  return (
    <div className="grid gap-2">
      <Label>
        {label}
        {requerido ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <Popover open={abierto} onOpenChange={setAbierto}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={Boolean(error)}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <CalendarDays className="size-4" />
            {value
              ? value.toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })
              : "Selecciona una fecha"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(fecha) => {
              onSelect(fecha);
              setAbierto(false);
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
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
