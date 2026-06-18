"use client";

import {
  Activity,
  AlertTriangle,
  CircleCheck,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import type { ResumenFlota, VehiculoFlota } from "../tipos/flota.tipos";
import {
  asignacionesVehiculo,
  esVisibleEnFlota,
  estadoActivoVehiculo,
  estadoOperativoVehiculo,
} from "./flota-normalizadores";

type Props = {
  resumen: ResumenFlota;
  vehiculos: VehiculoFlota[];
};

export function FlotaResumen({ resumen, vehiculos }: Props) {
  const vehiculosVisibles = vehiculos.filter(esVisibleEnFlota);
  const activosVigentes = vehiculosVisibles.filter(
    (vehiculo) => estadoActivoVehiculo(vehiculo) === "ACTIVO",
  );
  const operativos = vehiculosVisibles.filter(
    (vehiculo) => estadoOperativoVehiculo(vehiculo) === "OPERATIVO",
  );
  const mantenimiento = vehiculosVisibles.filter(
    (vehiculo) => estadoOperativoVehiculo(vehiculo) === "MANTENIMIENTO",
  );

  const dataOperativo = [
    { name: "Operativo", value: operativos.length, color: "#10b981" },
    { name: "Mantenimiento", value: mantenimiento.length, color: "#f59e0b" },
    {
      name: "Otros",
      value: vehiculosVisibles.length - operativos.length - mantenimiento.length,
      color: "#ef4444",
    },
  ];

  const asignados = vehiculosVisibles.filter(
    (vehiculo) => asignacionesVehiculo(vehiculo).length > 0,
  );
  const dataContratos = [
    { name: "Asignados", value: asignados.length, color: "#10b981" },
    {
      name: "Sin contrato",
      value: vehiculosVisibles.length - asignados.length,
      color: "#94a3b8",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ResumenCard
          icon={Truck}
          label="Total flota"
          value={resumen?.totalVehiculos ?? vehiculosVisibles.length}
          detail="Unidades registradas"
        />
        <ResumenCard
          icon={CircleCheck}
          label="Vigentes"
          value={activosVigentes.length}
          detail="Estado administrativo activo"
        />
        <ResumenCard
          icon={Activity}
          label="Operativas"
          value={resumen?.operativosActivos ?? operativos.length}
          detail="Disponibles para servicio"
        />
        <ResumenCard
          icon={AlertTriangle}
          label="Mantenimiento"
          value={resumen?.mantenimiento ?? mantenimiento.length}
          detail="Alertas de disponibilidad"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-lg border border-border shadow-sm ring-0">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg">Estado operativo</CardTitle>
            <CardDescription>Distribucion de unidades por estado</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataOperativo}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataOperativo.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-sm ring-0">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg">Asignacion de contratos</CardTitle>
            <CardDescription>Unidades con contrato vs sin contrato</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-5">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataContratos}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataContratos.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
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
    <Card className="rounded-lg border border-border shadow-sm ring-0">
      <CardHeader className="gap-2">
        <div className="mb-1 flex size-10 items-center justify-center rounded-lg border border-border bg-background">
          <Icon className="size-5 text-primary" />
        </div>
        <CardDescription className="text-sm">{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {detail}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
