import { SiteHeader } from "@/compartido/componentes/site-header";
import DetalleVehiculoClient from "../componentes/detalle-vehiculo-client";
import { obtenerAsignacionPorPlaca } from "../servicios/flota-api";

type Props = {
  id: string;
};

export async function VehiculoDetalleVista({ id }: Props) {
  const vehiculo = await obtenerAsignacionPorPlaca(id);
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
          <DetalleVehiculoClient initialData={vehiculo} id={placa} />
        </div>
      </main>
    </>
  );
}

export default VehiculoDetalleVista;
