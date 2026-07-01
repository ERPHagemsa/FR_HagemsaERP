import { SiteHeader } from "@/compartido/componentes/site-header";
import { CargaMasivaVista } from "@/modulos/activos/vistas/carga-masiva-vista";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ searchParams }: Props) {
  const query = await searchParams;
  const loteId = normalizarLoteId(query.lote);

  return (
    <>
      <SiteHeader
        title="Carga masiva"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Carga masiva" },
        ]}
      />
      <CargaMasivaVista loteId={loteId} />
    </>
  );
}

function normalizarLoteId(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  const id = Number(raw);
  return raw && Number.isInteger(id) && id > 0 ? id : undefined;
}
