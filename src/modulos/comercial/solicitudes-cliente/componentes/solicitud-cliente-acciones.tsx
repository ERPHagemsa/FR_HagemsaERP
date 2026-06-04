"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { esError404, esError409, esErrorValidacion, extraerMensajeError } from "@/compartido/api";
import { Button } from "@/compartido/componentes/ui/button";

import { useAgregarCotizacionMutation } from "../servicios/solicitudes-cliente-queries";
import type { EstadoSolicitudCliente } from "../tipos/solicitud-cliente.tipos";
import { accionesPermitidasSC } from "../tipos/solicitud-cliente.tipos";
import { SolicitudClienteDescartarDialog } from "./solicitud-cliente-descartar-dialog";

type Props = {
  id: string;
  estado: EstadoSolicitudCliente;
};

export function SolicitudClienteAcciones({ id, estado }: Props) {
  const router = useRouter();
  const accionesPermitidas = accionesPermitidasSC(estado);

  const agregarMutation = useAgregarCotizacionMutation();

  async function onAgregarCotizacion() {
    try {
      const respuesta = await agregarMutation.mutateAsync(id);
      router.push(`/comercial/cotizaciones/${respuesta.idCotizacion}/editar`);
    } catch (err) {
      if (esError404(err)) {
        toast.error(extraerMensajeError(err, "Solicitud no encontrada"));
        return;
      }
      if (esError409(err)) {
        toast.error(extraerMensajeError(err, "No se puede agregar cotizacion: conflicto de origen"));
        return;
      }
      if (esErrorValidacion(err)) {
        toast.error(extraerMensajeError(err, "No se puede agregar cotizacion en este estado"));
        return;
      }
      toast.error(extraerMensajeError(err, "No se pudo agregar la cotizacion"));
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={!accionesPermitidas.agregarCotizacion || agregarMutation.isPending}
        onClick={() => void onAgregarCotizacion()}
      >
        {agregarMutation.isPending ? "Agregando..." : "Agregar cotizacion"}
      </Button>

      <SolicitudClienteDescartarDialog
        id={id}
        disabled={!accionesPermitidas.descartar}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
