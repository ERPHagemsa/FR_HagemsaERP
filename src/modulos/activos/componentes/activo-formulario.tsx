"use client";

import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/compartido/componentes/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import { cn } from "@/compartido/utilidades";
import { actualizarActivo, crearActivo } from "../servicios/activos-api";
import type {
  Activo,
  EstadoActivo,
  EstadoCalibracion,
  EstadoOperativo,
  TipoActivo,
} from "../tipos/activo.tipos";

type Props = {
  activo?: Activo;
  modo?: "crear" | "editar";
};

export function ActivoFormulario({ activo, modo = "crear" }: Props) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isEdit = modo === "editar";

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const codigo = String(formData.get("codigo") ?? "").trim().toUpperCase();
    const numero = (name: string) => {
      const value = String(formData.get(name) ?? "").trim();
      return value ? Number(value) : null;
    };
    const texto = (name: string) =>
      String(formData.get(name) ?? "").trim().toUpperCase() || null;

    try {
      const payload = {
        tipoActivo: String(formData.get("tipoActivo")) as TipoActivo,
        descripcion: String(formData.get("descripcion") ?? "").trim(),
        ubicacion: String(formData.get("ubicacion") ?? "").trim(),
        estadoActivo: String(formData.get("estadoActivo")) as EstadoActivo,
        observacion:
          String(formData.get("observacion") ?? "").trim() || undefined,
        vehiculo: {
          plantillaInventario:
            String(formData.get("plantillaInventario") ?? "") || "EQUIPO_LIVIANO",
          tarjetaPropiedad: texto("tarjetaPropiedad"),
          tarjetaMercancias: texto("tarjetaMercancias"),
          soat: texto("soat"),
          revisionTecnica12Meses: texto("revisionTecnica12Meses"),
          revisionTecnica6Meses: texto("revisionTecnica6Meses"),
          resolucionDirectoral: texto("resolucionDirectoral"),
          resolucionGerencial: texto("resolucionGerencial"),
          iqbf: texto("iqbf"),
          certificadoMatpel: texto("certificadoMatpel"),
          certificadoBonificacion: texto("certificadoBonificacion"),
          certificadoOperatividad: texto("certificadoOperatividad"),
          placaRodaje: texto("placaRodaje"),
          anioFabricacion: numero("anioFabricacion"),
          color: texto("color"),
          marca: texto("marca"),
          modelo: texto("modelo"),
          carroceria: texto("carroceria"),
          ejes: numero("ejes"),
          categoria: texto("categoria"),
          serieChasis: texto("serieChasis"),
          serieMotor: texto("serieMotor"),
          radioComunicacion: texto("radioComunicacion"),
          autorradio: texto("autorradio"),
          llantasRepuesto: texto("llantasRepuesto"),
          camara: texto("camara"),
          tablet: texto("tablet"),
          dispositivosSeguridad: texto("dispositivosSeguridad"),
          estadoOperativo: String(
            formData.get("estadoOperativo") ?? "OPERATIVO"
          ) as EstadoOperativo,
          cajaHerramientas: texto("cajaHerramientas"),
          jaulaAntivuelco: texto("jaulaAntivuelco"),
          carriboy: texto("carriboy"),
          baranda: texto("baranda"),
          mamparon: texto("mamparon"),
          ancho: numero("ancho"),
          longitud: numero("longitud"),
          alto: numero("alto"),
          tipoSuspension: texto("tipoSuspension"),
          tipoTornamesa: texto("tipoTornamesa"),
          capacidadTanqueGalones: numero("capacidadTanqueGalones"),
          estadoCalibracion: String(
            formData.get("estadoCalibracion") ?? "PENDIENTE"
          ) as EstadoCalibracion,
          factorCorreccion: numero("factorCorreccion"),
        },
      };

      const saved = isEdit
        ? await actualizarActivo(activo!.id, payload)
        : await crearActivo({
            codigo,
            ...payload,
          });

      router.push(`/activos/${saved.codigo}?${isEdit ? "updated" : "created"}=1`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el activo");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader className="border-b border-border">
          <CardTitle>
            {isEdit ? "Modificar activo" : "Registrar activo"}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="divide-y divide-border">
            <AccordionSection
              title="Datos base"
              description="Identificacion administrativa del activo."
              defaultOpen
            >
                <div className="grid gap-4 lg:grid-cols-[220px_1fr_220px]">
                  <Field
                    name="codigo"
                    label="Codigo"
                    placeholder="ACT-000864"
                    defaultValue={activo?.codigo}
                    disabled={isEdit}
                    required
                  />
                  <Field
                    name="descripcion"
                    label="Descripcion"
                    placeholder="Camioneta Toyota Hilux"
                    defaultValue={activo?.descripcion}
                    required
                  />
                  <SelectField
                    name="estadoActivo"
                    label="Estado activo"
                    defaultValue={activo?.estadoActivo ?? "ACTIVO"}
                    values={["ACTIVO", "INACTIVO", "SINIESTRADO"]}
                    required
                  />
                </div>
                <div className="grid gap-4 pt-4 md:grid-cols-2">
                  <SelectField
                    name="tipoActivo"
                    label="Tipo de activo"
                    defaultValue={activo?.tipoActivo ?? "VEHICULO"}
                    values={["VEHICULO", "EQUIPO", "HERRAMIENTA", "DISPOSITIVO", "OTRO"]}
                    required
                  />
                  <Field
                    name="ubicacion"
                    label="Ubicacion"
                    placeholder="Arequipa - Base principal"
                    defaultValue={activo?.ubicacion}
                    required
                  />
                </div>
            </AccordionSection>

            <AccordionSection
              title="Datos vehiculares"
              description="Placa, marca, modelo y datos propios de la unidad."
              defaultOpen
            >
                <div className="grid gap-4 lg:grid-cols-[260px_180px_1fr_1fr]">
                  <SelectField
                    name="plantillaInventario"
                    label="Plantilla"
                    defaultValue={activo?.vehiculo?.plantillaInventario ?? "EQUIPO_LIVIANO"}
                    values={["CAMION", "REMOLCADOR", "SEMIREMOLQUE", "EQUIPO_LIVIANO"]}
                    required
                  />
                  <Field name="placaRodaje" label="Placa" placeholder="BTZ-750" defaultValue={activo?.vehiculo?.placaRodaje ?? undefined} />
                  <Field name="marca" label="Marca" placeholder="TOYOTA" defaultValue={activo?.vehiculo?.marca ?? undefined} />
                  <Field name="modelo" label="Modelo" placeholder="HILUX" defaultValue={activo?.vehiculo?.modelo ?? undefined} />
                </div>
                <div className="grid gap-4 pt-4 md:grid-cols-2 lg:grid-cols-5">
                  <Field name="anioFabricacion" label="Ano fabricacion" type="number" defaultValue={activo?.vehiculo?.anioFabricacion ?? undefined} />
                  <Field name="color" label="Color" defaultValue={activo?.vehiculo?.color ?? undefined} />
                  <Field name="carroceria" label="Carroceria" defaultValue={activo?.vehiculo?.carroceria ?? undefined} />
                  <Field name="ejes" label="Ejes" type="number" defaultValue={activo?.vehiculo?.ejes ?? undefined} />
                  <Field name="categoria" label="Categoria" defaultValue={activo?.vehiculo?.categoria ?? undefined} />
                </div>
                <div className="grid gap-4 pt-4 md:grid-cols-2">
                  <Field name="serieChasis" label="Serie de chasis" defaultValue={activo?.vehiculo?.serieChasis ?? undefined} />
                  <Field name="serieMotor" label="Serie y marca de motor" defaultValue={activo?.vehiculo?.serieMotor ?? undefined} />
                </div>
            </AccordionSection>

            <AccordionSection
              title="Documentacion de unidad"
              description="Datos documentarios migrados o registrados para la unidad."
            >
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Field name="tarjetaPropiedad" label="Tarjeta de propiedad" defaultValue={activo?.vehiculo?.tarjetaPropiedad ?? undefined} />
                  <Field name="tarjetaMercancias" label="Tarjeta de mercancias" defaultValue={activo?.vehiculo?.tarjetaMercancias ?? undefined} />
                  <Field name="soat" label="SOAT" defaultValue={activo?.vehiculo?.soat ?? undefined} />
                  <Field name="revisionTecnica12Meses" label="Revision tecnica 12 meses" defaultValue={activo?.vehiculo?.revisionTecnica12Meses ?? undefined} />
                  <Field name="revisionTecnica6Meses" label="Revision tecnica 6 meses" defaultValue={activo?.vehiculo?.revisionTecnica6Meses ?? undefined} />
                  <Field name="resolucionDirectoral" label="Resolucion Directoral" defaultValue={activo?.vehiculo?.resolucionDirectoral ?? undefined} />
                  <Field name="resolucionGerencial" label="Resolucion Gerencial" defaultValue={activo?.vehiculo?.resolucionGerencial ?? undefined} />
                  <Field name="iqbf" label="IQBF" defaultValue={activo?.vehiculo?.iqbf ?? undefined} />
                  <Field name="certificadoMatpel" label="Certificado Matpel" defaultValue={activo?.vehiculo?.certificadoMatpel ?? undefined} />
                  <Field name="certificadoBonificacion" label="Certificado bonificacion" defaultValue={activo?.vehiculo?.certificadoBonificacion ?? undefined} />
                  <Field name="certificadoOperatividad" label="Certificado operatividad" defaultValue={activo?.vehiculo?.certificadoOperatividad ?? undefined} />
                </div>
            </AccordionSection>

            <AccordionSection
              title="Equipamiento e implementacion"
              description="Accesorios, implementos y elementos instalados."
            >
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Field name="radioComunicacion" label="Radio de comunicacion" defaultValue={activo?.vehiculo?.radioComunicacion ?? undefined} />
                  <Field name="autorradio" label="Autorradio" defaultValue={activo?.vehiculo?.autorradio ?? undefined} />
                  <Field name="llantasRepuesto" label="Llantas de repuesto" defaultValue={activo?.vehiculo?.llantasRepuesto ?? undefined} />
                  <Field name="camara" label="Camara" defaultValue={activo?.vehiculo?.camara ?? undefined} />
                  <Field name="tablet" label="Tablet" defaultValue={activo?.vehiculo?.tablet ?? undefined} />
                  <Field name="dispositivosSeguridad" label="Dispositivos de seguridad" defaultValue={activo?.vehiculo?.dispositivosSeguridad ?? undefined} />
                  <Field name="cajaHerramientas" label="Caja de herramientas" defaultValue={activo?.vehiculo?.cajaHerramientas ?? undefined} />
                  <Field name="jaulaAntivuelco" label="Jaula antivuelco" defaultValue={activo?.vehiculo?.jaulaAntivuelco ?? undefined} />
                  <Field name="carriboy" label="Carriboy" defaultValue={activo?.vehiculo?.carriboy ?? undefined} />
                  <Field name="baranda" label="Baranda" defaultValue={activo?.vehiculo?.baranda ?? undefined} />
                  <Field name="mamparon" label="Mamparon" defaultValue={activo?.vehiculo?.mamparon ?? undefined} />
                </div>
            </AccordionSection>

            <AccordionSection
              title="Dimensiones y configuracion"
              description="Medidas, suspension, tornamesa y capacidad de tanque."
            >
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Field name="ancho" label="Ancho" type="number" step="0.001" defaultValue={activo?.vehiculo?.ancho ?? undefined} />
                  <Field name="longitud" label="Longitud" type="number" step="0.001" defaultValue={activo?.vehiculo?.longitud ?? undefined} />
                  <Field name="alto" label="Alto" type="number" step="0.001" defaultValue={activo?.vehiculo?.alto ?? undefined} />
                  <Field name="tipoSuspension" label="Tipo de suspension" defaultValue={activo?.vehiculo?.tipoSuspension ?? undefined} />
                  <Field name="tipoTornamesa" label="Tipo de tornamesa" defaultValue={activo?.vehiculo?.tipoTornamesa ?? undefined} />
                  <Field name="capacidadTanqueGalones" label="Capacidad tanque galones" type="number" step="0.01" defaultValue={activo?.vehiculo?.capacidadTanqueGalones ?? undefined} />
                </div>
            </AccordionSection>

            <AccordionSection
              title="Control operativo"
              description="Estado operativo, calibracion y observaciones."
            >
                <div className="grid gap-4 md:grid-cols-3">
                  <SelectField name="estadoOperativo" label="Estado operativo" defaultValue={activo?.vehiculo?.estadoOperativo ?? "OPERATIVO"} values={["OPERATIVO", "MANTENIMIENTO", "NO_OPERATIVO"]} />
                  <SelectField name="estadoCalibracion" label="Estado calibracion" defaultValue={activo?.vehiculo?.estadoCalibracion ?? "PENDIENTE"} values={["CALIBRADA", "NO_CALIBRADA", "PENDIENTE", "OBSERVADA"]} />
                  <Field name="factorCorreccion" label="Factor correccion" type="number" step="0.01" defaultValue={activo?.vehiculo?.factorCorreccion ?? undefined} />
                </div>
                <div className="pt-4">
                  <Field name="observacion" label="Observacion" defaultValue={activo?.observacion ?? undefined} />
                </div>
            </AccordionSection>
          </div>

          {error ? (
            <div className="mx-5 mb-4 rounded-lg border border-destructive/40 bg-destructive/15 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2 border-t border-border bg-muted/40 px-5 py-4">
            <Button type="button" variant="outline" onClick={() => router.push("/activos")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving
                ? "Guardando..."
                : isEdit
                  ? "Actualizar activo"
                  : "Guardar activo"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

function AccordionSection({
  title,
  description,
  defaultOpen = false,
  children,
}: {
  title: string;
  description?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <section>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-4 bg-muted/25 px-5 py-4 text-left transition-colors hover:bg-muted/45"
      >
        <span>
          <span className="block text-sm font-semibold text-foreground">
            {title}
          </span>
          {description ? (
            <span className="mt-1 block text-xs text-muted-foreground">
              {description}
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        >
          v
        </span>
      </button>
      {open ? <div className="px-5 py-5">{children}</div> : null}
    </section>
  );
}

function Field({
  label,
  name,
  required,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  name: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <Input id={name} name={name} required={required} {...props} />
    </div>
  );
}

function SelectField({
  label,
  name,
  values,
  defaultValue,
  required = false,
}: {
  label: string;
  name: string;
  values: string[];
  defaultValue: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className={cn(
          "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        )}
      >
        {values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}
