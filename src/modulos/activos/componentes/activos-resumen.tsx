import {
  IconActivity,
  IconAlertTriangle,
  IconCar,
  IconCircleCheck,
  type Icon,
} from "@tabler/icons-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import type { Activo } from "../tipos/activo.tipos";

type Props = {
  activos: Activo[];
};

export function ActivosResumen({ activos }: Props) {
  const activosVisibles = activos.filter(
    (activo) => activo.estadoActivo !== "ELIMINADO"
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
    (activo) => activo.vehiculo?.estadoCalibracion === "NO_CALIBRADA"
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ResumenCard
        icon={IconCar}
        label="Total activos"
        value={activosVisibles.length}
        detail="Unidades registradas"
      />
      <ResumenCard
        icon={IconCircleCheck}
        label="Activos vigentes"
        value={activosVigentes.length}
        detail="Estado administrativo activo"
      />
      <ResumenCard
        icon={IconActivity}
        label="Operativos"
        value={operativos.length}
        detail="Disponibles para operar"
      />
      <ResumenCard
        icon={IconAlertTriangle}
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
  icon: Icon;
  label: string;
  value: number | string;
}) {
  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-lg border border-destructive/25 bg-destructive/10">
          <Icon className="size-6 text-destructive" />
        </div>
        <CardDescription className="text-sm">{label}</CardDescription>
        <CardTitle className="text-4xl font-semibold mt-1">{value}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-1">{detail}</CardDescription>
      </CardHeader>
    </Card>
  );
}
