import { SiteHeader } from "@/compartido/componentes/site-header";
import DetalleVehiculoClient from "../componentes/detalle-vehiculo-client";
import {
  obtenerAsignacionPorPlaca,
  obtenerContratosDisponibles,
} from "../servicios/flota-api";

type Props = {
  id: string;
};

export async function VehiculoDetalleVista({ id }: Props) {
  const [vehiculo, contratosDisponibles] = await Promise.all([
    obtenerAsignacionPorPlaca(id),
    obtenerContratosDisponibles(),
  ]);
  const placa = decodeURIComponent(id);

  return (
    <>
      <SiteHeader
        title={`Unidad ${placa}`}
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
            id={placa}
          />
        </div>
      </main>
    </>
  );
}

export default VehiculoDetalleVista;
