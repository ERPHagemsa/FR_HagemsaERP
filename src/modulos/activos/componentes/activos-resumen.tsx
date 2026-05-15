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
  const activosVigentes = activos.filter((activo) => activo.estadoActivo === "ACTIVO");
  const operativos = activos.filter(
    (activo) => activo.vehiculo?.estadoOperativo === "OPERATIVO"
  );
  const mantenimiento = activos.filter(
    (activo) => activo.vehiculo?.estadoOperativo === "MANTENIMIENTO"
  );
  const noCalibrados = activos.filter(
    (activo) => activo.vehiculo?.estadoCalibracion === "NO_CALIBRADA"
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ResumenCard
        icon={IconCar}
        label="Total activos"
        value={activos.length}
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
      <CardHeader>
        <div className="mb-3 flex size-9 items-center justify-center rounded-lg border border-border bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl">{value}</CardTitle>
        <CardDescription>{detail}</CardDescription>
      </CardHeader>
    </Card>
  );
}
