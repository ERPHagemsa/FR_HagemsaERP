// Componentes presentacionales reutilizables del formulario de activos
// (campos y selectores sin estado de negocio), extraidos de
// activo-formulario.tsx para reducir su tamano.

import * as React from "react";
import type { Icon } from "@tabler/icons-react";

import { Button } from "@/compartido/componentes/ui/button";
import { Input } from "@/compartido/componentes/ui/input";
import { Label } from "@/compartido/componentes/ui/label";
import { cn } from "@/compartido/utilidades";
import type { OpcionCatalogo } from "../ganchos/use-catalogos-activos";
import type { TipoTanqueActivo } from "../tipos/activo.tipos";

export function SectionIntro({
  icon: IconComponent,
  title,
  description,
}: {
  icon: Icon;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-5 flex items-start gap-3 border-b border-border pb-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
        <IconComponent className="size-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export function PendingList({
  empty,
  items,
  onRemove,
}: {
  empty: string;
  items: { id: string; title: string; detail: string }[];
  onRemove: (index: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {items.length ? (
        <div className="divide-y divide-border">
          {items.map((item, index) => (
            <div
              className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between"
              key={item.id}
            >
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.detail}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => onRemove(index)}
              >
                Quitar
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-sm text-muted-foreground">
          {empty}
        </div>
      )}
    </div>
  );
}

export function Field({
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

export function TipoTanqueSelector({
  tipoTanque,
  onChange,
}: {
  tipoTanque: TipoTanqueActivo;
  onChange: (tipo: TipoTanqueActivo) => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>
        Tipo tanque <span className="text-destructive">*</span>
      </Label>
      <input name="tipoTanque" type="hidden" value={tipoTanque} readOnly />
      <div className="grid h-9 grid-cols-2 rounded-lg border border-input bg-background p-0.5">
        {(["DIESEL", "UREA"] as TipoTanqueActivo[]).map((tipo) => (
          <button
            key={tipo}
            type="button"
            onClick={() => onChange(tipo)}
            className={cn(
              "rounded-md px-3 text-sm font-medium text-muted-foreground transition",
              tipoTanque === tipo && "bg-primary text-primary-foreground"
            )}
          >
            {tipo === "DIESEL" ? "Diesel" : "Urea"}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EstadoActivoSelector({
  estado,
  onChange,
}: {
  estado: "ACTIVO" | "BAJA";
  onChange: (estado: "ACTIVO" | "BAJA") => void;
}) {
  return (
    <div className="grid gap-2">
      <Label>
        Estado activo <span className="text-destructive">*</span>
      </Label>
      <div className="grid h-9 grid-cols-2 rounded-lg border border-input bg-background p-0.5">
        {[
          { value: "ACTIVO", label: "Activo" },
          { value: "BAJA", label: "Baja" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value as "ACTIVO" | "BAJA")}
            className={cn(
              "rounded-md px-3 text-sm font-medium text-muted-foreground transition",
              estado === option.value && "bg-primary text-primary-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function UnidadTanqueDisplay({
  tipoTanque,
}: {
  tipoTanque: TipoTanqueActivo;
}) {
  const unidad = tipoTanque === "UREA" ? "Litros" : "Galones";

  return (
    <div className="grid gap-2">
      <Label>Unidad</Label>
      <div
        key={unidad}
        className="flex h-9 items-center rounded-lg border border-input bg-muted/40 px-3 text-sm font-medium text-foreground"
      >
        {unidad}
      </div>
    </div>
  );
}

export function TextAreaField({
  label,
  name,
  required,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </Label>
      <textarea
        id={name}
        name={name}
        required={required}
        rows={3}
        className="min-h-24 w-full resize-y rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        {...props}
      />
    </div>
  );
}

export function SelectField({
  label,
  name,
  values,
  opciones,
  defaultValue,
  labels,
  onChange,
  required = false,
}: {
  label: string;
  name: string;
  values?: string[];
  opciones?: OpcionCatalogo[];
  defaultValue: string;
  labels?: Record<string, string>;
  onChange?: (value: string) => void;
  required?: boolean;
}) {
  const items = opciones
    ? opciones.map((opcion) => ({ value: String(opcion.id), texto: opcion.nombre }))
    : (values ?? []).map((value) => ({ value, texto: labels?.[value] ?? value }));

  // Si `opciones` viene de un catalogo que carga async, el <select> puede montarse
  // antes de que existan las <option> reales y queda pegado en la primera opcion
  // disponible. `defaultValue` solo se aplica en el montaje, asi que una vez listo
  // el catalogo forzamos un remount (via `key`) para que vuelva a matchear el valor real.
  const catalogoListo = !opciones || opciones.length > 0;

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-foreground">
        {label}
        {required ? <span className="ml-1 text-destructive">*</span> : null}
      </span>
      <select
        key={catalogoListo ? `${name}-listo` : `${name}-cargando`}
        name={name}
        defaultValue={defaultValue}
        required={required}
        onChange={(event) => onChange?.(event.target.value)}
        className={cn(
          "h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        )}
      >
        {!required && opciones ? <option value="">Seleccionar...</option> : null}
        {items.map(({ value, texto }) => (
          <option key={value} value={value}>
            {texto}
          </option>
        ))}
      </select>
    </label>
  );
}
