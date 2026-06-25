"use client";

import { Activity, FileText, Truck, Unlink, type LucideIcon } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/compartido/componentes/ui/card";
import { cn } from "@/compartido/utilidades/utils";
import type { ResumenFlota, VehiculoFlota } from "../tipos/flota.tipos";
import { asignacionesVehiculo, esVisibleEnFlota, estadoOperativoVehiculo } from "./flota-normalizadores";

type Props = {
  resumen: ResumenFlota;
  vehiculos: VehiculoFlota[];
};

const TOP_CUENTAS_LIMITE = 5;

export function FlotaResumen({ resumen, vehiculos }: Props) {
  const vehiculosVisibles = vehiculos.filter(esVisibleEnFlota);
  const totalVisibles = vehiculosVisibles.length;

  // ── Contratos y asignaciones ────────────────────────────────────────────
  const totalContratos = vehiculosVisibles.reduce(
    (acc, vehiculo) =>
      acc + asignacionesVehiculo(vehiculo).filter((a) => a.contrato !== null).length,
    0,
  );
  const unidadesSinAsignacion = vehiculosVisibles.filter(
    (vehiculo) => asignacionesVehiculo(vehiculo).length === 0,
  );
  const pctSinAsignacion =
    totalVisibles > 0 ? Math.round((unidadesSinAsignacion.length / totalVisibles) * 100) : 0;

  // ── Estado operativo ─────────────────────────────────────────────────────
  const operativos = vehiculosVisibles.filter(
    (vehiculo) => estadoOperativoVehiculo(vehiculo) === "OPERATIVO",
  );
  const mantenimiento = vehiculosVisibles.filter(
    (vehiculo) => estadoOperativoVehiculo(vehiculo) === "MANTENIMIENTO",
  );
  const pctOperativo = totalVisibles > 0 ? Math.round((operativos.length / totalVisibles) * 100) : 0;

  const dataOperativo = [
    { name: "Operativo", value: operativos.length, color: "#10b981" },
    { name: "Mantenimiento", value: mantenimiento.length, color: "#f59e0b" },
    {
      name: "Otros",
      value: totalVisibles - operativos.length - mantenimiento.length,
      color: "#94a3b8",
    },
  ].filter((item) => item.value > 0);

  // ── Top cuentas por unidades asignadas (lente de negocio) ───────────────
  const unidadesPorCuenta = new Map<string, { nombre: string; unidades: Set<string> }>();
  for (const vehiculo of vehiculosVisibles) {
    for (const asignacion of asignacionesVehiculo(vehiculo)) {
      if (!asignacion.cuenta) continue;
      const clave = asignacion.cuenta.codigo;
      const entrada = unidadesPorCuenta.get(clave) ?? {
        nombre: asignacion.cuenta.nombre,
        unidades: new Set<string>(),
      };
      entrada.unidades.add(vehiculo.id);
      unidadesPorCuenta.set(clave, entrada);
    }
  }
  const dataTopCuentas = Array.from(unidadesPorCuenta.entries())
    .map(([codigo, { nombre, unidades }]) => ({
      codigo,
      nombre: nombre.length > 22 ? `${nombre.slice(0, 22)}…` : nombre,
      unidades: unidades.size,
    }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, TOP_CUENTAS_LIMITE);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ResumenCard
          icon={Truck}
          label="Total flota"
          value={resumen?.totalVehiculos ?? totalVisibles}
          detail="Unidades registradas"
        />
        <ResumenCard
          icon={Activity}
          label="Operativas"
          value={resumen?.operativosActivos ?? operativos.length}
          detail={`${pctOperativo}% de la flota visible`}
        />
        <ResumenCard
          icon={FileText}
          label="Total de contratos"
          value={totalContratos}
          detail="Asignaciones contractuales vigentes"
        />
        <ResumenCard
          icon={Unlink}
          label="Sin asignación"
          value={unidadesSinAsignacion.length}
          detail={`${pctSinAsignacion}% de la flota sin contrato ni cuenta`}
          alerta={unidadesSinAsignacion.length > 0}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-lg border border-border shadow-sm ring-0">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg">Estado operativo</CardTitle>
            <CardDescription>Distribucion de unidades por estado</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-5">
            {dataOperativo.length === 0 ? (
              <EstadoVacio mensaje="No hay unidades visibles para graficar." />
            ) : (
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
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border border-border shadow-sm ring-0">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg">Top cuentas por unidades asignadas</CardTitle>
            <CardDescription>Cuentas que concentran mas flota</CardDescription>
          </CardHeader>
          <CardContent className="h-64 pt-5">
            {dataTopCuentas.length === 0 ? (
              <EstadoVacio mensaje="Ninguna cuenta tiene unidades asignadas todavia." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dataTopCuentas}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                >
                  <XAxis type="number" allowDecimals={false} hide />
                  <YAxis
                    type="category"
                    dataKey="nombre"
                    width={130}
                    tick={{ fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => {
                      const n = Number(value) || 0;
                      return [`${n} unidad${n === 1 ? "" : "es"}`, "Asignadas"];
                    }}
                  />
                  <Bar dataKey="unidades" fill="#2563eb" radius={[0, 6, 6, 0]} barSize={18} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EstadoVacio({ mensaje }: { mensaje: string }) {
  return (
    <div className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
      {mensaje}
    </div>
  );
}

function ResumenCard({
  alerta = false,
  detail,
  icon: Icon,
  label,
  value,
}: {
  alerta?: boolean;
  detail: string;
  icon: LucideIcon;
  label: string;
  value: number | string;
}) {
  return (
    <Card
      className={cn(
        "rounded-lg border shadow-sm ring-0",
        alerta ? "border-amber-300 dark:border-amber-800" : "border-border",
      )}
    >
      <CardHeader className="gap-2">
        <div
          className={cn(
            "mb-1 flex size-10 items-center justify-center rounded-lg border",
            alerta
              ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
              : "border-border bg-background",
          )}
        >
          <Icon className={cn("size-5", alerta ? "text-amber-600 dark:text-amber-400" : "text-primary")} />
        </div>
        <CardDescription className="text-sm">{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">{detail}</CardDescription>
      </CardHeader>
    </Card>
  );
}
