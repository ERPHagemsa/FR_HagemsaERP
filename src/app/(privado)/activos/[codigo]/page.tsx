import { SiteHeader } from "@/compartido/componentes/site-header";
import { ActivoDetalleVista } from "@/modulos/activos/vistas/activo-detalle-vista";

type Props = {
  params: Promise<{ codigo: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: Props) {
  const { codigo } = await params;
  const query = await searchParams;
  const accion =
    query.created === "1"
      ? "created"
      : query.updated === "1"
        ? "updated"
        : query.inactive === "1"
        ? "inactive"
        : query.siniestrado === "1"
          ? "siniestrado"
          : query.deleted === "1"
            ? "deleted"
            : undefined;

  return (
    <>
      <SiteHeader
        title="Ver Activo"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Ver Activo" },
        ]}
      />
      <ActivoDetalleVista codigo={codigo} accion={accion} />
    </>
  );
}
