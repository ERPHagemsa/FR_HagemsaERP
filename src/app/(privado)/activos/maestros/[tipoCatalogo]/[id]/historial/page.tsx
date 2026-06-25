import { notFound } from "next/navigation";

import { SiteHeader } from "@/compartido/componentes/site-header";
import { CATALOGOS_MAESTROS } from "@/modulos/activos/componentes/catalogos-maestros.config";
import type { TipoCatalogoMaestro } from "@/modulos/activos/tipos/maestros.tipos";
import { ValorCatalogoHistorialVista } from "@/modulos/activos/vistas/valor-catalogo-historial-vista";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ tipoCatalogo: string; id: string }>;
};

export default async function Page({ params }: Props) {
  const { tipoCatalogo, id } = await params;

  const config = CATALOGOS_MAESTROS.find((c) => c.tipoCatalogo === tipoCatalogo);
  const idNumerico = Number(id);
  if (!config || !Number.isInteger(idNumerico)) {
    notFound();
  }

  return (
    <>
      <SiteHeader
        title="Historial de catalogo"
        breadcrumbs={[
          { title: "Activos", href: "/activos" },
          { title: "Administrador de maestros", href: "/activos/maestros" },
          { title: config.titulo },
          { title: "Historial" },
        ]}
      />
      <ValorCatalogoHistorialVista
        tipoCatalogo={tipoCatalogo as TipoCatalogoMaestro}
        id={idNumerico}
      />
    </>
  );
}
