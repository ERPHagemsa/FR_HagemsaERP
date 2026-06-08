"use client";

// Boton de accion compacto, solo-icono, con tooltip integrado y tono semantico.
// Pensado para columnas de "Acciones" en tablas (editar, eliminar, ver, etc.)
// y reutilizable en todos los modulos del ERP para mantener un lenguaje visual
// consistente entre equipos.
//
// Uso basico:
//   import { Pencil } from "lucide-react";
//   <BotonIconoAccion icono={Pencil} etiqueta="Editar" onClick={...} />
//
// Como disparador de un dialogo (AlertDialog / Dialog), via asChild del trigger:
//   <AlertDialogTrigger asChild>
//     <BotonIconoAccion icono={Trash2} etiqueta="Eliminar" tono="destructivo" />
//   </AlertDialogTrigger>
//
// Iconos: SIEMPRE lucide-react (ver CLAUDE.md). El tamano del glifo lo controla
// este componente, no el icono que se pasa.

import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/compartido/componentes/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/compartido/componentes/ui/tooltip";
import { cn } from "@/compartido/utilidades/utils";

// Tono semantico de la accion. Define color de fondo e icono (no el borde).
export type TonoAccion = "neutral" | "destructivo" | "advertencia";

type TamanoIcono = "icon-xs" | "icon-sm" | "icon" | "icon-lg";

type Props = {
  /** Icono lucide-react (el componente, no el elemento). */
  icono: LucideIcon;
  /** Texto del tooltip; tambien se usa como aria-label para accesibilidad. */
  etiqueta: string;
  /** Color semantico de la accion. Por defecto "neutral". */
  tono?: TonoAccion;
  /** Tamano del boton. Por defecto "icon-sm". */
  tamano?: TamanoIcono;
} & Omit<
  React.ComponentProps<typeof Button>,
  "size" | "variant" | "children" | "aria-label"
>;

// Fondo tinteado + color de icono por tono. El fondo es el acento; el borde no.
const clasesPorTono: Record<TonoAccion, string> = {
  neutral:
    "bg-muted/60 text-foreground hover:bg-muted hover:text-foreground",
  destructivo:
    "bg-destructive/10 text-destructive hover:bg-destructive/20 hover:text-destructive",
  advertencia:
    "bg-amber-400/10 text-amber-500 hover:bg-amber-400/20 hover:text-amber-500 dark:text-amber-400",
};

export const BotonIconoAccion = React.forwardRef<
  HTMLButtonElement,
  Props
>(function BotonIconoAccion(
  { icono: Icono, etiqueta, tono = "neutral", tamano = "icon-sm", className, disabled, ...props },
  ref
) {
  const boton = (
    <Button
      ref={ref}
      type="button"
      variant="ghost"
      size={tamano}
      aria-label={etiqueta}
      disabled={disabled}
      className={cn(clasesPorTono[tono], className)}
      {...props}
    >
      <Icono className="size-4" />
    </Button>
  );

  return (
    <Tooltip>
      {/* Un boton deshabilitado no emite eventos de puntero; el <span> deja
          que el tooltip siga apareciendo al pasar el mouse. */}
      <TooltipTrigger asChild>
        {disabled ? <span className="inline-flex">{boton}</span> : boton}
      </TooltipTrigger>
      <TooltipContent>{etiqueta}</TooltipContent>
    </Tooltip>
  );
});
