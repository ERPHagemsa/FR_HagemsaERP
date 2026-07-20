"use client";

// Puente entre el query param `?accion=...` (que dejan las redirecciones tras
// registrar / actualizar / descartar, y el redirect server-side de "bloqueado")
// y una notificacion toast de sonner. Dispara el toast una sola vez al montar y
// limpia el query param para no volver a dispararlo en un refresh.

import { usePathname, useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

type TipoToast = "success" | "info" | "warning";

const mensajes: Record<
  string,
  { titulo: string; detalle: string; tipo: TipoToast }
> = {
  registrado: {
    titulo: "Prospecto registrado",
    detalle: "El prospecto fue creado correctamente en el modulo comercial.",
    tipo: "success",
  },
  actualizado: {
    titulo: "Prospecto actualizado",
    detalle: "Los cambios fueron guardados correctamente.",
    tipo: "success",
  },
  descartado: {
    titulo: "Prospecto descartado",
    detalle: "El prospecto fue marcado como DESCARTADO.",
    tipo: "info",
  },
  reactivado: {
    titulo: "Prospecto reactivado",
    detalle: "El prospecto volvio a la cartera (ACTIVO).",
    tipo: "success",
  },
  bloqueado: {
    titulo: "Prospecto no editable",
    detalle:
      "El prospecto se encuentra en un estado terminal y no admite modificaciones.",
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

    // Limpia ?accion del URL para que un refresh no repita la notificacion.
    router.replace(pathname, { scroll: false });
  }, [accion, pathname, router]);

  return null;
}
