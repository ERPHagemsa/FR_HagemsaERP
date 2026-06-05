import {
  IconActivity,
  IconAlertTriangle,
  IconCircleCheck,
  IconTruck,
  type Icon,
} from "@tabler/icons-react";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import type { ResumenFlota, VehiculoFlota } from "../tipos/flota.tipos";
import {
  esVisibleEnFlota,
  estadoActivoVehiculo,
  estadoCalibracionVehiculo,
  estadoOperativoVehiculo,
} from "./flota-normalizadores";

type Props = {
  resumen: ResumenFlota;
  vehiculos: VehiculoFlota[];
};

export function FlotaResumen({ resumen, vehiculos }: Props) {
  const vehiculosVisibles = vehiculos.filter(esVisibleEnFlota);
  const activosVigentes = vehiculosVisibles.filter(
    (vehiculo) => estadoActivoVehiculo(vehiculo) === "ACTIVO"
  );
  const operativos = vehiculosVisibles.filter(
    (vehiculo) => estadoOperativoVehiculo(vehiculo) === "OPERATIVO"
  );
  const mantenimiento = vehiculosVisibles.filter(
    (vehiculo) => estadoOperativoVehiculo(vehiculo) === "MANTENIMIENTO"
  );
  const noCalibrados = vehiculosVisibles.filter(
    (vehiculo) => estadoCalibracionVehiculo(vehiculo) === "NO_CALIBRADA"
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ResumenCard
        icon={IconTruck}
        label="Total flota"
        value={resumen?.totalVehiculos ?? vehiculosVisibles.length}
        detail="Unidades registradas"
      />
      <ResumenCard
        icon={IconCircleCheck}
        label="Vigentes"
        value={activosVigentes.length}
        detail="Estado administrativo activo"
      />
      <ResumenCard
        icon={IconActivity}
        label="Operativas"
        value={resumen?.operativosActivos ?? operativos.length}
        detail="Disponibles para servicio"
      />
      <ResumenCard
        icon={IconAlertTriangle}
        label="Mantenimiento / no calibradas"
        value={`${resumen?.mantenimiento ?? mantenimiento.length} / ${
          resumen?.noCalibrados ?? noCalibrados.length
        }`}
        detail="Alertas de disponibilidad"
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
        <CardTitle className="mt-1 text-4xl font-semibold">{value}</CardTitle>
        <CardDescription className="mt-1 text-xs text-muted-foreground">
          {detail}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
