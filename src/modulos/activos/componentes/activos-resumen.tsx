import {
  Activity,
  AlertTriangle,
  CircleCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { useCatalogosActivos } from "../ganchos/use-catalogos-activos";
import type { Activo } from "../tipos/activo.tipos";

type Props = {
  activos: Activo[];
};

export function ActivosResumen({ activos }: Props) {
  const catalogos = useCatalogosActivos();
  const idNoCalibrada = catalogos.idPorNombre("ESTADO_CALIBRACION", "No calibrada");
  const activosVisibles = activos.filter(
    (activo) => activo.estadoRegistro !== false
  );
  const activosVigentes = activosVisibles.filter(
    (activo) => activo.estadoActivo === "ACTIVO"
  );
  const operativos = activosVisibles.filter(
    (activo) => activo.vehiculo?.estadoOperativo === "OPERATIVO"
  );
  const mantenimiento = activosVisibles.filter(
    (activo) => activo.vehiculo?.estadoOperativo === "MANTENIMIENTO"
  );
  const noCalibrados = activosVisibles.filter(
    (activo) => activo.vehiculo?.estadoCalibracionReferenciaId === idNoCalibrada
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ResumenCard
        icon={Truck}
        label="Total activos"
        value={activosVisibles.length}
        detail="Unidades registradas"
      />
      <ResumenCard
        icon={CircleCheck}
        label="Activos vigentes"
        value={activosVigentes.length}
        detail="Estado administrativo activo"
      />
      <ResumenCard
        icon={Activity}
        label="Operativos"
        value={operativos.length}
        detail="Disponibles para operar"
      />
      <ResumenCard
        icon={AlertTriangle}
        label="Mantenimiento / no calibrados"
        value={`${mantenimiento.length} / ${noCalibrados.length}`}
        detail="Alertas operativas"
      />
    </div>
  );
}

function ResumenCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Icon className="size-5" />
        </div>
        <CardDescription className="text-sm">{label}</CardDescription>
        <CardTitle className="text-4xl font-semibold mt-1">{value}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">{detail}</CardDescription>
      </CardHeader>
    </Card>
  );
}
