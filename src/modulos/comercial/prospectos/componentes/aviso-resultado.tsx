import { IconCircleCheck, IconInfoCircle } from "@tabler/icons-react";
import { cn } from "@/compartido/utilidades";

const mensajes: Record<string, { titulo: string; detalle: string }> = {
  registrado: {
    titulo: "Prospecto registrado",
    detalle: "El prospecto fue creado correctamente en el modulo comercial.",
  },
  actualizado: {
    titulo: "Prospecto actualizado",
    detalle: "Los cambios fueron guardados correctamente.",
  },
  descartado: {
    titulo: "Prospecto descartado",
    detalle: "El prospecto fue marcado como DESCARTADO.",
  },
  bloqueado: {
    titulo: "Prospecto no editable",
    detalle:
      "El prospecto se encuentra en un estado terminal y no admite modificaciones.",
  },
};

type Props = {
  accion?: string;
};

export function AvisoResultado({ accion }: Props) {
  if (!accion || !mensajes[accion]) return null;

  const mensaje = mensajes[accion];
  const esPeligro = accion === "descartado" || accion === "bloqueado";
  const Icon = esPeligro ? IconInfoCircle : IconCircleCheck;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border px-4 py-3 text-sm",
        esPeligro
          ? "border-destructive/40 bg-destructive/10"
          : "border-emerald-500/40 bg-emerald-500/10"
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-5",
          esPeligro ? "text-destructive" : "text-emerald-600"
        )}
      />
      <div>
        <p className="font-semibold">{mensaje.titulo}</p>
        <p className="text-muted-foreground">{mensaje.detalle}</p>
      </div>
    </div>
  );
}
