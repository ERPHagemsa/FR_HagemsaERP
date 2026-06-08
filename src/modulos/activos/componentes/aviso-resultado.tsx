"use client";

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

type TipoToast = "success" | "info" | "warning";

const mensajes: Record<
  string,
  { titulo: string; detalle: string; tipo: TipoToast }
> = {
  created: {
    titulo: "Activo registrado",
    detalle: "La unidad fue creada correctamente en el maestro de Activos.",
    tipo: "success",
  },
  updated: {
    titulo: "Activo modificado",
    detalle: "Los cambios fueron guardados correctamente.",
    tipo: "success",
  },
  inactive: {
    titulo: "Activo inactivado",
    detalle: "El estado administrativo se actualizo a INACTIVO.",
    tipo: "info",
  },
  siniestrado: {
    titulo: "Activo siniestrado",
    detalle: "La unidad fue marcada como SINIESTRADO.",
    tipo: "warning",
  },
  deleted: {
    titulo: "Activo retirado",
    detalle: "El activo se retiro del maestro visible.",
    tipo: "warning",
  },
};

type Props = {
  accion?: string;
};

export function AvisoResultado({ accion }: Props) {
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!accion) return;

    const mensaje = mensajes[accion];
    if (!mensaje) return;

    toast[mensaje.tipo](mensaje.titulo, { description: mensaje.detalle });
    router.replace(pathname, { scroll: false });
  }, [accion, pathname, router]);

  return null;
}
