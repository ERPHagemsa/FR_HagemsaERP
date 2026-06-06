"use client";

import {
  IconActivity,
  IconAlertTriangle,
  IconCircleCheck,
  IconTruck,
  type Icon,
} from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
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

  const dataOperativo = [
    { name: "Operativo", value: operativos.length, color: "#10b981" },
    { name: "Mantenimiento", value: mantenimiento.length, color: "#f59e0b" },
    { name: "Otros", value: vehiculosVisibles.length - operativos.length - mantenimiento.length, color: "#ef4444" },
  ];

  const asignados = vehiculosVisibles.filter(v => v.contrato && v.contrato !== "Sin Contrato");
  const dataContratos = [
    { name: "Asignados", value: asignados.length, color: "#3b82f6" },
    { name: "Sin Contrato", value: vehiculosVisibles.length - asignados.length, color: "#94a3b8" },
  ];

  return (
    <div className="flex flex-col gap-5">
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
          label="Mantenimiento / sin calibrar"
          value={`${resumen?.mantenimiento ?? mantenimiento.length} / ${
            resumen?.noCalibrados ?? noCalibrados.length
          }`}
          detail="Alertas de disponibilidad"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estado Operativo</CardTitle>
            <CardDescription>Distribución de unidades por estado</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
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
                  {dataOperativo.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Asignación de Contratos</CardTitle>
            <CardDescription>Unidades con contrato vs sin contrato</CardDescription>
          </CardHeader>
          <CardContent className="h-64">
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
                  {dataContratos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
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
