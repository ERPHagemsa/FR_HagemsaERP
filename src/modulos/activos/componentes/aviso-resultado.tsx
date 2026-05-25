import { IconCircleCheck, IconInfoCircle } from "@tabler/icons-react";
import { cn } from "@/compartido/utilidades";

const mensajes: Record<string, { titulo: string; detalle: string }> = {
  created: {
    titulo: "Activo registrado",
    detalle: "La unidad fue creada correctamente en el maestro de Activos.",
  },
  updated: {
    titulo: "Activo modificado",
    detalle: "Los cambios fueron guardados correctamente.",
  },
  inactive: {
    titulo: "Activo inactivado",
    detalle: "El estado administrativo se actualizo a INACTIVO.",
  },
  siniestrado: {
    titulo: "Activo siniestrado",
    detalle: "La unidad fue marcada como SINIESTRADO.",
  },
};

type Props = {
  accion?: string;
};

export function AvisoResultado({ accion }: Props) {
  if (!accion || !mensajes[accion]) return null;

  const mensaje = mensajes[accion];
  const Icon = accion === "siniestrado" ? IconInfoCircle : IconCircleCheck;
  const isDanger = accion === "siniestrado";

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        isDanger
          ? "border-destructive/40 bg-destructive/10"
          : "border-emerald-500/40 bg-emerald-500/10"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-5",
          isDanger ? "text-destructive" : "text-emerald-600"
        )}
      />
      <div>
        <p className="font-semibold">{mensaje.titulo}</p>
        <p className="text-muted-foreground">{mensaje.detalle}</p>
      </div>
    </div>
  );
}
