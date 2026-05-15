import { IconCircleCheck, IconInfoCircle } from "@tabler/icons-react";

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

  return (
    <div className="flex items-start gap-3 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
      <Icon className="mt-0.5 size-5 text-primary" />
      <div>
        <p className="font-semibold">{mensaje.titulo}</p>
        <p className="text-muted-foreground">{mensaje.detalle}</p>
      </div>
    </div>
  );
}
