// Panel lateral "Resumen del registro" del formulario de activos,
// extraido de activo-formulario.tsx para reducir su tamano.

import {
  IconClipboardText,
  IconFileDescription,
  IconReceipt2,
  IconRulerMeasure,
  IconSettings,
  IconShieldCheck,
  IconTruck,
} from "@tabler/icons-react";

import { cn } from "@/compartido/utilidades";
import type { ActivoTab, RegistroResumenData } from "./activo-formulario.tipos";
import { formatSummaryValue } from "./activo-formulario.utilidades";

export function ResumenRegistro({
  activeTab,
  onSelectTab,
  resumen,
  tabsDisponibles,
}: {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  resumen: RegistroResumenData;
  tabsDisponibles: ActivoTab[];
}) {
  const secciones = [
    {
      id: "base",
      title: "Base",
      icon: IconClipboardText,
      items: resumen.base,
    },
    {
      id: "adquisicion",
      title: "Adquisicion",
      icon: IconReceipt2,
      items: resumen.adquisicion,
    },
    {
      id: "vehiculo",
      title: "Vehiculo",
      icon: IconTruck,
      items: resumen.vehiculo,
    },
    {
      id: "equipamiento",
      title: "Equipamiento",
      icon: IconSettings,
      items: resumen.equipamiento,
    },
    {
      id: "dimensiones",
      title: "Dimensiones",
      icon: IconRulerMeasure,
      items: resumen.dimensiones,
    },
    {
      id: "control",
      title: "Control",
      icon: IconShieldCheck,
      items: resumen.control,
    },
    {
      id: "documentos",
      title: "Pendientes",
      icon: IconFileDescription,
      items: resumen.pendientes,
    },
  ].filter((seccion) => tabsDisponibles.includes(seccion.id as ActivoTab));

  return (
    <aside className="h-fit rounded-xl border border-border bg-background/40 p-4 xl:sticky xl:top-5">
      <div className="mb-4">
        <p className="text-sm font-semibold text-foreground">
          Resumen del registro
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Revisa lo llenado sin volver por cada pestana.
        </p>
      </div>
      <div className="grid gap-3">
        {secciones.map((seccion) => (
          <button
            key={seccion.id}
            type="button"
            onClick={() => onSelectTab(seccion.id)}
            className={cn(
              "rounded-lg border border-border bg-muted/20 p-3 text-left transition hover:border-primary/50",
              activeTab === seccion.id && "border-primary/60 bg-primary/10"
            )}
          >
            <div className="mb-2 flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <seccion.icon className="size-4" />
              </span>
              <span className="text-sm font-semibold">{seccion.title}</span>
            </div>
            <dl className="grid gap-1">
              {seccion.items.map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-[92px_minmax(0,1fr)] gap-2 text-xs"
                >
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="truncate font-medium text-foreground">
                    {formatSummaryValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </button>
        ))}
      </div>
    </aside>
  );
}
