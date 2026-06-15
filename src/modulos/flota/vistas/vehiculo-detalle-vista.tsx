import { SiteHeader } from "@/compartido/componentes/site-header";
import DetalleVehiculoClient from "../componentes/detalle-vehiculo-client";
import {
  obtenerUnidadPorId,
  obtenerContratosDisponibles,
} from "../servicios/flota-api";

type Props = {
  id: string;
};

export async function VehiculoDetalleVista({ id }: Props) {
  const unidadId = decodeURIComponent(id);
  const [vehiculo, contratosDisponibles] = await Promise.all([
    obtenerUnidadPorId(unidadId),
    obtenerContratosDisponibles(),
  ]);

  return (
    <>
      <SiteHeader
        title={`Unidad ${vehiculo?.placa ?? vehiculo?.placaRodaje ?? unidadId}`}
        breadcrumbs={[
          { title: "Flota y Disponibilidad", href: "/flota" },
          { title: "Listar unidades", href: "/flota/unidades" },
          { title: "Ver" },
        ]}
      />
      <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
        <div className="flex w-full flex-col gap-6">
          <DetalleVehiculoClient
            contratosDisponibles={contratosDisponibles}
            initialData={vehiculo}
            id={unidadId}
          />
        </div>
      </main>
    </>
  );
}

export default VehiculoDetalleVista;
