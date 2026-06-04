import { SiteHeader } from "@/compartido/componentes/site-header";
import DetalleVehiculoClient from "./DetalleVehiculoClient";

interface Params {
  params: { id: string };
}

export default function Page({ params }: Params) {
  const { id } = params;

  return (
    <>
      <SiteHeader title={`Vehículo ${id}`} />
      <main className="flex min-h-screen flex-col bg-sky-50 px-6 py-12 text-slate-900">
        <div className="mx-auto w-full max-w-3xl">
          <DetalleVehiculoClient id={id} />
        </div>
      </main>
    </>
  );
}
