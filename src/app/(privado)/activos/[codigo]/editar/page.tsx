import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivoEditarVista } from "@/modulos/activos/vistas/activo-editar-vista";

type Props = {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: Props) {
  const { codigo } = await params;
  const query = await searchParams;
  const returnTo = normalizarReturnTo(query.returnTo);

  return (
    <>
      <SiteHeader
        title="Actualizar Activo"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Actualizar Activo" },
        ]}
      />
      <ActivoEditarVista codigo={codigo} returnTo={returnTo} />
    </>
  );
}

function normalizarReturnTo(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;

  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return undefined;
  }

  return raw;
}
