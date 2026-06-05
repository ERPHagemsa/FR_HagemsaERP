import DetalleVehiculoClient from "../componentes/detalle-vehiculo-client";
import { obtenerVehiculoPorId } from "../servicios/flota-api";

type Props = {
  id: string;
};

export async function VehiculoDetalleVista({ id }: Props) {
  const vehiculo = await obtenerVehiculoPorId(id);

  return (
    <main className="min-h-screen bg-background px-5 py-6 text-foreground lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <DetalleVehiculoClient initialData={vehiculo} id={id} />
      </div>
    </main>
  );
}

export default VehiculoDetalleVista;
